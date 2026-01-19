'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

export default function TopLoadingBar() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const pathname = usePathname()
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const completeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isLoadingRef = useRef(false)

  // Complete loading when route changes (navigation completed)
  useEffect(() => {
    if (isLoadingRef.current) {
      // Route changed, complete the loading bar
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      isLoadingRef.current = false
      setProgress(100)
      completeTimeoutRef.current = setTimeout(() => {
        setLoading(false)
        setProgress(0)
      }, 300)
    }
  }, [pathname])

  useEffect(() => {
    const startLoading = () => {
      if (isLoadingRef.current) return // Already loading
      
      isLoadingRef.current = true
      setLoading(true)
      setProgress(0)
      
      // Animate progress
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            return 85 // Stop at 85% until action completes
          }
          // Fast initial progress, then slower
          const increment = prev < 50 ? 15 : 5
          return Math.min(prev + increment + Math.random() * 5, 85)
        })
      }, 100)
    }

    const completeLoading = () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      
      isLoadingRef.current = false
      
      // Complete to 100%
      setProgress(100)
      
      // Hide after animation
      completeTimeoutRef.current = setTimeout(() => {
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
      
      // Check for links (navigation to other pages)
      const link = target.closest('a')
      if (link) {
        const href = link.getAttribute('href')
        // Only show loading for internal navigation links
        if (href && href.startsWith('/') && !href.startsWith('//')) {
          startLoading()
          // Navigation will complete when pathname changes
          // Fallback timeout in case navigation doesn't happen
          setTimeout(completeLoading, 3000)
          return
        }
      }
      
      // Check for submit buttons
      const submitButton = target.closest('button[type="submit"]')
      if (submitButton) {
        startLoading()
        // Complete after reasonable delay
        setTimeout(completeLoading, 2000)
        return
      }
      
      // Check for any other buttons (tab buttons, action buttons, etc.)
      const button = target.closest('button')
      if (button && button.type !== 'submit') {
        startLoading()
        // Quick completion for instant actions like tab switching
        setTimeout(completeLoading, 300)
        return
      }
    }

    // Use capture phase to catch events early
    document.addEventListener('submit', handleSubmit, true)
    document.addEventListener('click', handleClick, true)

    return () => {
      document.removeEventListener('submit', handleSubmit, true)
      document.removeEventListener('click', handleClick, true)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      if (completeTimeoutRef.current) clearTimeout(completeTimeoutRef.current)
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
