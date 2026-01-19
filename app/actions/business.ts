'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// Helper function to calculate average ratings
function calculateAvgRatings(reviews: any[]) {
  const payCompetitiveValues = reviews
    .map((r: any) => r.payCompetitive)
    .filter((v: any): v is number => typeof v === 'number' && v > 0)
  const workloadValues = reviews
    .map((r: any) => r.workload)
    .filter((v: any): v is number => typeof v === 'number' && v > 0)
  const flexibilityValues = reviews
    .map((r: any) => r.flexibility)
    .filter((v: any): v is number => typeof v === 'number' && v > 0)
  
  return {
    payCompetitive: payCompetitiveValues.length > 0
      ? (payCompetitiveValues.reduce((sum: number, v: number) => sum + v, 0) / payCompetitiveValues.length).toFixed(1)
      : null,
    workload: workloadValues.length > 0
      ? (workloadValues.reduce((sum: number, v: number) => sum + v, 0) / workloadValues.length).toFixed(1)
      : null,
    flexibility: flexibilityValues.length > 0
      ? (flexibilityValues.reduce((sum: number, v: number) => sum + v, 0) / flexibilityValues.length).toFixed(1)
      : null,
  }
}

export async function listBusinesses(filters: {
  state?: string
  city?: string
  category?: string
}) {
  const where: any = {}

  if (filters.state) {
    where.state = filters.state
  }

  if (filters.city) {
    where.city = filters.city
  }

  if (filters.category) {
    where.category = filters.category
  }

  // Parallel fetch: businesses and only BUSINESS reviews (not ALL reviews)
  const [businesses, reviews] = await Promise.all([
    prisma.businesses.findMany(where),
    prisma.reviews.findMany({ targetType: 'BUSINESS' }),
  ])
  
  // Group reviews by businessId for O(1) lookup
  const reviewsByBusinessId = new Map<string, any[]>()
  reviews.forEach((r: any) => {
    if (r.businessId && r.targetUserId === null) {
      const existing = reviewsByBusinessId.get(r.businessId) || []
      existing.push(r)
      reviewsByBusinessId.set(r.businessId, existing)
    }
  })
  
  // Add review counts and average ratings using Map lookup
  const businessesWithCounts = businesses.map((business: any) => {
    const businessReviews = reviewsByBusinessId.get(business.id) || []
    return {
      ...business,
      _count: { reviews: businessReviews.length },
      avgRatings: calculateAvgRatings(businessReviews),
    }
  })
  
  // Sort by name
  businessesWithCounts.sort((a: any, b: any) => a.name.localeCompare(b.name))
  
  return businessesWithCounts
}

export async function getUniqueCities(state?: string) {
  const allBusinesses = await prisma.businesses.findMany({})
  
  let cities = allBusinesses.map((b: any) => b.city)
  
  if (state) {
    cities = allBusinesses.filter((b: any) => b.state === state).map((b: any) => b.city)
  }
  
  // Get unique cities and sort
  const uniqueCities = [...new Set(cities)].sort()
  
  return uniqueCities
}

export async function getCitiesByState() {
  try {
    const allBusinesses = await prisma.businesses.findMany({})
    
    const citiesByState: Record<string, string[]> = {}
    
    allBusinesses.forEach((business: any) => {
      if (business.state && business.city) {
        if (!citiesByState[business.state]) {
          citiesByState[business.state] = []
        }
        if (!citiesByState[business.state].includes(business.city)) {
          citiesByState[business.state].push(business.city)
        }
      }
    })
    
    // Sort cities in each state
    Object.keys(citiesByState).forEach((state: string) => {
      citiesByState[state].sort()
    })
    
    return citiesByState
  } catch (err) {
    console.error('Error in getCitiesByState:', err)
    return {}
  }
}

export async function getBusinessDetails(businessId: string) {
  // Parallel fetch: business, reviews, and employer profiles
  const [business, allReviews, employerProfiles] = await Promise.all([
    prisma.businesses.findUnique({ id: businessId }),
    prisma.reviews.findMany({ businessId }),
    (async () => {
      try {
        const { supabaseAdmin } = await import('@/lib/supabase')
        const { data } = await supabaseAdmin
          .from('EmployerProfile')
          .select('userId, businessId')
          .eq('businessId', businessId)
        return data || []
      } catch (err) {
        console.error('Error fetching employer profiles:', err)
        return []
      }
    })(),
  ])

  if (!business) {
    return null
  }
  
  if (!employerProfiles || employerProfiles.length === 0) {
    return {
      ...business,
      employers: [],
      _count: { reviews: allReviews.length },
    }
  }

  // Get employer users
  const employerUserIds = new Set(employerProfiles.filter((p: any) => p?.userId).map((p: any) => p.userId))
  const allUsers = await prisma.users.findMany({})
  const employerUsers = allUsers.filter((u: any) => u.role === 'EMPLOYER' && employerUserIds.has(u.id))

  // Group employer reviews by targetUserId for O(1) lookup (avoids N+1)
  const employerReviewsByUserId = new Map<string, any[]>()
  allReviews.forEach((r: any) => {
    if (r.targetType === 'EMPLOYER' && r.targetUserId) {
      const existing = employerReviewsByUserId.get(r.targetUserId) || []
      existing.push(r)
      employerReviewsByUserId.set(r.targetUserId, existing)
    }
  })

  // Build employer data using Map lookup (no more N+1 queries!)
  const employers = employerUsers.map((user: any) => {
    const reviews = employerReviewsByUserId.get(user.id) || []
    const ratings = { OUTSTANDING: 0, DELIVERED_AS_EXPECTED: 0, GOT_NOTHING_NICE_TO_SAY: 0 }
    
    reviews.forEach((review: any) => {
      if (review.rating && review.rating in ratings) {
        ratings[review.rating as keyof typeof ratings]++
      }
    })

    return {
      id: `profile-${user.id}`,
      userId: user.id,
      businessId: business.id,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
        position: user.position,
      },
      ratings,
      reviewCount: reviews.length,
    }
  })

  return {
    ...business,
    employers,
    _count: { reviews: allReviews.length },
  }
}
