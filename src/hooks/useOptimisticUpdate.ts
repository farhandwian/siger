// Generic Optimistic Updates Pattern for React Query
// Use this pattern for any mutation that updates existing data

import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useOptimisticUpdate<TData, TVariables, TCacheData = TData>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  queryKey: readonly string[],
  updateCacheFn: (oldData: TCacheData | undefined, variables: TVariables) => TCacheData | undefined
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    
    // Optimistic update
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData<TCacheData>(queryKey)
      
      // Optimistically update cache
      queryClient.setQueryData<TCacheData>(queryKey, (oldData) => 
        updateCacheFn(oldData, variables)
      )
      
      return { previousData }
    },
    
    // Rollback on error
    onError: (error, variables, context) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
    },
    
    // Optional: sync with server periodically
    onSettled: () => {
      // Uncomment if you need periodic server sync
      // queryClient.invalidateQueries({ queryKey })
    },
  })
}

// Example usage for project name updates
interface Project {
  id: string
  name: string
  updatedAt: Date
}

export function useUpdateProjectName() {
  return useOptimisticUpdate<
    Project, 
    { projectId: string; name: string }, 
    Project[]
  >(
    // API call
    async ({ projectId, name }) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      return response.json()
    },
    
    // Query key to update
    ['projects'] as const,
    
    // How to update cache
    (oldProjects, { projectId, name }) =>
      oldProjects?.map((project) => 
        project.id === projectId 
          ? { ...project, name, updatedAt: new Date() }
          : project
      )
  )
}

/*
Usage in component:

function ProjectNameEditor({ projectId, currentName }: { 
  projectId: string; 
  currentName: string; 
}) {
  const updateName = useUpdateProjectName()
  
  const handleSave = (newName: string) => {
    updateName.mutate({ projectId, name: newName })
    // UI updates immediately! No loading state needed.
  }
  
  return (
    <input 
      defaultValue={currentName}
      onBlur={(e) => handleSave(e.target.value)}
      disabled={updateName.isPending}
    />
  )
}
*/
