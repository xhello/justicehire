import { Suspense } from 'react'
import { getBusinessDetails } from '@/app/actions/business'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createBusinessReview, getBusinessReviews } from '@/app/actions/business-review'
import { prisma } from '@/lib/prisma'
import BusinessImage from '../BusinessImage'
import StarRating from './StarRating'
import SuccessBanner from '@/components/SuccessBanner'
import BusinessReviewFormClient from './BusinessReviewFormClient'
import Tabs from './Tabs'
import ReviewFormClient from './ReviewFormClient'
import { timeAgo } from '@/lib/timeAgo'
import BackButton from '@/components/BackButton'

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  // Parallel fetch: user, business details, and business reviews
  const [user, business, fetchedReviews] = await Promise.all([
    getCurrentUser(),
    getBusinessDetails(id),
    getBusinessReviews(id),
  ])
  
  // Sort reviews by most recent first
  const businessReviews = [...fetchedReviews].sort((a: any, b: any) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
  
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
    ? (payCompetitiveValues.reduce((sum: number, v: number) => sum + v, 0) / payCompetitiveValues.length).toFixed(1)
    : null
  const avgWorkload = workloadValues.length > 0
    ? (workloadValues.reduce((sum: number, v: number) => sum + v, 0) / workloadValues.length).toFixed(1)
    : null
  const avgFlexibility = flexibilityValues.length > 0
    ? (flexibilityValues.reduce((sum: number, v: number) => sum + v, 0) / flexibilityValues.length).toFixed(1)
    : null
  
  const hasRatings = avgPayCompetitive || avgWorkload || avgFlexibility
  const reviewCount = businessReviews.length

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Business not found</h1>
          <Link href="/business" className="text-blue-600 hover:text-blue-700">
            Back to search
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={null}>
        <SuccessBanner />
      </Suspense>
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
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="flex gap-6 items-center">
            <div className="p-3 flex-shrink-0">
              {business.photoUrl ? (
                <div className="w-32 h-32 bg-gray-200 overflow-hidden rounded-lg">
                  <BusinessImage
                    src={business.photoUrl}
                    alt={business.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-4xl">🏢</span>
                </div>
              )}
            </div>
            <div className="p-3 flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{business.name}</h1>
              <p className="text-lg text-gray-700">{business.address}</p>
              <p className="text-sm text-gray-600">
                {business.city}, {business.state} • {business.category}
              </p>
              <div className="mt-2">
                {hasRatings ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 flex-wrap">
                      {avgPayCompetitive && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Pay:</span>
                          <span className="text-lg font-bold text-gray-900">{avgPayCompetitive}</span>
                          <div className="flex text-yellow-400">
                            {[1, 2, 3, 4, 5].map((star: number) => (
                              <span key={star}>{star <= Math.round(parseFloat(avgPayCompetitive)) ? '★' : '☆'}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {avgWorkload && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Workload amount:</span>
                          <span className="text-lg font-bold text-gray-900">{avgWorkload}</span>
                          <div className="flex text-yellow-400">
                            {[1, 2, 3, 4, 5].map((star: number) => (
                              <span key={star}>{star <= Math.round(parseFloat(avgWorkload)) ? '★' : '☆'}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {avgFlexibility && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Schedule flexibility:</span>
                          <span className="text-lg font-bold text-gray-900">{avgFlexibility}</span>
                          <div className="flex text-yellow-400">
                            {[1, 2, 3, 4, 5].map((star: number) => (
                              <span key={star}>{star <= Math.round(parseFloat(avgFlexibility)) ? '★' : '☆'}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Based on {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Rating scale: ⭐ 1 | Dissatisfied → ⭐ 5 | Satisfied
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No reviews yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: Business Reviews | Employers */}
        <Tabs
          tabs={[
            {
              id: 'reviews',
              label: `Business Reviews (${businessReviews.length})`,
              content: (
                <>
                  {user && user.verified && (
                    <BusinessReviewForm businessId={business.id} user={user} />
                  )}
                  
                  {!user || !user.verified ? (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-700 font-medium mb-2">
                        Only verified users can submit reviews.
                      </p>
                      <p className="text-sm text-gray-600">
                        Please <Link href="/signup" className="text-blue-600 hover:text-blue-700">sign up</Link> and verify your email address to leave a review. You can verify your email from your dashboard.
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-6 space-y-4">
                    {businessReviews.length === 0 ? (
                      <p className="text-gray-700">No reviews yet. Be the first to review this business!</p>
                    ) : (
                      businessReviews.map((review: any, index: number) => {
                        // Debug: Log review data
                        if (process.env.NODE_ENV === 'development') {
                          console.log('Review data:', {
                            id: review.id,
                            targetType: review.targetType,
                            payCompetitive: review.payCompetitive,
                            workload: review.workload,
                            flexibility: review.flexibility,
                            hasFields: !!(review.payCompetitive || review.workload || review.flexibility)
                          })
                        }
                        
                        // Show full content for logged-in users OR the first review
                        const showFullContent = !!user || index === 0
                        
                        return (
                        <div key={review.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-xs text-gray-500">
                              {timeAgo(review.createdAt)}
                            </span>
                          </div>
                          
                          {/* Display three ratings - always show for business reviews, even if not rated */}
                          <div className="mt-3 space-y-2">
                            {review.payCompetitive ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700 min-w-[140px]">Pay Competitive:</span>
                                <div className="flex text-yellow-400">
                                  {[1, 2, 3, 4, 5].map((star: number) => (
                                    <span key={star}>{star <= review.payCompetitive! ? '★' : '☆'}</span>
                                  ))}
                                </div>
                                <span className="text-sm text-gray-600">({review.payCompetitive}/5)</span>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500">Pay Competitive: Not rated</div>
                            )}
                              {review.workload ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-700 min-w-[160px]">Workload amount:</span>
                                  <div className="flex text-yellow-400">
                                    {[1, 2, 3, 4, 5].map((star: number) => (
                                      <span key={star}>{star <= review.workload! ? '★' : '☆'}</span>
                                    ))}
                                  </div>
                                  <span className="text-sm text-gray-600">({review.workload}/5)</span>
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500">Workload amount: Not rated</div>
                              )}
                              {review.flexibility ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-700 min-w-[160px]">Schedule flexibility:</span>
                                  <div className="flex text-yellow-400">
                                    {[1, 2, 3, 4, 5].map((star: number) => (
                                      <span key={star}>{star <= review.flexibility! ? '★' : '☆'}</span>
                                    ))}
                                  </div>
                                  <span className="text-sm text-gray-600">({review.flexibility}/5)</span>
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500">Schedule flexibility: Not rated</div>
                              )}
                          </div>
                          
                          {showFullContent ? (
                            review.message && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-sm font-medium text-gray-700 mb-1">Additional Comments:</p>
                                <p className="text-gray-700">{review.message}</p>
                              </div>
                            )
                          ) : (
                            <div className="mt-3 pt-3 border-t bg-gray-50 rounded p-3">
                              <p className="text-sm text-gray-600">
                                Only verified users can read review contents.
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                Please <a href="/signup" className="text-blue-600 hover:underline">sign up</a> and verify your email address to read full reviews. You can verify your email from your dashboard.
                              </p>
                            </div>
                          )}
                        </div>
                        )
                      })
                    )}
                  </div>
                </>
              ),
            },
            {
              id: 'employees',
              label: `Employees (${business.employees.length})`,
              content: (
                <>
                  {business.employees.length === 0 ? (
                    <p className="text-gray-700">No employees registered for this business.</p>
                  ) : (
                    <div className="space-y-6">
                      {business.employees.map((employee: any) => (
                        <EmployeeCard
                          key={employee.id}
                          employee={employee}
                          businessId={business.id}
                          user={user}
                        />
                      ))}
                    </div>
                  )}
                </>
              ),
            },
          ]}
          defaultTab="reviews"
        />
      </main>
      </div>
    </div>
  )
}

async function EmployeeCard({
  employee,
  businessId,
  user,
}: {
  employee: any
  businessId: string
  user: any
}) {
  const canReview =
    user &&
    user.verified &&
    user.id !== employee.userId

  // Get existing review (if any) to allow updating
  const existingReview = canReview
    ? await prisma.reviews.findFirst({
        reviewerId: user.id,
        targetUserId: employee.userId,
        businessId,
      })
    : null

  return (
    <div className="border rounded-lg p-4">
      <Link href={`/employee/${employee.userId}`} className="block">
        <div className="flex items-center justify-between mb-4 hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-4">
            {employee.user.photoUrl ? (
              <img
                src={employee.user.photoUrl}
                alt={`${employee.user.firstName} ${employee.user.lastName}`}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-xl">
                  {employee.user.firstName[0]}{employee.user.lastName[0]}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-xl font-semibold text-blue-600 hover:text-blue-700">
                {employee.user.firstName} {employee.user.lastName}
              </h3>
              {employee.user.position && (
                <p className="text-sm text-gray-700 capitalize">{employee.user.position}</p>
              )}
              <p className="text-sm text-gray-700">{employee.reviewCount} reviews</p>
            </div>
          </div>
        </div>
      </Link>

      {user ? (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Rating Breakdown:</h4>
          <div className="space-y-1 text-sm">
            <p className="text-green-600">
              Outstanding: {employee.ratings.OUTSTANDING}
            </p>
            <p className="text-yellow-600">
              No issue: {employee.ratings.DELIVERED_AS_EXPECTED}
            </p>
            <p className="text-red-600">
              Nothing nice to say: {employee.ratings.GOT_NOTHING_NICE_TO_SAY}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Rating Breakdown:</h4>
          <div className="space-y-1 text-sm">
            <p className="text-green-600">Outstanding: <span className="blur-sm select-none">0</span></p>
            <p className="text-yellow-600">No issue: <span className="blur-sm select-none">0</span></p>
            <p className="text-red-600">Nothing nice to say: <span className="blur-sm select-none">0</span></p>
          </div>
          <p className="mt-2 text-xs text-blue-600">
            Only verified users can see review stats
          </p>
        </div>
      )}

      {canReview && (
        <ReviewFormClient
          targetUserId={employee.userId}
          businessId={businessId}
          targetType="EMPLOYEE"
          existingReview={existingReview}
        />
      )}
    </div>
  )
}

async function BusinessReviewForm({ businessId, user }: { businessId: string; user: any }) {
  // Get existing review if any
  const existingReview = await prisma.reviews.findFirst({
    reviewerId: user.id,
    businessId,
    targetType: 'BUSINESS',
    targetUserId: null,
  })
  
  return (
    <BusinessReviewFormClient 
      businessId={businessId}
      existingReview={existingReview}
    />
  )
}
