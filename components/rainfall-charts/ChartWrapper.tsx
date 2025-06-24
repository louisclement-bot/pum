"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ChartWrapperProps {
  children: ReactNode
  className?: string
  placeholder?: ReactNode
}

/**
 * A wrapper component that delays rendering its children until the component
 * is visible in the viewport. This is useful for charts or other components
 * that need to measure their container dimensions on mount, especially when
 * they are inside tabs or collapsible sections.
 */
export default function ChartWrapper({
  children,
  className,
  placeholder,
}: ChartWrapperProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // This ensures browser APIs are available before we proceed.
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Don't run the observer logic on the server or if the ref is not set yet.
    if (!isMounted || !containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          // A small delay ensures that any animations (like framer-motion's
          // height animation) have completed and the container has its final
          //, stable dimensions before we render the chart.
          setTimeout(() => {
            setIsVisible(true)
            // Once visible, we don't need to observe anymore.
            if (containerRef.current) {
              observer.unobserve(containerRef.current)
            }
          }, 100) // 100ms delay is usually enough for quick animations.
        }
      },
      {
        root: null, // Observes intersections relative to the viewport.
        threshold: 0.1, // Trigger when at least 10% of the element is visible.
      },
    )

    const currentRef = containerRef.current
    observer.observe(currentRef)

    // Cleanup function to disconnect the observer when the component unmounts.
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
      observer.disconnect()
    }
  }, [isMounted])

  const defaultPlaceholder = (
    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
      Chargement du graphique...
    </div>
  )

  return (
    <div ref={containerRef} className={cn("w-full h-[300px]", className)}>
      {isVisible ? children : placeholder || defaultPlaceholder}
    </div>
  )
}
