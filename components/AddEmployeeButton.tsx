'use client'

import { useState, useEffect } from 'react'
import ImageCropper from '@/components/ImageCropper'

interface AddEmployeeButtonProps {
  citiesByState: Record<string, string[]>
  isLoggedIn?: boolean
}

export default function AddEmployeeButton({ citiesByState, isLoggedIn = false }: AddEmployeeButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [hasLoggedOut, setHasLoggedOut] = useState(false)
  const [showCropper, setShowCropper] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [croppedImage, setCroppedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingBusinesses, setLoadingBusinesses] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  // Effective logged in state (considers if user logged out during this session)
  const effectivelyLoggedIn = isLoggedIn && !hasLoggedOut
  
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedBusiness, setSelectedBusiness] = useState('')
  const [position, setPosition] = useState('')
  
  const [businesses, setBusinesses] = useState<{ id: string; name: string }[]>([])
  
  const states = Object.keys(citiesByState).sort()
  const cities = selectedState ? citiesByState[selectedState] || [] : []

  // Fetch businesses when city changes
  useEffect(() => {
    if (selectedState && selectedCity) {
      setLoadingBusinesses(true)
      setSelectedBusiness('')
      fetch(`/api/businesses?state=${selectedState}&city=${encodeURIComponent(selectedCity)}`)
        .then(res => res.json())
        .then(data => {
          setBusinesses(data.businesses || [])
        })
        .catch(() => setBusinesses([]))
        .finally(() => setLoadingBusinesses(false))
    } else {
      setBusinesses([])
    }
  }, [selectedState, selectedCity])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        setError('Photo is too large. Please choose a photo smaller than 10MB.')
        e.target.value = ''
        return
      }

      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.')
        e.target.value = ''
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
        setShowCropper(true)
      }
      reader.onerror = () => {
        setError('Failed to read photo file. Please try again.')
        e.target.value = ''
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = (croppedImageData: string) => {
    setCroppedImage(croppedImageData)
    setShowCropper(false)
    setImagePreview(null)
  }

  const handleCropCancel = () => {
    setShowCropper(false)
    setImagePreview(null)
    setCroppedImage(null)
    const fileInput = document.getElementById('employee-photo') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Check if base64 string is too large
    if (croppedImage && croppedImage.length > 1.5 * 1024 * 1024) {
      setError('Photo is too large. Please try a smaller photo or crop it more.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          businessId: selectedBusiness || null,
          position: position || null,
          photoData: croppedImage || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to add employee')
        return
      }

      setSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(false)
        // Reset form
        setFirstName('')
        setLastName('')
        setSelectedState('')
        setSelectedCity('')
        setSelectedBusiness('')
        setPosition('')
        setCroppedImage(null)
        // Refresh page to show new employee
        window.location.reload()
      }, 1500)
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleButtonClick = () => {
    if (effectivelyLoggedIn) {
      setShowLogoutConfirm(true)
    } else {
      setIsOpen(true)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setHasLoggedOut(true)
      setShowLogoutConfirm(false)
      setIsOpen(true)
    } catch (err) {
      console.error('Logout failed:', err)
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <>
      {showCropper && imagePreview && (
        <ImageCropper
          imageSrc={imagePreview}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
        />
      )}
      
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 text-center">
        <button
          onClick={handleButtonClick}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add an employee
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Would you like to log out?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Logging out will keep your submission anonymous.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                No
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loggingOut ? 'Logging out...' : 'Yes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Add an Employee</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-gray-900">Employee added!</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <select
                        value={selectedState}
                        onChange={(e) => {
                          setSelectedState(e.target.value)
                          setSelectedCity('')
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select state</option>
                        {states.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        disabled={!selectedState}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Select city</option>
                        {cities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business
                    </label>
                    <select
                      value={selectedBusiness}
                      onChange={(e) => setSelectedBusiness(e.target.value)}
                      disabled={!selectedCity || loadingBusinesses}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">
                        {loadingBusinesses ? 'Loading...' : 'Select business (optional)'}
                      </option>
                      {businesses.map((business) => (
                        <option key={business.id} value={business.id}>
                          {business.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="e.g. Manager, Server, Bartender"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Photo (Optional)
                    </label>
                    <input
                      id="employee-photo"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload a profile photo (JPG, PNG, etc.)
                    </p>
                    {croppedImage && (
                      <div className="mt-2 flex justify-center">
                        <div>
                          <img
                            src={croppedImage}
                            alt="Selected photo"
                            className="w-24 h-24 rounded-lg object-cover border-2 border-blue-500"
                          />
                          <p className="mt-1 text-xs text-green-600 text-center">Photo selected ✓</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !firstName || !lastName}
                    className="w-full py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Adding...' : 'Add Employee'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
