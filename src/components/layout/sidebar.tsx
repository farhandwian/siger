'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import {
  ChartBarIcon,
  DocumentDuplicateIcon,
  ChatBubbleLeftEllipsisIcon,
  DocumentTextIcon,
  SigerLogo,
} from '../ui/icons'
import { Users, Shield } from 'lucide-react'

interface SidebarItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  children?: SidebarItem[]
  roles?: ('ADMIN' | 'MANAGER' | 'USER' | 'VIEWER')[] // Role-based visibility
}

interface SidebarProps {
  className?: string
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: ChartBarIcon,
    href: '/dashboard',
  },
  {
    id: 'manajemen-usulan',
    label: 'Manajemen Usulan',
    icon: DocumentDuplicateIcon,
    children: [
      {
        id: 'daftar-usulan',
        label: 'Daftar Usulan',
        icon: DocumentDuplicateIcon,
        href: '/daftar-usulan',
      },
      {
        id: 'tambah-usulan',
        label: 'Tambah Usulan',
        icon: DocumentDuplicateIcon,
        href: '/tambah-usulan',
      },
      {
        id: 'verifikasi-usulan',
        label: 'Verifikasi Usulan',
        icon: DocumentDuplicateIcon,
        href: '/verifikasi-usulan',
        roles: ['ADMIN', 'MANAGER'], // Only admins and managers can verify
      },
    ],
  },
  {
    id: 'monitoring-evaluasi',
    label: 'Monitoring & Evaluasi',
    icon: ChatBubbleLeftEllipsisIcon,
    href: '/monitoring-evaluasi',
    children: [
      {
        id: 'overview',
        label: 'Overview',
        icon: DocumentDuplicateIcon,
        href: '/monitoring-evaluasi/overview',
      },
      {
        id: 'data-teknis',
        label: 'Data Teknis',
        icon: DocumentDuplicateIcon,
        href: '/monitoring-evaluasi/data-teknis',
      },
      {
        id: 'jadwal',
        label: 'Jadwal',
        icon: DocumentDuplicateIcon,
        href: '/monitoring-evaluasi/jadwal',
      },
      {
        id: 'action-plan',
        label: 'Action Plan',
        icon: DocumentDuplicateIcon,
        href: '/monitoring-evaluasi/action-plan',
        roles: ['ADMIN', 'MANAGER'], // Only admins and managers can create action plans
      },
      {
        id: 'material-flow',
        label: 'Material Flow',
        icon: DocumentDuplicateIcon,
        href: '/monitoring-evaluasi/material-flow',
      },
      {
        id: 'analisa-kebutuhan',
        label: 'Analisa Kebutuhan',
        icon: DocumentDuplicateIcon,
        href: '/monitoring-evaluasi/analisa-kebutuhan',
      },
    ],
  },
  {
    id: 'laporan',
    label: 'Laporan',
    icon: DocumentTextIcon,
    href: '/laporan',
  },
  {
    id: 'forum-diskusi',
    label: 'Forum Diskusi',
    icon: ChatBubbleLeftEllipsisIcon,
    href: '/forum-diskusi',
  },
  {
    id: 'user-management',
    label: 'Kelola Pengguna',
    icon: Users,
    roles: ['ADMIN'], // Only admins can access user management
    children: [
      {
        id: 'users-list',
        label: 'Daftar Pengguna',
        icon: Users,
        href: '/admin/users',
        roles: ['ADMIN'],
      },
      {
        id: 'users-create',
        label: 'Tambah Pengguna',
        icon: Users,
        href: '/admin/users/create',
        roles: ['ADMIN'],
      },
      {
        id: 'user-roles',
        label: 'Kelola Role',
        icon: Shield,
        href: '/admin/roles',
        roles: ['ADMIN'],
      },
    ],
  },
]

const SidebarItemComponent: React.FC<{
  item: SidebarItem
  isChild?: boolean
  pathname: string
  userRole: string | undefined
}> = ({ item, isChild = false, pathname, userRole }) => {
  const Icon = item.icon

  // Check if user has permission to see this item
  if (item.roles && userRole && !item.roles.includes(userRole as any)) {
    return null
  }

  const isActive =
    pathname === item.href ||
    (item.children && item.children.some(child => pathname === child.href))

  const content = (
    <div
      className={cn(
        'relative flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 transition-colors lg:gap-2 lg:px-2.5 lg:py-1.5 xl:gap-3 xl:px-4 xl:py-2',
        isActive ? 'bg-yellow-400 text-blue-900' : 'text-gray-500 hover:bg-gray-100',
        isChild && 'ml-2 lg:ml-2.5 xl:ml-4'
      )}
    >
      {isActive && !isChild && (
        <div className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 transform rounded-r-full bg-blue-900 lg:h-6 xl:h-8" />
      )}
      <Icon className={cn('h-3.5 w-3.5 lg:h-4 lg:w-4 xl:h-6 xl:w-6', isChild && 'opacity-0')} />
      <span className="truncate text-[10px] font-medium lg:text-xs xl:text-sm">{item.label}</span>
    </div>
  )

  return (
    <div className="w-full">
      {item.href ? <Link href={item.href}>{content}</Link> : content}

      {item.children && (
        <div className="mt-0.5 lg:mt-1">
          {item.children.map(child => (
            <SidebarItemComponent
              key={child.id}
              item={child}
              isChild={true}
              pathname={pathname}
              userRole={userRole}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { user, role } = useAuth()
  const pathname = usePathname()

  // Filter sidebar items based on user role
  const filteredItems = sidebarItems.filter(item => {
    if (!item.roles) return true // Show items without role restrictions
    if (!role) return false // Hide role-restricted items for unauthenticated users
    return item.roles.includes(role)
  })

  return (
    <div
      className={cn(
        'scrollbar-hide flex h-screen w-40 flex-col overflow-y-auto border-r border-gray-200 bg-white lg:w-44 xl:w-64',
        className
      )}
    >
      {/* Logo Section */}
      <div className="flex-shrink-0 border-b border-gray-100 p-2 lg:p-3 xl:p-6">
        <Link href="/monitoring-evaluasi" className="flex items-center gap-1.5 lg:gap-2">
          <SigerLogo className="h-5 w-5 lg:h-6 lg:w-6 xl:h-8 xl:w-8" />
          <span className="text-sm font-bold text-blue-900 lg:text-base xl:text-2xl">SIGER</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 space-y-0.5 overflow-y-auto p-1.5 lg:space-y-1 lg:p-2 xl:p-4">
        {filteredItems.map(item => (
          <SidebarItemComponent key={item.id} item={item} pathname={pathname} userRole={role} />
        ))}
      </div>

      {/* User Info Footer */}
      {user && (
        <div className="border-t border-gray-100 p-2 lg:p-3 xl:p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-900 lg:h-8 lg:w-8 xl:text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-medium text-gray-900 lg:text-xs xl:text-sm">
                {user.name}
              </p>
              <p className="truncate text-[8px] text-gray-500 lg:text-[10px] xl:text-xs">{role}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
