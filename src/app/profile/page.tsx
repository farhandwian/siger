'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { User, Mail, Phone, Calendar, Shield, Clock } from 'lucide-react'
import { format } from 'date-fns'

/**
 * User Profile Page
 * Displays current user information and role details
 * Accessible by all authenticated users
 */

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case 'ADMIN':
      return 'bg-red-100 text-red-800'
    case 'MANAGER':
      return 'bg-blue-100 text-blue-800'
    case 'USER':
      return 'bg-green-100 text-green-800'
    case 'VIEWER':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const roleDescriptions = {
  ADMIN: 'Full system access including user management and system configuration',
  MANAGER: 'Project management, approval permissions, and team coordination',
  USER: 'Standard user with project participation and data entry rights',
  VIEWER: 'Read-only access to projects, reports, and dashboard data',
}

export default function ProfilePage() {
  const { user, permissions, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1">
          <Header title="Profile" breadcrumb={{ level1: 'User', level2: 'Profile' }} />
          <div className="p-6">
            <div className="space-y-4">
              <div className="h-32 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-48 animate-pulse rounded-lg bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1">
          <Header title="Profile" breadcrumb={{ level1: 'User', level2: 'Profile' }} />
          <div className="p-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-gray-500">User information not available</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1">
        <Header title="User Profile" breadcrumb={{ level1: 'Account', level2: 'Profile' }} />

        <div className="p-4 lg:p-6 xl:p-8">
          <div className="max-w-4xl">
            {/* Profile Header */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-900">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                    <p className="text-gray-600">{user.email}</p>
                    <div className="mt-2">
                      <Badge className={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Role</p>
                      <p className="font-medium">{user.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Role & Permissions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Role & Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-900">Role Description:</p>
                      <p className="text-sm text-gray-600">
                        {roleDescriptions[user.role as keyof typeof roleDescriptions]}
                      </p>
                    </div>

                    <div>
                      <p className="mb-3 text-sm font-medium text-gray-900">Current Permissions:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div
                          className={`flex items-center gap-2 ${permissions.canViewProjects ? 'text-green-600' : 'text-gray-400'}`}
                        >
                          <div
                            className={`h-2 w-2 rounded-full ${permissions.canViewProjects ? 'bg-green-500' : 'bg-gray-300'}`}
                          />
                          View Projects
                        </div>
                        <div
                          className={`flex items-center gap-2 ${permissions.canCreateProjects ? 'text-green-600' : 'text-gray-400'}`}
                        >
                          <div
                            className={`h-2 w-2 rounded-full ${permissions.canCreateProjects ? 'bg-green-500' : 'bg-gray-300'}`}
                          />
                          Create Projects
                        </div>
                        <div
                          className={`flex items-center gap-2 ${permissions.canEditProjects ? 'text-green-600' : 'text-gray-400'}`}
                        >
                          <div
                            className={`h-2 w-2 rounded-full ${permissions.canEditProjects ? 'bg-green-500' : 'bg-gray-300'}`}
                          />
                          Edit Projects
                        </div>
                        <div
                          className={`flex items-center gap-2 ${permissions.canViewUsers ? 'text-green-600' : 'text-gray-400'}`}
                        >
                          <div
                            className={`h-2 w-2 rounded-full ${permissions.canViewUsers ? 'bg-green-500' : 'bg-gray-300'}`}
                          />
                          User Management
                        </div>
                        <div
                          className={`flex items-center gap-2 ${permissions.canViewReports ? 'text-green-600' : 'text-gray-400'}`}
                        >
                          <div
                            className={`h-2 w-2 rounded-full ${permissions.canViewReports ? 'bg-green-500' : 'bg-gray-300'}`}
                          />
                          View Reports
                        </div>
                        <div
                          className={`flex items-center gap-2 ${permissions.canExportReports ? 'text-green-600' : 'text-gray-400'}`}
                        >
                          <div
                            className={`h-2 w-2 rounded-full ${permissions.canExportReports ? 'bg-green-500' : 'bg-gray-300'}`}
                          />
                          Export Reports
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Information */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg bg-gray-50 p-4 text-center">
                    <Calendar className="mx-auto mb-2 h-6 w-6 text-gray-400" />
                    <p className="text-xs text-gray-500">Account Status</p>
                    <p className="font-medium text-green-600">Active</p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4 text-center">
                    <Shield className="mx-auto mb-2 h-6 w-6 text-gray-400" />
                    <p className="text-xs text-gray-500">Security Level</p>
                    <p className="font-medium">
                      {user.role === 'ADMIN'
                        ? 'High'
                        : user.role === 'MANAGER'
                          ? 'Medium'
                          : 'Standard'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4 text-center">
                    <Clock className="mx-auto mb-2 h-6 w-6 text-gray-400" />
                    <p className="text-xs text-gray-500">Session Status</p>
                    <p className="font-medium text-green-600">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
