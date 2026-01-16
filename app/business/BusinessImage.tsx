'use client'

import { useState } from 'react'

interface BusinessImageProps {
  src: string | null | undefined
  alt: string
  className?: string
}

export default function BusinessImage({ src, alt, className = '' }: BusinessImageProps) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return null
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  )
}
