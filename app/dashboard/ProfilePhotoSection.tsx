'use client'

import { useState } from 'react'
import ImageCropper from '@/components/ImageCropper'
import { updateUserPhoto, requestEmailOtp, verifyEmailOtp } from '../actions/auth'
import { useRouter } from 'next/navigation'

interface ProfilePhotoSectionProps {
  user: {
    id: string
    firstName: string
    lastName: string
    photoUrl: string | null
    email: string
    verified: boolean
  }
}

export default function ProfilePhotoSection({ user }: ProfilePhotoSectionProps) {
  const [showCropper, setShowCropper] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showEmailUpdate, setShowEmailUpdate] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const router = useRouter()

  const handleSendOtp = async () => {
    if (user.verified && !newEmail) {
      setError('Please enter a new email address')
      return
    }

    setError(null)
    setSendingOtp(true)

    try {
      const formData = new FormData()
      formData.append('email', user.email)
      if (user.verified && newEmail) {
        formData.append('newEmail', newEmail)
      }

      const result = await requestEmailOtp(formData)
      
      if (result?.error) {
        setError(result.error)
      } else {
        setOtpSent(true)
        setError(null)
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.')
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    setError(null)
    setVerifying(true)

    try {
      const formData = new FormData()
      // For email updates, OTP is sent to newEmail, so we verify against newEmail
      if (user.verified && newEmail) {
        formData.append('email', newEmail) // OTP was sent to newEmail, verify against it
        formData.append('newEmail', newEmail) // New email to update to
        formData.append('otp', otp)
      } else {
        formData.append('email', user.email)
        formData.append('otp', otp)
      }

      const result = await verifyEmailOtp(formData)
      
      if (result?.error) {
        setError(result.error)
      } else {
        // Refresh the page to show updated status
        router.refresh()
      }
    } catch (err) {
      setError('Failed to verify OTP. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

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

  const handleCropComplete = async (croppedImageData: string) => {
    setShowCropper(false)
    setImagePreview(null)
    setError(null)
    setLoading(true)

    try {
      // Check if base64 string is too large (max 1.5MB base64)
      if (croppedImageData.length > 1.5 * 1024 * 1024) {
        setError('Photo is too large after processing. Please try a smaller photo or crop it more.')
        setLoading(false)
        return
      }

      const formData = new FormData()
      formData.append('photoUrl', croppedImageData)

      const result = await updateUserPhoto(formData)
      
      if (result?.error) {
        setError(result.error)
      } else {
        // Refresh the page to show updated photo
        router.refresh()
      }
    } catch (err) {
      console.error('Photo update error:', err)
      setError('An error occurred. Please try again. If the issue persists, try using a smaller photo.')
    } finally {
      setLoading(false)
    }
  }

  const handleCropCancel = () => {
    setShowCropper(false)
    setImagePreview(null)
    // Reset file input
    const fileInput = document.getElementById('photo-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
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
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Profile Photo</h3>
        
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            {user.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-32 h-32 rounded-lg object-cover border-2 border-gray-300"
              />
            ) : (
              <div className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                <span className="text-gray-500 text-4xl">
                  {user.firstName[0]}{user.lastName[0]}
                </span>
              </div>
            )}
            {/* Verification status badge */}
            <div className="absolute -top-2 -right-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                user.verified 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {user.verified ? '✓ Verified' : '⚠ Not Verified'}
              </span>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm w-full">
              {error}
            </div>
          )}
          
          <label
            htmlFor="photo-upload"
            className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
          >
            {loading ? 'Updating...' : 'Update Photo'}
          </label>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={loading}
          />
          <p className="mt-2 text-xs text-gray-500 text-center">
            Click to upload a new photo
          </p>

          {/* Email verification/update section */}
          <div className="mt-6 w-full border-t pt-4">
            {!user.verified ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-700 text-center">
                  Verify your email to submit reviews
                </p>
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {sendingOtp ? 'Sending...' : 'Verify Email with OTP'}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={verifying || otp.length !== 6}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {verifying ? 'Verifying...' : 'Verify OTP'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false)
                        setOtp('')
                        setError(null)
                      }}
                      className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-700 text-center">
                  Email: {user.email}
                </p>
                {!showEmailUpdate ? (
                  <button
                    type="button"
                    onClick={() => setShowEmailUpdate(true)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
                  >
                    Update Email Address
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="New email address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    {!otpSent ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={sendingOtp || !newEmail}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {sendingOtp ? 'Sending...' : 'Send OTP to New Email'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowEmailUpdate(false)
                            setNewEmail('')
                            setError(null)
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Enter 6-digit OTP"
                          maxLength={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={verifying || otp.length !== 6}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {verifying ? 'Verifying...' : 'Verify & Update Email'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false)
                            setOtp('')
                            setNewEmail('')
                            setShowEmailUpdate(false)
                            setError(null)
                          }}
                          className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
