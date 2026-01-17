'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

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

  const businesses = await prisma.businesses.findMany(where)
  const reviews = await prisma.reviews.findMany({})
  
  // Add review counts and average ratings
  const businessesWithCounts = businesses.map((business: any) => {
    const businessReviews = reviews.filter((r: any) => 
      r.businessId === business.id && 
      r.targetType === 'BUSINESS' && 
      r.targetUserId === null
    )
    
    const reviewCount = businessReviews.length
    
    // Calculate average ratings for the three fields
    const payCompetitiveValues = businessReviews
      .map((r: any) => r.payCompetitive)
      .filter((v: any): v is number => typeof v === 'number' && v > 0)
    const workloadValues = businessReviews
      .map((r: any) => r.workload)
      .filter((v: any): v is number => typeof v === 'number' && v > 0)
    const flexibilityValues = businessReviews
      .map((r: any) => r.flexibility)
      .filter((v: any): v is number => typeof v === 'number' && v > 0)
    
    const avgPayCompetitive = payCompetitiveValues.length > 0
      ? (payCompetitiveValues.reduce((sum, v) => sum + v, 0) / payCompetitiveValues.length).toFixed(1)
      : null
    const avgWorkload = workloadValues.length > 0
      ? (workloadValues.reduce((sum, v) => sum + v, 0) / workloadValues.length).toFixed(1)
      : null
    const avgFlexibility = flexibilityValues.length > 0
      ? (flexibilityValues.reduce((sum, v) => sum + v, 0) / flexibilityValues.length).toFixed(1)
      : null
    
    return {
      ...business,
      _count: {
        reviews: reviewCount,
      },
      avgRatings: {
        payCompetitive: avgPayCompetitive,
        workload: avgWorkload,
        flexibility: avgFlexibility,
      },
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
      if (!citiesByState[business.state]) {
        citiesByState[business.state] = []
      }
      if (!citiesByState[business.state].includes(business.city)) {
        citiesByState[business.state].push(business.city)
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
  const business = await prisma.businesses.findUnique({ id: businessId })

  if (!business) {
    return null
  }

  // Get all reviews for this business
  const allReviews = await prisma.reviews.findMany({ businessId })

  // Get all employer profiles for this business
  let employerProfiles: any[] = []
  try {
    const { supabaseAdmin } = await import('@/lib/supabase')
    const { data } = await supabaseAdmin
      .from('EmployerProfile')
      .select('userId, businessId')
      .eq('businessId', businessId)
    employerProfiles = data || []
  } catch (err) {
    console.error('Error fetching employer profiles:', err)
  }
  
  if (!employerProfiles || employerProfiles.length === 0) {
    return {
      ...business,
      employers: [],
      _count: {
        reviews: allReviews.length,
      },
    }
  }

  // Get all users who are employers for this business
  const employerUserIds = employerProfiles.filter((p: any) => p?.userId).map((p: any) => p.userId)
  const allUsers = await prisma.users.findMany({})
  const employerUsers = allUsers.filter(
    (u: any) => u.role === 'EMPLOYER' && employerUserIds.includes(u.id)
  )

  // Get aggregated ratings for each employer
  const employers = await Promise.all(
    employerUsers.map(async (user: any) => {
      const reviews = await prisma.reviews.findMany({
        targetUserId: user.id,
        targetType: 'EMPLOYER',
        businessId: business.id,
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
  )

  const reviewCount = allReviews.length

  return {
    ...business,
    employers,
    _count: {
      reviews: reviewCount,
    },
  }
}
