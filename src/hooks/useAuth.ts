'use client'

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'
import { UserRole } from '@/lib/auth'

/**
 * Authentication Hook
 * Provides user session data and role-based permissions
 * Use this hook in components that need to check user authentication and permissions
 */

export interface UserPermissions {
  // Project permissions
  canViewProjects: boolean
  canCreateProjects: boolean
  canEditProjects: boolean
  canDeleteProjects: boolean
  
  // Activity permissions
  canViewActivities: boolean
  canCreateActivities: boolean
  canEditActivities: boolean
  canDeleteActivities: boolean
  
  // Monitoring permissions
  canViewMonitoring: boolean
  canEditMonitoring: boolean
  
  // Proposal permissions
  canViewProposals: boolean
  canCreateProposals: boolean
  canEditProposals: boolean
  canDeleteProposals: boolean
  canApproveProposals: boolean
  
  // User management permissions
  canViewUsers: boolean
  canCreateUsers: boolean
  canEditUsers: boolean
  canDeleteUsers: boolean
  
  // Reports permissions
  canViewReports: boolean
  canExportReports: boolean
  
  // Role checks
  isAdmin: boolean
  isManager: boolean
  isUser: boolean
  isViewer: boolean
}

export function useAuth() {
  const { data: session, status } = useSession()

  const permissions = useMemo((): UserPermissions => {
    if (!session?.user?.role) {
      // No permissions for unauthenticated users
      return {
        canViewProjects: false,
        canCreateProjects: false,
        canEditProjects: false,
        canDeleteProjects: false,
        canViewActivities: false,
        canCreateActivities: false,
        canEditActivities: false,
        canDeleteActivities: false,
        canViewMonitoring: false,
        canEditMonitoring: false,
        canViewProposals: false,
        canCreateProposals: false,
        canEditProposals: false,
        canDeleteProposals: false,
        canApproveProposals: false,
        canViewUsers: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canViewReports: false,
        canExportReports: false,
        isAdmin: false,
        isManager: false,
        isUser: false,
        isViewer: false,
      }
    }

    const role = session.user.role as UserRole

    return {
      // Project permissions
      canViewProjects: ['ADMIN', 'MANAGER', 'USER', 'VIEWER'].includes(role),
      canCreateProjects: ['ADMIN', 'MANAGER'].includes(role),
      canEditProjects: ['ADMIN', 'MANAGER'].includes(role),
      canDeleteProjects: ['ADMIN'].includes(role),
      
      // Activity permissions
      canViewActivities: ['ADMIN', 'MANAGER', 'USER', 'VIEWER'].includes(role),
      canCreateActivities: ['ADMIN', 'MANAGER', 'USER'].includes(role),
      canEditActivities: ['ADMIN', 'MANAGER', 'USER'].includes(role),
      canDeleteActivities: ['ADMIN', 'MANAGER'].includes(role),
      
      // Monitoring permissions
      canViewMonitoring: ['ADMIN', 'MANAGER', 'USER', 'VIEWER'].includes(role),
      canEditMonitoring: ['ADMIN', 'MANAGER'].includes(role),
      
      // Proposal permissions
      canViewProposals: ['ADMIN', 'MANAGER', 'USER', 'VIEWER'].includes(role),
      canCreateProposals: ['ADMIN', 'MANAGER', 'USER'].includes(role),
      canEditProposals: ['ADMIN', 'MANAGER', 'USER'].includes(role),
      canDeleteProposals: ['ADMIN', 'MANAGER'].includes(role),
      canApproveProposals: ['ADMIN', 'MANAGER'].includes(role),
      
      // User management permissions
      canViewUsers: ['ADMIN'].includes(role),
      canCreateUsers: ['ADMIN'].includes(role),
      canEditUsers: ['ADMIN'].includes(role),
      canDeleteUsers: ['ADMIN'].includes(role),
      
      // Reports permissions
      canViewReports: ['ADMIN', 'MANAGER', 'USER'].includes(role),
      canExportReports: ['ADMIN', 'MANAGER'].includes(role),
      
      // Role checks
      isAdmin: role === 'ADMIN',
      isManager: role === 'MANAGER',
      isUser: role === 'USER',
      isViewer: role === 'VIEWER',
    }
  }, [session?.user?.role])

  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: !!session,
    permissions,
    role: session?.user?.role as UserRole | undefined,
  }
}

/**
 * Role Guard Hook
 * Returns true if user has any of the specified roles
 */
export function useHasRole(allowedRoles: UserRole[]): boolean {
  const { user } = useAuth()
  
  if (!user?.role) return false
  
  return allowedRoles.includes(user.role as UserRole)
}

/**
 * Permission Guard Hook
 * Returns true if user has the specified permission
 */
export function useHasPermission(permission: keyof UserPermissions): boolean {
  const { permissions } = useAuth()
  
  return permissions[permission]
}
