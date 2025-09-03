'use client'

import { useState, useEffect } from 'react'

interface ProjectDetail {
  id: string
  // Informasi Umum Proyek
  penyediaJasa: string | null
  pekerjaan: string | null
  jenisPaket: string | null
  jenisPengadaan: string | null

  // Informasi Kontrak & Anggaran
  paguAnggaran: string | null
  nilaiKontrak: string | null
  nomorKontrak: string | null
  spmk: string | null
  masaKontrak: string | null
  tanggalKontrak: string | null
  akhirKontrak: string | null
  pembayaranTerakhir: string | null

  // Progress data
  fisikProgress: number | null
  fisikDeviasi: number | null
  fisikTarget: number | null

  saluranProgress: number | null
  saluranDeviasi: number | null
  saluranTarget: number | null

  bangunanProgress: number | null
  bangunanDeviasi: number | null
  bangunanTarget: number | null

  keuanganProgress: number | null
  keuanganDeviasi: number | null
  keuanganTarget: number | null

  // Realisasi data
  outputData: any
  tenagaKerjaData: any
  alatData: any
  materialData: any

  // Metadata
  createdAt: string
  updatedAt: string
}

interface ProjectDetailResponse {
  success: boolean
  data: ProjectDetail
}

export function useProjectDetail(id: string) {
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    const fetchProject = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/projects/${id}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Project not found')
          }
          throw new Error('Failed to fetch project')
        }

        const result: ProjectDetailResponse = await response.json()

        if (result.success) {
          setProject(result.data)
        } else {
          throw new Error('Failed to fetch project')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [id])

  return {
    project,
    loading,
    error,
    refetch: () => {
      if (id) {
        setLoading(true)
        // Re-trigger useEffect by updating a dependency
      }
    },
  }
}
