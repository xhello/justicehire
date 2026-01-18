'use client'

import { useState } from 'react'
import Cropper, { Area, Point } from 'react-easy-crop'
import { getCroppedImg } from '@/lib/cropImage'

interface ImageCropperProps {
  imageSrc: string
  onCrop: (croppedImage: string) => void
  onCancel: () => void
  aspectRatio?: number // width/height ratio (1 for square, etc.)
}

export default function ImageCropper({ imageSrc, onCrop, onCancel, aspectRatio = 1 }: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const handleCrop = async () => {
    if (!croppedAreaPixels) return
    
    setIsProcessing(true)
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
      onCrop(croppedImage)
    } catch (error) {
      console.error('Error cropping image:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Adjust Your Photo</h3>
        
        <div className="relative w-full aspect-square max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            cropShape="rect"
            showGrid={true}
            style={{
              containerStyle: {
                width: '100%',
                height: '100%',
                position: 'relative',
              },
            }}
          />
        </div>
        
        <div className="mt-4 space-y-2">
          <p className="text-sm text-gray-600 text-center">
            Drag to reposition • Scroll to zoom • Crop area is square (1:1)
          </p>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setZoom(Math.max(1, zoom - 0.1))}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
            >
              Zoom Out
            </button>
            <button
              type="button"
              onClick={() => {
                setCrop({ x: 0, y: 0 })
                setZoom(1)
              }}
              className="flex-1 px-4 py-2 bg-blue-200 text-blue-700 rounded-md hover:bg-blue-300 text-sm font-medium"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setZoom(Math.min(3, zoom + 0.1))}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
            >
              Zoom In
            </button>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={handleCrop}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Use This Photo'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
