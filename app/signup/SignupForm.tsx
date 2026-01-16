'use client'

import { useState } from 'react'
import { signupEmployee, signupEmployer } from '../actions/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupForm({ businesses }: { businesses: any[] }) {
  const [role, setRole] = useState<'EMPLOYEE' | 'EMPLOYER'>('EMPLOYEE')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    // Convert photo file to base64 data URL
    const photoFile = formData.get('photo') as File
    if (photoFile && photoFile.size > 0) {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result as string
        formData.set('photoUrl', base64String)
        
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
      reader.onerror = () => {
        setError('Failed to read photo file. Please try again.')
        setLoading(false)
      }
      reader.readAsDataURL(photoFile)
    } else {
      setError('Please upload a photo')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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

            {role === 'EMPLOYEE' && (
              <div>
                <label htmlFor="socialUrl" className="block text-sm font-medium text-gray-700">
                  Instagram or Facebook URL (optional)
                </label>
                <input
                  id="socialUrl"
                  name="socialUrl"
                  type="url"
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
                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
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
                Photo <span className="text-red-500">*</span>
              </label>
              <input
                id="photo"
                name="photo"
                type="file"
                accept="image/*"
                required
                className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="mt-1 text-xs text-gray-500">Upload a profile photo (JPG, PNG, etc.)</p>
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
  )
}
