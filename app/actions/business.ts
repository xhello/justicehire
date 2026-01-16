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
  
  // Add review counts
  const businessesWithCounts = businesses.map((business) => {
    const reviewCount = reviews.filter((r) => r.businessId === business.id).length
    return {
      ...business,
      _count: {
        reviews: reviewCount,
      },
    }
  })
  
  // Sort by name
  businessesWithCounts.sort((a, b) => a.name.localeCompare(b.name))
  
  return businessesWithCounts
}

export async function getUniqueCities(state?: string) {
  const allBusinesses = await prisma.businesses.findMany({})
  
  let cities = allBusinesses.map((b) => b.city)
  
  if (state) {
    cities = allBusinesses.filter((b) => b.state === state).map((b) => b.city)
  }
  
  // Get unique cities and sort
  const uniqueCities = [...new Set(cities)].sort()
  
  return uniqueCities
}

export async function getCitiesByState() {
  const allBusinesses = await prisma.businesses.findMany({})
  
  const citiesByState: Record<string, string[]> = {}
  
  allBusinesses.forEach((business) => {
    if (!citiesByState[business.state]) {
      citiesByState[business.state] = []
    }
    if (!citiesByState[business.state].includes(business.city)) {
      citiesByState[business.state].push(business.city)
    }
  })
  
  // Sort cities in each state
  Object.keys(citiesByState).forEach((state) => {
    citiesByState[state].sort()
  })
  
  return citiesByState
}

export async function getBusinessDetails(businessId: string) {
  const business = await prisma.businesses.findUnique({ id: businessId })

  if (!business) {
    return null
  }

  // Get all reviews for this business
  const allReviews = await prisma.reviews.findMany({ businessId })

  // Get all employer profiles for this business
  const { supabaseAdmin } = await import('@/lib/supabase')
  const { data: employerProfiles } = await supabaseAdmin
    .from('EmployerProfile')
    .select('userId, businessId')
    .eq('businessId', businessId)
  
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
  const employerUserIds = employerProfiles.map((p) => p.userId)
  const allUsers = await prisma.users.findMany({})
  const employerUsers = allUsers.filter(
    (u) => u.role === 'EMPLOYER' && employerUserIds.includes(u.id)
  )

  // Get aggregated ratings for each employer
  const employers = await Promise.all(
    employerUsers.map(async (user) => {
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

      reviews.forEach((review) => {
        ratings[review.rating]++
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
