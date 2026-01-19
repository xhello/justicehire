'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface TypeButtonsProps {
  selectedType?: string
}

export default function TypeButtons({ selectedType = 'business' }: TypeButtonsProps) {
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
    
    router.push(`/?${newParams.toString()}`)
  }

  return (
    <div className="flex gap-2 mb-4">
      <button
        type="button"
        onClick={() => handleTypeChange('business')}
        className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
          selectedType === 'business'
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
          selectedType === 'employer'
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
          selectedType === 'employees'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
        }`}
      >
        Employees
      </button>
    </div>
  )
}
