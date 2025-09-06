'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAutoSaveMaterial, UpdateMaterialData } from '@/hooks/useMaterialQueries'
import { cn } from '@/lib/utils'

// Define allowed field names for materials
type AllowedFieldName = keyof UpdateMaterialData

interface AutoSaveMaterialFieldProps {
  value: string
  onChange: (value: string) => void
  materialId: string
  fieldName: AllowedFieldName
  placeholder?: string
  className?: string
  readOnly?: boolean
  debounceMs?: number
  type?: 'text' | 'number' | 'date'
}

export function AutoSaveMaterialField({
  value,
  onChange,
  materialId,
  fieldName,
  placeholder,
  className,
  readOnly = false,
  debounceMs = 1000,
  type = 'text',
}: AutoSaveMaterialFieldProps) {
  const [localValue, setLocalValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)

  const { saveField, isLoading } = useAutoSaveMaterial(materialId, fieldName)

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Debounced save function
  const debouncedSave = useCallback(
    (newValue: string) => {
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }

      const timeout = setTimeout(async () => {
        setIsSaving(true)
        try {
          // Convert value based on field type
          let processedValue: string | number = newValue
          if (type === 'number' && (fieldName === 'volumeTarget' || fieldName === 'waktuSelesai')) {
            processedValue = parseFloat(newValue) || 0
          }

          await saveField(processedValue)
          onChange(newValue)
        } catch (error) {
          console.error(`Failed to save ${fieldName}:`, error)
          // Reset to original value on error
          setLocalValue(value)
        }
        setIsSaving(false)
      }, debounceMs)

      setSaveTimeout(timeout)
    },
    [saveField, saveTimeout, debounceMs, fieldName, onChange, value, type]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)

    if (!readOnly) {
      debouncedSave(newValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (saveTimeout) {
        clearTimeout(saveTimeout)
        setSaveTimeout(null)
      }
      debouncedSave(localValue)
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
    }
  }, [saveTimeout])

  const showSavingIndicator = isSaving || isLoading

  return (
    <div className="relative">
      <input
        type={type}
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        readOnly={readOnly}
        className={cn(
          'w-full border-b border-gray-200 bg-white px-2 py-1 text-[9px] text-gray-700 transition-colors focus:border-blue-500 focus:outline-none lg:px-2.5 lg:py-1.5 lg:text-[10px] xl:px-3 xl:py-2 xl:text-xs',
          readOnly && 'cursor-not-allowed bg-gray-50',
          showSavingIndicator && 'pr-8',
          className
        )}
        disabled={readOnly}
      />

      {showSavingIndicator && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 lg:h-3.5 lg:w-3.5"></div>
        </div>
      )}
    </div>
  )
}
