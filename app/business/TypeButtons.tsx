'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface TypeButtonsProps {
  selectedType?: string
}

export default function TypeButtons({ selectedType }: TypeButtonsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = selectedType || 'business'

  const handleTypeChange = (newType: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('category', newType)
    // Keep existing state and city filters
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => handleTypeChange('business')}
        className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
          type === 'business'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
        }`}
      >
        Business
      </button>
      <button
        type="button"
        onClick={() => handleTypeChange('employer')}
        className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
          type === 'employer'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
        }`}
      >
        Employers
      </button>
      <button
        type="button"
        onClick={() => handleTypeChange('employees')}
        className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
          type === 'employees'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
        }`}
      >
        Employees
      </button>
    </div>
  )
}
