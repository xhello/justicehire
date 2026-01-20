'use client'

import { useEffect, useState, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createBusinessReview } from '@/app/actions/business-review'
import StarRating from './StarRating'

export default function BusinessReviewFormClient({ 
  businessId, 
  existingReview 
}: { 
  businessId: string
  existingReview: any 
}) {
  const [state, formAction] = useActionState(createBusinessReview, null)
  const router = useRouter()
  const [hasReview, setHasReview] = useState(!!existingReview)
  
  const isUpdate = hasReview || (state && 'success' in state && state.success && state.isUpdate)

  useEffect(() => {
    if (state && 'success' in state && state.success) {
      // Update local state to reflect that review now exists
      setHasReview(true)
      // Refresh the page data to get updated review
      router.refresh()
    }
  }, [state, router])

  return (
    <form action={formAction} className="mb-6 border rounded-lg p-4">
      <input type="hidden" name="businessId" value={businessId} />
      
      {state && 'error' in state && state.error ? (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {state.error}
        </div>
      ) : null}
      
      {state && 'success' in state && state.success ? (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
          {state.message}
        </div>
      ) : null}
      
      <label className="block text-sm font-medium text-gray-700 mb-4">
        {isUpdate ? 'Update Your Review' : 'Leave a Review'}
      </label>
      
      <div className="space-y-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pay Competitiveness
          </label>
          <p className="text-xs text-gray-600 mb-2">
            How competitive do you feel your pay is compared to similar jobs?
          </p>
          <p className="text-xs text-gray-500 mb-2">
            (1 = Dissatisfied, 5 = Satisfied)
          </p>
          <StarRating name="payCompetitive" defaultValue={existingReview?.payCompetitive || null} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Workload amount
          </label>
          <p className="text-xs text-gray-600 mb-2">
            How manageable is your workload?
          </p>
          <p className="text-xs text-gray-500 mb-2">
            (1 = Dissatisfied, 5 = Satisfied)
          </p>
          <StarRating name="workload" defaultValue={existingReview?.workload || null} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Schedule flexibility
          </label>
          <p className="text-xs text-gray-600 mb-2">
            How satisfied are you with your schedule flexibility?
          </p>
          <p className="text-xs text-gray-500 mb-2">
            (1 = Dissatisfied, 5 = Satisfied)
          </p>
          <StarRating name="flexibility" defaultValue={existingReview?.flexibility || null} required />
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
          Additional Comments (Optional)
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          maxLength={1000}
          defaultValue={existingReview?.message || ''}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Share any additional thoughts about this business..."
        />
        <p className="text-xs text-gray-500 mt-1">Maximum 1000 characters (optional)</p>
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
