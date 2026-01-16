import { getUserProfile } from '@/app/actions/review'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createReview } from '@/app/actions/review'
import { prisma } from '@/lib/prisma'

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
  const canReview =
    user &&
    user.verified &&
    user.role === 'EMPLOYER' &&
    user.id !== employee.id

  // Get existing review (if any) to allow updating
  const existingReview =
    canReview && user?.employerProfile
      ? await prisma.reviews.findFirst({
          reviewerId: user.id,
          targetUserId: employee.id,
          businessId: user.employerProfile.business.id,
        })
      : null

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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-6 mb-6">
            {employee.photoUrl ? (
              <img
                src={employee.photoUrl}
                alt={`${employee.firstName} ${employee.lastName}`}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
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

          {employee.socialUrl && (
            <div className="mb-4">
              <a
                href={employee.socialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                {employee.socialUrl}
              </a>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Rating Summary</h2>
          <div className="space-y-2">
            <p className="text-lg">
              Total Reviews: <span className="font-semibold">{employee.total}</span>
            </p>
            <div className="space-y-1">
              <p className="text-green-600">
                Outstanding: {employee.ratings.OUTSTANDING}
              </p>
              <p className="text-yellow-600">
                As Expected: {employee.ratings.DELIVERED_AS_EXPECTED}
              </p>
              <p className="text-red-600">
                Nothing nice to say: {employee.ratings.GOT_NOTHING_NICE_TO_SAY}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">
            {existingReview ? 'Update Review' : 'Leave a Review'}
          </h2>
          {canReview && user?.employerProfile ? (
            <ReviewForm
              targetUserId={employee.id}
              businessId={user.employerProfile.business.id}
              targetType="EMPLOYEE"
              existingReview={existingReview}
            />
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-700">
                You must be logged in as a verified employer to leave a review.
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
                <p className="mt-2 text-sm text-gray-600">
                  Please verify your account to leave reviews.
                </p>
              )}
              {user && user.verified && user.role !== 'EMPLOYER' && (
                <p className="mt-2 text-sm text-gray-600">
                  Only employers can leave reviews for employees.
                </p>
              )}
            </div>
          )}
        </div>
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
  existingReview?: { rating: string } | null
}) {
  const isUpdate = !!existingReview
  const defaultRating = existingReview?.rating || ''

  return (
    <form action={createReview}>
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
              <span className="text-red-600">Nothing nice to say</span>
            </label>
          </div>
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
