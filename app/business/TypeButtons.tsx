'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface TypeButtonsProps {
  selectedType?: string
  counts?: {
    business: number
    employees: number
  }
  totalEmployees?: number
  showEveryone?: boolean
}

export default function TypeButtons({ selectedType = 'business', counts, totalEmployees, showEveryone = false }: TypeButtonsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleTypeChange = (newType: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const state = params.get('state')
    const city = params.get('city')
    const everyone = params.get('everyone')
    
    const newParams = new URLSearchParams()
    if (state) newParams.set('state', state)
    if (city) newParams.set('city', city)
    newParams.set('category', newType)
    if (everyone === 'true') newParams.set('everyone', 'true')
    
    router.push(`/?${newParams.toString()}`, { scroll: false })
  }

  const handleEveryoneToggle = () => {
    const params = new URLSearchParams(searchParams.toString())
    const state = params.get('state')
    const city = params.get('city')
    
    const newParams = new URLSearchParams()
    if (state) newParams.set('state', state)
    if (city) newParams.set('city', city)
    newParams.set('category', 'employees')
    
    if (!showEveryone) {
      newParams.set('everyone', 'true')
    }
    // If already showing everyone, don't set the param (removes it)
    
    router.push(`/?${newParams.toString()}`, { scroll: false })
  }

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex gap-2">
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
          onClick={() => handleTypeChange('employees')}
          className={`px-3 py-2 rounded-md font-medium transition-colors ${
            selectedType === 'employees'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
          }`}
        >
          Employees {counts && `(${showEveryone && totalEmployees ? totalEmployees : counts.employees})`}
        </button>
      </div>
      
      {selectedType === 'employees' && (
        <button
          type="button"
          onClick={handleEveryoneToggle}
          className="flex items-center gap-2 text-sm"
        >
          <span className={`${showEveryone ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
            Everyone
          </span>
          <div
            className={`relative w-10 h-5 rounded-full transition-colors ${
              showEveryone ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                showEveryone ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </div>
        </button>
      )}
    </div>
  )
}
