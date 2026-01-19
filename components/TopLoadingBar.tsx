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
      
      // Check for submit buttons
      const submitButton = target.closest('button[type="submit"]')
      if (submitButton) {
        startLoading()
        // Complete after reasonable delay
        setTimeout(completeLoading, 2000)
        return
      }
      
      // Check for tab buttons - buttons that are not submit buttons and are used for tab navigation
      const button = target.closest('button')
      if (button && button.type !== 'submit') {
        // Check if it's a tab button by looking for tab navigation context
        // Tab buttons are typically in nav elements
        const isInNav = button.closest('nav') !== null
        
        // Check for common tab button text patterns
        const buttonText = button.textContent?.toLowerCase().trim() || ''
        const isTabButtonText = 
          buttonText.includes('business') ||
          buttonText.includes('employer') ||
          buttonText.includes('employee') ||
          buttonText.includes('review received') ||
          buttonText.includes('reviews received') ||
          buttonText.includes('reviews given') ||
          buttonText.includes('review given')
        
        // Check if button is in a tab-like container (flex container, typically used for tabs)
        const parent = button.parentElement
        const isInTabContainer = parent && parent.classList.contains('flex')
        
        // If in nav (tab navigation) OR has tab button text in a flex container, show loading
        if (isInNav || (isInTabContainer && isTabButtonText)) {
          startLoading()
          // Tab switching is instant, so complete quickly
          setTimeout(completeLoading, 300)
        }
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
