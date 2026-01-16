import { getCitiesByState } from '../actions/business'
import { searchResults } from '../actions/search'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import BusinessFilters from './BusinessFilters'
import BusinessImage from './BusinessImage'

export default async function BusinessSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; city?: string; category?: string }>
}) {
  const params = await searchParams
  const user = await getCurrentUser()
  const results = await searchResults({
    state: params.state,
    city: params.city,
    category: params.category,
  })
  
  // Get cities grouped by state for the filter component
  const citiesByState = await getCitiesByState()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Justice Hire
            </Link>
            <div className="flex gap-4">
              {user ? (
                <Link
                  href={user.role === 'EMPLOYEE' ? '/dashboard/employee' : '/dashboard/employer'}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Sign Up
                  </Link>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Log In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Business Search</h2>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <BusinessFilters
            citiesByState={citiesByState}
            selectedState={params.state}
            selectedCity={params.city}
            selectedCategory={params.category}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">
            Results ({results.length})
          </h3>
          {results.length === 0 ? (
            <p className="text-gray-700">No results found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((item) => {
                if (item.type === 'business') {
                  return (
                    <Link
                      key={item.id}
                      href={`/business/${item.id}`}
                      className="border rounded-lg overflow-hidden hover:shadow-md transition flex items-center"
                    >
                      <div className="p-2 flex-shrink-0">
                        {item.photoUrl ? (
                          <div className="w-24 h-24 bg-gray-200 overflow-hidden">
                            <BusinessImage
                              src={item.photoUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-2xl">🏢</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2 flex-1 min-w-0">
                        <h4 className="font-semibold text-lg truncate">{item.name}</h4>
                        <p className="text-sm text-gray-700">{item.city}, {item.state}</p>
                        <p className="text-sm text-gray-600 mt-2">
                          {item._count.reviews} reviews
                        </p>
                      </div>
                    </Link>
                  )
                } else if (item.type === 'employer') {
                  return (
                    <Link
                      key={item.id}
                      href={`/employer/${item.id}`}
                      className="border rounded-lg overflow-hidden hover:shadow-md transition flex items-center"
                    >
                      <div className="p-2 flex-shrink-0">
                        {item.photoUrl ? (
                          <div className="w-24 h-24 bg-gray-200 overflow-hidden rounded-full">
                            <BusinessImage
                              src={item.photoUrl}
                              alt={`${item.firstName} ${item.lastName}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-400 text-2xl">
                              {item.firstName[0]}{item.lastName[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-2 flex-1 min-w-0">
                        <h4 className="font-semibold text-lg truncate">
                          {item.firstName} {item.lastName}
                        </h4>
                        {item.businessName ? (
                          <div className="text-sm text-gray-700">
                            <p>{item.businessName}</p>
                            {item.position && <p>{item.position}</p>}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700">
                            {item.city}, {item.state}
                          </p>
                        )}
                        <div className="text-sm text-gray-600 mt-2">
                          <p>{item._count.reviews} reviews received</p>
                          {item._count.reviewsWritten !== undefined && (
                            <p>{item._count.reviewsWritten} reviewed</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                } else if (item.type === 'employee') {
                  return (
                    <Link
                      key={item.id}
                      href={`/employee/${item.id}`}
                      className="border rounded-lg overflow-hidden hover:shadow-md transition flex items-center"
                    >
                      <div className="p-2 flex-shrink-0">
                        {item.photoUrl ? (
                          <div className="w-24 h-24 bg-gray-200 overflow-hidden rounded-full">
                            <BusinessImage
                              src={item.photoUrl}
                              alt={`${item.firstName} ${item.lastName}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-400 text-2xl">
                              {item.firstName[0]}{item.lastName[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-2 flex-1 min-w-0">
                        <h4 className="font-semibold text-lg truncate">
                          {item.firstName} {item.lastName}
                        </h4>
                        <p className="text-sm text-gray-700">Employee</p>
                        <div className="text-sm text-gray-600 mt-2">
                          <p>{item._count.reviews} reviews received</p>
                          {item._count.reviewsWritten !== undefined && (
                            <p>{item._count.reviewsWritten} reviewed</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                }
                return null
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
