import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { prisma } from '@/lib/prisma'
import ProfilePhotoSection from '../ProfilePhotoSection'
import ReviewsTabs from '../ReviewsTabs'

export default async function EmployeeDashboard() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'EMPLOYEE') {
    redirect('/dashboard/employer')
  }

  // Employees can access dashboard even if not verified (can verify from dashboard)

  // Get user's rating breakdown directly
  let userRatings = {
    ratings: {
      OUTSTANDING: 0,
      DELIVERED_AS_EXPECTED: 0,
      GOT_NOTHING_NICE_TO_SAY: 0,
    },
    total: 0,
  }
  
  try {
    const reviewsReceived = await prisma.reviews.findMany({
      targetUserId: user.id,
    })

    reviewsReceived.forEach((review: any) => {
      if (review.rating === 'OUTSTANDING') {
        userRatings.ratings.OUTSTANDING++
      } else if (review.rating === 'DELIVERED_AS_EXPECTED') {
        userRatings.ratings.DELIVERED_AS_EXPECTED++
      } else if (review.rating === 'GOT_NOTHING_NICE_TO_SAY') {
        userRatings.ratings.GOT_NOTHING_NICE_TO_SAY++
      }
    })

    userRatings.total = reviewsReceived.length
  } catch (error) {
    console.error('Error fetching user ratings:', error)
  }

  // Get all reviews the employee has given
  const reviewsGiven = await prisma.reviews.findMany({
    reviewerId: user.id,
  })

  // Get all reviews the employee has received
  const reviewsReceived = await prisma.reviews.findMany({
    targetUserId: user.id,
  })

  // Get details for reviews given (target user, business, etc.)
  const reviewsGivenWithDetails = await Promise.all(
    reviewsGiven.map(async (review: any) => {
      let targetUser = null
      let business = null
      
      if (review.targetUserId) {
        targetUser = await prisma.users.findUnique({ id: review.targetUserId })
      }
      
      if (review.businessId) {
        business = await prisma.businesses.findUnique({ id: review.businessId })
      }
      
      return {
        ...review,
        targetUser: targetUser
          ? {
              id: targetUser.id,
              firstName: targetUser.firstName,
              lastName: targetUser.lastName,
              role: targetUser.role,
              photoUrl: targetUser.photoUrl,
            }
          : null,
        business: business
          ? {
              id: business.id,
              name: business.name,
              photoUrl: business.photoUrl,
            }
          : null,
      }
    })
  )

  // Get details for reviews received (reviewer, business, etc.)
  const reviewsReceivedWithDetails = await Promise.all(
    reviewsReceived.map(async (review: any) => {
      let reviewer = null
      let business = null
      
      if (review.reviewerId) {
        reviewer = await prisma.users.findUnique({ id: review.reviewerId })
      }
      
      if (review.businessId) {
        business = await prisma.businesses.findUnique({ id: review.businessId })
      }
      
      return {
        ...review,
        reviewer: reviewer
          ? {
              id: reviewer.id,
              firstName: reviewer.firstName,
              lastName: reviewer.lastName,
              role: reviewer.role,
              photoUrl: reviewer.photoUrl,
            }
          : null,
        business: business
          ? {
              id: business.id,
              name: business.name,
              photoUrl: business.photoUrl,
            }
          : null,
      }
    })
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700">
                Justice Hire
              </Link>
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
            <div className="flex items-center gap-4">
              <Link 
                href={`/employee/${user.id}`}
                className="flex items-center"
              >
                {user.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-xs">
                      {user.firstName[0]}{user.lastName[0]}
                    </span>
                  </div>
                )}
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-blue-600 rounded-lg shadow-sm transition-colors"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Employee Dashboard</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ProfilePhotoSection user={{
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              photoUrl: user.photoUrl,
              email: user.email,
              verified: user.verified,
            }} ratings={userRatings} />
          </div>
          
          <div className="lg:col-span-2">
            <ReviewsTabs
              reviewsReceived={reviewsReceivedWithDetails}
              reviewsGiven={reviewsGivenWithDetails}
              renderReceived={(reviews) => reviews.map((review: any) => (
                <ReviewReceivedCard key={review.id} review={review} />
              ))}
              renderGiven={(reviews) => reviews.map((review: any) => (
                <ReviewGivenCard key={review.id} review={review} />
              ))}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

function ReviewGivenCard({ review }: { review: any }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3 flex-1">
          {/* Photo - Business or Profile */}
          {review.targetType === 'BUSINESS' && review.business ? (
            <Link href={`/business/${review.business.id}`} className="flex-shrink-0">
              {review.business.photoUrl ? (
                <img
                  src={review.business.photoUrl}
                  alt={review.business.name}
                  className="w-12 h-12 rounded-lg object-cover hover:opacity-80 transition-opacity cursor-pointer"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors cursor-pointer">
                  <span className="text-gray-400 text-lg">🏢</span>
                </div>
              )}
            </Link>
          ) : review.targetUser ? (
            <Link 
              href={review.targetType === 'EMPLOYER' ? `/employer/${review.targetUser.id}` : `/employee/${review.targetUser.id}`}
              className="flex-shrink-0"
            >
              {review.targetUser.photoUrl ? (
                <img
                  src={review.targetUser.photoUrl}
                  alt={`${review.targetUser.firstName} ${review.targetUser.lastName}`}
                  className="w-12 h-12 rounded-lg object-cover hover:opacity-80 transition-opacity cursor-pointer"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors cursor-pointer">
                  <span className="text-gray-500 text-sm">
                    {review.targetUser.firstName[0]}{review.targetUser.lastName[0]}
                  </span>
                </div>
              )}
            </Link>
          ) : null}
          
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {review.targetType === 'BUSINESS' && review.business ? (
                <>
                  Review for: <Link href={`/business/${review.business.id}`} className="text-blue-600 hover:text-blue-700">{review.business.name}</Link>
                </>
              ) : review.targetType === 'EMPLOYER' && review.targetUser ? (
                <>
                  Review for: <Link href={`/employer/${review.targetUser.id}`} className="text-blue-600 hover:text-blue-700">{review.targetUser.firstName} {review.targetUser.lastName}</Link> (Employer)
                </>
              ) : review.targetType === 'EMPLOYEE' && review.targetUser ? (
                <>
                  Review for: <Link href={`/employee/${review.targetUser.id}`} className="text-blue-600 hover:text-blue-700">{review.targetUser.firstName} {review.targetUser.lastName}</Link> (Employee)
                </>
              ) : (
                'Review'
              )}
            </p>
            {review.business && review.targetType !== 'BUSINESS' && (
              <p className="text-xs text-gray-500 mt-1">Business: {review.business.name}</p>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-500 ml-4">
          {new Date(review.createdAt).toLocaleDateString()}
        </span>
      </div>
      
      {review.targetType === 'BUSINESS' ? (
        <div className="mt-3 space-y-2">
          {review.payCompetitive && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Pay Competitive:</span>
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star: number) => (
                  <span key={star}>{star <= review.payCompetitive! ? '★' : '☆'}</span>
                ))}
              </div>
              <span className="text-sm text-gray-600">({review.payCompetitive}/5)</span>
            </div>
          )}
          {review.workload && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Workload amount:</span>
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star: number) => (
                  <span key={star}>{star <= review.workload! ? '★' : '☆'}</span>
                ))}
              </div>
              <span className="text-sm text-gray-600">({review.workload}/5)</span>
            </div>
          )}
          {review.flexibility && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Schedule flexibility:</span>
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star: number) => (
                  <span key={star}>{star <= review.flexibility! ? '★' : '☆'}</span>
                ))}
              </div>
              <span className="text-sm text-gray-600">({review.flexibility}/5)</span>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-2">
          {review.rating === 'OUTSTANDING' && (
            <p className="text-green-600 font-medium">Outstanding</p>
          )}
          {review.rating === 'DELIVERED_AS_EXPECTED' && (
            <p className="text-yellow-600 font-medium">No issue</p>
          )}
          {review.rating === 'GOT_NOTHING_NICE_TO_SAY' && (
            <p className="text-red-600 font-medium">Nothing nice to say</p>
          )}
        </div>
      )}
      
      {review.message && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-sm font-medium text-gray-700 mb-1">Additional Comments:</p>
          <p className="text-gray-700">{review.message}</p>
        </div>
      )}
    </div>
  )
}

function ReviewReceivedCard({ review }: { review: any }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3 flex-1">
          {/* Reviewer Photo */}
          {review.reviewer ? (
            <Link 
              href={review.reviewer.role === 'EMPLOYER' ? `/employer/${review.reviewer.id}` : `/employee/${review.reviewer.id}`}
              className="flex-shrink-0"
            >
              {review.reviewer.photoUrl ? (
                <img
                  src={review.reviewer.photoUrl}
                  alt={`${review.reviewer.firstName} ${review.reviewer.lastName}`}
                  className="w-12 h-12 rounded-lg object-cover hover:opacity-80 transition-opacity cursor-pointer"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors cursor-pointer">
                  <span className="text-gray-500 text-sm">
                    {review.reviewer.firstName[0]}{review.reviewer.lastName[0]}
                  </span>
                </div>
              )}
            </Link>
          ) : null}
          
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              Review from: {review.reviewer ? (
                <Link 
                  href={review.reviewer.role === 'EMPLOYER' ? `/employer/${review.reviewer.id}` : `/employee/${review.reviewer.id}`}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {review.reviewer.firstName} {review.reviewer.lastName}
                </Link>
              ) : (
                'Anonymous'
              )} ({review.reviewer?.role?.toLowerCase() || 'Reviewer'})
            </p>
            {review.business && (
              <p className="text-xs text-gray-500 mt-1">at <Link href={`/business/${review.business.id}`} className="text-blue-600 hover:text-blue-700">{review.business.name}</Link></p>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-500 ml-4">
          {new Date(review.createdAt).toLocaleDateString()}
        </span>
      </div>
      
      {review.targetType === 'BUSINESS' ? (
        <div className="mt-3 space-y-2">
          {review.payCompetitive && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Pay Competitive:</span>
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star: number) => (
                  <span key={star}>{star <= review.payCompetitive! ? '★' : '☆'}</span>
                ))}
              </div>
              <span className="text-sm text-gray-600">({review.payCompetitive}/5)</span>
            </div>
          )}
          {review.workload && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Workload amount:</span>
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star: number) => (
                  <span key={star}>{star <= review.workload! ? '★' : '☆'}</span>
                ))}
              </div>
              <span className="text-sm text-gray-600">({review.workload}/5)</span>
            </div>
          )}
          {review.flexibility && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Schedule flexibility:</span>
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star: number) => (
                  <span key={star}>{star <= review.flexibility! ? '★' : '☆'}</span>
                ))}
              </div>
              <span className="text-sm text-gray-600">({review.flexibility}/5)</span>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-2">
          {review.rating === 'OUTSTANDING' && (
            <p className="text-green-600 font-medium">Outstanding</p>
          )}
          {review.rating === 'DELIVERED_AS_EXPECTED' && (
            <p className="text-yellow-600 font-medium">No issue</p>
          )}
          {review.rating === 'GOT_NOTHING_NICE_TO_SAY' && (
            <p className="text-red-600 font-medium">Nothing nice to say</p>
          )}
        </div>
      )}
      
      {review.message && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-sm font-medium text-gray-700 mb-1">Comment:</p>
          <p className="text-gray-700">{review.message}</p>
        </div>
      )}
    </div>
  )
}

