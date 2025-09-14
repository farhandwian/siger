'use client'

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'
import { UserRole } from '@prisma/client'

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
      return {
        // Project permissions
        canViewProjects: false,
        canCreateProjects: false,
        canEditProjects: false,
        canDeleteProjects: false,
        
        // Activity permissions
        canViewActivities: false,
        canCreateActivities: false,
        canEditActivities: false,
        canDeleteActivities: false,
        
        // Monitoring permissions
        canViewMonitoring: false,
        canEditMonitoring: false,
        
        // User management permissions
        canViewUsers: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        
        // Reports permissions
        canViewReports: false,
        canExportReports: false,
        
        // Role checks
        isAdmin: false,
        isManager: false,
        isUser: false,
        isViewer: false,
      }
    }

    const role = session.user.role as UserRole

    return {
      // Project permissions
      canViewProjects: true, // All authenticated users can view
      canCreateProjects: ([UserRole.ADMIN_SISTEM, UserRole.ADMIN_BALAI, UserRole.SATKER, UserRole.PPK] as UserRole[]).includes(role),
      canEditProjects: ([UserRole.ADMIN_SISTEM, UserRole.ADMIN_BALAI, UserRole.SATKER, UserRole.PPK] as UserRole[]).includes(role),
      canDeleteProjects: ([UserRole.ADMIN_SISTEM, UserRole.ADMIN_BALAI] as UserRole[]).includes(role),
      
      // Activity permissions
      canViewActivities: true, // All authenticated users can view
      canCreateActivities: ([UserRole.ADMIN_SISTEM, UserRole.ADMIN_BALAI, UserRole.SATKER, UserRole.PPK] as UserRole[]).includes(role),
      canEditActivities: ([UserRole.ADMIN_SISTEM, UserRole.ADMIN_BALAI, UserRole.SATKER, UserRole.PPK] as UserRole[]).includes(role),
      canDeleteActivities: ([UserRole.ADMIN_SISTEM, UserRole.ADMIN_BALAI] as UserRole[]).includes(role),
      
      // Monitoring permissions
      canViewMonitoring: true, // All authenticated users can view
      canEditMonitoring: ([UserRole.ADMIN_SISTEM, UserRole.ADMIN_BALAI, UserRole.SATKER, UserRole.PPK, UserRole.VENDOR] as UserRole[]).includes(role),
      
      // User management permissions
      canViewUsers: role === UserRole.ADMIN_SISTEM,
      canCreateUsers: role === UserRole.ADMIN_SISTEM,
      canEditUsers: role === UserRole.ADMIN_SISTEM,
      canDeleteUsers: role === UserRole.ADMIN_SISTEM,
      
      // Reports permissions
      canViewReports: ([UserRole.ADMIN_SISTEM, UserRole.ADMIN_BALAI, UserRole.DIRJEN_SDA, UserRole.KABALAI, UserRole.SATKER, UserRole.PPK] as UserRole[]).includes(role),
      canExportReports: ([UserRole.ADMIN_SISTEM, UserRole.ADMIN_BALAI, UserRole.DIRJEN_SDA, UserRole.KABALAI] as UserRole[]).includes(role),
      
      // Role checks
      isAdmin: role === UserRole.ADMIN_SISTEM,
      isManager: ([UserRole.ADMIN_SISTEM, UserRole.ADMIN_BALAI, UserRole.DIRJEN_SDA, UserRole.KABALAI] as UserRole[]).includes(role),
      isUser: ([UserRole.ADMIN_SISTEM, UserRole.ADMIN_BALAI, UserRole.DIRJEN_SDA, UserRole.KABALAI, UserRole.SATKER, UserRole.PPK] as UserRole[]).includes(role),
      isViewer: true, // All authenticated users can view
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
