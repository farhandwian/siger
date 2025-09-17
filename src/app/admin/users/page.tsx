'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users as UsersIcon,
  UserCheck,
  UserX,
  Shield,
} from 'lucide-react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { toast } from 'sonner'

/**
 * User Management Page
 * Admin-only page for managing system users
 * Includes user listing, creation, editing, and role management
 */

interface User {
  id: string
  name: string
  email: string
  username: string
  role: 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER'
  isActive: boolean
  phoneNumber?: string
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

interface UsersResponse {
  success: boolean
  data: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

async function fetchUsers(page: number, search?: string): Promise<UsersResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '10',
  })

  if (search) {
    params.append('search', search)
  }

  const response = await fetch(`/api/admin/users?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }

  return response.json()
}

async function deleteUser(userId: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/admin/users/${userId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to delete user')
  }

  return response.json()
}

async function toggleUserStatus(userId: string, isActive: boolean): Promise<{ success: boolean }> {
  const response = await fetch(`/api/admin/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isActive }),
  })

  if (!response.ok) {
    throw new Error('Failed to update user status')
  }

  return response.json()
}

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case 'ADMIN':
      return 'bg-red-100 text-red-800 hover:bg-red-200'
    case 'MANAGER':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
    case 'USER':
      return 'bg-green-100 text-green-800 hover:bg-green-200'
    case 'VIEWER':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  }
}

export default function UsersManagementPage() {
  const { permissions, user } = useAuth()
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const queryClient = useQueryClient()

  // Fetch users data
  const {
    data: usersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-users', currentPage, searchTerm],
    queryFn: () => fetchUsers(currentPage, searchTerm),
    enabled: permissions.canViewUsers,
  })

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success('User deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete user: ${error.message}`)
    },
  })

  // Toggle user status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      toggleUserStatus(userId, isActive),
    onSuccess: () => {
      toast.success('User status updated successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: Error) => {
      toast.error(`Failed to update user status: ${error.message}`)
    },
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleDeleteUser = (userId: string, userName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete user "${userName}"? This action cannot be undone.`
      )
    ) {
      deleteUserMutation.mutate(userId)
    }
  }

  const handleToggleStatus = (userId: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ userId, isActive: !currentStatus })
  }

  // Check permissions
  if (!permissions.canViewUsers) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="min-h-screen pl-0 lg:pl-44 xl:pl-64">
          <Header
            title="Access Denied"
            breadcrumb={{ level1: 'Admin', level2: 'User Management' }}
          />
          <div className="p-6">
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                You don&apos;t have permission to access user management. Please contact your
                administrator.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar className={sidebarOpen ? 'translate-x-0' : ''} />

      {/* Main Content */}
      <div className="min-h-screen pl-0 lg:pl-44 xl:pl-64">
        {/* Mobile Menu Button */}
        <div className="border-b border-gray-200 bg-white p-2 lg:hidden">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="p-1">
            <UsersIcon className="h-5 w-5" />
          </Button>
        </div>

        <Header title="User Management" breadcrumb={{ level1: 'Admin', level2: 'Users' }} />

        <div className="p-4 lg:p-6 xl:p-8">
          {/* Page Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600">Manage system users, roles, and permissions</p>
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/admin/users/create">
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Link>
            </Button>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search users by name, email, or username..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button type="submit" variant="outline">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                Users
                {usersData && <Badge variant="outline">{usersData.pagination.total} total</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded bg-gray-100" />
                  ))}
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertDescription>Failed to load users. Please try again later.</AlertDescription>
                </Alert>
              ) : !usersData?.data?.length ? (
                <div className="py-8 text-center">
                  <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm
                      ? 'Try adjusting your search terms'
                      : 'Get started by adding a new user'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {usersData.data.map(userData => (
                    <div
                      key={userData.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                          <span className="text-sm font-medium text-blue-900">
                            {userData.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{userData.name}</h3>
                          <p className="text-sm text-gray-500">{userData.email}</p>
                          <p className="text-xs text-gray-400">@{userData.username}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className={getRoleBadgeVariant(userData.role)}>
                          {userData.role}
                        </Badge>

                        <div className="flex items-center gap-1">
                          {userData.isActive ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(userData.id, userData.isActive)}
                            disabled={toggleStatusMutation.isPending}
                          >
                            {userData.isActive ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </Button>

                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/users/${userData.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>

                          {userData.id !== user?.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(userData.id, userData.name)}
                              disabled={deleteUserMutation.isPending}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {usersData && usersData.pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Showing {(currentPage - 1) * 10 + 1} to{' '}
                    {Math.min(currentPage * 10, usersData.pagination.total)} of{' '}
                    {usersData.pagination.total} users
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage(prev => Math.min(usersData.pagination.totalPages, prev + 1))
                      }
                      disabled={currentPage === usersData.pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
