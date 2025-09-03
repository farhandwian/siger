'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'

interface HeaderProps {
  title?: string
  breadcrumb?: {
    level1: string
    level2?: string
  }
  className?: string
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Sistem Informasi Geospasial Irigasi',
  breadcrumb = { level1: 'Monitoring & Evaluasi', level2: 'Data Teknis' },
  className,
}) => {
  return (
    <header
      className={cn(
        'border-b border-gray-200 bg-white px-4 py-3 lg:px-6 lg:py-4 xl:px-8 xl:py-5',
        className
      )}
    >
      <div className="flex items-center justify-between">
        {/* Title and Breadcrumb */}
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="truncate text-sm font-medium text-gray-900 lg:text-base">{title}</h1>
          <nav className="flex items-center space-x-2 text-xs lg:text-sm">
            <span className="truncate text-gray-500">{breadcrumb.level1}</span>
            {breadcrumb.level2 && (
              <>
                <span className="text-gray-500">/</span>
                <span className="truncate text-blue-900">{breadcrumb.level2}</span>
              </>
            )}
          </nav>
        </div>

        {/* User Info and AI Assistant */}
        <div className="flex flex-shrink-0 items-center gap-3 lg:gap-4 xl:gap-6">
          {/* User Profile */}
          <div className="hidden items-center gap-2 md:flex lg:gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 lg:h-9 lg:w-9 xl:h-10 xl:w-10">
              <div className="h-3 w-3 rounded-full bg-gray-600 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4" />
            </div>
            <div className="hidden text-xs lg:block lg:text-sm">
              <div className="font-medium text-black">BBWS Mesuji Sekampung</div>
              <div className="text-gray-600">Admin</div>
            </div>
          </div>

          {/* AI Assistant Button */}
          <Button
            size="sm"
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-yellow-500 px-2 text-xs text-white hover:opacity-90 lg:px-4 lg:text-sm"
          >
            <svg
              className="mr-1 h-3 w-3 lg:mr-2 lg:h-4 lg:w-4 xl:h-5 xl:w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span className="hidden sm:inline">AI Assistant</span>
            <span className="sm:hidden">AI</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
