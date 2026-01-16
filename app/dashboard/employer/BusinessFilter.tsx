'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function BusinessFilter({
  businesses,
  currentBusinessId,
  disabled = false,
}: {
  businesses: Array<{ id: string; name: string }>
  currentBusinessId?: string
  disabled?: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const businessId = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    
    if (businessId) {
      params.set('businessId', businessId)
    } else {
      params.delete('businessId')
    }
    
    router.push(`/dashboard/employer?${params.toString()}`)
  }

  return (
    <select
      id="businessFilter"
      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
      value={currentBusinessId || ''}
      onChange={handleChange}
      disabled={disabled}
    >
      <option value="">All Businesses</option>
      {businesses.map((business) => (
        <option key={business.id} value={business.id}>
          {business.name}
        </option>
      ))}
    </select>
  )
}
