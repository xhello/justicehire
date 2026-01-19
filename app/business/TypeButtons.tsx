'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface TypeButtonsProps {
  selectedType?: string
  counts?: {
    business: number
    employer: number
    employees: number
  }
}

export default function TypeButtons({ selectedType = 'business', counts }: TypeButtonsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleTypeChange = (newType: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const state = params.get('state')
    const city = params.get('city')
    
    const newParams = new URLSearchParams()
    if (state) newParams.set('state', state)
    if (city) newParams.set('city', city)
    newParams.set('category', newType)
    
    router.push(`/?${newParams.toString()}`, { scroll: false })
  }

  return (
    <div className="flex gap-2 mb-4">
      <button
        type="button"
        onClick={() => handleTypeChange('business')}
        className={`px-3 py-2 rounded-md font-medium transition-colors ${
          selectedType === 'business'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
        }`}
      >
        Business {counts && `(${counts.business})`}
      </button>
      <button
        type="button"
        onClick={() => handleTypeChange('employer')}
        className={`px-3 py-2 rounded-md font-medium transition-colors ${
          selectedType === 'employer'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
        }`}
      >
        Employers {counts && `(${counts.employer})`}
      </button>
      <button
        type="button"
        onClick={() => handleTypeChange('employees')}
        className={`px-3 py-2 rounded-md font-medium transition-colors ${
          selectedType === 'employees'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
        }`}
      >
        Employees {counts && `(${counts.employees})`}
      </button>
    </div>
  )
}
