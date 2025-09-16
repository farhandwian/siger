import { useQuery } from '@tanstack/react-query'

interface WeeklyReportActivity {
  id: string
  no: number
  uraian: string
  sat: string
  volume: number
  bobot: number
  realisasiMinggulalu_volume?: number | null
  realisasiMinggulalu_bobot?: number | null
  targetMingguIni?: number | null
  realisasiMingguIni?: number | null
  status?: string | null
  kumulatifMingguIni_volume?: number | null
  kumulatifMingguIni_bobot?: number | null
  persentaseItemPekerjaan?: number | null
  persentaseGrafikProgress?: number | null
  persentaseRencanaKumulatif?: number | null
  statusKumulatif?: string | null
  persentaseSeluruhPekerjaan?: number | null
  parentActivityId?: string | null
  displayOrder: number
  subActivities?: WeeklyReportActivity[]
}

interface WeeklyReport {
  id: string
  projectId: string
  weekNumber: number
  startDate: string
  endDate: string
  status: string
  satker?: string | null
  kegiatan?: string | null
  proyekPekerjaan?: string | null
  createdAt: string
  updatedAt: string
  activities: WeeklyReportActivity[]
  project: {
    id: string
    pekerjaan: string
  }
}

interface WeeklyReportResponse {
  success: boolean
  data: WeeklyReport
}

/**
 * Hook to fetch weekly report data
 */
export function useWeeklyReport(id: string | null) {
  return useQuery({
    queryKey: ['weekly-report', id],
    queryFn: async (): Promise<WeeklyReport> => {
      if (!id) throw new Error('Report ID is required')

      const response = await fetch(`/api/weekly-reports/${id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch weekly report')
      }

      const result: WeeklyReportResponse = await response.json()
      
      if (!result.success) {
        throw new Error(result.data as unknown as string || 'Failed to fetch weekly report')
      }

      return result.data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export type { WeeklyReport, WeeklyReportActivity }