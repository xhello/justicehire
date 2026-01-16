'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function StateCityFilter({
  type,
  options,
  currentValue,
  disabled = false,
}: {
  type: 'state' | 'city'
  options: string[]
  currentValue?: string
  disabled?: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    
    if (value) {
      params.set(type, value)
    } else {
      params.delete(type)
    }
    
    // If changing state, clear city filter (but keep business if it matches)
    if (type === 'state') {
      params.delete('city')
      // Don't clear businessId - let user keep it if they want
    }
    
    router.push(`/dashboard/employer?${params.toString()}`)
  }

  return (
    <select
      id={`${type}Filter`}
      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
      value={currentValue || ''}
      onChange={handleChange}
      disabled={disabled}
    >
      <option value="">All {type === 'state' ? 'States' : 'Cities'}</option>
      {options.map((option: string) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}
