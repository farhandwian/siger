import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ActivityProposal,
  CreateActivityProposal,
  UpdateActivityProposal,
  CreateLingkupUsulan,
  ActivityProposalsResponseSchema,
  ActivityProposalResponseSchema,
} from '@/lib/schemas/proposal'

// Fetch proposals
export function useProposals(params?: {
  page?: number
  limit?: number
  search?: string
  status?: string
  tahun?: string
}) {
  return useQuery({
    queryKey: ['proposals', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.page) searchParams.set('page', params.page.toString())
      if (params?.limit) searchParams.set('limit', params.limit.toString())
      if (params?.search) searchParams.set('search', params.search)
      if (params?.status) searchParams.set('status', params.status)
      if (params?.tahun) searchParams.set('tahun', params.tahun)

      const res = await fetch(`/api/proposals?${searchParams}`, {
        cache: 'no-store',
      })
      const json = await res.json()
      return ActivityProposalsResponseSchema.parse(json)
    },
    staleTime: 30_000,
  })
}

// Fetch single proposal
export function useProposal(id: string) {
  return useQuery({
    queryKey: ['proposal', id],
    queryFn: async () => {
      const res = await fetch(`/api/proposals/${id}`, {
        cache: 'no-store',
      })
      const json = await res.json()
      return ActivityProposalResponseSchema.parse(json).data
    },
    enabled: !!id,
    staleTime: 30_000,
  })
}

// Create proposal mutation
export function useCreateProposal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateActivityProposal): Promise<ActivityProposal> => {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
    },
  })
}

// Update proposal mutation
export function useUpdateProposal(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateActivityProposal): Promise<ActivityProposal> => {
      const res = await fetch(`/api/proposals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      queryClient.invalidateQueries({ queryKey: ['proposal', id] })
    },
  })
}

// Delete proposal mutation
export function useDeleteProposal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/proposals/${id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
    },
  })
}

// Add lingkup usulan mutation
export function useAddLingkupUsulan(proposalId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateLingkupUsulan) => {
      const res = await fetch(`/api/proposals/${proposalId}/lingkup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal', proposalId] })
    },
  })
}
