'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { useProject } from '@/hooks/useActivityQueries'

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onSuccess?: () => void
}

interface ScheduleData {
  weekNumber: number
  plan: number
  realization: number
  actionPlan: number
}
interface ParsedActivity {
  name: string
  type: 'activity' | 'subActivity'
  parentActivity?: string
  satuan?: string
  volume?: number
  bobot?: number
  scheduleData: ScheduleData[]
}

export function CSVImportModal({ isOpen, onClose, projectId, onSuccess }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState<{
    stage: string
    progress: number
    total: number
  } | null>(null)
  const [parseResult, setParseResult] = useState<ParsedActivity[] | null>(null)
  const [importResult, setImportResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [importMode, setImportMode] = useState<'replace' | 'upsert'>('upsert')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use the project hook to get SPMK date
  const { data: project } = useProject(projectId)
  const spmkDate = project?.tanggalSpmk || null

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      setError(null)
      setParseResult(null)
    } else {
      setError('Please select a valid CSV file')
    }
  }

  const parseCSV = (csvText: string): string[][] => {
    const lines = csvText.split('\n')

    // Auto-detect delimiter by checking the first few lines
    const detectDelimiter = (text: string): string => {
      const testLines = text.split('\n').slice(0, 3) // Check first 3 lines
      let semicolonCount = 0
      let commaCount = 0

      testLines.forEach(line => {
        // Count delimiters outside of quoted strings
        let inQuotes = false
        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (!inQuotes) {
            if (char === ';') semicolonCount++
            if (char === ',') commaCount++
          }
        }
      })

      // Return the delimiter that appears more frequently
      return semicolonCount > commaCount ? ';' : ','
    }

    const delimiter = detectDelimiter(csvText)

    // Proper CSV parsing that respects quoted fields
    const parseCSVLine = (line: string, delimiter: string): string[] => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      let i = 0

      while (i < line.length) {
        const char = line[i]
        const nextChar = line[i + 1]

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Handle escaped quotes ("") within quoted field
            current += '"'
            i += 2 // Skip both quotes
            continue
          } else {
            // Toggle quote state
            inQuotes = !inQuotes
          }
        } else if (char === delimiter && !inQuotes) {
          // Found delimiter outside quotes - end current field
          result.push(current.trim())
          current = ''
        } else {
          // Regular character - add to current field
          current += char
        }
        i++
      }

      // Add the last field
      result.push(current.trim())
      return result
    }

    return lines.map(line => parseCSVLine(line, delimiter))
  }

  const parseScheduleData = (rows: string[][], headerSkip: number): ParsedActivity[] => {
    // Skip header rows
    const dataRows = rows.slice(headerSkip)

    const activities: ParsedActivity[] = []
    const processedActivities = new Set<string>()
    const processedSubActivities = new Set<string>()

    let i = 0
    let currentActivity = ''

    while (i < dataRows.length) {
      const planRow = dataRows[i]
      const actualRow = dataRows[i + 1] // Next row for actual values

      const firstCol = planRow[0]?.trim()
      const secondCol = planRow[1]?.trim()

      // Check if this is a main activity (has Roman numeral)
      if (firstCol && /^[IVX]+$/.test(firstCol)) {
        currentActivity = secondCol

        // Only add if not already processed
        if (!processedActivities.has(secondCol)) {
          activities.push({
            name: secondCol,
            type: 'activity',
            scheduleData: [],
          })
          processedActivities.add(secondCol)
        }
        i++
        continue
      }

      // Check if this is a sub-activity (no Roman numeral but has content in second column)
      if (!firstCol && secondCol && currentActivity) {
        const subActivityKey = `${currentActivity}::${secondCol}`
        const startWeekCol = 5 // Schedule data starts from column 5

        // Only process if not already processed
        if (!processedSubActivities.has(subActivityKey)) {
          const satuan = planRow[2]?.trim()
          const volume = parseFloat(planRow[3]?.replace(',', '.') || '0')
          const bobot = parseFloat(planRow[4]?.replace(',', '.') || '0')

          // Extract plan values (current row) - schedule data starts from column 5
          const scheduleData: ScheduleData[] = []

          const rowLength = Math.max(planRow.length, actualRow ? actualRow.length : 0)

          for (let colIndex = startWeekCol; colIndex < rowLength; colIndex++) {

            let plan = 0
            let actual = 0

            if (colIndex < planRow.length) {
              plan = parseFloat(planRow[colIndex]?.replace(',', '.') || '0')
            }

            if (actualRow && colIndex < actualRow.length) {
              actual = parseFloat(actualRow[colIndex]?.replace(',', '.') || '0')
            }

            scheduleData.push({
              weekNumber: colIndex - startWeekCol + 1,
              plan,
              realization: actual,
              actionPlan: plan,
            })
          }

          const subActivity: ParsedActivity = {
            name: secondCol,
            type: 'subActivity',
            parentActivity: currentActivity,
            satuan,
            volume,
            bobot,
            scheduleData: scheduleData,
          }

          activities.push(subActivity)
          processedSubActivities.add(subActivityKey)
        }
      }

      i++
    }

    return activities
  }

  const processCSV = async () => {
    if (!file) return

    // Check if SPMK date is available
    if (!spmkDate) {
      setError('SPMK date not found. Please ensure the project has a valid SPMK date.')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const text = await file.text()
      const rows = parseCSV(text)

      if (rows.length < 2) {
        throw new Error('CSV file must have at least 2 rows (1 header + 1 data)')
      }

      // Skip header rows and parse the data
      const parsedData = parseScheduleData(rows, 1)
      setParseResult(parsedData)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetModal = () => {
    setFile(null)
    setParseResult(null)
    setImportResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const importToDatabase = async () => {
    if (!parseResult) return

    setIsImporting(true)
    setError(null)
    
    // Simulate more realistic progress tracking
    const progressSteps = [
      { stage: 'Validating data...', progress: 10 },
      { stage: 'Processing activities...', progress: 30 },
      { stage: 'Creating sub-activities...', progress: 60 },
      { stage: 'Importing schedules...', progress: 85 },
      { stage: 'Finalizing import...', progress: 95 },
    ]

    let currentStepIndex = 0
    setImportProgress({ stage: 'Preparing data...', progress: 0, total: 100 })

    // Simulate progress updates during import
    const progressInterval = setInterval(() => {
      if (currentStepIndex < progressSteps.length) {
        const step = progressSteps[currentStepIndex]
        setImportProgress({ stage: step.stage, progress: step.progress, total: 100 })
        currentStepIndex++
      }
    }, 800) // Update every 800ms

    try {
      const response = await fetch(`/api/projects/${projectId}/schedule/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          activities: parseResult,
          importMode,
        }),
      })

      clearInterval(progressInterval)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Import failed')
      }

      setImportProgress({ stage: 'Import completed!', progress: 100, total: 100 })
      setImportResult(result)

      // Call onSuccess callback to refresh data
      if (onSuccess) {
        onSuccess()
      }

      // Clear progress after 2 seconds
      setTimeout(() => {
        setImportProgress(null)
      }, 2000)

    } catch (err) {
      clearInterval(progressInterval)
      setError(err instanceof Error ? err.message : 'Failed to import to database')
    } finally {
      setIsImporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="overflow  w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Impor Jadwal dari CSV</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              resetModal()
              onClose()
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 overflow-y-auto">
          {/* SPMK Date Info */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="font-medium text-blue-800">Template:</div>
              <div className="text-sm text-blue-700">
                <a
                  href="https://s3.keenos.id/public/jadwal_csv_fix.csv"
                  download
                  className="underline"
                  aria-label="Unduh template CSV"
                >
                  Unduh CSV
                </a>
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="Select CSV file for schedule import"
              />

              {!file ? (
                <div className="space-y-2">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Pilih file CSV yang berisi data jadwal</p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Pilih File
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} size="sm">
                    Ganti File
                  </Button>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Process Button */}
            <div className="flex gap-2">
              <Button onClick={processCSV} disabled={!file || isProcessing} className="flex-1">
                {isProcessing ? 'Memproses...' : 'Parse & Pratinjau'}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  resetModal()
                  onClose()
                }}
              >
                Batal
              </Button>
            </div>
          </div>

          {/* Results Preview */}
          {parseResult && !importResult && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-medium">Pratinjau Impor</h3>
              <div className="rounded bg-gray-50 p-3 text-sm text-gray-600">
                <p>✅ Berhasil mem-parse {parseResult.length} item</p>
                <p>📁 Pekerjaan: {parseResult.filter(item => item.type === 'activity').length}</p>
                <p>📋 Kegiatan: {parseResult.filter(item => item.type === 'subActivity').length}</p>
                <p className="mt-2 text-xs">
                  Siap untuk diimpor ke database. Klik tombol di bawah untuk melanjutkan.
                </p>
              </div>

              {/* Import Mode Selection */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Mode Impor</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="importMode"
                      value="upsert"
                      checked={importMode === 'upsert'}
                      onChange={e => setImportMode(e.target.value as 'upsert' | 'replace')}
                      className="text-blue-600"
                    />
                    <div>
                      <div className="text-sm font-medium">Upsert (Gabungkan)</div>
                      <div className="text-xs text-gray-500">
                        Perbarui data yang ada dan buat yang baru. Menjaga data yang sudah ada.
                      </div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={e => setImportMode(e.target.value as 'upsert' | 'replace')}
                      className="text-blue-600"
                    />
                    <div>
                      <div className="text-sm font-medium">Ganti Semua</div>
                      <div className="text-xs text-gray-500">
                        Hapus semua data yang ada dan ganti dengan data dari CSV. ⚠️ Tidak dapat
                        dikembalikan!
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Import to Database Button */}
              <div className="flex gap-2">
                <Button
                  onClick={importToDatabase}
                  disabled={isImporting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isImporting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      {importProgress?.stage || 'Mengimpor...'}
                    </div>
                  ) : (
                    'Impor ke Database'
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setParseResult(null)}
                  disabled={isImporting}
                >
                  Edit CSV
                </Button>
              </div>

              {/* Progress Display */}
              {importProgress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{importProgress.stage}</span>
                    <span>{Math.round((importProgress.progress / importProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.round((importProgress.progress / importProgress.total) * 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import Success */}
          {importResult && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-medium text-green-700">Impor Berhasil!</h3>
              <div className="rounded border border-green-200 bg-green-50 p-3 text-sm">
                <p className="font-medium text-green-800">✅ {importResult.message}</p>
                <div className="mt-2 space-y-1 text-green-700">
                  <div>
                    <p className="font-semibold">📁 Pekerjaan:</p>
                    <p className="ml-4 text-sm">
                      Ditambahkan: {importResult.data?.imported?.activities || 0} | Diubah:{' '}
                      {importResult.data?.updated?.activities || 0}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">📋 Kegiatan:</p>
                    <p className="ml-4 text-sm">
                      Ditambahkan: {importResult.data?.imported?.subActivities || 0} | Diubah:{' '}
                      {importResult.data?.updated?.subActivities || 0}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">📅 Rencana:</p>
                    <p className="ml-4 text-sm">
                      Ditambahkan: {importResult.data?.imported?.schedules || 0} | Diubah:{' '}
                      {importResult.data?.updated?.schedules || 0}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">📊 Realisasi:</p>
                    <p className="ml-4 text-sm">
                      Ditambahkan: {importResult.data?.imported?.realizations || 0}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => {
                  resetModal()
                  onClose()
                }}
                className="w-full"
              >
                Tutup
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
