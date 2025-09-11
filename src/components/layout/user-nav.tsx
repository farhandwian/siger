'use client'

import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { signOut } from 'next-auth/react'
import { User, Settings, LogOut, Shield } from 'lucide-react'
import Link from 'next/link'

/**
 * User Navigation Component
 * Displays user information and provides navigation options
 * Includes role-based menu items and authentication controls
 */

export function UserNav() {
  const { user, isAuthenticated, permissions, role } = useAuth()

  if (!isAuthenticated || !user) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/auth/signin">Sign In</Link>
      </Button>
    )
  }

  const handleSignOut = async () => {
    try {
      await signOut({
        callbackUrl: '/auth/signin',
        redirect: true,
      })
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  }

  const getRoleBadge = (role: string) => {
    const roleColors = {
      ADMIN: 'text-red-600 bg-red-100',
      MANAGER: 'text-blue-600 bg-blue-100',
      USER: 'text-green-600 bg-green-100',
      VIEWER: 'text-gray-600 bg-gray-100',
    }

    return (
      <span
        className={`rounded-full px-2 py-1 text-xs ${roleColors[role as keyof typeof roleColors] || roleColors.USER}`}
      >
        {role}
      </span>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-sm">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            <div className="mt-2">{getRoleBadge(role || 'USER')}</div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>

        {permissions.canViewUsers && (
          <DropdownMenuItem asChild>
            <Link href="/admin/users" className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              <span>User Management</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600"
          onSelect={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Authentication Status Component
 * Shows loading state while authentication is being determined
 */
export function AuthStatus() {
  const { isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
  }

  return <UserNav />
}
