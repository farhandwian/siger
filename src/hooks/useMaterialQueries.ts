import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

// Types
export interface Material {
  id: string
  projectId: string
  jenisMaterial: string
  volumeSatuan: 'm3' | 'buah'
  volumeTarget: number
  tanggalMulai?: string
  tanggalSelesai?: string
  waktuSelesai?: number
  createdAt: string
  updatedAt: string
  schedules: MaterialSchedule[]
}

export interface MaterialSchedule {
  id: string
  materialId: string
  date: string
  rencana: number
  rencanaKumulatif: number
  realisasi: number
  realisasiKumulatif: number
  tercapai: 'Y' | 'T'
  createdAt: string
  updatedAt: string
}

export interface CreateMaterialData {
  projectId: string
  jenisMaterial: string
  volumeSatuan?: 'm3' | 'buah'
  volumeTarget?: number
  tanggalMulai?: string
  tanggalSelesai?: string
  waktuSelesai?: number
}

export interface UpdateMaterialData {
  jenisMaterial?: string
  volumeSatuan?: 'm3' | 'buah'
  volumeTarget?: number
  tanggalMulai?: string
  tanggalSelesai?: string
  waktuSelesai?: number
}

export interface UpdateScheduleData {
  realisasi?: number
  realisasiKumulatif?: number
}

// Hooks
export const useMaterials = (projectId: string) => {
  return useQuery({
    queryKey: ['materials', projectId],
    queryFn: async () => {
      const response = await apiClient.get<{ materials: Material[] }>(
        `/materials?projectId=${projectId}`
      )
      return response.materials
    },
    enabled: !!projectId,
  })
}

export const useCreateMaterial = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateMaterialData) => {
      const response = await apiClient.post<{ material: Material }>('/materials', data)
      return response.material
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['materials', variables.projectId] })
    },
  })
}

export const useUpdateMaterial = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMaterialData }) => {
      const response = await apiClient.put<{ material: Material }>(`/materials?id=${id}`, data)
      return response.material
    },
    onSuccess: material => {
      queryClient.invalidateQueries({ queryKey: ['materials', material.projectId] })
    },
  })
}

export const useDeleteMaterial = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      await apiClient.delete(`/materials?id=${id}`)
      return { id, projectId }
    },
    onSuccess: variables => {
      queryClient.invalidateQueries({ queryKey: ['materials', variables.projectId] })
    },
  })
}

export const useUpdateMaterialSchedule = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateScheduleData }) => {
      const response = await apiClient.put<{ schedule: MaterialSchedule }>(
        `/materials/schedules?id=${id}`,
        data
      )
      return response.schedule
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}

export const useCreateMaterialSchedule = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      materialId: string
      date: string
      rencana?: number
      rencanaKumulatif?: number
      realisasi?: number
      realisasiKumulatif?: number
    }) => {
      const response = await apiClient.post<{ schedule: MaterialSchedule }>(
        `/materials/schedules`,
        data
      )
      return response.schedule
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}

// Auto-save hook for material fields
export const useAutoSaveMaterial = (materialId: string, fieldName: keyof UpdateMaterialData) => {
  const updateMaterial = useUpdateMaterial()

  const saveField = async (value: string | number) => {
    try {
      const data = { [fieldName]: value } as UpdateMaterialData
      await updateMaterial.mutateAsync({ id: materialId, data })
    } catch (error) {
      console.error(`Failed to save ${fieldName}:`, error)
    }
  }

  return {
    saveField,
    isLoading: updateMaterial.isPending,
    error: updateMaterial.error,
  }
}
