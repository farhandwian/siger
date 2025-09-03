import { useState, useEffect, useCallback } from 'react'

interface UseAutoSaveOptions {
  projectId: string
  fieldName: string
  initialValue: string
  debounceMs?: number
}

interface UseAutoSaveReturn {
  value: string
  setValue: (value: string) => void
  isLoading: boolean
  isSaved: boolean
  error: string | null
}

export function useAutoSave({
  projectId,
  fieldName,
  initialValue,
  debounceMs = 1000,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [value, setLocalValue] = useState(initialValue)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const saveToDatabase = useCallback(
    async (valueToSave: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/projects/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
            fieldName,
            value: valueToSave,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to save data')
        }

        setIsSaved(true)
        console.log(`Auto-saved ${fieldName}: ${valueToSave}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
        console.error('Auto-save failed:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [projectId, fieldName]
  )

  const setValue = useCallback((newValue: string) => {
    setLocalValue(newValue)
    setIsSaved(false)
  }, [])

  // Auto-save effect with debounce
  useEffect(() => {
    if (value === initialValue) return

    const timeoutId = setTimeout(() => {
      saveToDatabase(value)
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [value, initialValue, saveToDatabase, debounceMs])

  return {
    value,
    setValue,
    isLoading,
    isSaved,
    error,
  }
}

// Hook untuk mengelola semua field project sekaligus
interface ProjectData {
  penyediaJasa: string
  pekerjaan: string
  jenisPaket: string
  jenisPengadaan: string
  paguAnggaran: string
  nilaiKontrak: string
  nomorKontrak: string
  spmk: string
  masaKontrak: string
  tanggalKontrak: string
  akhirKontrak: string
  pembayaranTerakhir: string
}

export function useProjectAutoSave(projectId: string, initialData: ProjectData) {
  const [data, setData] = useState(initialData)
  const [savingFields, setSavingFields] = useState<Set<string>>(new Set())

  const updateField = useCallback(
    async (fieldName: keyof ProjectData, value: string) => {
      // Update local state immediately
      setData(prev => ({ ...prev, [fieldName]: value }))

      // Add to saving fields
      setSavingFields(prev => new Set(prev).add(fieldName))

      // Debounce the save operation
      setTimeout(async () => {
        try {
          const response = await fetch('/api/projects/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              projectId,
              fieldName,
              value,
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to save')
          }

          console.log(`Auto-saved ${fieldName}: ${value}`)
        } catch (error) {
          console.error('Auto-save failed:', error)
        } finally {
          // Remove from saving fields
          setSavingFields(prev => {
            const newSet = new Set(prev)
            newSet.delete(fieldName)
            return newSet
          })
        }
      }, 1000)
    },
    [projectId]
  )

  return {
    data,
    updateField,
    savingFields,
  }
}
