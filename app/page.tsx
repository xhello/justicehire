import Link from 'next/link'
import { Suspense } from 'react'
import { getCitiesByState } from './actions/business'
import { searchResults, getCategoryCounts } from './actions/search'
import { getCurrentUser } from '@/lib/auth'
import BusinessFilters from './business/BusinessFilters'
import BusinessImage from './business/BusinessImage'
import SuccessBanner from '@/components/SuccessBanner'
import TypeButtons from './business/TypeButtons'

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; city?: string; category?: string }>
}) {
  let params, user, results, citiesByState, categoryCounts
  
  try {
    params = await searchParams
  } catch (err) {
    params = { state: undefined, city: undefined, category: undefined }
  }
  
  try {
    // Parallel fetch: user, results, cities, and category counts
    const [userResult, resultsResult, citiesResult, countsResult] = await Promise.all([
      getCurrentUser().catch((err) => {
        console.error('Error getting current user:', err)
        return null
      }),
      searchResults({
        state: params.state,
        city: params.city,
        category: params.category,
      }).catch((err) => {
        console.error('Error getting search results:', err)
        return []
      }),
      getCitiesByState().catch((err) => {
        console.error('Error getting cities by state:', err)
        return {}
      }),
      getCategoryCounts({
        state: params.state,
        city: params.city,
      }).catch((err) => {
        console.error('Error getting category counts:', err)
        return { business: 0, employees: 0 }
      }),
    ])
    
    user = userResult
    results = resultsResult
    citiesByState = citiesResult
    categoryCounts = countsResult
  } catch (err) {
    console.error('Error fetching data:', err)
    user = null
    results = []
    citiesByState = {}
    categoryCounts = { business: 0, employees: 0 }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={null}>
        <SuccessBanner />
      </Suspense>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Justice Hire
            </Link>
            <div className="flex gap-4 items-center">
              {user ? (
                <Link
                  href="/dashboard/employee"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-blue-600 rounded-md shadow-md transition-colors"
                >
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
        <Suspense fallback={null}>
          <SuccessBanner />
        </Suspense>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Anonymous, Verified Reviews for Hospitality
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            A platform where employees and employers in the hospitality industry can leave
            anonymous, verified reviews on each other and companies. Reviews are completely anonymous to
            both the public and the reviewed party.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <BusinessFilters
            citiesByState={citiesByState}
            selectedState={params.state}
            selectedCity={params.city}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <Suspense fallback={<div className="flex gap-2 mb-4"><div className="flex-1 h-10 bg-gray-200 rounded-md animate-pulse"></div><div className="flex-1 h-10 bg-gray-200 rounded-md animate-pulse"></div><div className="flex-1 h-10 bg-gray-200 rounded-md animate-pulse"></div></div>}>
            <TypeButtons selectedType={params.category || 'business'} counts={categoryCounts} />
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
                        {item.businessName ? (
                          <p className="text-sm text-gray-700">
                            {item.position ? (
                              <><span className="capitalize">{item.position}</span> at {item.businessName}</>
                            ) : (
                              <>Working at {item.businessName}</>
                            )}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-700">Employee</p>
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
                }
                return null
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} Justice Hire. All rights reserved.
            </p>
            <Link
              href="/terms"
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Terms of Service & Disclaimer
            </Link>
          </div>
        </div>
      </footer>
      </div>
    </div>
    )
}
