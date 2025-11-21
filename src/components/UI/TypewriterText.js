// FILE OVERVIEW
// - Purpose: Animated typewriter effect component that displays text character by character with optional cursor.
// - Used by: HomePage for animated title and subtitle display; provides visual appeal on landing page.
// - Notes: Production component. Configurable speed and cursor display; calls onComplete callback when animation finishes.

import React, { useState, useEffect } from 'react'

const TypewriterText = ({ text, speed = 100, className = '', showCursor = true, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timeout)
    } else if (currentIndex === text.length && !isComplete) {
      setIsComplete(true)
      if (onComplete) {
        onComplete()
      }
    }
  }, [currentIndex, text, speed, isComplete, onComplete])

  return (
    <span className={className}>
      {displayedText}
      {showCursor && !isComplete && <span className="animate-pulse">|</span>}
    </span>
  )
}

export default TypewriterText
