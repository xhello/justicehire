'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface WorkplaceCardProps {
  business: {
    id: string
    name: string
    address: string
    city: string
    state: string
  }
  position?: string | null
}

export default function WorkplaceCard({ business, position }: WorkplaceCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLeave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/workplace/leave', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to leave workplace')
      }

      router.refresh()
    } catch (error) {
      console.error('Error leaving workplace:', error)
      alert('Failed to leave workplace. Please try again.')
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Workplace</h3>
      <Link 
        href={`/business/${business.id}`}
        className="block hover:bg-gray-50 rounded-lg transition-colors"
      >
        <h4 className="text-lg font-medium text-blue-600 hover:text-blue-700">
          {business.name}
        </h4>
        <p className="text-sm text-gray-700">{business.address}</p>
        <p className="text-sm text-gray-600">{business.city}, {business.state}</p>
        {position && (
          <p className="text-sm text-gray-600 mt-2 capitalize">
            Position: <span className="font-medium">{position}</span>
          </p>
        )}
      </Link>
      
      <div className="mt-4 pt-4 border-t">
        {showConfirm ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Are you sure you want to leave this workplace?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLeave}
                disabled={loading}
                className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Leaving...' : 'Yes, Leave'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full px-3 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
          >
            Leave Workplace
          </button>
        )}
      </div>
    </div>
  )
}
