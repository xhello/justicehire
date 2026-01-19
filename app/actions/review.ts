'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const createReviewSchema = z.object({
  targetUserId: z.string(),
  targetType: z.enum(['EMPLOYEE', 'EMPLOYER']),
  businessId: z.string(),
  rating: z.enum(['OUTSTANDING', 'DELIVERED_AS_EXPECTED', 'GOT_NOTHING_NICE_TO_SAY']),
  message: z.string().max(1000).optional().or(z.literal('')),
})

export async function createReview(
  prevState: any,
  formData?: FormData
): Promise<{ success: boolean; isUpdate: boolean; message: string } | { error: string } | void> {
  // Handle both useFormState (prevState, formData) and direct server action (formData only)
  // If formData is undefined, prevState is actually the FormData from direct server action call
  const isUseFormState = formData !== undefined
  const actualFormData = isUseFormState ? formData! : (prevState as FormData)
  
  const user = await getCurrentUser()

  if (!user || !user.verified) {
    // If used with useFormState, return error object; otherwise return void (old behavior)
    if (isUseFormState) {
      return { error: 'You must be logged in and verified to leave a review.' }
    }
    return
  }

  const data = {
    targetUserId: actualFormData.get('targetUserId') as string,
    targetType: actualFormData.get('targetType') as 'EMPLOYEE' | 'EMPLOYER',
    businessId: actualFormData.get('businessId') as string,
    rating: actualFormData.get('rating') as string,
    message: (actualFormData.get('message') as string) || undefined,
    returnToBusiness: actualFormData.get('returnToBusiness') === 'true',
  }

  let validated
  try {
    validated = createReviewSchema.parse(data)
  } catch {
    if (isUseFormState) {
      return { error: 'Invalid form data. Please check your inputs.' }
    }
    return
  }

  // Check if target user exists
  const targetUser = await prisma.users.findUnique({ id: validated.targetUserId })

  if (!targetUser) {
    if (isUseFormState) {
      return { error: 'Target user not found.' }
    }
    return
  }

  // Check if business exists
  const business = await prisma.businesses.findUnique({ id: validated.businessId })

  if (!business) {
    if (isUseFormState) {
      return { error: 'Business not found.' }
    }
    return
  }

  // Prevent self-review
  if (user.id === validated.targetUserId) {
    if (isUseFormState) {
      return { error: 'You cannot review yourself.' }
    }
    return
  }

  // Check for existing review (any time, not just 30 days)
  const existingReview = await prisma.reviews.findFirst({
    reviewerId: user.id,
    targetUserId: validated.targetUserId,
    businessId: validated.businessId,
  })

  const isUpdate = !!existingReview

  if (existingReview) {
    // Update existing review - try by ID first, fallback to combination
    try {
      if (existingReview.id) {
        await prisma.reviews.update({
          where: { id: existingReview.id },
          data: {
            rating: validated.rating,
            message: validated.message || null,
          },
        })
      } else {
        // No ID, use combination to find and update
        await prisma.reviews.update({
          where: {
            reviewerId: user.id,
            targetUserId: validated.targetUserId,
            businessId: validated.businessId,
          },
          data: {
            rating: validated.rating,
            message: validated.message || null,
          },
        })
      }
    } catch (error) {
      // If update fails, delete old and create new
      await prisma.reviews.deleteMany({
        reviewerId: user.id,
        targetUserId: validated.targetUserId,
        businessId: validated.businessId,
      })
      await prisma.reviews.create({
        reviewerId: user.id,
        targetUserId: validated.targetUserId,
        targetType: validated.targetType,
        businessId: validated.businessId,
        rating: validated.rating,
        message: validated.message || null,
      })
    }
  } else {
    // Create new review
    await prisma.reviews.create({
      reviewerId: user.id,
      targetUserId: validated.targetUserId,
      targetType: validated.targetType,
      businessId: validated.businessId,
      rating: validated.rating,
      message: validated.message || null,
    })
  }

  revalidatePath('/dashboard/employee')
  revalidatePath('/dashboard/employer')
  revalidatePath(`/business/${validated.businessId}`)
  revalidatePath(`/employee/${validated.targetUserId}`)
  revalidatePath(`/employer/${validated.targetUserId}`)

  // Return success state instead of redirecting if returnToBusiness is true
  if (data.returnToBusiness) {
    return {
      success: true,
      isUpdate,
      message: isUpdate 
        ? 'Review updated successfully!'
        : 'Review submitted successfully!'
    }
  }

  // Redirect with success message (for reviews from profile pages)
  const successMessage = isUpdate 
    ? encodeURIComponent('Review updated successfully!')
    : encodeURIComponent('Review submitted successfully!')
  
  if (validated.targetType === 'EMPLOYEE') {
    redirect(`/employee/${validated.targetUserId}?success=${successMessage}`)
  } else {
    redirect(`/employer/${validated.targetUserId}?success=${successMessage}`)
  }
}

// Wrapper for direct form action usage (without useFormState)
export async function createReviewAction(formData: FormData): Promise<void> {
  await createReview(null, formData)
}

export async function getAggregatedRatings(userId: string) {
  const reviews = await prisma.reviews.findMany({
    targetUserId: userId,
  })

  const ratings = {
    OUTSTANDING: 0,
    DELIVERED_AS_EXPECTED: 0,
    GOT_NOTHING_NICE_TO_SAY: 0,
  }

  reviews.forEach((review: any) => {
    if (review.rating && review.rating in ratings) {
      ratings[review.rating as keyof typeof ratings]++
    }
  })

  return {
    ratings,
    total: reviews.length,
  }
}

export async function getUserProfile(userId: string) {
  const user = await prisma.users.findUnique({ id: userId })

  if (!user) {
    return null
  }

  const aggregatedRatings = await getAggregatedRatings(userId)

  // Get business info if employer
  let businessInfo = null
  if (user.role === 'EMPLOYER' && user.employerProfile) {
    const business = await prisma.businesses.findUnique({ id: user.employerProfile.businessId })
    if (business) {
      businessInfo = {
        id: business.id,
        name: business.name,
        address: business.address,
      }
    }
  }

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    photoUrl: user.photoUrl,
    role: user.role,
    socialUrl: user.socialUrl,
    employerProfile: businessInfo
      ? {
          business: businessInfo,
        }
      : undefined,
    ...aggregatedRatings,
  }
}
