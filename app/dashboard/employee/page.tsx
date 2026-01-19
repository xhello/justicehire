import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { prisma } from '@/lib/prisma'
import ProfilePhotoSection from '../ProfilePhotoSection'
import ReviewsTabs from './ReviewsTabs'

export default async function EmployeeDashboard() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'EMPLOYEE') {
    redirect('/dashboard/employer')
  }

  // Employees can access dashboard even if not verified (can verify from dashboard)

  // Get all reviews that this employee has left (reviews given)
  const employeeReviewsGiven = await prisma.reviews.findMany({
    reviewerId: user.id,
  })
  
  // Get all reviews that this employee has received (reviews received)
  const employeeReviewsReceived = await prisma.reviews.findMany({
    targetUserId: user.id,
    targetType: 'EMPLOYEE',
  })
  
  // Get all businesses and users for display
  const allBusinesses = await prisma.businesses.findMany({})
  const allUsers = await prisma.users.findMany({})
  
  // Enrich reviews given with business and target user information
  const reviewsGivenWithDetails = employeeReviewsGiven.map((review: any) => {
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
      reviewer: targetUser
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
  
  // Enrich reviews received with business and reviewer information
  const reviewsReceivedWithDetails = employeeReviewsReceived.map((review: any) => {
    const business = allBusinesses.find((b: any) => b.id === review.businessId)
    const reviewer = review.reviewerId 
      ? allUsers.find((u: any) => u.id === review.reviewerId)
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
      reviewer: reviewer
        ? {
            id: reviewer.id,
            firstName: reviewer.firstName,
            lastName: reviewer.lastName,
            role: reviewer.role,
            photoUrl: reviewer.photoUrl,
          }
        : null,
    }
  })
  
  // Sort by most recent first
  reviewsGivenWithDetails.sort((a: any, b: any) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return dateB - dateA
  })
  
  reviewsReceivedWithDetails.sort((a: any, b: any) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return dateB - dateA
  })

  // Calculate rating stats from reviews received
  const totalReviews = reviewsReceivedWithDetails.length
  const outstandingCount = reviewsReceivedWithDetails.filter((r: any) => r.rating === 'OUTSTANDING').length
  const noIssueCount = reviewsReceivedWithDetails.filter((r: any) => r.rating === 'DELIVERED_AS_EXPECTED').length
  const nothingNiceCount = reviewsReceivedWithDetails.filter((r: any) => r.rating === 'GOT_NOTHING_NICE_TO_SAY').length

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
                className="flex items-center gap-2"
                title={`${user.firstName} ${user.lastName}`}
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-blue-600 rounded-md shadow-md transition-colors"
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
            <ProfilePhotoSection 
              user={{
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                photoUrl: user.photoUrl,
                email: user.email,
                verified: user.verified,
              }}
              ratingStats={{
                total: totalReviews,
                outstanding: outstandingCount,
                noIssue: noIssueCount,
                nothingNice: nothingNiceCount,
              }}
            />
          </div>
          
          <div className="lg:col-span-2">
            <ReviewsTabs 
              reviewsGiven={reviewsGivenWithDetails}
              reviewsReceived={reviewsReceivedWithDetails}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

