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
    console.log(`📄 Action Plan CSV delimiter detected: "${delimiter}"`)

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
    return monthMap[monthName.toUpperCase()] || 1
  }

  const parseDateRange = (dateRange: string): { startDay: number; endDay: number } => {
    const match = dateRange.match(/(\d{1,2})\s*-\s*(\d{1,2})/)
    if (match) {
      return {
        startDay: parseInt(match[1]),
        endDay: parseInt(match[2]),
      }
    }
    return { startDay: 1, endDay: 7 }
  }

  // Build week-based period mapping from SPMK date
  const buildWeekBasedMapping = (
    spmkDate: string | null,
    totalWeeks: number = 20
  ): Array<{ month: number; year: number; week: number }> => {
    if (!spmkDate) {
      console.log('⚠️ No SPMK date available, using fallback mapping')
      // Fallback mapping starting from last week of May 2025 (May 26, 2025)
      const fallbackStart = new Date('2025-05-26')
      return generateWeekMapping(fallbackStart, totalWeeks)
    }

    try {
      let startDate: Date

      // Handle Indonesian date format like "22 Mei 2025"
      const indonesianMonths: { [key: string]: string } = {
        januari: '01',
        februari: '02',
        maret: '03',
        april: '04',
        mei: '05',
        juni: '06',
        juli: '07',
        agustus: '08',
        september: '09',
        oktober: '10',
        november: '11',
        desember: '12',
      }

      // Check if it's Indonesian format (contains month names)
      const indonesianPattern = /(\d{1,2})\s+(\w+)\s+(\d{4})/i
      const indonesianMatch = spmkDate.match(indonesianPattern)

      if (indonesianMatch) {
        const [, day, monthName, year] = indonesianMatch
        const monthNum = indonesianMonths[monthName.toLowerCase()]
        if (monthNum) {
          const formattedDate = `${year}-${monthNum}-${day.padStart(2, '0')}`
          startDate = new Date(formattedDate)
          console.log('📅 Parsed Indonesian SPMK date:', spmkDate, '->', formattedDate)
        } else {
          throw new Error('Unknown Indonesian month name')
        }
      }
      // Handle standard formats
      else if (spmkDate.includes('-')) {
        // Check if it's YYYY-MM-DD or DD-MM-YYYY
        const parts = spmkDate.split('-')
        if (parts[0].length === 4) {
          // YYYY-MM-DD format
          startDate = new Date(spmkDate)
        } else {
          // DD-MM-YYYY format
          startDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
        }
      } else if (spmkDate.includes('/')) {
        // DD/MM/YYYY format
        const parts = spmkDate.split('/')
        startDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
      } else {
        throw new Error('Unsupported date format')
      }

      if (isNaN(startDate.getTime())) {
        throw new Error('Invalid date')
      }

      console.log('📅 Using SPMK date as start:', startDate.toISOString())
      return generateWeekMapping(startDate, totalWeeks)
    } catch (error) {
      console.error('❌ Error parsing SPMK date:', spmkDate, error)
      // Fallback to May 26, 2025 - should align with CSV Period 1 in last week of May
      const fallbackStart = new Date('2025-05-26')
      return generateWeekMapping(fallbackStart, totalWeeks)
    }
  }

  // Generate week mapping from start date
  const generateWeekMapping = (
    startDate: Date,
    totalWeeks: number
  ): Array<{ month: number; year: number; week: number }> => {
    const periods: Array<{ month: number; year: number; week: number }> = []

    console.log('📅 Generating Action Plan week mapping starting from:', startDate.toISOString())

    for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex++) {
      // Calculate the actual date for this week (7 days per week)
      const weekDate = new Date(startDate)
      weekDate.setDate(startDate.getDate() + weekIndex * 7)

      // Find the Monday and Thursday of the week containing this date
      const monday = getMonday(weekDate)
      const thursday = new Date(monday)
      thursday.setDate(monday.getDate() + 3)

      // Use Thursday's month and year (Thursday ownership rule)
      const month = thursday.getMonth() + 1
      const year = thursday.getFullYear()

      // Calculate week number within that month
      // Find all Mondays in the month that have Thursday in the same month
      let week = 1
      const firstDayOfMonth = new Date(year, month - 1, 1)
      let currentMonday = getMonday(firstDayOfMonth)

      while (currentMonday <= thursday) {
        const currentThursday = new Date(currentMonday)
        currentThursday.setDate(currentMonday.getDate() + 3)

        // If this Thursday belongs to our target month
        if (currentThursday.getMonth() === month - 1 && currentThursday.getFullYear() === year) {
          if (currentMonday.getTime() === monday.getTime()) {
            break // Found our week number
          }
          week++
        }

        currentMonday.setDate(currentMonday.getDate() + 7)
      }

      periods.push({ month, year, week })

      console.log(
        `📅 Action Plan Week ${weekIndex + 1}: ${weekDate.toISOString().slice(0, 10)} -> ${year}-${month.toString().padStart(2, '0')}-W${week} (Monday: ${monday.toISOString().slice(0, 10)}, Thursday: ${thursday.toISOString().slice(0, 10)})`
      )
    }

    return periods
  }

  // Helper function to get the Monday of the week containing the given date
  const getMonday = (date: Date): Date => {
    const day = date.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysFromMonday = day === 0 ? 6 : day - 1 // Convert Sunday (0) to 6
    const monday = new Date(date)
    monday.setDate(date.getDate() - daysFromMonday)
    return monday
  }

  // Helper function to get month name
  const getMonthName = (month: number): string => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]
    return months[month - 1] || 'Unknown'
  }

  const buildPeriodMapping = (
    rows: string[][],
    spmkDate: string | null
  ): Array<{ month: number; year: number; week: number }> => {
    console.log('📅 Building Action Plan week-based period mapping from SPMK date:', spmkDate)

    // Count total data columns to determine how many weeks we need
    const maxColumns = Math.max(...rows.map(row => row.length))
    const dataColumnStart = 7 // Schedule data starts from column 7
    const totalWeeks = Math.max(maxColumns - dataColumnStart, 20) // At least 20 weeks

    console.log(
      `📅 Detected ${maxColumns} total columns, building ${totalWeeks} weeks from column ${dataColumnStart}`
    )

    // Use SPMK date-based week mapping
    return buildWeekBasedMapping(spmkDate, totalWeeks)
  }

  const mapPeriodToDate = (
    periodIndex: number,
    periodMapping: Array<{ month: number; year: number; week: number }>
  ): { month: number; year: number; week: number } => {
    return periodMapping[periodIndex] || { month: 1, year: 2025, week: 1 }
  }

  const parseScheduleData = (rows: string[][], headerSkip: number): ParsedActionPlan[] => {
    // Skip header rows
    const dataRows = rows.slice(headerSkip)

    // Build dynamic period mapping from SPMK date
    const periodMapping = buildPeriodMapping(rows, spmkDate)

    const activities: ParsedActionPlan[] = []
    const processedActivities = new Set<string>()
    const processedSubActivities = new Set<string>()

    let i = 0
    let currentActivity = ''

    while (i < dataRows.length) {
      const row = dataRows[i]
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
            const dateInfo = mapPeriodToDate(colIndex - 7, periodMapping)

            if (value > 0 || colIndex < 25) {
              // Include even 0 values for valid periods
              planScheduleData.push({
                period: `${dateInfo.year}-${dateInfo.month.toString().padStart(2, '0')}-W${dateInfo.week}`,
                month: dateInfo.month,
                year: dateInfo.year,
                week: dateInfo.week,
                planPercentage: value,
                actualPercentage: 0,
              })
            }
          }

          // Check next row for actual values
          let actualScheduleData = planScheduleData.map(item => ({ ...item, actualPercentage: 0 }))
          if (i + 1 < dataRows.length) {
            const nextRow = dataRows[i + 1]
            if (nextRow && !nextRow[0]?.trim() && !nextRow[1]?.trim()) {
              // This is the actual values row
              for (
                let colIndex = 7;
                colIndex < nextRow.length && colIndex - 7 < actualScheduleData.length;
                colIndex++
              ) {
                const actualValue = parseFloat(nextRow[colIndex]?.replace(',', '.') || '0')
                if (actualScheduleData[colIndex - 7]) {
                  actualScheduleData[colIndex - 7].actualPercentage = actualValue
                }
              }
              i++ // Skip the actual values row
            }
          }

          // Deduplicate schedule data within the same sub-activity
          const uniqueScheduleData = actualScheduleData.filter(
            (item, index, self) =>
              index ===
              self.findIndex(
                t => t.period === item.period && t.month === item.month && t.week === item.week
              )
          )

          const subActivity: ParsedActionPlan = {
            name: secondCol,
            type: 'subActivity',
            parentActivity: currentActivity,
            satuan,
            volumeKontrak,
            bobotMC0,
            volumeMC0,
            scheduleData: uniqueScheduleData,
          }

          activities.push(subActivity)
          processedSubActivities.add(subActivityKey)
        }
      }

      i++
    }

    return activities
  }

  const parseActionPlanCSV = async (csvText: string): Promise<ParsedActionPlan[]> => {
    try {
      const rows = parseCSV(csvText)

      if (rows.length < 4) {
        throw new Error('CSV file must have at least 4 rows (3 headers + data)')
      }

      // Check if SPMK date is available
      if (!spmkDate) {
        throw new Error('SPMK date not found. Please ensure the project has a valid SPMK date.')
      }

      // Skip first 3 header rows and parse the data
      const parsedData = parseScheduleData(rows, 3)

      // Console log the results for debugging
      console.log('=== ACTION PLAN CSV IMPORT RESULTS ===')
      console.log('Project ID:', projectId)
      console.log('Total Activities:', parsedData.filter(item => item.type === 'activity').length)
      console.log(
        'Total Sub-Activities:',
        parsedData.filter(item => item.type === 'subActivity').length
      )

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
              console.log(
                `     ${schedule.period}: Plan=${schedule.planPercentage}%, Actual=${schedule.actualPercentage}%`
              )
            }
          })
        }
      })

      return parsedData
    } catch (error) {
      console.error('❌ Error parsing action plan CSV:', error)
      throw error
    }
  }

  const handleProcessFile = async () => {
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
            {/* SPMK Date Info */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="font-medium text-blue-800">Template:</div>
                <div className="text-sm text-blue-700">
                  <a
                    href="https://s3.keenos.id/public/action_plan_template.csv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    aria-label="Pratinjau template CSV"
                  >
                    Pratinjau
                  </a>
                  <span className="mx-2 text-gray-400">|</span>
                  <a
                    href="https://s3.keenos.id/public/action_plan_template.csv"
                    download
                    className="underline"
                    aria-label="Unduh template CSV"
                  >
                    Unduh CSV
                  </a>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                <Calendar className="h-4 w-4" />
                <span>Project SPMK Date: {spmkDate || 'Not set'}</span>
              </div>
            </div>

            {/* Step 1: File Selection */}
            {!parseResult && !importResult && (
              <div className="space-y-4">
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
                        {item.name} ({item.scheduleData.length} schedule entries)
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
