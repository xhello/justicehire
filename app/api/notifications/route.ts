import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ notifications: [] })
    }

    // Get all reviews the current user has given
    const myReviews = await prisma.reviews.findMany({
      reviewerId: user.id,
    })

    // Get unique target user IDs and business IDs the user has reviewed
    const reviewedUserIds = new Set<string>()
    const reviewedBusinessIds = new Set<string>()

    myReviews.forEach((review: any) => {
      if (review.targetUserId) {
        reviewedUserIds.add(review.targetUserId)
      }
      if (review.businessId && review.targetType === 'BUSINESS') {
        reviewedBusinessIds.add(review.businessId)
      }
    })

    // Get recent reviews for those users and businesses (not by current user)
    const notifications: any[] = []

    // Get reviews for users I've reviewed
    if (reviewedUserIds.size > 0) {
      const userReviews = await prisma.reviews.findMany({
        targetUserId: { in: Array.from(reviewedUserIds) },
        reviewerId: { not: user.id },
      })

      // Get user details for targets
      const targetUsers = await prisma.users.findMany({
        id: { in: Array.from(reviewedUserIds) },
      })
      const userMap = new Map(targetUsers.map((u: any) => [u.id, u]))

      userReviews.forEach((review: any) => {
        const targetUser = userMap.get(review.targetUserId)
        if (targetUser) {
          notifications.push({
            id: review.id,
            type: 'user_review',
            targetId: review.targetUserId,
            targetName: `${targetUser.firstName} ${targetUser.lastName}`,
            targetType: review.targetType,
            rating: review.rating,
            createdAt: review.createdAt,
          })
        }
      })
    }

    // Get reviews for businesses I've reviewed
    if (reviewedBusinessIds.size > 0) {
      const businessReviews = await prisma.reviews.findMany({
        businessId: { in: Array.from(reviewedBusinessIds) },
        targetType: 'BUSINESS',
        reviewerId: { not: user.id },
      })

      // Get business details
      const businesses = await prisma.businesses.findMany({
        id: { in: Array.from(reviewedBusinessIds) },
      })
      const businessMap = new Map(businesses.map((b: any) => [b.id, b]))

      businessReviews.forEach((review: any) => {
        const business = businessMap.get(review.businessId)
        if (business) {
          notifications.push({
            id: review.id,
            type: 'business_review',
            targetId: review.businessId,
            targetName: business.name,
            targetType: 'BUSINESS',
            rating: review.rating,
            createdAt: review.createdAt,
          })
        }
      })
    }

    // Sort by latest first
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Limit to 20 most recent
    return NextResponse.json({ notifications: notifications.slice(0, 20) })
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ notifications: [] }, { status: 500 })
  }
}
