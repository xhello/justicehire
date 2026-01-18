'use client'

import { useEffect, useState } from 'react'
import { useFormState } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createReview } from '@/app/actions/review'

export default function ReviewFormClient({
  targetUserId,
  businessId,
  targetType,
  existingReview,
}: {
  targetUserId: string
  businessId: string
  targetType: 'EMPLOYEE' | 'EMPLOYER'
  existingReview?: { rating: string; message?: string | null } | null
}) {
  const [state, formAction] = useFormState(createReview, null)
  const router = useRouter()
  const [hasReview, setHasReview] = useState(!!existingReview)
  
  const isUpdate = hasReview || (state && 'success' in state && state.success && state.isUpdate)
  const defaultRating = existingReview?.rating || ''
  const defaultMessage = existingReview?.message || ''

  useEffect(() => {
    if (state && 'success' in state && state.success) {
      // Update local state to reflect that review now exists
      setHasReview(true)
      // Refresh the page data to get updated review
      router.refresh()
    }
  }, [state, router])

  return (
    <form action={formAction} className="mt-4 border-t pt-4">
      <input type="hidden" name="targetUserId" value={targetUserId} />
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="returnToBusiness" value="true" />

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

      <label className="block text-sm font-medium text-gray-700 mb-2">
        {isUpdate ? 'Update Review' : 'Leave a Review'}
      </label>
      <div className="flex gap-4 mb-4">
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
          <span className="text-yellow-600">No issue</span>
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

      <div className="mb-4">
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
          Additional Comments (Optional)
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          maxLength={1000}
          defaultValue={defaultMessage}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Share your thoughts about this person..."
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
