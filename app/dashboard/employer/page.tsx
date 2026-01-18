import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import ProfilePhotoSection from '../ProfilePhotoSection'

export default async function EmployerDashboard() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'EMPLOYER') {
    redirect('/dashboard/employee')
  }

  // Employers can access dashboard even if not verified (verified: false by default)

  // Get all reviews that this employer has left
  const employerReviews = await prisma.reviews.findMany({
    reviewerId: user.id,
  })
  
  // Get all businesses and users for display
  const allBusinesses = await prisma.businesses.findMany({})
  const allUsers = await prisma.users.findMany({})
  
  // Enrich reviews given with business and target user information
  const reviewsWithDetails = employerReviews.map((review: any) => {
    const business = allBusinesses.find((b: any) => b.id === review.businessId)
    const targetUser = review.targetUserId 
      ? allUsers.find((u: any) => u.id === review.targetUserId)
      : null
    
    return {
      ...review,
      business: business
        ? {
            id: business.id,
            name: business.name,
            photoUrl: business.photoUrl,
          }
        : null,
      targetUser: targetUser
        ? {
            id: targetUser.id,
            firstName: targetUser.firstName,
            lastName: targetUser.lastName,
            role: targetUser.role,
            photoUrl: targetUser.photoUrl,
          }
        : null,
    }
  })
  
  // Sort by most recent first
  reviewsWithDetails.sort((a: any, b: any) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return dateB - dateA
  })

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
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-blue-600 rounded-md transition-colors"
              >
                Explore
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href={`/employer/${user.id}`}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-blue-600 rounded-md transition-colors"
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
                {user.firstName} {user.lastName}
              </Link>
              {user.employerProfile && (
                <Link 
                  href={`/business/${user.employerProfile.business.id}`}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-blue-600 rounded-md transition-colors"
                >
                  {user.employerProfile.business.name}
                </Link>
              )}
              <form action={logout}>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-blue-600 rounded-md transition-colors"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Employer Dashboard</h2>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              user.verified 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {user.verified ? '✓ Verified' : '⚠ Not Verified'}
            </span>
          </div>
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
            }} />
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4">Your Business</h3>
              {user.employerProfile ? (
                <div>
                  <Link 
                    href={`/business/${user.employerProfile.business.id}`}
                    className="text-lg font-medium text-blue-600 hover:text-blue-700"
                  >
                    {user.employerProfile.business.name}
                  </Link>
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

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4">Reviews Given</h3>
          {reviewsWithDetails.length === 0 ? (
            <p className="text-gray-700">You haven't left any reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviewsWithDetails.map((review: any) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function ReviewCard({ review }: { review: any }) {
  const getRatingLabel = (rating: string | null) => {
    if (!rating) return null
    switch (rating) {
      case 'OUTSTANDING':
        return <span className="text-green-600 font-medium">Outstanding</span>
      case 'DELIVERED_AS_EXPECTED':
        return <span className="text-yellow-600 font-medium">No issue</span>
      case 'GOT_NOTHING_NICE_TO_SAY':
        return <span className="text-red-600 font-medium">Nothing nice to say</span>
      default:
        return null
    }
  }

  const getTargetName = () => {
    if (review.targetType === 'EMPLOYEE' && review.targetUser) {
      return `${review.targetUser.firstName} ${review.targetUser.lastName} (Employee)`
    } else if (review.targetType === 'EMPLOYER' && review.targetUser) {
      return `${review.targetUser.firstName} ${review.targetUser.lastName} (Employer)`
    } else if (review.targetType === 'BUSINESS' && review.business) {
      return review.business.name
    }
    return 'Unknown'
  }

  const getTargetLink = () => {
    if (review.targetType === 'EMPLOYEE' && review.targetUserId) {
      return `/employee/${review.targetUserId}`
    } else if (review.targetType === 'EMPLOYER' && review.targetUserId) {
      return `/employer/${review.targetUserId}`
    } else if (review.targetType === 'BUSINESS' && review.businessId) {
      return `/business/${review.businessId}`
    }
    return '#'
  }

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3 flex-1">
          {/* Photo - Business or Profile */}
          {review.targetType === 'BUSINESS' && review.business ? (
            <Link href={getTargetLink()} className="flex-shrink-0">
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
            <Link href={getTargetLink()} className="flex-shrink-0">
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
              Review for: <Link 
                href={getTargetLink()}
                className="text-blue-600 hover:text-blue-700"
              >
                {getTargetName()}
              </Link>
            </p>
            {review.business && review.targetType !== 'BUSINESS' && (
              <p className="text-sm text-gray-600 mt-1">
                at <Link href={`/business/${review.businessId}`} className="text-blue-600 hover:text-blue-700">
                  {review.business.name}
                </Link>
              </p>
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
              <span className="text-sm font-medium text-gray-700 min-w-[140px]">Pay Competitive:</span>
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star: number) => (
                  <span key={star}>{star <= review.payCompetitive ? '★' : '☆'}</span>
                ))}
              </div>
              <span className="text-sm text-gray-600">({review.payCompetitive}/5)</span>
            </div>
          )}
          {review.workload && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 min-w-[140px]">Workload amount:</span>
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star: number) => (
                  <span key={star}>{star <= review.workload ? '★' : '☆'}</span>
                ))}
              </div>
              <span className="text-sm text-gray-600">({review.workload}/5)</span>
            </div>
          )}
          {review.flexibility && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 min-w-[140px]">Schedule flexibility:</span>
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star: number) => (
                  <span key={star}>{star <= review.flexibility ? '★' : '☆'}</span>
                ))}
              </div>
              <span className="text-sm text-gray-600">({review.flexibility}/5)</span>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-2">
          <p className="text-sm text-gray-700">
            Rating: {getRatingLabel(review.rating)}
          </p>
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
