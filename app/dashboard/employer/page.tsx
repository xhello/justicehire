import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { getAggregatedRatings } from '@/app/actions/review'
import { staticUsers } from '@/lib/static-data'
import BusinessFilter from './BusinessFilter'
import StateCityFilter from './StateCityFilter'

export default async function EmployerDashboard({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; city?: string; businessId?: string }>
}) {
  const params = await searchParams
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'EMPLOYER') {
    redirect('/dashboard/employee')
  }

  if (!user.verified) {
    redirect('/verify?email=' + user.email)
  }

  // Get all businesses
  const allBusinesses = await prisma.businesses.findMany({})
  
  // Get unique states and cities from all businesses
  const uniqueStates = [...new Set(allBusinesses.map((b) => b.state))].sort()
  const uniqueCities = params.state
    ? [...new Set(allBusinesses.filter((b) => b.state === params.state).map((b) => b.city))].sort()
    : [...new Set(allBusinesses.map((b) => b.city))].sort()

  // Filter businesses based on selected state and city
  let filteredBusinesses = allBusinesses
  if (params.state) {
    filteredBusinesses = filteredBusinesses.filter((b) => b.state === params.state)
  }
  if (params.city) {
    filteredBusinesses = filteredBusinesses.filter((b) => b.city === params.city)
  }

  // Get all reviews
  const allReviews = await prisma.reviews.findMany({})
  
  // Filter reviews by selected filters
  // If no filters are selected, show all employees who reviewed any business
  const relevantReviews = allReviews.filter((review) => {
    // If businessId filter is specified, only include reviews for that business
    if (params.businessId) {
      return review.businessId === params.businessId
    }
    
    // If state or city filters are specified, filter by those
    if (params.state || params.city) {
      const business = filteredBusinesses.find((b) => b.id === review.businessId)
      return !!business
    }
    
    // No filters - include all reviews
    return true
  })

  // Get unique employee IDs who reviewed businesses in the area
  const employeeIds = [...new Set(relevantReviews.map((r) => r.reviewerId))]
  
  // Get employee users with their review information
  const employeesWithReviews = employeeIds
    .map((employeeId) => {
      const employee = staticUsers.find((u) => u.id === employeeId && u.role === 'EMPLOYEE')
      if (!employee) return null
      
      // Get businesses this employee reviewed
      const employeeReviews = relevantReviews.filter((r) => r.reviewerId === employeeId)
      const reviewedBusinessIds = [...new Set(employeeReviews.map((r) => r.businessId))]
      const reviewedBusinesses = reviewedBusinessIds
        .map((bid) => allBusinesses.find((b) => b.id === bid))
        .filter(Boolean)
      
      return {
        employee,
        reviewedBusinesses,
        reviewCount: employeeReviews.length,
      }
    })
    .filter(Boolean) as Array<{
      employee: typeof staticUsers[0]
      reviewedBusinesses: any[]
      reviewCount: number
    }>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Justice Hire</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {user.firstName} {user.lastName}
              </span>
              {user.employerProfile && (
                <span className="text-sm text-gray-700">
                  {user.employerProfile.business.name}
                </span>
              )}
              <form action={logout}>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Employer Dashboard</h2>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Your Business</h3>
          {user.employerProfile ? (
            <div>
              <p className="text-lg font-medium">{user.employerProfile.business.name}</p>
              <p className="text-sm text-gray-700">
                {user.employerProfile.business.address}
              </p>
              <p className="text-sm text-gray-600">
                {user.employerProfile.business.city}, {user.employerProfile.business.state}
              </p>
            </div>
          ) : (
            <p className="text-gray-700">No business associated</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">
            Find Employees Who Reviewed Businesses
          </h3>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label htmlFor="stateFilter" className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <StateCityFilter
                type="state"
                options={uniqueStates}
                currentValue={params.state}
              />
            </div>
            
            <div>
              <label htmlFor="cityFilter" className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <StateCityFilter
                type="city"
                options={uniqueCities}
                currentValue={params.city}
              />
            </div>
            
            <div>
              <label htmlFor="businessFilter" className="block text-sm font-medium text-gray-700 mb-2">
                Business (optional)
              </label>
              <BusinessFilter
                businesses={filteredBusinesses.map((b) => ({ id: b.id, name: b.name }))}
                currentBusinessId={params.businessId}
              />
            </div>
          </div>

          {employeesWithReviews.length === 0 ? (
            <p className="text-gray-700">
              {params.businessId
                ? 'No employees have reviewed the selected business yet.'
                : params.state || params.city
                ? `No employees have reviewed businesses in ${params.city || 'selected cities'}, ${params.state || 'selected states'} yet.`
                : 'Select a state and/or city to filter employees.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employeesWithReviews.map(({ employee, reviewedBusinesses, reviewCount }) => (
                <EmployeeCard
                  key={employee.id}
                  employeeId={employee.id}
                  reviewedBusinesses={reviewedBusinesses}
                  reviewCount={reviewCount}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

async function EmployeeCard({
  employeeId,
  reviewedBusinesses,
  reviewCount,
}: {
  employeeId: string
  reviewedBusinesses: any[]
  reviewCount: number
}) {
  const employee = await prisma.users.findUnique({ id: employeeId })

  if (!employee) return null

  const ratings = await getAggregatedRatings(employeeId)

  return (
    <Link
      href={`/employee/${employeeId}`}
      className="border rounded-lg p-4 hover:shadow-md transition block"
    >
      <div className="flex items-center gap-4 mb-3">
        {employee.photoUrl ? (
          <img
            src={employee.photoUrl}
            alt={`${employee.firstName} ${employee.lastName}`}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-600">
              {employee.firstName[0]}{employee.lastName[0]}
            </span>
          </div>
        )}
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">
            {employee.firstName} {employee.lastName}
          </h4>
          <p className="text-xs text-gray-600 mt-1">
            Reviewed {reviewCount} business{reviewCount !== 1 ? 'es' : ''}
          </p>
        </div>
        </div>

      <div className="text-sm text-gray-700 border-t pt-3">
        <p className="font-medium mb-1">Overall Rating:</p>
        <p>Total Reviews: {ratings.total}</p>
        <div className="mt-1 space-y-0.5">
          <p className="text-green-600">Outstanding: {ratings.ratings.OUTSTANDING}</p>
          <p className="text-yellow-600">
            As Expected: {ratings.ratings.DELIVERED_AS_EXPECTED}
          </p>
          <p className="text-red-600">
            Poor: {ratings.ratings.GOT_NOTHING_NICE_TO_SAY}
          </p>
        </div>
      </div>
    </Link>
  )
}
