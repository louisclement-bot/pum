"use client"

import type React from "react"

import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"

type NumberInputProps = {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  className?: string
}

export default function NumberInput({
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  label,
  className = "",
}: NumberInputProps) {
  const [inputValue, setInputValue] = useState<string>(value.toString())

  useEffect(() => {
    setInputValue(value.toString())
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    const numValue = Number.parseInt(newValue, 10)
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue)
    }
  }

  const handleBlur = () => {
    const numValue = Number.parseInt(inputValue, 10)
    if (isNaN(numValue) || numValue < min) {
      setInputValue(min.toString())
      onChange(min)
    } else if (numValue > max) {
      setInputValue(max.toString())
      onChange(max)
    }
  }

  const increment = () => {
    const newValue = Math.min(value + step, max)
    onChange(newValue)
    setInputValue(newValue.toString())
  }

  const decrement = () => {
    const newValue = Math.max(value - step, min)
    onChange(newValue)
    setInputValue(newValue.toString())
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <div className="text-base font-medium text-blue-800 dark:text-blue-300 mb-1">{label}</div>}
      <div className="flex items-center">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={decrement}
          disabled={value <= min}
          className="h-12 w-12 rounded-l-xl rounded-r-none border-2 border-r-0 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-50"
        >
          <Minus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span className="sr-only">Decrease</span>
        </Button>
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className="h-12 rounded-none text-center w-20 border-2 border-x-0 border-blue-200 dark:border-blue-800 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-blue-500 dark:focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={increment}
          disabled={value >= max}
          className="h-12 w-12 rounded-r-xl rounded-l-none border-2 border-l-0 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-50"
        >
          <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span className="sr-only">Increase</span>
        </Button>
      </div>
    </div>
  )
}
