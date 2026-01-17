import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'

export default async function EmployerDashboard() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'EMPLOYER') {
    redirect('/dashboard/employee')
  }

  if (!user.verified) {
    redirect('/verify?email=' + user.email)
  }

  // Get all reviews that this employer has left
  const employerReviews = await prisma.reviews.findMany({
    reviewerId: user.id,
  })
  
  // Get all businesses and users for display
  const allBusinesses = await prisma.businesses.findMany({})
  const allUsers = await prisma.users.findMany({})
  
  // Enrich reviews with business and target user information
  const reviewsWithDetails = employerReviews.map((review: any) => {
    const business = allBusinesses.find((b: any) => b.id === review.businessId)
    const targetUser = review.targetUserId 
      ? allUsers.find((u: any) => u.id === review.targetUserId)
      : null
    
    return {
      ...review,
      business,
      targetUser,
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
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700">
                Justice Hire
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {user.firstName} {user.lastName}
              </span>
              {user.employerProfile && (
                <span className="text-sm text-gray-700">
                  {user.employerProfile.business.name}
                </span>
              )}
              <form action={logout}>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Employer Dashboard</h2>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Your Business</h3>
          {user.employerProfile ? (
            <div>
              <p className="text-lg font-medium">{user.employerProfile.business.name}</p>
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

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Your Reviews</h3>
          
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
        return <span className="text-yellow-600 font-medium">As Expected</span>
      case 'GOT_NOTHING_NICE_TO_SAY':
        return <span className="text-red-600 font-medium">nothing nice to say</span>
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
        <div className="flex-1">
          <Link 
            href={getTargetLink()}
            className="text-lg font-semibold text-blue-600 hover:text-blue-700"
          >
            {getTargetName()}
          </Link>
          {review.business && review.targetType !== 'BUSINESS' && (
            <p className="text-sm text-gray-600 mt-1">
              at <Link href={`/business/${review.businessId}`} className="text-blue-600 hover:text-blue-700">
                {review.business.name}
              </Link>
            </p>
          )}
        </div>
        <span className="text-xs text-gray-500">
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
