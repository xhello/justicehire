'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const createBusinessReviewSchema = z.object({
  businessId: z.string(),
  payCompetitive: z.number().min(1).max(5),
  workload: z.number().min(1).max(5),
  flexibility: z.number().min(1).max(5),
  message: z.string().optional(),
})

export async function createBusinessReview(
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; isUpdate: boolean; message: string } | { error: string }> {
  const user = await getCurrentUser()

  if (!user || !user.verified) {
    return { error: 'You must be logged in and verified to leave a review.' }
  }

  const data = {
    businessId: formData.get('businessId') as string,
    payCompetitive: parseInt(formData.get('payCompetitive') as string),
    workload: parseInt(formData.get('workload') as string),
    flexibility: parseInt(formData.get('flexibility') as string),
    message: (formData.get('message') as string) || undefined,
  }

  let validated
  try {
    validated = createBusinessReviewSchema.parse(data)
  } catch {
    return { error: 'Invalid form data. Please check your inputs.' }
  }

  // Check if business exists
  const business = await prisma.businesses.findUnique({ id: validated.businessId })

  if (!business) {
    return { error: 'Business not found.' }
  }

  // Check for existing review
  const existingReview = await prisma.reviews.findFirst({
    reviewerId: user.id,
    businessId: validated.businessId,
    targetType: 'BUSINESS',
    targetUserId: null,
  })

  if (existingReview) {
    // Update existing review
    try {
      if (existingReview.id) {
        await prisma.reviews.update({
          where: { id: existingReview.id },
          data: {
            payCompetitive: validated.payCompetitive,
            workload: validated.workload,
            flexibility: validated.flexibility,
            message: validated.message || null,
          },
        })
      } else {
        // Fallback: delete and recreate
        await prisma.reviews.deleteMany({
          reviewerId: user.id,
          businessId: validated.businessId,
          targetType: 'BUSINESS',
          targetUserId: null,
        })
        await prisma.reviews.create({
          reviewerId: user.id,
          targetType: 'BUSINESS',
          targetUserId: null,
          businessId: validated.businessId,
          rating: null,
          payCompetitive: validated.payCompetitive,
          workload: validated.workload,
          flexibility: validated.flexibility,
          message: validated.message || null,
        })
      }
    } catch {
      // If update fails, delete old and create new
      await prisma.reviews.deleteMany({
        reviewerId: user.id,
        businessId: validated.businessId,
        targetType: 'BUSINESS',
        targetUserId: null,
      })
      await prisma.reviews.create({
        reviewerId: user.id,
        targetType: 'BUSINESS',
        targetUserId: null,
        businessId: validated.businessId,
        rating: null,
        payCompetitive: validated.payCompetitive,
        workload: validated.workload,
        flexibility: validated.flexibility,
        message: validated.message || null,
      })
    }
  } else {
    // Create new review
    await prisma.reviews.create({
      reviewerId: user.id,
      targetType: 'BUSINESS',
      targetUserId: null,
      businessId: validated.businessId,
      rating: null,
      payCompetitive: validated.payCompetitive,
      workload: validated.workload,
      flexibility: validated.flexibility,
      message: validated.message || null,
    })
  }

  revalidatePath(`/business/${validated.businessId}`)

  // Return success state instead of redirecting
  return {
    success: true,
    isUpdate: !!existingReview,
    message: existingReview 
      ? 'Business review updated successfully!'
      : 'Business review submitted successfully!'
  }
}

export async function getBusinessReviews(businessId: string) {
  const reviews = await prisma.reviews.findMany({
    businessId,
    targetType: 'BUSINESS',
  })

  if (reviews.length === 0) {
    return []
  }

  // Get all reviewer IDs and fetch users in ONE query (avoids N+1)
  const reviewerIds = [...new Set(reviews.map((r: any) => r.reviewerId).filter(Boolean))]
  const reviewers = reviewerIds.length > 0 ? await prisma.users.findMany({}) : []
  const reviewerMap = new Map<string, any>(reviewers.map((u: any) => [u.id, u]))

  // Map reviews with reviewer info using O(1) lookup
  const reviewsWithUsers = reviews.map((review: any) => {
    const reviewer: any = review.reviewerId ? reviewerMap.get(review.reviewerId) : null
    return {
      ...review,
      reviewer: reviewer
        ? {
            firstName: reviewer.firstName,
            lastName: reviewer.lastName,
            photoUrl: reviewer.photoUrl,
            role: reviewer.role,
          }
        : null,
    }
  })

  return reviewsWithUsers
}
