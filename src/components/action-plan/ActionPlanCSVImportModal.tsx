'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, X, FileText, AlertCircle, CheckCircle, Calendar } from 'lucide-react'
import { useProject } from '@/hooks/useActivityQueries'
import { useBulkCreateActionPlanSchedules } from '@/hooks/useActionPlanSchedules'

interface ActionPlanCSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onSuccess?: () => void
}

interface ParsedActionPlan {
  name: string
  type: 'activity' | 'subActivity'
  parentActivity?: string
  satuan?: string
  volumeKontrak?: number
  bobotMC0?: number
  volumeMC0?: number
  scheduleData: Array<{
    period: string
    month: number
    year: number
    week: number
    planPercentage: number
    actualPercentage: number
  }>
}

export function ActionPlanCSVImportModal({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}: ActionPlanCSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [parseResult, setParseResult] = useState<ParsedActionPlan[] | null>(null)
  const [importResult, setImportResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [importMode, setImportMode] = useState<'replace' | 'upsert'>('upsert')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use the project hook to get SPMK date
  const { data: project } = useProject(projectId)
  const spmkDate = project?.tanggalSpmk || null
  const bulkCreateMutation = useBulkCreateActionPlanSchedules()

  useEffect(() => {
    if (project?.tanggalSpmk) {
      console.log('📅 SPMK date from hook:', project.tanggalSpmk)
    }
  }, [project?.tanggalSpmk])

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
    return lines.map(line => {
      // Split by semicolon and clean up quotes
      return line.split(';').map(cell => cell.trim().replace(/"/g, ''))
    })
  }

  const parseMonthName = (monthName: string): number => {
    const monthMap: { [key: string]: number } = {
      JANUARI: 1,
      JAN: 1,
      FEBRUARI: 2,
      FEB: 2,
      MARET: 3,
      MAR: 3,
      APRIL: 4,
      APR: 4,
      MEI: 5,
      MAY: 5,
      JUNI: 6,
      JUN: 6,
      JULY: 7,
      JUL: 7,
      JULI: 7,
      AGUSTUS: 8,
      AGU: 8,
      AUG: 8,
      SEPTEMBER: 9,
      SEP: 9,
      SEPT: 9,
      OKTOBER: 10,
      OKT: 10,
      OCT: 10,
      NOVEMBER: 11,
      NOV: 11,
      DESEMBER: 12,
      DES: 12,
      DEC: 12,
    }

    const normalized = monthName.toUpperCase().trim()
    return monthMap[normalized] || 0
  }

  const parseActionPlanCSV = async (csvText: string): Promise<ParsedActionPlan[]> => {
    try {
      const rows = parseCSV(csvText)

      if (rows.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row')
      }

      // Find header indices (case-insensitive)
      const headers = rows[0].map(h => h.toLowerCase().trim())
      const nameIndex = headers.findIndex(
        h => h.includes('nama') || h.includes('name') || h.includes('kegiatan')
      )

      if (nameIndex === -1) {
        throw new Error('Could not find activity name column in CSV')
      }

      const parsedData: ParsedActionPlan[] = []
      let currentActivity: ParsedActionPlan | null = null

      // Process data rows
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]

        // Skip empty rows
        if (row.length === 0 || row.every(cell => !cell.trim())) {
          continue
        }

        const activityName = row[nameIndex]?.trim()

        if (!activityName) {
          continue
        }

        // Check if this is a main activity (not indented) or sub-activity (indented)
        const isSubActivity = activityName.startsWith(' ') || activityName.startsWith('\t')
        const cleanName = activityName.replace(/^\s+/, '')

        const actionPlan: ParsedActionPlan = {
          name: cleanName,
          type: isSubActivity ? 'subActivity' : 'activity',
          parentActivity: isSubActivity ? currentActivity?.name : undefined,
          scheduleData: [],
        }

        // Parse schedule data from remaining columns
        for (let j = nameIndex + 1; j < row.length && j < headers.length; j++) {
          const header = headers[j]
          const cellValue = row[j]?.trim()

          if (!cellValue || cellValue === '-' || cellValue === '') {
            continue
          }

          // Try to parse as percentage
          const numericValue = parseFloat(cellValue.replace('%', '').replace(',', '.'))

          if (!isNaN(numericValue)) {
            // Extract month and week info from header
            // This is simplified - you might need to adjust based on your CSV format
            const periodMatch = header.match(/period\s*(\d+)/i) || header.match(/minggu\s*(\d+)/i)
            if (periodMatch) {
              const weekNumber = parseInt(periodMatch[1])
              const currentDate = new Date()

              actionPlan.scheduleData.push({
                period: `Period ${weekNumber}`,
                month: currentDate.getMonth() + 1,
                year: currentDate.getFullYear(),
                week: weekNumber,
                planPercentage: numericValue,
                actualPercentage: 0, // Default to 0 for action plans
              })
            }
          }
        }

        parsedData.push(actionPlan)

        if (!isSubActivity) {
          currentActivity = actionPlan
        }
      }

      console.log('📊 Parsed action plan data:', parsedData)
      return parsedData
    } catch (error) {
      console.error('❌ Error parsing action plan CSV:', error)
      throw error
    }
  }

  const handleProcessFile = async () => {
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      const text = await file.text()
      const parsedData = await parseActionPlanCSV(text)
      setParseResult(parsedData)
    } catch (error: any) {
      setError(error.message || 'Failed to process CSV file')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImport = async () => {
    if (!parseResult) return

    setIsImporting(true)
    setError(null)

    try {
      // Convert parsed data to action plan schedules
      const actionPlanSchedules = parseResult.flatMap(item =>
        item.scheduleData.map(schedule => ({
          activityId: item.type === 'activity' ? 'temp-activity-id' : null, // You'll need to map this properly
          subActivityId: item.type === 'subActivity' ? 'temp-subactivity-id' : null, // You'll need to map this properly
          month: schedule.month,
          year: schedule.year,
          week: schedule.week,
          planPercentage: schedule.planPercentage,
          actualPercentage: schedule.actualPercentage,
        }))
      )

      const result = await bulkCreateMutation.mutateAsync(actionPlanSchedules)

      setImportResult(result)

      if (result.successful.length > 0) {
        onSuccess?.()
      }
    } catch (error: any) {
      setError(error.message || 'Failed to import action plan data')
    } finally {
      setIsImporting(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setParseResult(null)
    setImportResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="m-4 max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg bg-white shadow-xl">
        <Card className="border-0 shadow-none">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Import Action Plan dari CSV</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            {/* Step 1: File Selection */}
            {!parseResult && !importResult && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Project SPMK Date: {spmkDate || 'Not set'}</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Download Template CSV (Optional)
                    </label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href="https://s3.keenos.id/public/action_plan_template.csv"
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Download Template
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Upload Action Plan CSV File
                    </label>
                    <div
                      className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-gray-400"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-600">Click to select CSV file</p>
                      <p className="mt-1 text-xs text-gray-500">
                        File harus berformat CSV dengan data action plan
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                      aria-label="Select CSV file for action plan import"
                    />
                  </div>

                  {file && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">{file.name}</span>
                        <span className="text-xs text-blue-700">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-800">{error}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleProcessFile}
                      disabled={!file || isProcessing}
                      className="bg-[#ffc928] text-[#364878] hover:bg-[#ffc928]/90"
                    >
                      {isProcessing ? 'Processing...' : 'Process File'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Preview and Import */}
            {parseResult && !importResult && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">File processed successfully!</span>
                </div>

                <div className="rounded-lg border bg-gray-50 p-4">
                  <h4 className="mb-2 font-medium">Preview:</h4>
                  <p className="text-sm text-gray-600">
                    Found {parseResult.length} activities/sub-activities
                  </p>
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    {parseResult.slice(0, 5).map((item, index) => (
                      <div key={index} className="py-1 text-xs text-gray-700">
                        • {item.type === 'subActivity' ? '  ' : ''}
                        {item.name}({item.scheduleData.length} schedule entries)
                      </div>
                    ))}
                    {parseResult.length > 5 && (
                      <div className="text-xs text-gray-500">
                        ... and {parseResult.length - 5} more
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleReset}>
                    Back
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={isImporting}
                    className="bg-[#ffc928] text-[#364878] hover:bg-[#ffc928]/90"
                  >
                    {isImporting ? 'Importing...' : 'Import Action Plan'}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Import Results */}
            {importResult && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Import completed!</span>
                </div>

                <div className="rounded-lg border bg-gray-50 p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-green-600">Successful:</span>
                      <span className="ml-2">{importResult.successful?.length || 0}</span>
                    </div>
                    <div>
                      <span className="font-medium text-red-600">Failed:</span>
                      <span className="ml-2">{importResult.failed?.length || 0}</span>
                    </div>
                  </div>

                  {importResult.failed?.length > 0 && (
                    <div className="mt-4 max-h-32 overflow-y-auto">
                      <h5 className="mb-2 font-medium text-red-600">Failed entries:</h5>
                      {importResult.failed.map((failure: any, index: number) => (
                        <div key={index} className="py-1 text-xs text-red-700">
                          • {failure.error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleClose}
                    className="bg-[#ffc928] text-[#364878] hover:bg-[#ffc928]/90"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
