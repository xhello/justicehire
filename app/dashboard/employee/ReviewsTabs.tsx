'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Review {
  id: string
  rating: string | null
  message: string | null
  createdAt: string
  targetType: string
  targetUserId: string | null
  businessId: string
  payCompetitive?: number | null
  workload?: number | null
  flexibility?: number | null
  reviewer?: {
    id: string
    firstName: string
    lastName: string
    role: string
    photoUrl: string | null
  } | null
  business?: {
    id: string
    name: string
    photoUrl: string | null
  } | null
}

interface ReviewsTabsProps {
  reviewsGiven: Review[]
  reviewsReceived: Review[]
}

export default function ReviewsTabs({ reviewsGiven, reviewsReceived }: ReviewsTabsProps) {
  const [activeTab, setActiveTab] = useState<'given' | 'received'>('received')

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

  const getTargetName = (review: Review) => {
    if (review.targetType === 'EMPLOYEE' && review.reviewer) {
      return `${review.reviewer.firstName} ${review.reviewer.lastName} (Employee)`
    } else if (review.targetType === 'EMPLOYER' && review.reviewer) {
      return `${review.reviewer.firstName} ${review.reviewer.lastName} (Employer)`
    } else if (review.targetType === 'BUSINESS' && review.business) {
      return review.business.name
    }
    return 'Unknown'
  }

  const getTargetLink = (review: Review) => {
    if (review.targetType === 'EMPLOYEE' && review.targetUserId) {
      return `/employee/${review.targetUserId}`
    } else if (review.targetType === 'EMPLOYER' && review.targetUserId) {
      return `/employer/${review.targetUserId}`
    } else if (review.targetType === 'BUSINESS' && review.businessId) {
      return `/business/${review.businessId}`
    }
    return '#'
  }

  const getReviewerName = (review: Review) => {
    if (review.reviewer) {
      return `${review.reviewer.firstName} ${review.reviewer.lastName}`
    }
    return 'Unknown'
  }

  const getReviewerLink = (review: Review) => {
    if (review.reviewer) {
      if (review.reviewer.role === 'EMPLOYEE') {
        return `/employee/${review.reviewer.id}`
      } else {
        return `/employer/${review.reviewer.id}`
      }
    }
    return '#'
  }

  const reviewsToShow = activeTab === 'given' ? reviewsGiven : reviewsReceived

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-4 mb-4 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'received'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
          }`}
        >
          Review Received
        </button>
        <button
          onClick={() => setActiveTab('given')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'given'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
          }`}
        >
          Reviews Given
        </button>
      </div>

      {reviewsToShow.length === 0 ? (
        <p className="text-gray-700">
          {activeTab === 'given' 
            ? "You haven't left any reviews yet."
            : "You haven't received any reviews yet."}
        </p>
      ) : (
        <div className="space-y-4">
          {reviewsToShow.map((review: Review) => (
            <div key={review.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3 flex-1">
                  {/* Photo - For "given" show target, for "received" show reviewer */}
                  {activeTab === 'given' ? (
                    review.targetType === 'BUSINESS' && review.business ? (
                      <Link href={getTargetLink(review)} className="flex-shrink-0">
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
                    ) : review.reviewer ? (
                      <Link href={getTargetLink(review)} className="flex-shrink-0">
                        {review.reviewer.photoUrl ? (
                          <img
                            src={review.reviewer.photoUrl}
                            alt={getReviewerName(review)}
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
                    ) : null
                  ) : (
                    // For received reviews, show reviewer photo
                    review.reviewer ? (
                      <Link href={getReviewerLink(review)} className="flex-shrink-0">
                        {review.reviewer.photoUrl ? (
                          <img
                            src={review.reviewer.photoUrl}
                            alt={getReviewerName(review)}
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
                    ) : null
                  )}
                  
                  <div className="flex-1">
                    {activeTab === 'given' ? (
                      <>
                        <p className="text-sm font-medium text-gray-900">
                          Review for: <Link 
                            href={getTargetLink(review)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            {getTargetName(review)}
                          </Link>
                        </p>
                        {review.business && review.targetType !== 'BUSINESS' && (
                          <p className="text-sm text-gray-600 mt-1">
                            at <Link href={`/business/${review.businessId}`} className="text-blue-600 hover:text-blue-700">
                              {review.business.name}
                            </Link>
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-900">
                          Review from: <Link 
                            href={getReviewerLink(review)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            {getReviewerName(review)} ({review.reviewer?.role === 'EMPLOYEE' ? 'Employee' : 'Employer'})
                          </Link>
                        </p>
                        {review.business && (
                          <p className="text-sm text-gray-600 mt-1">
                            at <Link href={`/business/${review.businessId}`} className="text-blue-600 hover:text-blue-700">
                              {review.business.name}
                            </Link>
                          </p>
                        )}
                      </>
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
                          <span key={star}>{star <= review.payCompetitive! ? '★' : '☆'}</span>
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
                          <span key={star}>{star <= review.workload! ? '★' : '☆'}</span>
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
                          <span key={star}>{star <= review.flexibility! ? '★' : '☆'}</span>
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
          ))}
        </div>
      )}
    </div>
  )
}
