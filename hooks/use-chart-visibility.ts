"use client"

import { useState, useEffect, useRef, useCallback } from "react"

/**
 * Custom hook to detect chart container visibility and size changes
 * Particularly useful for charts inside tabs that need to re-render when their tab becomes active
 * 
 * @returns {Object} An object containing:
 *   - ref: Ref to attach to the chart container
 *   - isVisible: Boolean indicating if the chart is currently visible
 *   - forceUpdate: Function to manually trigger a chart update
 *   - containerSize: Object with width and height of the container
 */
export function useChartVisibility() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [updateTrigger, setUpdateTrigger] = useState(0)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  
  // Force an update that will cause charts to re-render
  const forceUpdate = useCallback(() => {
    setUpdateTrigger(prev => prev + 1)
  }, [])

  // Set up intersection observer to detect visibility changes
  useEffect(() => {
    if (!containerRef.current) return
    
    const currentElement = containerRef.current
    
    // Create intersection observer to detect when the chart becomes visible
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        const newIsVisible = entry.isIntersecting
        
        if (newIsVisible && !isVisible) {
          // If becoming visible, force an update after a short delay
          // This gives the browser time to properly calculate dimensions
          setTimeout(() => {
            setIsVisible(true)
            forceUpdate()
          }, 50)
        } else if (!newIsVisible && isVisible) {
          setIsVisible(false)
        }
      },
      {
        threshold: 0.1, // Consider visible when at least 10% is in view
        root: null      // Use viewport as root
      }
    )
    
    // Start observing
    intersectionObserver.observe(currentElement)
    
    return () => {
      // Clean up observer when component unmounts
      intersectionObserver.unobserve(currentElement)
      intersectionObserver.disconnect()
    }
  }, [isVisible, forceUpdate])
  
  // Set up resize observer to detect size changes
  useEffect(() => {
    if (!containerRef.current) return
    
    const currentElement = containerRef.current
    
    // Create resize observer to detect when the chart container changes size
    const resizeObserver = new ResizeObserver((entries) => {
      const [entry] = entries
      
      if (entry && entry.contentRect) {
        const { width, height } = entry.contentRect
        
        // Only update if dimensions actually changed
        setContainerSize(prev => {
          if (prev.width !== width || prev.height !== height) {
            // If size changed and element is visible, force an update
            if (isVisible) {
              setTimeout(forceUpdate, 50)
            }
            return { width, height }
          }
          return prev
        })
      }
    })
    
    // Start observing
    resizeObserver.observe(currentElement)
    
    return () => {
      // Clean up observer when component unmounts
      resizeObserver.unobserve(currentElement)
      resizeObserver.disconnect()
    }
  }, [isVisible, forceUpdate])
  
  // Additional effect to handle tab switching via URL or programmatic changes
  useEffect(() => {
    // Check if element is currently visible in the viewport
    const checkVisibility = () => {
      if (!containerRef.current) return
      
      const rect = containerRef.current.getBoundingClientRect()
      const isCurrentlyVisible = 
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      
      // If element is visible but our state doesn't reflect that, update
      if (isCurrentlyVisible && !isVisible) {
        setIsVisible(true)
        forceUpdate()
      }
    }
    
    // Check visibility on mount and when updateTrigger changes
    checkVisibility()
    
    // Also listen for tab visibility changes at the document level
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVisibility()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isVisible, updateTrigger, forceUpdate])
  
  return {
    ref: containerRef,
    isVisible,
    forceUpdate,
    containerSize,
    updateTrigger
  }
}
