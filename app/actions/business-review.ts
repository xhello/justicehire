'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const createBusinessReviewSchema = z.object({
  businessId: z.string(),
  starRating: z.number().min(1).max(5),
  message: z.string().min(1).max(1000),
})

export async function createBusinessReview(formData: FormData): Promise<void> {
  const user = await getCurrentUser()

  if (!user || !user.verified) {
    return
  }

  const data = {
    businessId: formData.get('businessId') as string,
    starRating: parseInt(formData.get('starRating') as string),
    message: formData.get('message') as string,
  }

  let validated
  try {
    validated = createBusinessReviewSchema.parse(data)
  } catch {
    return
  }

  // Check if business exists
  const business = await prisma.businesses.findUnique({ id: validated.businessId })

  if (!business) {
    return
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
            starRating: validated.starRating,
            message: validated.message,
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
          starRating: validated.starRating,
          message: validated.message,
        })
      }
    } catch (error) {
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
        starRating: validated.starRating,
        message: validated.message,
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
      starRating: validated.starRating,
      message: validated.message,
    })
  }

  revalidatePath(`/business/${validated.businessId}`)
}

export async function getBusinessReviews(businessId: string) {
  const reviews = await prisma.reviews.findMany({
    businessId,
    targetType: 'BUSINESS',
  })

  // Get reviewer information
  const reviewsWithUsers = await Promise.all(
    reviews.map(async (review: any) => {
      const reviewer = await prisma.users.findUnique({ id: review.reviewerId })
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
  )

  return reviewsWithUsers
}
