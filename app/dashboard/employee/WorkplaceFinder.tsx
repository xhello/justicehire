'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface WorkplaceFinderProps {
  userId: string
}

export default function WorkplaceFinder({ userId }: WorkplaceFinderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')
  
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [availableBusinesses, setAvailableBusinesses] = useState<any[]>([])
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingBusinesses, setLoadingBusinesses] = useState(false)
  
  const router = useRouter()

  // Fetch cities when state changes
  useEffect(() => {
    const fetchCities = async () => {
      if (selectedState) {
        setLoadingCities(true)
        try {
          const response = await fetch(`/api/cities?state=${selectedState}`)
          const data = await response.json()
          setAvailableCities(data.cities || [])
        } catch (err) {
          console.error('Error fetching cities:', err)
          setAvailableCities([])
        } finally {
          setLoadingCities(false)
        }
      } else {
        setAvailableCities([])
      }
      setSelectedCity('')
      setSelectedBusinessId('')
    }
    fetchCities()
  }, [selectedState])

  // Fetch businesses when city changes
  useEffect(() => {
    const fetchBusinesses = async () => {
      if (selectedState && selectedCity) {
        setLoadingBusinesses(true)
        try {
          const response = await fetch(`/api/businesses?state=${selectedState}&city=${selectedCity}`)
          const data = await response.json()
          setAvailableBusinesses(data.businesses || [])
        } catch (err) {
          console.error('Error fetching businesses:', err)
          setAvailableBusinesses([])
        } finally {
          setLoadingBusinesses(false)
        }
      } else {
        setAvailableBusinesses([])
      }
      setSelectedBusinessId('')
    }
    fetchBusinesses()
  }, [selectedState, selectedCity])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/workplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          businessId: selectedBusinessId,
          position: selectedPosition,
          state: selectedState,
          city: selectedCity,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set workplace')
      }

      setSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Workplace</h3>
        <p className="text-sm text-gray-600 mb-4">
          Add your workplace to let others know where you work.
        </p>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Find My Workplace
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setIsOpen(false)}
            />
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Find Your Workplace</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {success ? (
                <div className="text-center py-8">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-gray-900">Workplace added!</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                      {error}
                    </div>
                  )}

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <select
                      id="state"
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select state</option>
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
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      required
                      disabled={!selectedState || loadingCities}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {!selectedState 
                          ? 'Select state first' 
                          : loadingCities 
                          ? 'Loading cities...' 
                          : 'Select city'}
                      </option>
                      {availableCities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="business" className="block text-sm font-medium text-gray-700 mb-1">
                      Business
                    </label>
                    <select
                      id="business"
                      value={selectedBusinessId}
                      onChange={(e) => setSelectedBusinessId(e.target.value)}
                      required
                      disabled={!selectedCity || loadingBusinesses}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {!selectedCity 
                          ? 'Select city first' 
                          : loadingBusinesses 
                          ? 'Loading businesses...' 
                          : 'Select business'}
                      </option>
                      {availableBusinesses.map((business) => (
                        <option key={business.id} value={business.id}>
                          {business.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <select
                      id="position"
                      value={selectedPosition}
                      onChange={(e) => setSelectedPosition(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select position</option>
                      <option value="owner">Owner</option>
                      <option value="manager">Manager</option>
                      <option value="supervisor on duty">Supervisor on Duty</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !selectedBusinessId || !selectedPosition}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Saving...' : 'Save Workplace'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
