'use client'

import { useState } from 'react'

interface StarRatingProps {
  name: string
  defaultValue?: number | null
  required?: boolean
}

export default function StarRating({ name, defaultValue, required }: StarRatingProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(defaultValue || null)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)

  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star: number) => (
        <label key={star} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={star}
            required={required}
            defaultChecked={defaultValue === star}
            className="sr-only"
            onChange={() => setSelectedRating(star)}
          />
          <span
            className={`text-3xl transition ${
              (hoveredRating !== null && star <= hoveredRating) ||
              (hoveredRating === null && selectedRating !== null && star <= selectedRating)
                ? 'text-yellow-400'
                : 'text-gray-300'
            } hover:text-yellow-400`}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(null)}
          >
            ★
          </span>
        </label>
      ))}
    </div>
  )
}
