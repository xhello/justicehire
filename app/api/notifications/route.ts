import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ notifications: [] })
    }

    // Get user's notification dismissed timestamp
    const { data: userData } = await supabaseAdmin
      .from('User')
      .select('notificationsDismissedAt')
      .eq('id', user.id)
      .single()

    const dismissedAt = userData?.notificationsDismissedAt

    // Get all reviews the current user has given
    const { data: myReviews, error: myReviewsError } = await supabaseAdmin
      .from('Review')
      .select('*')
      .eq('reviewerId', user.id)

    if (myReviewsError || !myReviews) {
      console.error('Error fetching my reviews:', myReviewsError)
      return NextResponse.json({ notifications: [] })
    }

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

    const notifications: any[] = []

    // Get reviews for users I've reviewed (excluding my own reviews)
    if (reviewedUserIds.size > 0) {
      let userReviewsQuery = supabaseAdmin
        .from('Review')
        .select('*')
        .in('targetUserId', Array.from(reviewedUserIds))
        .neq('reviewerId', user.id)
      
      // Filter by dismissed timestamp if exists
      if (dismissedAt) {
        userReviewsQuery = userReviewsQuery.gt('createdAt', dismissedAt)
      }
      
      const { data: userReviews, error: userReviewsError } = await userReviewsQuery

      if (!userReviewsError && userReviews) {
        // Get user details for targets
        const { data: targetUsers } = await supabaseAdmin
          .from('User')
          .select('id, firstName, lastName')
          .in('id', Array.from(reviewedUserIds))

        const userMap = new Map((targetUsers || []).map((u: any) => [u.id, u]))

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
    }

    // Get reviews for businesses I've reviewed (excluding my own reviews)
    if (reviewedBusinessIds.size > 0) {
      let businessReviewsQuery = supabaseAdmin
        .from('Review')
        .select('*')
        .in('businessId', Array.from(reviewedBusinessIds))
        .eq('targetType', 'BUSINESS')
        .neq('reviewerId', user.id)
      
      // Filter by dismissed timestamp if exists
      if (dismissedAt) {
        businessReviewsQuery = businessReviewsQuery.gt('createdAt', dismissedAt)
      }
      
      const { data: businessReviews, error: businessReviewsError } = await businessReviewsQuery

      if (!businessReviewsError && businessReviews) {
        // Get business details
        const { data: businesses } = await supabaseAdmin
          .from('Business')
          .select('id, name')
          .in('id', Array.from(reviewedBusinessIds))

        const businessMap = new Map((businesses || []).map((b: any) => [b.id, b]))

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
