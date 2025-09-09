# Daily Sub Activities List API Documentation

## Overview
API endpoint untuk menampilkan daftar daily sub activities dengan fitur filtering, sorting, search, dan pagination. **Compatible dengan infinite scroll pattern untuk React Native.**

## Endpoint
```
GET /api/daily-sub-activities/list
```

## Query Parameters

### Pagination
- `page` (number, optional): Nomor halaman, default: 1, minimum: 1
- `limit` (number, optional): Jumlah item per halaman, default: 10, minimum: 1, maksimum: 100

### Sorting
- `sortBy` (string, optional): Field untuk sorting, options: 'updatedAt' | 'createdAt' | 'tanggalProgres', default: 'updatedAt'
- `sortOrder` (string, optional): Urutan sorting, options: 'asc' | 'desc', default: 'desc'

### Search
- `search` (string, optional): Pencarian berdasarkan nama sub activity (case-insensitive)

### Filters
- `projectId` (string, optional): Filter berdasarkan project ID
- `activityId` (string, optional): Filter berdasarkan activity ID
- `subActivityId` (string, optional): Filter berdasarkan sub activity ID
- `userId` (string, optional): Filter berdasarkan user ID (**TEMPORARILY DISABLED**)
- `startDate` (string, optional): Filter tanggal mulai (format: YYYY-MM-DD)
- `endDate` (string, optional): Filter tanggal akhir (format: YYYY-MM-DD)

## Request Examples

### Basic request
```
GET /api/daily-sub-activities/list
```

### With pagination
```
GET /api/daily-sub-activities/list?page=2&limit=20
```

### With search
```
GET /api/daily-sub-activities/list?search=galian&page=1&limit=10
```

### With project filter
```
GET /api/daily-sub-activities/list?projectId=cm123456789&sortBy=tanggalProgres&sortOrder=asc
```

### With date range filter
```
GET /api/daily-sub-activities/list?startDate=2024-01-01&endDate=2024-01-31&sortBy=tanggalProgres
```

### Complex filtering
```
GET /api/daily-sub-activities/list?projectId=cm123456789&search=galian&startDate=2024-01-01&page=1&limit=25&sortBy=updatedAt&sortOrder=desc
```

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "data": [
    {
      "id": "cm1234567890abcdef",
      "subActivityId": "cm987654321fedcba",
      "userId": "cmfb8i5yo0000vpgc5p776720",
      "koordinat": {
        "latitude": -6.200000,
        "longitude": 106.816666
      },
      "catatanKegiatan": "Pekerjaan galian tanah selesai 50%",
      "file": [
        {
          "filename": "progress_photo.jpg",
          "path": "/uploads/progress_photo.jpg"
        }
      ],
      "progresRealisasiPerHari": 15.5,
      "tanggalProgres": "2024-01-15",
      "createdAt": "2024-01-15T08:30:00.000Z",
      "updatedAt": "2024-01-15T16:45:00.000Z",
      "subActivity": {
        "id": "cm987654321fedcba",
        "name": "Galian Tanah Saluran Primer",
        "satuan": "m3",
        "volumeKontrak": 1000.0,
        "weight": 25.5,
        "order": 1,
        "activity": {
          "id": "cm456789012345678",
          "name": "Pekerjaan Galian",
          "order": 1,
          "project": {
            "id": "cm123456789012345",
            "pekerjaan": "Pembangunan Saluran Irigasi Primer",
            "penyediaJasa": "PT. Konstruksi Maju Jaya"
          }
        }
      },
      "user": {
        "id": "cmfb8i5yo0000vpgc5p776720",
        "name": "John Doe",
        "username": "johndoe",
        "email": "john.doe@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 85,
    "totalPages": 9,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "projectId": "cm123456789012345",
    "activityId": null,
    "subActivityId": null,
    "userId": "cmfb8i5yo0000vpgc5p776720",
    "search": "galian",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "sortBy": "updatedAt",
    "sortOrder": "desc"
  }
}
```

### Error Response (400 - Validation Error)
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Invalid query parameters",
  "details": {
    "issues": [
      {
        "path": ["page"],
        "message": "Number must be greater than or equal to 1"
      }
    ]
  }
}
```

### Error Response (500 - Database Error)
```json
{
  "success": false,
  "error": "Database Error",
  "message": "Failed to retrieve daily sub activities",
  "details": {
    "code": "P2002",
    "meta": {
      "target": ["field_name"]
    }
  }
}
```

### Error Response (500 - Internal Server Error)
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "details": "Error message details"
}
```

## Data Relations

API ini mengembalikan data daily sub activities dengan relasi berikut:
- **subActivity**: Detail sub activity yang dikerjakan
  - **activity**: Detail activity parent dari sub activity
    - **project**: Detail project yang memiliki activity
- **user**: Detail user yang melakukan entry daily activity

## Filter Hierarchy

Filter dapat diterapkan dengan hierarki sebagai berikut:
1. **subActivityId**: Paling spesifik, hanya menampilkan data untuk sub activity tertentu
2. **activityId**: Menampilkan semua daily sub activities untuk semua sub activities dalam satu activity
3. **projectId**: Menampilkan semua daily sub activities untuk semua activities dalam satu project

Jika tidak ada filter yang diterapkan, akan menampilkan semua daily sub activities untuk user yang ditentukan.

## Notes

1. **User Filter**: Filter berdasarkan user ID **SEMENTARA DINONAKTIFKAN** - API akan menampilkan data dari semua user
2. **Search**: Pencarian dilakukan pada field `name` dari sub activity (case-insensitive)
3. **Date Format**: Semua tanggal menggunakan format `YYYY-MM-DD`
4. **Sorting**: Default sorting adalah berdasarkan `updatedAt` dengan urutan `desc` (terbaru di atas)
5. **Pagination**: Maximum limit adalah 100 items per halaman untuk mencegah overload

## React Query Hook Usage

```typescript
import { useDailySubActivitiesList } from '@/hooks/useDailySubActivitiesList'

// Basic usage
const { data, isLoading, error } = useDailySubActivitiesList({
  page: 1,
  limit: 10,
  sortBy: 'updatedAt',
  sortOrder: 'desc'
})

// With search
const { data, isLoading, error } = useDailySubActivitiesList({
  search: 'galian',
  page: 1,
  limit: 20
})

// With project filter
const { data, isLoading, error } = useDailySubActivitiesList({
  projectId: 'cm123456789012345',
  startDate: '2024-01-01',
  endDate: '2024-01-31'
})
```

## React Native Infinite Scroll

API ini sudah compatible dengan infinite scroll di React Native. Lihat dokumentasi lengkap di: [DAILY_SUB_ACTIVITIES_REACT_NATIVE_INFINITE_SCROLL.md](./DAILY_SUB_ACTIVITIES_REACT_NATIVE_INFINITE_SCROLL.md)

### Key Points untuk Infinite Scroll:
- Gunakan `pagination.hasNext` untuk cek apakah ada data lebih
- Parameter `page` untuk load page berikutnya  
- Response format konsisten untuk setiap page
- Recommended `limit=20` untuk mobile performance optimal
