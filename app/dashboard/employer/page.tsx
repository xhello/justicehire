import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import ProfilePhotoSection from '../ProfilePhotoSection'
import ReviewsTabs from './ReviewsTabs'

export default async function EmployerDashboard() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'EMPLOYER') {
    redirect('/dashboard/employee')
  }

  // Employers can access dashboard even if not verified (verified: false by default)

  // Get all reviews that this employer has left (reviews given)
  const employerReviewsGiven = await prisma.reviews.findMany({
    reviewerId: user.id,
  })
  
  // Get all reviews that this employer has received (reviews received)
  const employerReviewsReceived = await prisma.reviews.findMany({
    targetUserId: user.id,
    targetType: 'EMPLOYER',
  })
  
  // Get all businesses and users for display
  const allBusinesses = await prisma.businesses.findMany({})
  const allUsers = await prisma.users.findMany({})
  
  // Enrich reviews given with business and target user information
  const reviewsGivenWithDetails = employerReviewsGiven.map((review: any) => {
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
  const reviewsReceivedWithDetails = employerReviewsReceived.map((review: any) => {
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
                href={`/employer/${user.id}`}
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
              {user.employerProfile && (
                <Link 
                  href={`/business/${user.employerProfile.business.id}`}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-blue-600 rounded-md shadow-md transition-colors"
                >
                  {user.employerProfile.business.name}
                </Link>
              )}
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
          <h2 className="text-3xl font-bold text-gray-900">Employer Dashboard</h2>
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

