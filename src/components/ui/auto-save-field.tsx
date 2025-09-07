'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useUpdateProjectField } from '@/hooks/useProjectQueries'
import { z } from 'zod'
import { UpdateProjectFieldSchema } from '@/lib/schemas'
import { cn } from '@/lib/utils'

// Define allowed field names type
type AllowedFieldName =
  | 'penyediaJasa'
  | 'pekerjaan'
  | 'jenisPaket'
  | 'jenisPengadaan'
  | 'paguAnggaran'
  | 'nilaiKontrak'
  | 'nomorKontrak'
  | 'spmk'
  | 'masaKontrak'
  | 'tanggalKontrak'
  | 'akhirKontrak'
  | 'pembayaranTerakhir'

interface AutoSaveFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  projectId: string
  fieldName: AllowedFieldName
  placeholder?: string
  className?: string
  disabled?: boolean
  maxLength?: number
  type?: 'text' | 'textarea' | 'date'
  rows?: number
}

export const AutoSaveField: React.FC<AutoSaveFieldProps> = ({
  label,
  value,
  onChange,
  projectId,
  fieldName,
  placeholder,
  className,
  disabled = false,
  maxLength,
  type = 'text',
  rows = 3,
}) => {
  const [localValue, setLocalValue] = useState(value)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const updateMutation = useUpdateProjectField()

  // Debounced save function
  const debouncedSave = useCallback(
    async (newValue: string) => {
      if (newValue === value || disabled) return

      try {
        // Validate data before sending
        const validationData = {
          projectId,
          fieldName,
          value: newValue,
        }

        UpdateProjectFieldSchema.parse(validationData)

        setSaveStatus('saving')
        setErrorMessage(null)

        await updateMutation.mutateAsync(validationData)

        setSaveStatus('saved')
        onChange(newValue)

        // Reset status after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch (error) {
        setSaveStatus('error')

        if (error instanceof z.ZodError) {
          setErrorMessage(error.errors[0]?.message || 'Validation error')
        } else if (error instanceof Error) {
          setErrorMessage(error.message)
        } else {
          setErrorMessage('Failed to save changes')
        }

        console.error('Auto-save error:', error)
      }
    },
    [value, projectId, fieldName, disabled, onChange, updateMutation]
  )

  // Auto-save effect with debouncing
  useEffect(() => {
    if (localValue !== value) {
      const timeoutId = setTimeout(() => {
        debouncedSave(localValue)
      }, 1000) // 1 second delay

      return () => clearTimeout(timeoutId)
    }
  }, [localValue, value, debouncedSave])

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = (newValue: string) => {
    if (maxLength && newValue.length > maxLength) {
      return
    }
    setLocalValue(newValue)
    setSaveStatus('idle')
    setErrorMessage(null)
  }

  const getStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        )
      case 'saved':
        return (
          <svg className="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )
      case 'error':
        return (
          <svg className="h-3 w-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        )
      default:
        return null
    }
  }

  const getStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...'
      case 'saved':
        return 'Saved'
      case 'error':
        return 'Error'
      default:
        return ''
    }
  }

  const inputClasses = cn(
    'w-full border-b border-gray-200 bg-white px-2 py-1 text-[9px] text-gray-700 transition-colors focus:border-blue-500 focus:outline-none lg:px-2.5 lg:py-1.5 lg:text-[10px] xl:px-3 xl:py-2 xl:text-xs',
    saveStatus === 'error' && 'border-red-300 bg-red-50',
    saveStatus === 'saved' && 'border-green-300 bg-green-50',
    disabled && 'bg-gray-50 cursor-not-allowed',
    className
  )

  return (
    <div className="flex flex-col gap-0.5 lg:gap-1">
      <div className="flex items-center justify-between">
        <label className="text-[9px] font-medium text-gray-700 lg:text-[10px] xl:text-xs">
          {label}
        </label>
        <div className="flex items-center gap-1">
          {getStatusIcon()}
          {saveStatus !== 'idle' && (
            <span
              className={cn(
                'text-[8px] lg:text-[9px]',
                saveStatus === 'saving' && 'text-blue-500',
                saveStatus === 'saved' && 'text-green-500',
                saveStatus === 'error' && 'text-red-500'
              )}
            >
              {getStatusText()}
            </span>
          )}
        </div>
      </div>

      {type === 'textarea' ? (
        <textarea
          value={localValue}
          onChange={e => handleChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          rows={rows}
          className={cn(inputClasses, 'resize-none')}
        />
      ) : type === 'date' ? (
        <input
          type="date"
          value={localValue}
          onChange={e => handleChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
        />
      ) : (
        <input
          type="text"
          value={localValue}
          onChange={e => handleChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={inputClasses}
        />
      )}

      {errorMessage && <p className="text-[8px] text-red-500 lg:text-[9px]">{errorMessage}</p>}

      {maxLength && (
        <p className="text-[8px] text-gray-400 lg:text-[9px]">
          {localValue.length}/{maxLength}
        </p>
      )}
    </div>
  )
}
