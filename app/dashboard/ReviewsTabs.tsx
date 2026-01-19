'use client'

import { useState } from 'react'

interface ReviewsTabsProps {
  reviewsReceived: any[]
  reviewsGiven: any[]
  renderReceived: (reviews: any[]) => React.ReactNode
  renderGiven: (reviews: any[]) => React.ReactNode
}

export default function ReviewsTabs({ 
  reviewsReceived, 
  reviewsGiven, 
  renderReceived, 
  renderGiven 
}: ReviewsTabsProps) {
  const [activeTab, setActiveTab] = useState<'received' | 'given'>('received')

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'received'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Reviews Received ({reviewsReceived.length})
        </button>
        <button
          onClick={() => setActiveTab('given')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'given'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Reviews Given ({reviewsGiven.length})
        </button>
      </div>

      <div>
        {activeTab === 'received' ? (
          reviewsReceived.length === 0 ? (
            <p className="text-gray-700">You haven't received any reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {renderReceived(reviewsReceived)}
            </div>
          )
        ) : (
          reviewsGiven.length === 0 ? (
            <p className="text-gray-700">You haven't left any reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {renderGiven(reviewsGiven)}
            </div>
          )
        )}
      </div>
    </div>
  )
}
