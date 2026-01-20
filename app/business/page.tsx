import { getCitiesByState } from '../actions/business'
import { searchResults } from '../actions/search'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import BusinessFilters from './BusinessFilters'
import BusinessImage from './BusinessImage'
import TypeButtons from './TypeButtons'
import { Suspense } from 'react'
import BackButton from '@/components/BackButton'

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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <BackButton />
              <Link
                href="/"
                className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors flex items-center justify-center"
                title="Search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Link>
            </div>
            <div className="flex gap-4 items-center">
              {user ? (
                <Link
                  href="/dashboard/employee"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-blue-600 rounded-md shadow-md transition-colors"
                >
                  {user.photoUrl ? (
                    <img 
                      src={user.photoUrl} 
                      alt="Profile" 
                      className="w-6 h-6 rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 text-xs font-semibold">
                        {user.firstName?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-blue-600 rounded-md shadow-md transition-colors"
                  >
                    Sign Up
                  </Link>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Log In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-16">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Business Search</h2>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <BusinessFilters
            citiesByState={citiesByState}
            selectedState={params.state}
            selectedCity={params.city}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">
            Results ({results.length})
          </h3>
          <Suspense fallback={<div className="flex gap-2 mb-4"><div className="flex-1 h-10 bg-gray-200 rounded-md animate-pulse"></div><div className="flex-1 h-10 bg-gray-200 rounded-md animate-pulse"></div><div className="flex-1 h-10 bg-gray-200 rounded-md animate-pulse"></div></div>}>
            <TypeButtons selectedType={params.category || 'business'} />
          </Suspense>
          {results.length === 0 ? (
            <p className="text-gray-700">No results found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((item: any) => {
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
                        {item.avgRatings && (item.avgRatings.payCompetitive || item.avgRatings.workload || item.avgRatings.flexibility) ? (
                          <div className="text-xs text-gray-600 mt-2 space-y-1">
                            {item.avgRatings.payCompetitive && (
                              <p>Pay: {item.avgRatings.payCompetitive} ⭐</p>
                            )}
                            {item.avgRatings.workload && (
                              <p>Workload: {item.avgRatings.workload} ⭐</p>
                            )}
                            {item.avgRatings.flexibility && (
                              <p>Schedule: {item.avgRatings.flexibility} ⭐</p>
                            )}
                            <p className="text-gray-500">{item._count.reviews} {item._count.reviews === 1 ? 'review' : 'reviews'}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600 mt-2">
                            {item._count.reviews === 0 ? 'No reviews yet' : `${item._count.reviews} ${item._count.reviews === 1 ? 'review' : 'reviews'}`}
                          </p>
                        )}
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
                          <div className="w-24 h-24 bg-gray-200 overflow-hidden rounded-lg">
                            <BusinessImage
                              src={item.photoUrl}
                              alt={`${item.firstName} ${item.lastName}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
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
                          <div className="w-24 h-24 bg-gray-200 overflow-hidden rounded-lg">
                            <BusinessImage
                              src={item.photoUrl}
                              alt={`${item.firstName} ${item.lastName}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
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
    </div>
  )
}
