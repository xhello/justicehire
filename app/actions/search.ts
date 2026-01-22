'use server'

import { prisma } from '@/lib/prisma'

// Helper function to calculate average ratings for businesses
function calculateBusinessRatings(businessReviews: any[]) {
  const payCompetitiveValues = businessReviews
    .map((r: any) => r.payCompetitive)
    .filter((v: any): v is number => typeof v === 'number' && v > 0)
  const workloadValues = businessReviews
    .map((r: any) => r.workload)
    .filter((v: any): v is number => typeof v === 'number' && v > 0)
  const flexibilityValues = businessReviews
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

export async function searchResults(filters: {
  state?: string
  city?: string
  category?: string
}) {
  try {
    const category = filters.category?.toLowerCase()

    if (category === 'business' || !category) {
      // Fetch businesses with filters
      const where: any = {}
      if (filters.state) where.state = filters.state
      if (filters.city) where.city = filters.city

      // Parallel fetch: businesses and only BUSINESS reviews (not all reviews!)
      const [businesses, businessReviews] = await Promise.all([
        prisma.businesses.findMany(where),
        prisma.reviews.findMany({ targetType: 'BUSINESS' }),
      ])
      
      // Group reviews by businessId for O(1) lookup
      const reviewsByBusinessId = new Map<string, any[]>()
      businessReviews.forEach((r: any) => {
        if (r.businessId && r.targetUserId === null) {
          const existing = reviewsByBusinessId.get(r.businessId) || []
          existing.push(r)
          reviewsByBusinessId.set(r.businessId, existing)
        }
      })
      
      const businessesWithCounts = businesses.map((business: any) => {
        const reviews = reviewsByBusinessId.get(business.id) || []
        return {
          ...business,
          type: 'business' as const,
          _count: { reviews: reviews.length },
          avgRatings: calculateBusinessRatings(reviews),
        }
      })
      
      // Sort by review count (descending), then by name if tied
      businessesWithCounts.sort((a: any, b: any) => {
        if (b._count.reviews !== a._count.reviews) {
          return b._count.reviews - a._count.reviews
        }
        return a.name.localeCompare(b.name)
      })
      return businessesWithCounts
      
    } else if (category === 'employees') {
      // Parallel fetch all needed data including employer profiles and all businesses
      const [allEmployees, allReviews, allBusinesses, employerProfiles] = await Promise.all([
        prisma.users.findMany({ role: 'EMPLOYEE' }),
        prisma.reviews.findMany({}),
        prisma.businesses.findMany({}),
        (async () => {
          try {
            const { supabaseAdmin } = await import('@/lib/supabase')
            const { data } = await supabaseAdmin
              .from('EmployerProfile')
              .select('userId, businessId')
            return data || []
          } catch (err) {
            console.error('Error fetching employer profiles:', err)
            return []
          }
        })(),
      ])

      // Pre-filter businesses by state/city if specified
      const filteredBusinessIds = new Set<string>()
      if (filters.state || filters.city) {
        allBusinesses.forEach((b: any) => {
          const matchesState = !filters.state || b.state === filters.state
          const matchesCity = !filters.city || b.city === filters.city
          if (matchesState && matchesCity) {
            filteredBusinessIds.add(b.id)
          }
        })
      }

      // Create lookup maps for employer profiles and businesses
      const userIdToBusinessId = new Map<string, string>()
      employerProfiles.forEach((profile: any) => {
        userIdToBusinessId.set(profile.userId, profile.businessId)
      })
      
      const businessIdToName = new Map<string, string>()
      allBusinesses.forEach((b: any) => {
        businessIdToName.set(b.id, b.name)
      })

      // Group reviews by reviewerId and targetUserId for O(1) lookup
      const reviewsByReviewerId = new Map<string, any[]>()
      const reviewsByTargetId = new Map<string, any[]>()
      allReviews.forEach((r: any) => {
        if (r.reviewerId) {
          const existing = reviewsByReviewerId.get(r.reviewerId) || []
          existing.push(r)
          reviewsByReviewerId.set(r.reviewerId, existing)
        }
        if (r.targetUserId && r.targetType === 'EMPLOYEE') {
          const existing = reviewsByTargetId.get(r.targetUserId) || []
          existing.push(r)
          reviewsByTargetId.set(r.targetUserId, existing)
        }
      })

      const employeesWithData = allEmployees.map((employee: any) => {
        const employeeReviews = reviewsByReviewerId.get(employee.id) || []
        const reviewedBusinessIds = new Set<string>(
          employeeReviews.map((r: any) => r.businessId).filter(Boolean)
        )

        // Filter by state/city if specified
        if (filters.state || filters.city) {
          const hasReviewedFilteredBusiness = Array.from(reviewedBusinessIds).some((id: string) =>
            filteredBusinessIds.has(id)
          )
          if (!hasReviewedFilteredBusiness) {
            return null
          }
        }

        const reviewsReceived = reviewsByTargetId.get(employee.id) || []
        const ratings = { OUTSTANDING: 0, DELIVERED_AS_EXPECTED: 0, GOT_NOTHING_NICE_TO_SAY: 0 }
        reviewsReceived.forEach((review: any) => {
          if (review.rating && review.rating in ratings) {
            ratings[review.rating as keyof typeof ratings]++
          }
        })

        // Get business association if employee has one
        const businessId = userIdToBusinessId.get(employee.id)
        const businessName = businessId ? businessIdToName.get(businessId) || null : null

        return {
          id: employee.id,
          type: 'employee' as const,
          firstName: employee.firstName,
          lastName: employee.lastName,
          photoUrl: employee.photoUrl,
          socialUrl: employee.socialUrl,
          position: employee.position || null,
          businessName,
          _count: { reviews: reviewsReceived.length, reviewsWritten: employeeReviews.length },
          ratings,
          reviewedBusinessCount: reviewedBusinessIds.size,
        }
      })

      const filteredEmployees = employeesWithData.filter((e: any) => e !== null) as any[]
      filteredEmployees.sort((a: any, b: any) =>
        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
      )
      return filteredEmployees
    }
    
    return []
  } catch (err) {
    console.error('Error in searchResults:', err)
    return []
  }
}

// Get counts for all categories (efficient parallel fetch)
export async function getCategoryCounts(filters: {
  state?: string
  city?: string
}) {
  try {
    // Parallel fetch: businesses, users, and reviews
    const [allBusinesses, allUsers, allReviews] = await Promise.all([
      prisma.businesses.findMany({}),
      prisma.users.findMany({}),
      prisma.reviews.findMany({}),
    ])
    
    // Filter businesses by state/city
    const filteredBusinesses = allBusinesses.filter((b: any) => {
      const matchesState = !filters.state || b.state === filters.state
      const matchesCity = !filters.city || b.city === filters.city
      return matchesState && matchesCity
    })
    
    // Get filtered business IDs
    const filteredBusinessIds = new Set(filteredBusinesses.map((b: any) => b.id))
    
    // Count employees who have reviewed businesses in the filtered location
    const employees = allUsers.filter((u: any) => u.role === 'EMPLOYEE')
    
    let employeeCount = 0
    if (filters.state || filters.city) {
      // Group reviews by reviewer
      const reviewsByReviewerId = new Map<string, any[]>()
      allReviews.forEach((r: any) => {
        if (r.reviewerId && r.businessId) {
          const existing = reviewsByReviewerId.get(r.reviewerId) || []
          existing.push(r)
          reviewsByReviewerId.set(r.reviewerId, existing)
        }
      })
      
      // Count employees who have reviewed a business in the filtered location
      employees.forEach((employee: any) => {
        const employeeReviews = reviewsByReviewerId.get(employee.id) || []
        const hasReviewedFilteredBusiness = employeeReviews.some((r: any) => 
          filteredBusinessIds.has(r.businessId)
        )
        if (hasReviewedFilteredBusiness) {
          employeeCount++
        }
      })
    } else {
      // No filter, count all employees
      employeeCount = employees.length
    }
    
    return {
      business: filteredBusinesses.length,
      employees: employeeCount,
    }
  } catch (err) {
    console.error('Error in getCategoryCounts:', err)
    return { business: 0, employees: 0 }
  }
}
