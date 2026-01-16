'use server'

import { prisma } from '@/lib/prisma'

export async function searchResults(filters: {
  state?: string
  city?: string
  category?: string
}) {
  const category = filters.category?.toLowerCase()

  if (category === 'business') {
    // Fetch businesses
    const where: any = {}
    if (filters.state) where.state = filters.state
    if (filters.city) where.city = filters.city

    const businesses = await prisma.businesses.findMany(where)
    const reviews = await prisma.reviews.findMany({})
    
    const businessesWithCounts = businesses.map((business) => {
      const reviewCount = reviews.filter((r) => r.businessId === business.id).length
      return {
        ...business,
        type: 'business' as const,
        _count: {
          reviews: reviewCount,
        },
      }
    })
    
    businessesWithCounts.sort((a, b) => a.name.localeCompare(b.name))
    return businessesWithCounts
  } else if (category === 'employer') {
    // Fetch employers
    const where: any = { role: 'EMPLOYER' }
    if (filters.state) where.state = filters.state
    if (filters.city) where.city = filters.city

    const employers = await prisma.users.findMany(where)
    const allReviews = await prisma.reviews.findMany({})
    const allBusinesses = await prisma.businesses.findMany({})
    
    // Get all employer profiles to map business IDs
    const { supabaseAdmin } = await import('@/lib/supabase')
    const { data: employerProfiles } = await supabaseAdmin
      .from('EmployerProfile')
      .select('userId, businessId')
    
    const userIdToBusinessId = new Map<string, string>()
    employerProfiles?.forEach((profile) => {
      userIdToBusinessId.set(profile.userId, profile.businessId)
    })

    const employersWithData = await Promise.all(
      employers.map(async (employer) => {
        // Get business name from employer profile
        let businessName: string | null = null
        const businessId = userIdToBusinessId.get(employer.id)
        if (businessId) {
          const business = allBusinesses.find((b) => b.id === businessId)
          businessName = business?.name || null
        }

        // Get reviews received as employer
        const reviewsReceived = allReviews.filter(
          (r) => r.targetUserId === employer.id && r.targetType === 'EMPLOYER'
        )

        // Get reviews written by employer
        const reviewsWritten = allReviews.filter(
          (r) => r.reviewerId === employer.id
        )

        const ratings = {
          OUTSTANDING: 0,
          DELIVERED_AS_EXPECTED: 0,
          GOT_NOTHING_NICE_TO_SAY: 0,
        }

        reviewsReceived.forEach((review) => {
          if (review.rating) {
            ratings[review.rating]++
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
          _count: {
            reviews: reviewsReceived.length,
            reviewsWritten: reviewsWritten.length,
          },
          ratings,
        }
      })
    )

    employersWithData.sort((a, b) => 
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
    )
    return employersWithData
  } else if (category === 'employees') {
    // Fetch employees
    // Note: Employees don't have state/city directly, so we filter by businesses they've reviewed
    const allEmployees = await prisma.users.findMany({ role: 'EMPLOYEE' })
    const allReviews = await prisma.reviews.findMany({})
    const allBusinesses = await prisma.businesses.findMany({})

    // Pre-filter businesses by state/city if specified
    let filteredBusinessIds = new Set<string>()
    if (filters.state || filters.city) {
      const filteredBusinesses = allBusinesses.filter((b) => {
        const matchesState = !filters.state || b.state === filters.state
        const matchesCity = !filters.city || b.city === filters.city
        return matchesState && matchesCity
      })
      filteredBusinessIds = new Set(filteredBusinesses.map((b) => b.id))
    }

    const employeesWithData = await Promise.all(
      allEmployees.map(async (employee) => {
        // Get businesses this employee has reviewed
        const reviewedBusinessIds = new Set(
          allReviews
            .filter((r) => r.reviewerId === employee.id)
            .map((r) => r.businessId)
        )

        // Filter by state/city if specified
        if (filters.state || filters.city) {
          const hasReviewedFilteredBusiness = Array.from(reviewedBusinessIds).some((id) =>
            filteredBusinessIds.has(id)
          )
          if (!hasReviewedFilteredBusiness) {
            return null
          }
        }

        // Get reviews received as employee
        const reviews = allReviews.filter(
          (r) => r.targetUserId === employee.id && r.targetType === 'EMPLOYEE'
        )

        const ratings = {
          OUTSTANDING: 0,
          DELIVERED_AS_EXPECTED: 0,
          GOT_NOTHING_NICE_TO_SAY: 0,
        }

        reviews.forEach((review) => {
          ratings[review.rating]++
        })

        // Get reviews written by employee
        const reviewsWritten = allReviews.filter(
          (r) => r.reviewerId === employee.id
        )

        return {
          id: employee.id,
          type: 'employee' as const,
          firstName: employee.firstName,
          lastName: employee.lastName,
          photoUrl: employee.photoUrl,
          socialUrl: employee.socialUrl,
          _count: {
            reviews: reviews.length,
            reviewsWritten: reviewsWritten.length,
          },
          ratings,
          reviewedBusinessCount: reviewedBusinessIds.size,
        }
      })
    )

    // Filter out nulls
    const filteredEmployees = employeesWithData.filter((e) => e !== null) as any[]

    filteredEmployees.sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
    )
    return filteredEmployees
  } else {
    // Default: show businesses
    const where: any = {}
    if (filters.state) where.state = filters.state
    if (filters.city) where.city = filters.city

    const businesses = await prisma.businesses.findMany(where)
    const reviews = await prisma.reviews.findMany({})
    
    const businessesWithCounts = businesses.map((business) => {
      const reviewCount = reviews.filter((r) => r.businessId === business.id).length
      return {
        ...business,
        type: 'business' as const,
        _count: {
          reviews: reviewCount,
        },
      }
    })
    
    businessesWithCounts.sort((a, b) => a.name.localeCompare(b.name))
    return businessesWithCounts
  }
}
