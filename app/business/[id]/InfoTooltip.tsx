'use client'

import { useState, useRef, useEffect } from 'react'

interface InfoTooltipProps {
  title: string
  explanation: string
  scale: string
}

export default function InfoTooltip({ title, explanation, scale }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative inline-block" ref={tooltipRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
        aria-label="Show explanation"
      >
        <span className="text-lg">ℹ️</span>
      </button>
      
      {isOpen && (
        <div className="absolute left-0 top-6 z-50 w-72 rounded-lg bg-gray-900 text-white p-4 shadow-xl">
          <div className="absolute -top-2 left-6 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-gray-900"></div>
          <h4 className="font-semibold mb-2 text-base">{title}</h4>
          <p className="text-sm text-gray-200 mb-3 leading-relaxed">{explanation}</p>
          <p className="text-sm text-yellow-400 font-medium">{scale}</p>
        </div>
      )}
    </div>
  )
}
