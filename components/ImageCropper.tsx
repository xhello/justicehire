'use client'

import { useState, useRef, useEffect } from 'react'

interface ImageCropperProps {
  imageSrc: string
  onCrop: (croppedImage: string) => void
  onCancel: () => void
  aspectRatio?: number // width/height ratio (1 for square, etc.)
}

export default function ImageCropper({ imageSrc, onCrop, onCancel, aspectRatio = 1 }: ImageCropperProps) {
  // Frame position (the crop area that moves over the image)
  const [framePosition, setFramePosition] = useState({ x: 0, y: 0 })
  const [imageScale, setImageScale] = useState(1)
  const [isDraggingFrame, setIsDraggingFrame] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const frameSizeRef = useRef<number>(300) // Default frame size

  useEffect(() => {
    // Initialize image scale and frame position
    const initializeCropper = () => {
      if (!imageRef.current || !containerRef.current) return
      
      const img = imageRef.current
      const container = containerRef.current
      
      const handleImageLoad = () => {
        // Use setTimeout to ensure container has rendered
        setTimeout(() => {
          if (!containerRef.current || !imageRef.current) return
          
          const containerRect = container.getBoundingClientRect()
          const containerWidth = containerRect.width
          const containerHeight = containerRect.height
          
          // Calculate scale to fit image in container (contain mode)
          const imgWidth = img.naturalWidth || img.width || 100
          const imgHeight = img.naturalHeight || img.height || 100
          
          if (imgWidth > 0 && imgHeight > 0) {
            const scaleX = containerWidth / imgWidth
            const scaleY = containerHeight / imgHeight
            const initialScale = Math.min(scaleX, scaleY) * 0.9 // Slightly smaller to show full image
            
            setImageScale(initialScale)
            
            // Set frame size to be a percentage of container (square)
            const containerSize = Math.min(containerWidth, containerHeight)
            frameSizeRef.current = containerSize * 0.7 // Frame is 70% of container
            
            // Center the frame initially
            setFramePosition({
              x: (containerWidth - frameSizeRef.current) / 2,
              y: (containerHeight - frameSizeRef.current) / 2,
            })
          }
        }, 100)
      }
      
      if (img.complete && img.naturalWidth > 0) {
        handleImageLoad()
      } else {
        img.onload = handleImageLoad
        // Fallback in case onload doesn't fire
        setTimeout(handleImageLoad, 500)
      }
    }
    
    initializeCropper()
  }, [imageSrc])

  const handleFrameMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!containerRef.current) return
    
    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    const containerX = e.clientX - rect.left
    const containerY = e.clientY - rect.top
    
    setIsDraggingFrame(true)
    setDragStart({
      x: containerX - framePosition.x,
      y: containerY - framePosition.y,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingFrame || !containerRef.current) return
    
    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    const containerX = e.clientX - rect.left
    const containerY = e.clientY - rect.top
    
    const newX = containerX - dragStart.x
    const newY = containerY - dragStart.y
    
    const containerWidth = rect.width
    const containerHeight = rect.height
    const frameSize = frameSizeRef.current
    
    // Constrain frame within container bounds
    const maxX = containerWidth - frameSize
    const maxY = containerHeight - frameSize
    
    setFramePosition({
      x: Math.max(0, Math.min(maxX, newX)),
      y: Math.max(0, Math.min(maxY, newY)),
    })
  }

  const handleMouseUp = () => {
    setIsDraggingFrame(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (!containerRef.current || !imageRef.current) return
    
    const delta = e.deltaY > 0 ? 0.95 : 1.05
    const newScale = Math.max(0.5, Math.min(3, imageScale * delta))
    setImageScale(newScale)
  }

  const handleCrop = () => {
    if (!imageRef.current || !containerRef.current) return
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const img = imageRef.current
    const frameSize = frameSizeRef.current
    
    // Canvas size matches frame size (square)
    canvas.width = frameSize
    canvas.height = frameSize
    
    // Calculate what part of the original image is inside the frame
    const containerRect = containerRef.current.getBoundingClientRect()
    const containerWidth = containerRect.width
    const containerHeight = containerRect.height
    
    // Image is centered and scaled
    const scaledImgWidth = img.naturalWidth * imageScale
    const scaledImgHeight = img.naturalHeight * imageScale
    
    // Image position (centered)
    const imgX = (containerWidth - scaledImgWidth) / 2
    const imgY = (containerHeight - scaledImgHeight) / 2
    
    // Frame position relative to container
    const frameX = framePosition.x
    const frameY = framePosition.y
    
    // Calculate what part of the scaled image is inside the frame
    const relativeX = frameX - imgX
    const relativeY = frameY - imgY
    
    // Convert to original image coordinates
    const sourceX = Math.max(0, relativeX / imageScale)
    const sourceY = Math.max(0, relativeY / imageScale)
    const sourceSize = frameSize / imageScale
    
    // Ensure we don't go beyond image bounds
    const actualSourceX = Math.min(sourceX, img.naturalWidth - sourceSize)
    const actualSourceY = Math.min(sourceY, img.naturalHeight - sourceSize)
    const actualSourceSize = Math.min(sourceSize, img.naturalWidth - actualSourceX, img.naturalHeight - actualSourceY)
    
    // Clear canvas with white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, frameSize, frameSize)
    
    // Draw the cropped portion
    ctx.drawImage(
      img,
      actualSourceX,
      actualSourceY,
      actualSourceSize,
      actualSourceSize,
      0,
      0,
      frameSize,
      frameSize
    )
    
    // Convert to base64
    const croppedImage = canvas.toDataURL('image/jpeg', 0.9)
    onCrop(croppedImage)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Adjust Your Photo</h3>
        
        <div
          ref={containerRef}
          className="relative w-full aspect-square max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Image - scaled and centered */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Preview"
            className="absolute select-none z-0"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) scale(${imageScale})`,
              transformOrigin: 'center center',
              maxWidth: 'none',
              width: 'auto',
              height: 'auto',
              display: 'block',
            }}
            draggable={false}
            onError={(e) => {
              console.error('Image failed to load:', imageSrc)
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
            onLoad={(e) => {
              console.log('Image loaded successfully', {
                naturalWidth: (e.target as HTMLImageElement).naturalWidth,
                naturalHeight: (e.target as HTMLImageElement).naturalHeight,
              })
            }}
          />
          
          {/* Crop Frame Overlay - movable square frame */}
          <div
            className="absolute border-4 border-blue-500 bg-blue-500 bg-opacity-20 cursor-move z-20"
            style={{
              left: `${framePosition.x}px`,
              top: `${framePosition.y}px`,
              width: `${frameSizeRef.current}px`,
              height: `${frameSizeRef.current}px`,
            }}
            onMouseDown={handleFrameMouseDown}
          >
            {/* Corner handles for visual feedback */}
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white"></div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white"></div>
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white"></div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white"></div>
          </div>
          
          {/* Dark overlay outside frame - using 4 rectangles for better performance */}
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* Top overlay */}
            <div
              className="absolute bg-black bg-opacity-50"
              style={{
                left: 0,
                top: 0,
                right: 0,
                height: `${framePosition.y}px`,
              }}
            ></div>
            {/* Bottom overlay */}
            <div
              className="absolute bg-black bg-opacity-50"
              style={{
                left: 0,
                bottom: 0,
                right: 0,
                height: `calc(100% - ${framePosition.y + frameSizeRef.current}px)`,
              }}
            ></div>
            {/* Left overlay */}
            <div
              className="absolute bg-black bg-opacity-50"
              style={{
                left: 0,
                top: `${framePosition.y}px`,
                width: `${framePosition.x}px`,
                height: `${frameSizeRef.current}px`,
              }}
            ></div>
            {/* Right overlay */}
            <div
              className="absolute bg-black bg-opacity-50"
              style={{
                right: 0,
                top: `${framePosition.y}px`,
                width: `calc(100% - ${framePosition.x + frameSizeRef.current}px)`,
                height: `${frameSizeRef.current}px`,
              }}
            ></div>
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          <p className="text-sm text-gray-600 text-center">
            Drag the blue frame to select area • Scroll to zoom image • Frame is square (1:1)
          </p>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setImageScale(Math.max(0.5, imageScale - 0.1))}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
            >
              Zoom Out
            </button>
            <button
              type="button"
              onClick={() => {
                if (!containerRef.current) return
                const containerRect = containerRef.current.getBoundingClientRect()
                const containerWidth = containerRect.width
                const containerHeight = containerRect.height
                const frameSize = frameSizeRef.current
                setFramePosition({
                  x: (containerWidth - frameSize) / 2,
                  y: (containerHeight - frameSize) / 2,
                })
              }}
              className="flex-1 px-4 py-2 bg-blue-200 text-blue-700 rounded-md hover:bg-blue-300 text-sm font-medium"
            >
              Center Frame
            </button>
            <button
              type="button"
              onClick={() => setImageScale(Math.min(3, imageScale + 0.1))}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
            >
              Zoom In
            </button>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={handleCrop}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
            >
              Use This Photo
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
