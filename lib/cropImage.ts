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

  // Return as base64 string with aggressive compression
  // Limit canvas size to max 600x600 to reduce file size significantly
  const maxDimension = 600
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

  // Draw resized image to output canvas with better quality settings
  outputCtx.imageSmoothingEnabled = true
  outputCtx.imageSmoothingQuality = 'high'
  outputCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, outputWidth, outputHeight)

  // Return as base64 string with aggressive compression
  // Start with quality 0.75, reduce if needed
  return new Promise((resolve, reject) => {
    const tryCompress = (quality: number) => {
      outputCanvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'))
            return
          }
          
          // Target: keep base64 under 1.5MB (roughly 1MB actual file)
          // Base64 is ~33% larger, so 1MB file = ~1.33MB base64
          // We'll target 1.5MB base64 to be safe
          const maxBase64Size = 1.5 * 1024 * 1024
          const estimatedBase64Size = blob.size * 1.33
          
          if (estimatedBase64Size > maxBase64Size && quality > 0.5) {
            // Try with lower quality
            tryCompress(quality - 0.1)
          } else {
            const reader = new FileReader()
            reader.onloadend = () => {
              const base64 = reader.result as string
              // Final check
              if (base64.length > maxBase64Size && quality > 0.5) {
                tryCompress(quality - 0.1)
              } else {
                resolve(base64)
              }
            }
            reader.onerror = reject
            reader.readAsDataURL(blob)
          }
        },
        'image/jpeg',
        quality
      )
    }
    
    // Start with 0.75 quality
    tryCompress(0.75)
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
