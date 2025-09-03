'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import {
  ChartBarIcon,
  DocumentDuplicateIcon,
  ChatBubbleLeftEllipsisIcon,
  DocumentTextIcon,
  SigerLogo,
} from '../ui/icons'

interface SidebarItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  active?: boolean
  children?: SidebarItem[]
}

interface SidebarProps {
  className?: string
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: ChartBarIcon,
  },
  {
    id: 'manajemen-usulan',
    label: 'Manajemen usulan',
    icon: DocumentDuplicateIcon,
    children: [
      { id: 'daftar-usulan', label: 'Daftar Usulan', icon: DocumentDuplicateIcon },
      { id: 'verifikasi-usulan', label: 'Verifikasi Usulan', icon: DocumentDuplicateIcon },
    ],
  },
  {
    id: 'monitoring-evaluasi',
    label: 'Monitoring & Evaluasi',
    icon: ChatBubbleLeftEllipsisIcon,
    active: true,
    children: [
      { id: 'overview', label: 'Overview', icon: DocumentDuplicateIcon },
      { id: 'data-teknis', label: 'Data Teknis', icon: DocumentDuplicateIcon },
      { id: 'jadwal', label: 'Jadwal', icon: DocumentDuplicateIcon },
      { id: 'action-plan', label: 'Action Plan', icon: DocumentDuplicateIcon },
      { id: 'material-flow', label: 'Material Flow', icon: DocumentDuplicateIcon },
      { id: 'analisa-kebutuhan', label: 'Analisa Kebutuhan', icon: DocumentDuplicateIcon },
    ],
  },
  {
    id: 'laporan',
    label: 'Laporan',
    icon: DocumentTextIcon,
  },
  {
    id: 'forum-diskusi',
    label: 'Forum Diskusi',
    icon: ChatBubbleLeftEllipsisIcon,
  },
]

const SidebarItemComponent: React.FC<{
  item: SidebarItem
  isChild?: boolean
}> = ({ item, isChild = false }) => {
  const Icon = item.icon

  return (
    <div className="w-full">
      <div
        className={cn(
          'relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 lg:gap-3 lg:rounded-lg lg:px-3 lg:py-2 xl:px-4',
          item.active ? 'bg-yellow-400 text-blue-900' : 'text-gray-500 hover:bg-gray-100',
          isChild && 'ml-2 lg:ml-3 xl:ml-4'
        )}
      >
        {item.active && !isChild && (
          <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 transform rounded-r-full bg-blue-900 lg:h-7 xl:h-8" />
        )}
        <Icon className={cn('h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6', isChild && 'opacity-0')} />
        <span className="truncate text-xs font-medium lg:text-sm">{item.label}</span>
      </div>

      {item.children && (
        <div className="mt-1">
          {item.children.map(child => (
            <SidebarItemComponent key={child.id} item={child} isChild={true} />
          ))}
        </div>
      )}
    </div>
  )
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'scrollbar-hide flex h-full w-48 flex-col overflow-y-auto border-r border-gray-200 bg-white lg:w-56 xl:w-64',
        className
      )}
    >
      {/* Logo Section */}
      <div className="flex-shrink-0 border-b border-gray-100 p-3 lg:p-4 xl:p-6">
        <div className="flex items-center gap-2">
          <SigerLogo className="h-6 w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8" />
          <span className="text-lg font-bold text-blue-900 lg:text-xl xl:text-2xl">SIGER</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 space-y-1 overflow-y-auto p-2 lg:space-y-2 lg:p-3 xl:p-4">
        {sidebarItems.map(item => (
          <SidebarItemComponent key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
