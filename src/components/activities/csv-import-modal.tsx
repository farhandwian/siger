'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react'

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onSuccess?: () => void
}

interface ParsedActivity {
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

export function CSVImportModal({ isOpen, onClose, projectId, onSuccess }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [parseResult, setParseResult] = useState<ParsedActivity[] | null>(null)
  const [importResult, setImportResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const mapPeriodToDate = (periodIndex: number): { month: number, year: number, week: number } => {
    // Based on the CSV structure, periods start from column 7 (index 7)
    // MEI (23-25), MEI (26-01), JUNI (02-08), JUNI (09-15), etc.
    const periods = [
      { month: 5, year: 2025, week: 4 }, // MEI 23-25
      { month: 5, year: 2025, week: 4 }, // MEI 26-01 (spanning)
      { month: 6, year: 2025, week: 1 }, // JUNI 02-08
      { month: 6, year: 2025, week: 2 }, // JUNI 09-15
      { month: 6, year: 2025, week: 3 }, // JUNI 16-22
      { month: 6, year: 2025, week: 4 }, // JUNI 23-29
      { month: 7, year: 2025, week: 1 }, // JULY 30-06
      { month: 7, year: 2025, week: 2 }, // JULY 07-13
      { month: 7, year: 2025, week: 3 }, // JULY 14-20
      { month: 7, year: 2025, week: 4 }, // JULY 21-27
      { month: 8, year: 2025, week: 1 }, // AGUSTUS 28-03
      { month: 8, year: 2025, week: 2 }, // AGUSTUS 04-10
      { month: 8, year: 2025, week: 3 }, // AGUSTUS 11-17
      { month: 8, year: 2025, week: 4 }, // AGUSTUS 18-24
      { month: 8, year: 2025, week: 4 }, // AGUSTUS 25-31
      { month: 9, year: 2025, week: 1 }, // SEPTEMBER 01-07
      { month: 9, year: 2025, week: 2 }, // SEPTEMBER 08-14
      { month: 9, year: 2025, week: 3 }, // SEPTEMBER 15-19
    ]
    
    return periods[periodIndex] || { month: 1, year: 2025, week: 1 }
  }

  const parseScheduleData = (rows: string[][], startRowIndex: number): ParsedActivity[] => {
    const activities: ParsedActivity[] = []
    let currentActivity: string | null = null
    let i = startRowIndex

    // Track processed activities and sub-activities to prevent duplicates
    const processedActivities = new Set<string>()
    const processedSubActivities = new Set<string>()

    while (i < rows.length) {
      const row = rows[i]
      if (!row || row.length < 2) {
        i++
        continue
      }

      const firstCol = row[0]?.trim()
      const secondCol = row[1]?.trim()

      // Check if this is a main activity (has Roman numeral)
      if (firstCol && /^[IVX]+$/.test(firstCol)) {
        currentActivity = secondCol
        
        // Only add if not already processed
        if (!processedActivities.has(secondCol)) {
          activities.push({
            name: secondCol,
            type: 'activity',
            scheduleData: []
          })
          processedActivities.add(secondCol)
        }
        i++
        continue
      }

      // Check if this is a sub-activity (no Roman numeral but has content in second column)
      if (!firstCol && secondCol && currentActivity) {
        const subActivityKey = `${currentActivity}::${secondCol}`
        
        // Only process if not already processed
        if (!processedSubActivities.has(subActivityKey)) {
          const satuan = row[2]?.trim()
          const volumeKontrak = parseFloat(row[3]?.replace(',', '.') || '0')
          const bobotMC0 = parseFloat(row[4]?.replace(',', '.') || '0')
          const volumeMC0 = parseFloat(row[5]?.replace(',', '.') || '0')

          // Extract plan values (current row) - schedule data starts from column 7
          const planScheduleData = []
          for (let colIndex = 7; colIndex < row.length; colIndex++) {
            const value = parseFloat(row[colIndex]?.replace(',', '.') || '0')
            const dateInfo = mapPeriodToDate(colIndex - 7)
            
            if (value > 0 || colIndex < 25) { // Include even 0 values for valid periods
              planScheduleData.push({
                period: `${dateInfo.year}-${dateInfo.month.toString().padStart(2, '0')}-W${dateInfo.week}`,
                month: dateInfo.month,
                year: dateInfo.year,
                week: dateInfo.week,
                planPercentage: value,
                actualPercentage: 0
              })
            }
          }

          // Check next row for actual values
          let actualScheduleData = planScheduleData.map(item => ({ ...item, actualPercentage: 0 }))
          if (i + 1 < rows.length) {
            const nextRow = rows[i + 1]
            if (nextRow && !nextRow[0]?.trim() && !nextRow[1]?.trim()) {
              // This is the actual values row
              for (let colIndex = 7; colIndex < nextRow.length && colIndex - 7 < actualScheduleData.length; colIndex++) {
                const actualValue = parseFloat(nextRow[colIndex]?.replace(',', '.') || '0')
                if (actualScheduleData[colIndex - 7]) {
                  actualScheduleData[colIndex - 7].actualPercentage = actualValue
                }
              }
              i++ // Skip the actual values row
            }
          }

          // Deduplicate schedule data within the same sub-activity
          const uniqueScheduleData = []
          const scheduleKeys = new Set()
          
          for (const schedule of actualScheduleData) {
            const key = `${schedule.month}-${schedule.year}-${schedule.week}`
            if (!scheduleKeys.has(key)) {
              scheduleKeys.add(key)
              uniqueScheduleData.push(schedule)
            }
          }

          activities.push({
            name: secondCol,
            type: 'subActivity',
            parentActivity: currentActivity,
            satuan,
            volumeKontrak: volumeKontrak || undefined,
            bobotMC0: bobotMC0 || undefined,
            volumeMC0: volumeMC0 || undefined,
            scheduleData: uniqueScheduleData
          })
          
          processedSubActivities.add(subActivityKey)
        }
      }

      i++
    }

    return activities
  }

  const processCSV = async () => {
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      const text = await file.text()
      const rows = parseCSV(text)

      if (rows.length < 4) {
        throw new Error('CSV file must have at least 4 rows (3 headers + data)')
      }

      // Skip first 3 header rows and parse the data
      const parsedData = parseScheduleData(rows, 3)
      setParseResult(parsedData)

      // Console log the results for now
      console.log('=== CSV IMPORT RESULTS ===')
      console.log('Project ID:', projectId)
      console.log('Total Activities:', parsedData.filter(item => item.type === 'activity').length)
      console.log('Total Sub-Activities:', parsedData.filter(item => item.type === 'subActivity').length)
      
      parsedData.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.type.toUpperCase()}: ${item.name}`)
        if (item.type === 'subActivity') {
          console.log(`   Parent: ${item.parentActivity}`)
          console.log(`   Satuan: ${item.satuan}`)
          console.log(`   Volume Kontrak: ${item.volumeKontrak}`)
          console.log(`   Bobot MC0: ${item.bobotMC0}%`)
          console.log(`   Volume MC0: ${item.volumeMC0}`)
          console.log(`   Schedule Data (${item.scheduleData.length} periods):`)
          item.scheduleData.forEach(schedule => {
            if (schedule.planPercentage > 0 || schedule.actualPercentage > 0) {
              console.log(`     ${schedule.period}: Plan=${schedule.planPercentage}%, Actual=${schedule.actualPercentage}%`)
            }
          })
        }
      })

    } catch (err) {
      console.error('CSV parsing error:', err)
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

    try {
      const response = await fetch(`/api/projects/${projectId}/schedule/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          activities: parseResult,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Import failed')
      }

      setImportResult(result)
      console.log('=== IMPORT TO DATABASE SUCCESSFUL ===')
      console.log('Result:', result)

      // Call onSuccess callback to refresh data
      if (onSuccess) {
        onSuccess()
      }

    } catch (err) {
      console.error('Import to database error:', err)
      setError(err instanceof Error ? err.message : 'Failed to import to database')
    } finally {
      setIsImporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Import Jadwal from CSV</CardTitle>
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
          {/* File Upload Section */}
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
                  <FileText className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-sm text-gray-600">
                      Select a CSV file with schedule data
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    size="sm"
                  >
                    Change File
                  </Button>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Process Button */}
            <div className="flex gap-2">
              <Button
                onClick={processCSV}
                disabled={!file || isProcessing}
                className="flex-1"
              >
                {isProcessing ? 'Processing...' : 'Parse & Preview'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  resetModal()
                  onClose()
                }}
              >
                Cancel
              </Button>
            </div>
          </div>

          {/* Results Preview */}
          {parseResult && !importResult && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-sm">Import Preview</h3>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <p>✅ Successfully parsed {parseResult.length} items</p>
                <p>📁 Activities: {parseResult.filter(item => item.type === 'activity').length}</p>
                <p>📋 Sub-Activities: {parseResult.filter(item => item.type === 'subActivity').length}</p>
                <p className="mt-2 text-xs">
                  Ready to import to database. Click the button below to proceed.
                </p>
              </div>
              
              {/* Import to Database Button */}
              <div className="flex gap-2">
                <Button
                  onClick={importToDatabase}
                  disabled={isImporting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isImporting ? 'Importing...' : 'Import to Database'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setParseResult(null)}
                  disabled={isImporting}
                >
                  Edit CSV
                </Button>
              </div>
            </div>
          )}

          {/* Import Success */}
          {importResult && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-sm text-green-700">Import Successful!</h3>
              <div className="text-sm bg-green-50 border border-green-200 p-3 rounded">
                <p className="font-medium text-green-800">✅ {importResult.message}</p>
                <div className="mt-2 space-y-1 text-green-700">
                  <div>
                    <p className="font-semibold">📁 Activities:</p>
                    <p className="ml-4 text-sm">Created: {importResult.data?.imported?.activities || 0} | Updated: {importResult.data?.updated?.activities || 0}</p>
                  </div>
                  <div>
                    <p className="font-semibold">📋 Sub-Activities:</p>
                    <p className="ml-4 text-sm">Created: {importResult.data?.imported?.subActivities || 0} | Updated: {importResult.data?.updated?.subActivities || 0}</p>
                  </div>
                  <div>
                    <p className="font-semibold">📅 Schedules:</p>
                    <p className="ml-4 text-sm">Created: {importResult.data?.imported?.schedules || 0} | Updated: {importResult.data?.updated?.schedules || 0}</p>
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
                Close
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
