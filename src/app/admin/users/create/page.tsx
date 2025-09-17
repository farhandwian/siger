'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserRole } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Users as UsersIcon, Save, Eye, EyeOff } from 'lucide-react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { toast } from 'sonner'

/**
 * Create User Page
 * Admin-only page for creating new system users
 * Includes form validation, role assignment, and password generation
 */

const CreateUserSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Valid email is required'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    role: z.nativeEnum(UserRole),
    phoneNumber: z.string().optional(),
    isActive: z.boolean(), // Remove default here, let the form provide it
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type CreateUserFormData = z.infer<typeof CreateUserSchema>

interface CreateUserRequest {
  name: string
  email: string
  username: string
  password: string
  role: UserRole
  phoneNumber?: string
  isActive: boolean
}

async function createUser(userData: CreateUserRequest) {
  const response = await fetch('/api/admin/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create user')
  }

  return response.json()
}

const roleDescriptions = {
  [UserRole.ADMIN_SISTEM]: 'Global system administrator with full access',
  [UserRole.ADMIN_BALAI]: 'Balai-level administrator with regional oversight',
  [UserRole.DIRJEN_SDA]: 'Director General with read-only oversight access',
  [UserRole.KABALAI]: 'Head of Balai with read-only regional access',
  [UserRole.SATKER]: 'Budget execution unit with satker-level CRUD access',
  [UserRole.PPK]: 'Project commitment officer with assigned project management',
  [UserRole.VENDOR]: 'Contractor/vendor with progress update access only',
}

export default function CreateUserPage() {
  const { permissions } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: {
      role: UserRole.PPK,
      isActive: true,
    },
  })

  const watchedRole = watch('role')

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success('User created successfully')
      router.push('/admin/users')
    },
    onError: (error: Error) => {
      toast.error(`Failed to create user: ${error.message}`)
    },
  })

  const onSubmit = (data: CreateUserFormData) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword: _, ...userData } = data
    createUserMutation.mutate(userData)
  }

  const generatePassword = () => {
    const length = 12
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''

    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }

    setValue('password', password)
    setValue('confirmPassword', password)
    toast.success('Password generated successfully')
  }

  // Check permissions
  if (!permissions.canCreateUsers) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="min-h-screen pl-0 lg:pl-44 xl:pl-64">
          <Header title="Access Denied" breadcrumb={{ level1: 'Admin', level2: 'Create User' }} />
          <div className="p-6">
            <Alert variant="destructive">
              <AlertDescription>
                You don&apos;t have permission to create users. Please contact your administrator.
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
      <div
        className={`fixed left-0 top-0 z-50 h-screen transform transition-transform duration-300 ease-in-out
        lg:relative lg:z-auto lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="min-h-screen pl-0 lg:pl-44 xl:pl-64">
        <div className="min-w-0 flex-1 lg:ml-0">
          {/* Mobile Menu Button */}
          <div className="border-b border-gray-200 bg-white p-2 lg:hidden">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="p-1">
              <UsersIcon className="h-5 w-5" />
            </Button>
          </div>

          <Header title="Create User" breadcrumb={{ level1: 'Admin', level2: 'Create User' }} />

          <div className="p-4 lg:p-6 xl:p-8">
            {/* Page Header */}
            <div className="mb-6 flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/users">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Users
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
                <p className="text-gray-600">
                  Add a new user to the system with appropriate role and permissions
                </p>
              </div>
            </div>

            <div className="max-w-2xl">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          {...register('name')}
                          placeholder="Enter full name"
                          className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && (
                          <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          {...register('username')}
                          placeholder="Enter username"
                          className={errors.username ? 'border-red-500' : ''}
                        />
                        {errors.username && (
                          <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        placeholder="Enter email address"
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                      <Input
                        id="phoneNumber"
                        {...register('phoneNumber')}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Password */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Password Configuration
                      <Button type="button" variant="outline" size="sm" onClick={generatePassword}>
                        Generate Password
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            {...register('password')}
                            placeholder="Enter password"
                            className={errors.password ? 'border-red-500' : ''}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {errors.password && (
                          <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            {...register('confirmPassword')}
                            placeholder="Confirm password"
                            className={errors.confirmPassword ? 'border-red-500' : ''}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Role and Permissions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Role and Permissions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="role">User Role</Label>
                      <Select
                        value={watchedRole}
                        onValueChange={value => setValue('role', value as any)}
                      >
                        <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select user role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UserRole.VENDOR}>Vendor/Contractor</SelectItem>
                          <SelectItem value={UserRole.PPK}>PPK (Project Officer)</SelectItem>
                          <SelectItem value={UserRole.SATKER}>SATKER (Budget Unit)</SelectItem>
                          <SelectItem value={UserRole.KABALAI}>Head of Balai</SelectItem>
                          <SelectItem value={UserRole.DIRJEN_SDA}>Director General</SelectItem>
                          <SelectItem value={UserRole.ADMIN_BALAI}>Balai Administrator</SelectItem>
                          <SelectItem value={UserRole.ADMIN_SISTEM}>System Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.role && (
                        <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>
                      )}
                    </div>

                    {watchedRole && (
                      <div className="rounded-lg bg-gray-50 p-3">
                        <h4 className="text-sm font-medium text-gray-900">Role Description:</h4>
                        <p className="text-sm text-gray-600">{roleDescriptions[watchedRole]}</p>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        {...register('isActive')}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="isActive" className="text-sm">
                        Account is active (user can sign in)
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {createUserMutation.isPending ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Creating User...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Create User
                      </>
                    )}
                  </Button>

                  <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link href="/admin/users">Cancel</Link>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
