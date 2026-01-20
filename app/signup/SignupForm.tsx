'use client'

import { useState } from 'react'
import { signupEmployee } from '../actions/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ImageCropper from '@/components/ImageCropper'
import BackButton from '@/components/BackButton'

export default function SignupForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCropper, setShowCropper] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [croppedImage, setCroppedImage] = useState<string | null>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        setError('Photo is too large. Please choose a photo smaller than 10MB.')
        // Reset file input
        e.target.value = ''
        return
      }

      // Check file type
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
    
    // Add photo if available
    if (croppedImage) {
      // Check if base64 string is too large (max 1.5MB base64)
      if (croppedImage.length > 1.5 * 1024 * 1024) {
        setError('Photo is too large after processing. Please try a smaller photo or crop it more.')
        setLoading(false)
        return
      }

      formData.set('photoUrl', croppedImage)
    } else {
      // Photo is optional, set empty string if not provided
      formData.set('photoUrl', '')
    }
    
    try {
      const result = await signupEmployee(formData)

      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else if (result?.success && result?.redirect) {
        // Redirect to dashboard on success
        router.push(result.redirect)
      }
    } catch (err: any) {
      // NEXT_REDIRECT is a special error thrown by Next.js redirect() function
      // We should ignore it as it's the expected behavior for redirects
      // The error can have different structures, so check multiple properties
      const isRedirectError = 
        err?.digest?.startsWith('NEXT_REDIRECT') ||
        err?.message?.includes('NEXT_REDIRECT') ||
        err?.digest?.includes('redirect') ||
        (err?.name === 'NEXT_REDIRECT')
      
      if (isRedirectError) {
        // Redirect is happening, don't show error - let Next.js handle the redirect
        return
      }
      console.error('Signup error:', err)
      setError('An error occurred. Please try again. If the issue persists, try using a smaller photo.')
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <BackButton />
              <Link
                href="/"
                className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors flex items-center justify-center"
                title="Search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Link>
            </div>
            <div className="flex gap-4">
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-blue-600 rounded-md shadow-md transition-colors"
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

      <div className="pt-16">
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

            <div>
              <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
                Photo (Optional)
              </label>
              <input
                id="photo"
                name="photo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="mt-1 text-xs text-gray-500">Upload a profile photo (JPG, PNG, etc.) - Optional</p>
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
    </div>
  )
}
