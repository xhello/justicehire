'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function TopLoadingBar() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const pathname = usePathname()

  useEffect(() => {
    // Reset on route change
    setLoading(false)
    setProgress(0)
  }, [pathname])

  useEffect(() => {
    let progressInterval: NodeJS.Timeout | null = null
    let completeTimeout: NodeJS.Timeout | null = null
    let isLoading = false

    const startLoading = () => {
      if (isLoading) return // Already loading
      
      isLoading = true
      setLoading(true)
      setProgress(0)
      
      // Animate progress
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            return 85 // Stop at 85% until form completes
          }
          // Fast initial progress, then slower
          const increment = prev < 50 ? 15 : 5
          return Math.min(prev + increment + Math.random() * 5, 85)
        })
      }, 100)
    }

    const completeLoading = () => {
      if (progressInterval) {
        clearInterval(progressInterval)
        progressInterval = null
      }
      
      isLoading = false
      
      // Complete to 100%
      setProgress(100)
      
      // Hide after animation
      completeTimeout = setTimeout(() => {
        setLoading(false)
        setProgress(0)
      }, 300)
    }

    const handleSubmit = (e: Event) => {
      const form = e.target as HTMLFormElement
      if (form.tagName === 'FORM') {
        startLoading()
        // Complete after reasonable delay (server actions typically take 1-3 seconds)
        setTimeout(completeLoading, 2000)
      }
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const button = target.closest('button[type="submit"]')
      if (button) {
        startLoading()
        // Complete after reasonable delay
        setTimeout(completeLoading, 2000)
      }
    }

    // Use capture phase to catch events early
    document.addEventListener('submit', handleSubmit, true)
    document.addEventListener('click', handleClick, true)

    return () => {
      document.removeEventListener('submit', handleSubmit, true)
      document.removeEventListener('click', handleClick, true)
      if (progressInterval) clearInterval(progressInterval)
      if (completeTimeout) clearTimeout(completeTimeout)
    }
  }, [])

  if (!loading) return null

  return (
    <div className="fixed top-16 left-0 right-0 z-[9999] h-1 bg-transparent">
      <div
        className="h-full bg-blue-600 shadow-lg transition-all duration-200 ease-out"
        style={{
          width: `${Math.min(progress, 100)}%`,
          boxShadow: '0 0 10px rgba(37, 99, 235, 0.5)',
        }}
      />
    </div>
  )
}
