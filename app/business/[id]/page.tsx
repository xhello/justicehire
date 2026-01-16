import { getBusinessDetails } from '@/app/actions/business'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createReview } from '@/app/actions/review'
import { createBusinessReview, getBusinessReviews } from '@/app/actions/business-review'
import { prisma } from '@/lib/prisma'
import BusinessImage from '../BusinessImage'
import StarRating from './StarRating'

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()
  const business = await getBusinessDetails(id)
  const businessReviews = await getBusinessReviews(id)
  
  // Calculate average star rating
  const starRatings = businessReviews
    .map((r) => r.starRating)
    .filter((r): r is number => r !== null)
  const averageRating = starRatings.length > 0
    ? (starRatings.reduce((sum, r) => sum + r, 0) / starRatings.length).toFixed(1)
    : null

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
              <div className="flex items-center gap-4 mt-2">
                {averageRating && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">{averageRating}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={star <= Math.round(parseFloat(averageRating)) ? 'text-yellow-400' : 'text-gray-300'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      ({starRatings.length} {starRatings.length === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}
                {!averageRating && (
                  <p className="text-sm text-gray-600">No reviews yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Business Reviews Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Business Reviews</h2>
          
          {user && user.verified && (
            <BusinessReviewForm businessId={business.id} user={user} />
          )}
          
          {!user || !user.verified ? (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                Please <Link href="/signup" className="text-blue-600 hover:text-blue-700">sign up</Link> and verify your account to leave a review.
              </p>
            </div>
          ) : null}

          <div className="mt-6 space-y-4">
            {businessReviews.length === 0 ? (
              <p className="text-gray-700">No reviews yet. Be the first to review this business!</p>
            ) : (
              businessReviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {review.reviewer?.photoUrl ? (
                        <img
                          src={review.reviewer.photoUrl}
                          alt={`${review.reviewer.firstName} ${review.reviewer.lastName}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">
                            {review.reviewer?.firstName[0]}{review.reviewer?.lastName[0]}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {review.reviewer?.firstName} {review.reviewer?.lastName}
                        </p>
                        <p className="text-sm text-gray-600 capitalize">{review.reviewer?.role?.toLowerCase()}</p>
                      </div>
                    </div>
                    {review.starRating && (
                      <div className="flex text-yellow-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star}>{star <= review.starRating! ? '★' : '☆'}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {review.message && (
                    <p className="text-gray-700 mt-2">{review.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-6">Employers</h2>
          {business.employers.length === 0 ? (
            <p className="text-gray-700">No employers registered for this business.</p>
          ) : (
            <div className="space-y-6">
              {business.employers.map((employer) => (
                <EmployerCard
                  key={employer.id}
                  employer={employer}
                  businessId={business.id}
                  user={user}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

async function EmployerCard({
  employer,
  businessId,
  user,
}: {
  employer: any
  businessId: string
  user: any
}) {
  const canReview =
    user &&
    user.verified &&
    user.role === 'EMPLOYEE' &&
    user.id !== employer.userId

  // Get existing review (if any) to allow updating
  const existingReview = canReview
    ? await prisma.reviews.findFirst({
        reviewerId: user.id,
        targetUserId: employer.userId,
        businessId,
      })
    : null

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {employer.user.photoUrl ? (
            <img
              src={employer.user.photoUrl}
              alt={`${employer.user.firstName} ${employer.user.lastName}`}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-xl">
                {employer.user.firstName[0]}{employer.user.lastName[0]}
              </span>
            </div>
          )}
          <div>
            <h3 className="text-xl font-semibold">
              {employer.user.firstName} {employer.user.lastName}
            </h3>
            {employer.user.position && (
              <p className="text-sm text-gray-700">{employer.user.position}</p>
            )}
            <p className="text-sm text-gray-700">{employer.reviewCount} reviews</p>
          </div>
        </div>
      </div>

      {user?.verified ? (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Rating Breakdown:</h4>
          <div className="space-y-1 text-sm">
            <p className="text-green-600">
              Outstanding: {employer.ratings.OUTSTANDING}
            </p>
            <p className="text-yellow-600">
              As Expected: {employer.ratings.DELIVERED_AS_EXPECTED}
            </p>
            <p className="text-red-600">
              Poor: {employer.ratings.GOT_NOTHING_NICE_TO_SAY}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 text-sm text-gray-600">
          <p>Sign up and verify to see rating breakdown</p>
        </div>
      )}

      {canReview && (
        <ReviewForm
          targetUserId={employer.userId}
          businessId={businessId}
          targetType="EMPLOYER"
          existingReview={existingReview}
        />
      )}
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
  existingReview?: { rating: string } | null
}) {
  const isUpdate = !!existingReview
  const defaultRating = existingReview?.rating || ''

  return (
    <form action={createReview} className="mt-4 border-t pt-4">
      <input type="hidden" name="targetUserId" value={targetUserId} />
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="targetType" value={targetType} />

      <label className="block text-sm font-medium text-gray-700 mb-2">
        {isUpdate ? 'Update Review' : 'Leave a Review'}
      </label>
      <div className="flex gap-4">
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
          <span className="text-yellow-600">As Expected</span>
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
          <span className="text-red-600">Poor</span>
        </label>
      </div>

      <button
        type="submit"
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        {isUpdate ? 'Update Review' : 'Submit Review'}
      </button>
    </form>
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
  
  const isUpdate = !!existingReview

  return (
    <form action={createBusinessReview} className="mb-6 border rounded-lg p-4">
      <input type="hidden" name="businessId" value={businessId} />
      
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {isUpdate ? 'Update Your Review' : 'Leave a Review'}
      </label>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating (1-5 stars)
        </label>
        <StarRating name="starRating" defaultValue={existingReview?.starRating || null} required />
      </div>

      <div className="mb-4">
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
          Your Review
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          maxLength={1000}
          defaultValue={existingReview?.message || ''}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Share your experience with this business..."
        />
        <p className="text-xs text-gray-500 mt-1">Maximum 1000 characters</p>
      </div>

      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        {isUpdate ? 'Update Review' : 'Submit Review'}
      </button>
    </form>
  )
}
