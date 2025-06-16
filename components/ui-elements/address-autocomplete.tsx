"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Loader2, MapPin, X, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"

export interface AddressSuggestion {
  label: string
  city?: string
  postcode?: string
  citycode?: string
  score: number
  id: string // BAN ID (clé d'interopérabilité)
  type: string
  coordinates: [number, number] // [longitude, latitude]
}

export interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (suggestion: AddressSuggestion) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  inputClassName?: string
  required?: boolean
  label?: string
  error?: string
  autoFocus?: boolean
  minLength?: number
  limit?: number
  type?: "housenumber" | "street" | "locality" | "municipality" | undefined
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Saisissez une adresse",
  disabled = false,
  className = "",
  inputClassName = "",
  required = false,
  label,
  error,
  autoFocus = false,
  minLength = 3,
  limit = 5,
  type,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debouncedValue = useDebounce(value, 300)

  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!query || query.length < minLength) {
        setSuggestions([])
        return
      }

      setIsLoading(true)
      try {
        // Build the URL with query parameters
        const params = new URLSearchParams({
          q: query,
          limit: limit.toString(),
        })

        // Add type filter if specified
        if (type) {
          params.append("type", type)
        }

        const response = await fetch(`https://api-adresse.data.gouv.fr/search/?${params.toString()}`)

        if (!response.ok) {
          throw new Error("Failed to fetch address suggestions")
        }

        const data = await response.json()

        if (data.features && Array.isArray(data.features)) {
          const formattedSuggestions: AddressSuggestion[] = data.features.map((feature) => ({
            label: feature.properties.label,
            city: feature.properties.city,
            postcode: feature.properties.postcode,
            citycode: feature.properties.citycode,
            score: feature.properties.score,
            id: feature.properties.id,
            type: feature.properties.type,
            coordinates: feature.geometry.coordinates,
          }))

          setSuggestions(formattedSuggestions)
          setShowSuggestions(true)
        } else {
          setSuggestions([])
        }
      } catch (error) {
        console.error("Error fetching address suggestions:", error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    },
    [minLength, limit, type],
  )

  // Fetch suggestions when the debounced value changes
  useEffect(() => {
    if (debouncedValue) {
      fetchSuggestions(debouncedValue)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [debouncedValue, fetchSuggestions])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    // Arrow down
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex((prevIndex) => (prevIndex < suggestions.length - 1 ? prevIndex + 1 : prevIndex))
    }
    // Arrow up
    else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0))
    }
    // Enter
    else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault()
      handleSelectSuggestion(suggestions[highlightedIndex])
    }
    // Handle Enter key when no suggestion is highlighted - trigger search
    else if (e.key === "Enter" && highlightedIndex === -1 && value.trim()) {
      e.preventDefault()
      setShowSuggestions(false)
      // Trigger the onSelect callback with null to indicate manual entry
      if (onSelect) {
        onSelect(null as any)
      }
    }
    // Escape
    else if (e.key === "Escape") {
      e.preventDefault()
      setShowSuggestions(false)
    }
  }

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    console.log("Selected address suggestion:", suggestion)
    onChange(suggestion.label)
    setShowSuggestions(false)
    setHighlightedIndex(-1)
    if (onSelect) {
      onSelect(suggestion)
    }
  }

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Clear input
  const handleClear = () => {
    onChange("")
    setSuggestions([])
    setShowSuggestions(false)
    setHighlightedIndex(-1)
    inputRef.current?.focus()
  }

  // Toggle suggestions dropdown
  const toggleSuggestions = () => {
    if (showSuggestions) {
      setShowSuggestions(false)
    } else if (value && suggestions.length > 0) {
      setShowSuggestions(true)
    } else if (value && value.length >= minLength) {
      fetchSuggestions(value)
    }
  }

  return (
    <div className={cn("relative w-full", className)}>
      {label && (
        <label
          htmlFor="address-autocomplete"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <div className="absolute left-3 text-gray-400 pointer-events-none">
          <MapPin className="h-5 w-5" />
        </div>

        <Input
          id="address-autocomplete"
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            if (e.target.value.length >= minLength) {
              setShowSuggestions(true)
            } else {
              setShowSuggestions(false)
            }
          }}
          onFocus={() => {
            setIsFocused(true)
            if (value && value.length >= minLength && suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoFocus={autoFocus}
          className={cn(
            "pl-10 pr-16 py-2 h-12 rounded-xl border-2 transition-colors",
            error
              ? "border-red-300 dark:border-red-700 focus:border-red-500 dark:focus:border-red-500"
              : "border-blue-200 dark:border-blue-800 focus:border-blue-500 dark:focus:border-blue-500",
            inputClassName,
          )}
          aria-expanded={showSuggestions}
          aria-autocomplete="list"
          aria-controls="address-suggestions"
          aria-activedescendant={highlightedIndex >= 0 ? `suggestion-${highlightedIndex}` : undefined}
        />

        <div className="absolute right-3 flex items-center space-x-1">
          {isLoading && <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />}

          {value && !isLoading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={handleClear}
              aria-label="Clear input"
            >
              <X className="h-4 w-4 text-gray-400" />
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={toggleSuggestions}
            aria-label={showSuggestions ? "Hide suggestions" : "Show suggestions"}
            disabled={!value || value.length < minLength}
          >
            {showSuggestions ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        </div>
      </div>

      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          id="address-suggestions"
          className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto"
          role="listbox"
        >
          <ul className="py-1">
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                id={`suggestion-${index}`}
                role="option"
                aria-selected={highlightedIndex === index}
                className={cn(
                  "px-4 py-2 cursor-pointer flex items-start gap-2",
                  highlightedIndex === index
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700/50",
                )}
                onClick={() => handleSelectSuggestion(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <MapPin className="h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">{suggestion.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex flex-wrap gap-2">
                    {suggestion.type && (
                      <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
                        {getTypeLabel(suggestion.type)}
                      </span>
                    )}
                    {suggestion.score && (
                      <span className="bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded text-blue-700 dark:text-blue-300">
                        Score: {Math.round(suggestion.score * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && !isLoading && value.length >= minLength && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-gray-500 dark:text-gray-400">Aucune adresse trouvée</p>
        </div>
      )}
    </div>
  )
}

// Helper function to get a human-readable label for address types
function getTypeLabel(type: string): string {
  switch (type) {
    case "housenumber":
      return "Adresse"
    case "street":
      return "Rue"
    case "locality":
      return "Lieu-dit"
    case "municipality":
      return "Commune"
    default:
      return type
  }
}
