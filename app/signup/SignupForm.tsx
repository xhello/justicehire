'use client'

import { useState, useEffect } from 'react'
import { signupEmployee, signupEmployer } from '../actions/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ImageCropper from '@/components/ImageCropper'

export default function SignupForm({ businesses }: { businesses: any[] }) {
  const [role, setRole] = useState<'EMPLOYEE' | 'EMPLOYER'>('EMPLOYEE')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCropper, setShowCropper] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [croppedImage, setCroppedImage] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState<string>('')
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [loadingCities, setLoadingCities] = useState(false)
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
    }

    fetchCities()
  }, [selectedState])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
        setShowCropper(true)
      }
      reader.onerror = () => {
        setError('Failed to read photo file. Please try again.')
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
    // Reset file input
    const fileInput = document.getElementById('photo') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    // Check if passwords match
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }
    
    // Use cropped image if available
    if (croppedImage) {
      formData.set('photoUrl', croppedImage)
    }
    
    try {
      let result
      if (role === 'EMPLOYEE') {
        result = await signupEmployee(formData)
      } else {
        result = await signupEmployer(formData)
      }

      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else {
        router.push(`/verify?email=${formData.get('email')}`)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showCropper && imagePreview && (
        <ImageCropper
          imageSrc={imagePreview}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
        />
      )}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                Justice Hire
              </Link>
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-blue-600 rounded-md transition-colors"
              >
                Explore
              </Link>
            </div>
            <div className="flex gap-4">
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-blue-600 rounded-md transition-colors"
              >
                Sign Up
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign up for Justice Hire
          </h2>
          <p className="mt-2 text-center text-sm text-gray-700">
            Or{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              log in to your account
            </Link>
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => setRole('EMPLOYEE')}
            className={`flex-1 py-2 px-4 rounded-md font-medium ${
              role === 'EMPLOYEE'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Employee
          </button>
          <button
            type="button"
            onClick={() => setRole('EMPLOYER')}
            className={`flex-1 py-2 px-4 rounded-md font-medium ${
              role === 'EMPLOYER'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Employer
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Password must be at least 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                placeholder="Re-enter your password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {role === 'EMPLOYEE' && (
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="(555) 123-4567"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {role === 'EMPLOYER' && (
              <>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <select
                    id="state"
                    name="state"
                    required
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value)
                      // Reset city when state changes
                      const citySelect = document.getElementById('city') as HTMLSelectElement
                      if (citySelect) {
                        citySelect.value = ''
                      }
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select state</option>
                    <option value="CA">California</option>
                    <option value="OR">Oregon</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <select
                    id="city"
                    name="city"
                    required
                    disabled={!selectedState || loadingCities}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!selectedState 
                        ? 'Select state first' 
                        : loadingCities 
                        ? 'Loading cities...' 
                        : 'Select city'}
                    </option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  {!selectedState && (
                    <p className="mt-1 text-xs text-gray-500">Please select a state first</p>
                  )}
                </div>

                <div>
                  <label htmlFor="businessId" className="block text-sm font-medium text-gray-700">
                    Business
                  </label>
                  <select
                    id="businessId"
                    name="businessId"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select business</option>
                    {businesses.map((business: any) => (
                      <option key={business.id} value={business.id}>
                        {business.name} - {business.city}, {business.state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                    Position
                  </label>
                  <select
                    id="position"
                    name="position"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select position</option>
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                    <option value="supervisor on duty">Supervisor on Duty</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
                Photo
              </label>
              <input
                id="photo"
                name="photo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="mt-1 text-xs text-gray-500">Upload a profile photo (JPG, PNG, etc.)</p>
              {croppedImage && (
                <div className="mt-2">
                  <img
                    src={croppedImage}
                    alt="Selected photo"
                    className="w-24 h-24 rounded-lg object-cover border-2 border-blue-500"
                  />
                  <p className="mt-1 text-xs text-green-600">Photo selected ✓</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
