// 'use client'

// import { useState } from 'react'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Input } from '@/components/ui/input'
// import { Button } from '@/components/ui/button'
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select'
// import { Badge } from '@/components/ui/badge'
// import { Skeleton } from '@/components/ui/skeleton'
// import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
// import { Search, Calendar, MapPin, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
// import { useDailySubActivitiesList } from '@/hooks/useDailySubActivitiesList'
// import type { DailySubActivitiesQuery } from '@/lib/schemas/daily-sub-activities'

// interface DailySubActivitiesListProps {
//   projectId?: string
//   activityId?: string
//   subActivityId?: string
// }

// export function DailySubActivitiesList({
//   projectId,
//   activityId,
//   subActivityId,
// }: DailySubActivitiesListProps) {
//   const [filters, setFilters] = useState<Partial<DailySubActivitiesQuery>>({
//     page: 1,
//     limit: 10,
//     sortBy: 'updatedAt',
//     sortOrder: 'desc',
//     projectId,
//     activityId,
//     subActivityId,
//     // userId: 'cmfb8i5yo0000vpgc5p776720', // TEMPORARILY DISABLED
//   })

//   const [searchInput, setSearchInput] = useState('')

//   const { data, isLoading, error, refetch } = useDailySubActivitiesList(filters)

//   const handleSearch = () => {
//     setFilters(prev => ({
//       ...prev,
//       search: searchInput.trim() || undefined,
//       page: 1,
//     }))
//   }

//   const handlePageChange = (newPage: number) => {
//     setFilters(prev => ({
//       ...prev,
//       page: newPage,
//     }))
//   }

//   const handleSortChange = (newSortBy: string) => {
//     setFilters(prev => ({
//       ...prev,
//       sortBy: newSortBy as 'updatedAt' | 'createdAt' | 'tanggalProgres',
//       page: 1,
//     }))
//   }

//   const handleLimitChange = (newLimit: string) => {
//     setFilters(prev => ({
//       ...prev,
//       limit: parseInt(newLimit),
//       page: 1,
//     }))
//   }

//   const handleDateRangeChange = (startDate: string, endDate: string) => {
//     setFilters(prev => ({
//       ...prev,
//       startDate: startDate || undefined,
//       endDate: endDate || undefined,
//       page: 1,
//     }))
//   }

//   const clearFilters = () => {
//     setSearchInput('')
//     setFilters({
//       page: 1,
//       limit: 10,
//       sortBy: 'updatedAt',
//       sortOrder: 'desc',
//       projectId,
//       activityId,
//       subActivityId,
//       // userId: 'cmfb8i5yo0000vpgc5p776720', // TEMPORARILY DISABLED
//     })
//   }

//   if (isLoading) {
//     return (
//       <Card className="rounded-2xl">
//         <CardHeader>
//           <CardTitle className="text-base sm:text-lg">Daily Sub Activities</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           {Array.from({ length: 5 }).map((_, i) => (
//             <Skeleton key={i} className="h-32 w-full rounded-xl" />
//           ))}
//         </CardContent>
//       </Card>
//     )
//   }

//   if (error) {
//     return (
//       <Card className="rounded-2xl">
//         <CardHeader>
//           <CardTitle className="text-base sm:text-lg">Daily Sub Activities</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <Alert variant="destructive">
//             <AlertTitle>Error loading data</AlertTitle>
//             <AlertDescription>
//               {error.message || 'Failed to load daily sub activities'}
//             </AlertDescription>
//           </Alert>
//           <Button onClick={() => refetch()} className="mt-4" variant="outline">
//             Try Again
//           </Button>
//         </CardContent>
//       </Card>
//     )
//   }

//   const { data: activities, pagination } = data || {
//     data: [],
//     pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
//   }

//   return (
//     <div className="space-y-6">
//       {/* Filters and Search */}
//       <Card className="rounded-2xl">
//         <CardHeader>
//           <CardTitle className="text-base sm:text-lg">Daily Sub Activities</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           {/* Search and Sort Controls */}
//           <div className="flex flex-col gap-4 sm:flex-row">
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
//               <Input
//                 placeholder="Search sub activities..."
//                 value={searchInput}
//                 onChange={e => setSearchInput(e.target.value)}
//                 onKeyDown={e => e.key === 'Enter' && handleSearch()}
//                 className="pl-10"
//               />
//             </div>
//             <Button onClick={handleSearch} className="w-full sm:w-auto">
//               Search
//             </Button>
//           </div>

//           {/* Sort and Limit Controls */}
//           <div className="flex flex-col gap-4 sm:flex-row">
//             <div className="flex-1">
//               <Select value={filters.sortBy} onValueChange={handleSortChange}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="Sort by" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="updatedAt">Last Updated</SelectItem>
//                   <SelectItem value="createdAt">Created Date</SelectItem>
//                   <SelectItem value="tanggalProgres">Progress Date</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="flex-1">
//               <Select value={filters.limit?.toString()} onValueChange={handleLimitChange}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="Items per page" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="10">10 per page</SelectItem>
//                   <SelectItem value="20">20 per page</SelectItem>
//                   <SelectItem value="50">50 per page</SelectItem>
//                   <SelectItem value="100">100 per page</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <Button onClick={clearFilters} variant="outline" className="w-full sm:w-auto">
//               Clear Filters
//             </Button>
//           </div>

//           {/* Active Filters */}
//           {(filters.search || filters.startDate || filters.endDate) && (
//             <div className="flex flex-wrap gap-2">
//               {filters.search && <Badge variant="secondary">Search: {filters.search}</Badge>}
//               {filters.startDate && <Badge variant="secondary">From: {filters.startDate}</Badge>}
//               {filters.endDate && <Badge variant="secondary">To: {filters.endDate}</Badge>}
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Results */}
//       <div className="space-y-4">
//         {activities.length === 0 ? (
//           <Card className="rounded-2xl">
//             <CardContent className="py-12 text-center">
//               <p className="mb-4 text-muted-foreground">No daily sub activities found</p>
//               <Button onClick={clearFilters} variant="outline">
//                 Clear Filters
//               </Button>
//             </CardContent>
//           </Card>
//         ) : (
//           activities.map(activity => (
//             <Card key={activity.id} className="rounded-2xl">
//               <CardContent className="p-6">
//                 <div className="space-y-4">
//                   {/* Header */}
//                   <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
//                     <div className="space-y-2">
//                       <h3 className="text-lg font-semibold">{activity.subActivity.name}</h3>
//                       <div className="space-y-1 text-sm text-muted-foreground">
//                         <p>
//                           <strong>Project:</strong>{' '}
//                           {activity.subActivity.activity.project.pekerjaan}
//                         </p>
//                         <p>
//                           <strong>Activity:</strong> {activity.subActivity.activity.name}
//                         </p>
//                         <p>
//                           <strong>Contractor:</strong>{' '}
//                           {activity.subActivity.activity.project.penyediaJasa}
//                         </p>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <Badge variant="outline">{activity.progresRealisasiPerHari}% Progress</Badge>
//                     </div>
//                   </div>

//                   {/* Progress Details */}
//                   <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                     <div className="space-y-2">
//                       <div className="flex items-center gap-2 text-sm">
//                         <Calendar className="h-4 w-4" />
//                         <span>Progress Date: {activity.tanggalProgres}</span>
//                       </div>
//                       {activity.koordinat && (
//                         <div className="flex items-center gap-2 text-sm">
//                           <MapPin className="h-4 w-4" />
//                           <span>
//                             Location: {activity.koordinat.latitude}, {activity.koordinat.longitude}
//                           </span>
//                         </div>
//                       )}
//                     </div>
//                     <div className="space-y-2">
//                       <div className="text-sm">
//                         <strong>Unit:</strong> {activity.subActivity.satuan || 'N/A'}
//                       </div>
//                       <div className="text-sm">
//                         <strong>Contract Volume:</strong>{' '}
//                         {activity.subActivity.volumeKontrak || 'N/A'}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Notes */}
//                   {activity.catatanKegiatan && (
//                     <div className="space-y-2">
//                       <div className="flex items-center gap-2 text-sm font-medium">
//                         <FileText className="h-4 w-4" />
//                         <span>Notes:</span>
//                       </div>
//                       <p className="pl-6 text-sm text-muted-foreground">
//                         {activity.catatanKegiatan}
//                       </p>
//                     </div>
//                   )}

//                   {/* Files */}
//                   {activity.file && Array.isArray(activity.file) && activity.file.length > 0 && (
//                     <div className="space-y-2">
//                       <div className="flex items-center gap-2 text-sm font-medium">
//                         <FileText className="h-4 w-4" />
//                         <span>Attached Files:</span>
//                       </div>
//                       <div className="flex flex-wrap gap-2 pl-6">
//                         {activity.file.map((file: any, index: number) => (
//                           <Badge key={index} variant="outline">
//                             {file.filename || `File ${index + 1}`}
//                           </Badge>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {/* Metadata */}
//                   <div className="border-t pt-2 text-xs text-muted-foreground">
//                     <div className="flex justify-between">
//                       <span>Created: {new Date(activity.createdAt).toLocaleString()}</span>
//                       <span>Updated: {new Date(activity.updatedAt).toLocaleString()}</span>
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           ))
//         )}
//       </div>

//       {/* Pagination */}
//       {pagination.totalPages > 1 && (
//         <Card className="rounded-2xl">
//           <CardContent className="p-4">
//             <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
//               <div className="text-sm text-muted-foreground">
//                 Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
//                 {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
//                 {pagination.total} results
//               </div>
//               <div className="flex items-center gap-2">
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => handlePageChange(pagination.page - 1)}
//                   disabled={!pagination.hasPrev}
//                 >
//                   <ChevronLeft className="h-4 w-4" />
//                   Previous
//                 </Button>
//                 <span className="text-sm">
//                   Page {pagination.page} of {pagination.totalPages}
//                 </span>
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => handlePageChange(pagination.page + 1)}
//                   disabled={!pagination.hasNext}
//                 >
//                   Next
//                   <ChevronRight className="h-4 w-4" />
//                 </Button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   )
// }
