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
        'border-b border-gray-200 bg-white px-3 py-2 lg:px-4 lg:py-3 xl:px-8 xl:py-5',
        className
      )}
    >
      <div className="flex items-center justify-between">
        {/* Title and Breadcrumb */}
        <div className="min-w-0 flex-1 space-y-0.5 lg:space-y-1">
          <h1 className="truncate text-xs font-medium text-gray-900 lg:text-sm xl:text-base">
            {title}
          </h1>
          <nav className="flex items-center space-x-1.5 text-[10px] lg:space-x-2 lg:text-xs xl:text-sm">
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
        <div className="flex flex-shrink-0 items-center gap-2 lg:gap-3 xl:gap-6">
          {/* User Profile */}
          <div className="hidden items-center gap-1.5 md:flex lg:gap-2 xl:gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 lg:h-7 lg:w-7 xl:h-10 xl:w-10">
              <div className="h-2.5 w-2.5 rounded-full bg-gray-600 lg:h-3 lg:w-3 xl:h-4 xl:w-4" />
            </div>
            <div className="hidden text-[10px] lg:block lg:text-xs xl:text-sm">
              <div className="font-medium text-black">BBWS Mesuji Sekampung</div>
              <div className="text-gray-600">Admin</div>
            </div>
          </div>

          {/* AI Assistant Button */}
          <Button
            size="sm"
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-yellow-500 px-2 text-[10px] text-white hover:opacity-90 lg:px-3 lg:text-xs xl:px-4 xl:text-sm"
          >
            <svg
              className="mr-1 h-2.5 w-2.5 lg:mr-1.5 lg:h-3 lg:w-3 xl:mr-2 xl:h-5 xl:w-5"
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
