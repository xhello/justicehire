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
      
    } else if (category === 'employer') {
      // Fetch employers with filters
      const where: any = { role: 'EMPLOYER' }
      if (filters.state) where.state = filters.state
      if (filters.city) where.city = filters.city

      // Parallel fetch all needed data
      const [employers, employerReviews, allBusinesses, employerProfiles] = await Promise.all([
        prisma.users.findMany(where),
        prisma.reviews.findMany({ targetType: 'EMPLOYER' }),
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
      
      // Create lookup maps for O(1) access
      const userIdToBusinessId = new Map<string, string>()
      employerProfiles.forEach((profile: any) => {
        userIdToBusinessId.set(profile.userId, profile.businessId)
      })
      
      const businessIdToName = new Map<string, string>()
      allBusinesses.forEach((b: any) => {
        businessIdToName.set(b.id, b.name)
      })
      
      // Group reviews by targetUserId and reviewerId
      const reviewsByTargetId = new Map<string, any[]>()
      const reviewsByReviewerId = new Map<string, number>()
      employerReviews.forEach((r: any) => {
        if (r.targetUserId) {
          const existing = reviewsByTargetId.get(r.targetUserId) || []
          existing.push(r)
          reviewsByTargetId.set(r.targetUserId, existing)
        }
        if (r.reviewerId) {
          reviewsByReviewerId.set(r.reviewerId, (reviewsByReviewerId.get(r.reviewerId) || 0) + 1)
        }
      })

      const employersWithData = employers.map((employer: any) => {
        const businessId = userIdToBusinessId.get(employer.id)
        const businessName = businessId ? businessIdToName.get(businessId) || null : null
        const reviewsReceived = reviewsByTargetId.get(employer.id) || []
        const reviewsWrittenCount = reviewsByReviewerId.get(employer.id) || 0

        const ratings = { OUTSTANDING: 0, DELIVERED_AS_EXPECTED: 0, GOT_NOTHING_NICE_TO_SAY: 0 }
        reviewsReceived.forEach((review: any) => {
          if (review.rating && review.rating in ratings) {
            ratings[review.rating as keyof typeof ratings]++
          }
        })

        return {
          id: employer.id,
          type: 'employer' as const,
          firstName: employer.firstName,
          lastName: employer.lastName,
          photoUrl: employer.photoUrl,
          state: employer.state,
          city: employer.city,
          position: employer.position,
          businessName,
          _count: { reviews: reviewsReceived.length, reviewsWritten: reviewsWrittenCount },
          ratings,
        }
      })

      employersWithData.sort((a: any, b: any) => 
        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
      )
      return employersWithData
      
    } else if (category === 'employees') {
      // Parallel fetch all needed data
      const [allEmployees, allReviews, allBusinesses] = await Promise.all([
        prisma.users.findMany({ role: 'EMPLOYEE' }),
        prisma.reviews.findMany({}),
        filters.state || filters.city ? prisma.businesses.findMany({}) : Promise.resolve([]),
      ])

      // Pre-filter businesses by state/city if specified
      let filteredBusinessIds = new Set<string>()
      if (filters.state || filters.city) {
        allBusinesses.forEach((b: any) => {
          const matchesState = !filters.state || b.state === filters.state
          const matchesCity = !filters.city || b.city === filters.city
          if (matchesState && matchesCity) {
            filteredBusinessIds.add(b.id)
          }
        })
      }

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

        return {
          id: employee.id,
          type: 'employee' as const,
          firstName: employee.firstName,
          lastName: employee.lastName,
          photoUrl: employee.photoUrl,
          socialUrl: employee.socialUrl,
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
