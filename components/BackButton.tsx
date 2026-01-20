'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'

export default function BackButton() {
  const router = useRouter()
  const pathname = usePathname()

  const handleBack = useCallback(() => {
    const currentPath = pathname
    
    // Go back once
    router.back()
    
    // Check after a short delay if we're still on the same page
    setTimeout(() => {
      if (window.location.pathname === currentPath) {
        // Still on same page, go back again
        router.back()
      }
    }, 100)
  }, [router, pathname])

  return (
    <button
      onClick={handleBack}
      className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-blue-600 rounded-md shadow-md transition-colors flex items-center justify-center"
      title="Go back"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-6 w-6" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M15 19l-7-7 7-7" 
        />
      </svg>
    </button>
  )
}
