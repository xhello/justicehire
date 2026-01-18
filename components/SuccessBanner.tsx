'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function SuccessBanner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const success = searchParams.get('success')
    if (success) {
      // Decode the URL-encoded message
      const decodedMessage = decodeURIComponent(success)
      setMessage(decodedMessage)
      setIsVisible(true)
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false)
        // Remove success param from URL after hiding
        const params = new URLSearchParams(searchParams.toString())
        params.delete('success')
        const newPath = window.location.pathname + (params.toString() ? `?${params.toString()}` : '')
        router.replace(newPath)
      }, 5000)

      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [searchParams, router])

  if (!isVisible || !message) return null

  return (
    <div className="fixed top-16 left-0 right-0 z-50 bg-green-500 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <p className="font-medium">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false)
            const params = new URLSearchParams(searchParams.toString())
            params.delete('success')
            const newPath = window.location.pathname + (params.toString() ? `?${params.toString()}` : '')
            router.replace(newPath)
          }}
          className="ml-4 text-white hover:text-gray-200 focus:outline-none"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
