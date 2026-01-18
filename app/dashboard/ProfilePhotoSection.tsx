'use client'

import { useState } from 'react'
import ImageCropper from '@/components/ImageCropper'
import { updateUserPhoto } from '../actions/auth'
import { useRouter } from 'next/navigation'

interface ProfilePhotoSectionProps {
  user: {
    id: string
    firstName: string
    lastName: string
    photoUrl: string | null
  }
}

export default function ProfilePhotoSection({ user }: ProfilePhotoSectionProps) {
  const [showCropper, setShowCropper] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
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

  const handleCropComplete = async (croppedImageData: string) => {
    setShowCropper(false)
    setImagePreview(null)
    setError(null)
    setLoading(true)

    try {
      // Check if base64 string is too large (roughly 3MB base64 = ~2MB actual)
      if (croppedImageData.length > 3 * 1024 * 1024) {
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
          </div>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
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
        </div>
      </div>
    </>
  )
}
