import { Suspense } from 'react'
import { getUserProfile } from '@/app/actions/review'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createReviewAction } from '@/app/actions/review'
import { prisma } from '@/lib/prisma'
import SuccessBanner from '@/components/SuccessBanner'

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()
  const employee = await getUserProfile(id)

  if (!employee || employee.role !== 'EMPLOYEE') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Employee not found</h1>
          <Link href="/dashboard/employer" className="text-blue-600 hover:text-blue-700">
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Check if current user can review this employee
  // Allow both employers and employees to review
  const canReview =
    user &&
    user.verified &&
    (user.role === 'EMPLOYER' || user.role === 'EMPLOYEE') &&
    user.id !== employee.id

  // Find a businessId for the review
  // For employers: use their business
  // For employees: find a business both have reviewed, or any business the reviewer has reviewed
  let reviewBusinessId: string | null = null
  
  if (canReview) {
    if (user.role === 'EMPLOYER' && user.employerProfile) {
      reviewBusinessId = user.employerProfile.business.id
    } else if (user.role === 'EMPLOYEE') {
      // Find businesses both employees have reviewed
      // Business reviews have targetType: 'BUSINESS' and targetUserId: null
      const allReviews = await prisma.reviews.findMany({
        reviewerId: user.id,
      })
      const reviewerBusinessReviews = allReviews.filter((r: any) => 
        r.targetType === 'BUSINESS' && r.targetUserId === null
      )
      
      const allTargetReviews = await prisma.reviews.findMany({
        reviewerId: employee.id,
      })
      const targetBusinessReviews = allTargetReviews.filter((r: any) => 
        r.targetType === 'BUSINESS' && r.targetUserId === null
      )
      
      const reviewerBusinessIds = new Set<string>(reviewerBusinessReviews.map((r: any) => r.businessId as string))
      const targetBusinessIds = new Set<string>(targetBusinessReviews.map((r: any) => r.businessId as string))
      
      // Find common business
      const commonBusinessId = Array.from(reviewerBusinessIds).find((bid: string) => 
        targetBusinessIds.has(bid)
      )
      
      if (commonBusinessId) {
        reviewBusinessId = commonBusinessId
      } else if (reviewerBusinessReviews.length > 0) {
        // Use any business the reviewer has reviewed
        reviewBusinessId = reviewerBusinessReviews[0].businessId
      } else {
        // Fallback: get first business from database
        const firstBusiness = await prisma.businesses.findFirst({})
        reviewBusinessId = firstBusiness?.id || null
      }
    }
  }

  // Get existing review (if any) to allow updating
  const existingReview =
    canReview && reviewBusinessId
      ? await prisma.reviews.findFirst({
          reviewerId: user.id,
          targetUserId: employee.id,
          businessId: reviewBusinessId,
        })
      : null
  
  // Get all reviews for this employee to display
  const allReviews = await prisma.reviews.findMany({
    targetUserId: employee.id,
    targetType: 'EMPLOYEE',
  })
  
  // Get reviewer information for each review (only for role)
  const reviewsWithUsers = await Promise.all(
    allReviews.map(async (review: any) => {
      const reviewer = await prisma.users.findUnique({ id: review.reviewerId })
      return {
        ...review,
        reviewer: reviewer
          ? {
              role: reviewer.role,
            }
          : null,
      }
    })
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={null}>
        <SuccessBanner />
      </Suspense>
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">
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
            <div className="flex gap-4 items-center">
              {user ? (
                <Link
                  href={user.role === 'EMPLOYEE' ? '/dashboard/employee' : '/dashboard/employer'}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-blue-600 rounded-md transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-blue-600 rounded-md transition-colors"
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-6 mb-6">
            {employee.photoUrl ? (
              <img
                src={employee.photoUrl}
                alt={`${employee.firstName} ${employee.lastName}`}
                className="w-24 h-24 rounded-lg object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-3xl">
                  {employee.firstName[0]}{employee.lastName[0]}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {employee.firstName} {employee.lastName}
              </h1>
              <p className="text-lg text-gray-700">Employee</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">
            {existingReview ? 'Update Review' : 'Leave a Review'}
          </h2>
          <div className="mb-4 pb-4 border-b">
            <p className="text-sm text-gray-600 mb-2">
              Total Reviews: <span className="font-semibold text-gray-900">{employee.total}</span>
            </p>
            <div className="flex gap-4 text-sm">
              <p className="text-green-600">
                Outstanding: <span className="font-semibold">{employee.ratings.OUTSTANDING}</span>
              </p>
              <p className="text-yellow-600">
                No issue: <span className="font-semibold">{employee.ratings.DELIVERED_AS_EXPECTED}</span>
              </p>
              <p className="text-red-600">
                Nothing nice to say: <span className="font-semibold">{employee.ratings.GOT_NOTHING_NICE_TO_SAY}</span>
              </p>
            </div>
          </div>
          {canReview && reviewBusinessId ? (
            <ReviewForm
              targetUserId={employee.id}
              businessId={reviewBusinessId}
              targetType="EMPLOYEE"
              existingReview={existingReview}
            />
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              {!canReview && !user && (
                <>
                  <p className="text-gray-700">
                    You must be logged in to leave a review.
                  </p>
                  <div className="mt-4 flex gap-4">
                    <Link
                      href="/signup"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Sign Up
                    </Link>
                    <Link
                      href="/login"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Log In
                    </Link>
                  </div>
                </>
              )}
              {user && !user.verified && (
                <div>
                  <p className="text-gray-700 font-medium mb-2">
                    Only verified users can submit reviews.
                  </p>
                  <p className="text-sm text-gray-600">
                    Please verify your email address to leave reviews. You can verify your email from your dashboard.
                  </p>
                </div>
              )}
              {user && user.verified && user.id === employee.id && (
                <p className="text-gray-700">
                  You cannot review yourself.
                </p>
              )}
              {canReview && !reviewBusinessId && (
                <p className="text-gray-700">
                  You need to review at least one business before you can review other employees.
                </p>
              )}
            </div>
          )}
        </div>

        {reviewsWithUsers.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mt-8">
            <h2 className="text-2xl font-semibold mb-4">All Reviews</h2>
            <div className="space-y-4">
              {reviewsWithUsers.map((review: any) => (
                <div key={review.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm text-gray-600 capitalize font-medium">{review.reviewer?.role?.toLowerCase() || 'Reviewer'}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
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
                  
                  {review.message && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-gray-700">{review.message}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function ReviewForm({
  targetUserId,
  businessId,
  targetType,
  existingReview,
}: {
  targetUserId: string
  businessId: string
  targetType: 'EMPLOYEE' | 'EMPLOYER'
  existingReview?: { rating: string; message?: string | null } | null
}) {
  const isUpdate = !!existingReview
  const defaultRating = existingReview?.rating || ''
  const defaultMessage = existingReview?.message || ''

  return (
    <form action={createReviewAction}>
      <input type="hidden" name="targetUserId" value={targetUserId} />
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="targetType" value={targetType} />

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="rating"
                value="OUTSTANDING"
                required
                defaultChecked={defaultRating === 'OUTSTANDING'}
                className="mr-2"
              />
              <span className="text-green-600">Outstanding</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="rating"
                value="DELIVERED_AS_EXPECTED"
                required
                defaultChecked={defaultRating === 'DELIVERED_AS_EXPECTED'}
                className="mr-2"
              />
              <span className="text-yellow-600">No issue</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="rating"
                value="GOT_NOTHING_NICE_TO_SAY"
                required
                defaultChecked={defaultRating === 'GOT_NOTHING_NICE_TO_SAY'}
                className="mr-2"
              />
              <span className="text-red-600">Nothing nice to say</span>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Comments (Optional)
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            maxLength={1000}
            defaultValue={defaultMessage}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Share your thoughts about this person..."
          />
          <p className="text-xs text-gray-500 mt-1">Maximum 1000 characters (optional)</p>
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {isUpdate ? 'Update Review' : 'Submit Review'}
        </button>
      </div>
    </form>
  )
}
