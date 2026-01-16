'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface BusinessFiltersProps {
  citiesByState: Record<string, string[]>
  selectedState?: string
  selectedCity?: string
  selectedCategory?: string
}

export default function BusinessFilters({
  citiesByState,
  selectedState,
  selectedCity,
  selectedCategory,
}: BusinessFiltersProps) {
  const router = useRouter()
  const [state, setState] = useState(selectedState || '')
  const [city, setCity] = useState(selectedCity || '')
  const [category, setCategory] = useState(selectedCategory || '')
  const [filteredCities, setFilteredCities] = useState<string[]>([])

  // Update cities when state changes
  useEffect(() => {
    if (state && citiesByState[state]) {
      setFilteredCities(citiesByState[state])
      // Clear city selection if it's not in the new state
      if (city && !citiesByState[state].includes(city)) {
        setCity('')
      }
    } else {
      // Show all cities from all states if no state selected
      const allCities = Object.values(citiesByState).flat()
      const uniqueCities = [...new Set(allCities)].sort()
      setFilteredCities(uniqueCities)
      if (state === '') {
        setCity('')
      }
    }
  }, [state, citiesByState, city])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (state) params.set('state', state)
    if (city) params.set('city', city)
    if (category) params.set('category', category)
    // Always redirect to home page for search
    router.push(`/?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
          State
        </label>
        <select
          id="state"
          name="state"
          value={state}
          onChange={(e) => {
            setState(e.target.value)
            setCity('') // Clear city when state changes
          }}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All States</option>
          <option value="CA">California</option>
          <option value="OR">Oregon</option>
        </select>
      </div>

      <div>
        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
          City
        </label>
        <select
          id="city"
          name="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          disabled={!state}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">All Cities</option>
          {filteredCities.map((cityName: string) => (
            <option key={cityName} value={cityName}>
              {cityName}
            </option>
          ))}
        </select>
        {!state && (
          <p className="mt-1 text-xs text-gray-500">Select a state first</p>
        )}
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          id="category"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Categories</option>
          <option value="business">Business</option>
          <option value="employer">Employer</option>
          <option value="employees">Employees</option>
        </select>
      </div>

      <div className="flex items-end">
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Search
        </button>
      </div>
    </form>
  )
}
