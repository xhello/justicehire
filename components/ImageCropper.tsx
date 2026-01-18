'use client'

import { useState, useRef, useEffect } from 'react'

interface ImageCropperProps {
  imageSrc: string
  onCrop: (croppedImage: string) => void
  onCancel: () => void
  aspectRatio?: number // width/height ratio (1 for square, etc.)
}

export default function ImageCropper({ imageSrc, onCrop, onCancel, aspectRatio = 1 }: ImageCropperProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    // Center the image initially - ensure square container
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current
      const container = containerRef.current
      
      // Wait for image to load
      const handleImageLoad = () => {
        // Get actual container dimensions (should be square due to aspect-square class)
        const containerRect = container.getBoundingClientRect()
        const containerSize = Math.min(containerRect.width, containerRect.height)
        
        // Calculate initial position to center
        const imgWidth = img.naturalWidth
        const imgHeight = img.naturalHeight
        
        // Calculate scale to fill the square container (cover mode)
        // Use the larger scale to ensure the image covers the entire square
        const scaleX = containerSize / imgWidth
        const scaleY = containerSize / imgHeight
        const initialScale = Math.max(scaleX, scaleY) * 1.1 // Start slightly zoomed in to ensure coverage
        
        setScale(initialScale)
        
        // Center position - image top-left corner position
        const scaledWidth = imgWidth * initialScale
        const scaledHeight = imgHeight * initialScale
        setPosition({
          x: (containerSize - scaledWidth) / 2,
          y: (containerSize - scaledHeight) / 2,
        })
      }
      
      if (img.complete) {
        handleImageLoad()
      } else {
        img.onload = handleImageLoad
      }
    }
  }, [imageSrc])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    
    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    const containerX = e.clientX - rect.left
    const containerY = e.clientY - rect.top
    
    setIsDragging(true)
    setDragStart({
      x: containerX - position.x,
      y: containerY - position.y,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current || !imageRef.current) return
    
    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    const containerX = e.clientX - rect.left
    const containerY = e.clientY - rect.top
    
    const newX = containerX - dragStart.x
    const newY = containerY - dragStart.y
    
    const containerSize = Math.min(container.clientWidth, container.clientHeight)
    const img = imageRef.current
    const imgWidth = img.naturalWidth * scale
    const imgHeight = img.naturalHeight * scale
    
    // Constrain movement within bounds
    const maxX = 0
    const minX = containerSize - imgWidth
    const maxY = 0
    const minY = containerSize - imgHeight
    
    setPosition({
      x: Math.max(minX, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY)),
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (!containerRef.current || !imageRef.current) return
    
    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    const containerSize = Math.min(container.clientWidth, container.clientHeight)
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.5, Math.min(3, scale * delta))
    
    const img = imageRef.current
    const imgWidth = img.naturalWidth * newScale
    const imgHeight = img.naturalHeight * newScale
    
    // Adjust position to zoom towards mouse position
    const scaleRatio = newScale / scale
    const newX = mouseX - (mouseX - position.x) * scaleRatio
    const newY = mouseY - (mouseY - position.y) * scaleRatio
    
    // Constrain within bounds
    const maxX = 0
    const minX = containerSize - imgWidth
    const maxY = 0
    const minY = containerSize - imgHeight
    
    setScale(newScale)
    setPosition({
      x: Math.max(minX, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY)),
    })
  }

  const handleCrop = () => {
    if (!imageRef.current || !containerRef.current) return
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    // Get actual rendered container size (should be square)
    const containerSize = Math.min(containerRect.width, containerRect.height)
    
    // Set canvas size to square (1:1 aspect ratio)
    canvas.width = containerSize
    canvas.height = containerSize
    
    const img = imageRef.current
    
    // The image is displayed with:
    // - transform: translate(position.x, position.y) scale(scale)
    // - transform-origin: 0 0
    // This means the image's top-left corner is at (position.x, position.y) in container coordinates
    
    // The container shows from (0, 0) to (containerSize, containerSize)
    // We need to map this to the original image coordinates
    
    // Container coordinate (0, 0) maps to image coordinate (-position.x / scale, -position.y / scale)
    // Container coordinate (containerSize, containerSize) maps to image coordinate ((containerSize - position.x) / scale, (containerSize - position.y) / scale)
    
    // Calculate source rectangle in original image coordinates
    const sourceX = Math.max(0, -position.x / scale)
    const sourceY = Math.max(0, -position.y / scale)
    const sourceWidth = (containerSize - Math.max(0, position.x) + Math.max(0, -position.x)) / scale
    const sourceHeight = (containerSize - Math.max(0, position.y) + Math.max(0, -position.y)) / scale
    
    // Ensure we don't go beyond image bounds
    const actualSourceWidth = Math.min(sourceWidth, img.naturalWidth - sourceX)
    const actualSourceHeight = Math.min(sourceHeight, img.naturalHeight - sourceY)
    
    // Use square crop - use the smaller dimension to ensure square output
    const sourceSize = Math.min(actualSourceWidth, actualSourceHeight)
    
    // Calculate destination offset if image doesn't fill container
    const destOffsetX = position.x < 0 ? 0 : (containerSize - (sourceSize * scale)) / 2
    const destOffsetY = position.y < 0 ? 0 : (containerSize - (sourceSize * scale)) / 2
    
    // Clear canvas with white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, containerSize, containerSize)
    
    // Draw the cropped square portion
    // If image extends beyond container, we crop from the center of what's visible
    const finalSourceX = position.x < 0 ? sourceX : Math.max(0, sourceX - (sourceWidth - sourceSize) / 2)
    const finalSourceY = position.y < 0 ? sourceY : Math.max(0, sourceY - (sourceHeight - sourceSize) / 2)
    
    ctx.drawImage(
      img,
      finalSourceX,
      finalSourceY,
      sourceSize,
      sourceSize,
      destOffsetX,
      destOffsetY,
      containerSize - (destOffsetX * 2),
      containerSize - (destOffsetY * 2)
    )
    
    // Convert to base64
    const croppedImage = canvas.toDataURL('image/jpeg', 0.9)
    onCrop(croppedImage)
  }

  const centerImage = () => {
    if (!containerRef.current || !imageRef.current) return
    
    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    const containerSize = Math.min(containerRect.width, containerRect.height)
    
    const img = imageRef.current
    const imgWidth = img.naturalWidth * scale
    const imgHeight = img.naturalHeight * scale
    
    // Center the image in the square container
    // Position is the top-left corner of the image
    setPosition({
      x: (containerSize - imgWidth) / 2,
      y: (containerSize - imgHeight) / 2,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Adjust Your Photo</h3>
        
        <div
          ref={containerRef}
          className="relative w-full aspect-square max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden cursor-move border-2 border-gray-300"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Preview"
            className="absolute select-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: '0 0',
            }}
            draggable={false}
          />
        </div>
        
        <div className="mt-4 space-y-2">
          <p className="text-sm text-gray-600 text-center">
            Drag to reposition • Scroll to zoom • Crop area is square (1:1)
          </p>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (!containerRef.current || !imageRef.current) return
                const container = containerRef.current
                const containerSize = Math.min(container.clientWidth, container.clientHeight)
                const newScale = Math.max(0.5, scale - 0.1)
                const img = imageRef.current
                const imgWidth = img.naturalWidth * newScale
                const imgHeight = img.naturalHeight * newScale
                setScale(newScale)
                // Re-center after zoom
                setPosition({
                  x: (containerSize - imgWidth) / 2,
                  y: (containerSize - imgHeight) / 2,
                })
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
            >
              Zoom Out
            </button>
            <button
              type="button"
              onClick={centerImage}
              className="flex-1 px-4 py-2 bg-blue-200 text-blue-700 rounded-md hover:bg-blue-300 text-sm font-medium"
            >
              Center
            </button>
            <button
              type="button"
              onClick={() => {
                if (!containerRef.current || !imageRef.current) return
                const container = containerRef.current
                const containerSize = Math.min(container.clientWidth, container.clientHeight)
                const newScale = Math.min(3, scale + 0.1)
                const img = imageRef.current
                const imgWidth = img.naturalWidth * newScale
                const imgHeight = img.naturalHeight * newScale
                setScale(newScale)
                // Re-center after zoom
                setPosition({
                  x: (containerSize - imgWidth) / 2,
                  y: (containerSize - imgHeight) / 2,
                })
              }}
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
