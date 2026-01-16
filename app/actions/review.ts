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
})

export async function createReview(formData: FormData) {
  const user = await getCurrentUser()

  if (!user || !user.verified) {
    return { error: 'You must be verified to leave reviews' }
  }

  const data = {
    targetUserId: formData.get('targetUserId') as string,
    targetType: formData.get('targetType') as 'EMPLOYEE' | 'EMPLOYER',
    businessId: formData.get('businessId') as string,
    rating: formData.get('rating') as string,
  }

  const validated = createReviewSchema.parse(data)

  // Check if target user exists
  const targetUser = await prisma.users.findUnique({ id: validated.targetUserId })

  if (!targetUser) {
    return { error: 'Target user not found' }
  }

  // Check if business exists
  const business = await prisma.businesses.findUnique({ id: validated.businessId })

  if (!business) {
    return { error: 'Business not found' }
  }

  // Prevent self-review
  if (user.id === validated.targetUserId) {
    return { error: 'You cannot review yourself' }
  }

  // Check for existing review (any time, not just 30 days)
  const existingReview = await prisma.reviews.findFirst({
    reviewerId: user.id,
    targetUserId: validated.targetUserId,
    businessId: validated.businessId,
  })

  if (existingReview) {
    // Update existing review - try by ID first, fallback to combination
    try {
      if (existingReview.id) {
        await prisma.reviews.update({
          where: { id: existingReview.id },
          data: {
            rating: validated.rating,
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
    })
  }

  revalidatePath('/dashboard/employee')
  revalidatePath('/dashboard/employer')
  revalidatePath(`/business/${validated.businessId}`)
  revalidatePath(`/employee/${validated.targetUserId}`)
  revalidatePath(`/employer/${validated.targetUserId}`)

  return { success: true }
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

  reviews.forEach((review) => {
    ratings[review.rating]++
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
