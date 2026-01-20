import { Suspense } from 'react'
import { getUserProfile } from '@/app/actions/review'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import { createReviewAction } from '@/app/actions/review'
import { prisma } from '@/lib/prisma'
import SuccessBanner from '@/components/SuccessBanner'
import { timeAgo } from '@/lib/timeAgo'

export default async function EmployerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  // Parallel fetch: user, employer profile
  const [user, employer] = await Promise.all([
    getCurrentUser(),
    getUserProfile(id),
  ])
  
  // getUserProfile already fetches user data including position, no need for extra query
  const employerPosition = employer?.position || null

  if (!employer || employer.role !== 'EMPLOYER') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Employer not found</h1>
          <Link href="/dashboard/employee" className="text-blue-600 hover:text-blue-700">
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Check if current user can review this employer
  const canReview =
    user &&
    user.verified &&
    (user.role === 'EMPLOYEE' || user.role === 'EMPLOYER') &&
    user.id !== employer.id

  // Get the reviewer's business ID
  let reviewerBusinessId: string | null = null
  if (user && user.role === 'EMPLOYER' && user.employerProfile) {
    reviewerBusinessId = user.employerProfile.business.id
  } else if (user && user.role === 'EMPLOYEE' && employer.employerProfile) {
    reviewerBusinessId = employer.employerProfile.business.id
  }

  // Parallel fetch: existing review + all reviews for this employer
  const [existingReview, allReviews] = await Promise.all([
    canReview && reviewerBusinessId
      ? prisma.reviews.findFirst({
          reviewerId: user.id,
          targetUserId: employer.id,
          businessId: reviewerBusinessId,
        })
      : Promise.resolve(null),
    prisma.reviews.findMany({
      targetUserId: employer.id,
      targetType: 'EMPLOYER',
    }),
  ])
  
  // Get all reviewer IDs and fetch users in one query (avoids N+1)
  const reviewerIds = [...new Set(allReviews.map((r: any) => r.reviewerId).filter(Boolean))]
  const reviewers = reviewerIds.length > 0 ? await prisma.users.findMany({}) : []
  const reviewerMap = new Map<string, any>(reviewers.map((u: any) => [u.id, u]))
  
  const reviewsWithUsers = allReviews.map((review: any) => {
    const reviewer: any = review.reviewerId ? reviewerMap.get(review.reviewerId) : null
    return {
      ...review,
      reviewer: reviewer ? { role: reviewer.role } : null,
    }
  })
  
  // Sort by most recent first
  reviewsWithUsers.sort((a: any, b: any) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={null}>
        <SuccessBanner />
      </Suspense>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
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
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-6 mb-6">
            {employer.photoUrl ? (
              <img
                src={employer.photoUrl}
                alt={`${employer.firstName} ${employer.lastName}`}
                className="w-24 h-24 rounded-lg object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-3xl">
                  {employer.firstName[0]}{employer.lastName[0]}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {employer.firstName} {employer.lastName}
              </h1>
              {employer.employerProfile?.business ? (
                <p className="text-lg text-gray-700">
                  {employerPosition ? (
                    <><span className="capitalize">{employerPosition}</span> at{' '}</>
                  ) : (
                    <>Working at{' '}</>
                  )}
                  <Link 
                    href={`/business/${employer.employerProfile.business.id}`}
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {employer.employerProfile.business.name}
                  </Link>
                </p>
              ) : (
                <p className="text-lg text-gray-700">Employee</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">
            {existingReview ? 'Update Review' : 'Leave a Review'}
          </h2>
          <div className="mb-4 pb-4 border-b">
            <p className="text-sm text-gray-600 mb-2">
              Total Reviews: <span className="font-semibold text-gray-900">{employer.total}</span>
            </p>
            {user ? (
              <div className="flex gap-4 text-sm">
                <p className="text-green-600">
                  Outstanding: <span className="font-semibold">{employer.ratings.OUTSTANDING}</span>
                </p>
                <p className="text-yellow-600">
                  No issue: <span className="font-semibold">{employer.ratings.DELIVERED_AS_EXPECTED}</span>
                </p>
                <p className="text-red-600">
                  Nothing nice to say: <span className="font-semibold">{employer.ratings.GOT_NOTHING_NICE_TO_SAY}</span>
                </p>
              </div>
            ) : (
              <div className="relative">
                <div className="flex gap-4 text-sm">
                  <p className="text-green-600">
                    Outstanding: <span className="font-semibold blur-sm select-none">0</span>
                  </p>
                  <p className="text-yellow-600">
                    No issue: <span className="font-semibold blur-sm select-none">0</span>
                  </p>
                  <p className="text-red-600">
                    Nothing nice to say: <span className="font-semibold blur-sm select-none">0</span>
                  </p>
                </div>
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                  Only verified users can see review stats.
                </div>
              </div>
            )}
          </div>
          {canReview && reviewerBusinessId ? (
            <ReviewForm
              targetUserId={employer.id}
              businessId={reviewerBusinessId}
              targetType="EMPLOYER"
              existingReview={existingReview}
            />
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-700">
                You must be logged in as a verified employee or employer to leave a review.
              </p>
              {!user && (
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
              )}
              {user && !user.verified && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700 font-medium mb-1">
                    Only verified users can submit reviews.
                  </p>
                  <p className="text-sm text-gray-600">
                    Please verify your email address to leave reviews. You can verify your email from your dashboard.
                  </p>
                </div>
              )}
              {user && user.verified && user.role !== 'EMPLOYEE' && user.role !== 'EMPLOYER' && (
                <p className="mt-2 text-sm text-gray-600">
                  Only employees and employers can leave reviews for employers.
                </p>
              )}
              {user && user.role === 'EMPLOYER' && !user.employerProfile && (
                <p className="mt-2 text-sm text-gray-600">
                  You need to be associated with a business to leave reviews.
                </p>
              )}
            </div>
          )}
        </div>

        {reviewsWithUsers.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mt-8">
            <h2 className="text-2xl font-semibold mb-4">All Reviews</h2>
            <div className="space-y-4">
              {reviewsWithUsers.map((review: any, index: number) => {
                // Show full content for logged-in users OR the first review
                const showFullContent = !!user || index === 0
                
                return (
                <div key={review.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-gray-500">
                      {timeAgo(review.createdAt)}
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
              )})}
            </div>
          </div>
        )}

      </main>
      </div>
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
