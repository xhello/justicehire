import { Area } from 'react-easy-crop'

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<string> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  // Set canvas size to match the crop area
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  // Return as base64 string with compression
  // Limit canvas size to max 800x800 to reduce file size
  const maxDimension = 800
  let outputWidth = pixelCrop.width
  let outputHeight = pixelCrop.height
  
  if (outputWidth > maxDimension || outputHeight > maxDimension) {
    const scale = Math.min(maxDimension / outputWidth, maxDimension / outputHeight)
    outputWidth = Math.round(outputWidth * scale)
    outputHeight = Math.round(outputHeight * scale)
  }

  // Create output canvas with limited size
  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = outputWidth
  outputCanvas.height = outputHeight
  const outputCtx = outputCanvas.getContext('2d')

  if (!outputCtx) {
    throw new Error('No 2d context for output canvas')
  }

  // Draw resized image to output canvas
  outputCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, outputWidth, outputHeight)

  // Return as base64 string with compression (lower quality for smaller file size)
  return new Promise((resolve, reject) => {
    outputCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'))
          return
        }
        
        // Check if blob is too large (max 2MB for base64)
        if (blob.size > 2 * 1024 * 1024) {
          // Try with even lower quality
          outputCanvas.toBlob(
            (smallerBlob) => {
              if (!smallerBlob) {
                reject(new Error('Image is too large even after compression'))
                return
              }
              const reader = new FileReader()
              reader.onloadend = () => resolve(reader.result as string)
              reader.onerror = reject
              reader.readAsDataURL(smallerBlob)
            },
            'image/jpeg',
            0.7 // Lower quality
          )
        } else {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        }
      },
      'image/jpeg',
      0.85 // Slightly lower quality for smaller file size
    )
  })
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.src = url
  })
}
