# API Documentation for Mobile Execution

## Overview
These APIs are designed for mobile applications to handle daily progress updates for construction activities.

## Endpoints

### 1. GET /api/full-projects
**Description**: Retrieve all projects with their activities and sub-activities

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search term for project name or contractor

**Response Example**:
```json
{
  "success": true,
  "data": [
    {
      "id": "cm0txl9yk00015wjn8h2r3k7b",
      "pekerjaan": "Pembangunan Irigasi Desa Sukamaju",
      "penyediaJasa": "CV Maju Bersama",
      "nilaiKontrak": "Rp 5,500,000,000",
      "tanggalKontrak": "2025-01-15",
      "akhirKontrak": "2025-12-15",
      "fisikProgress": 25.5,
      "fisikTarget": 100,
      "activities": [
        {
          "id": "act001",
          "name": "Pekerjaan Persiapan",
          "order": 1,
          "subActivities": [
            {
              "id": "sub001",
              "name": "Pembersihan Lahan",
              "satuan": "m2",
              "volumeKontrak": 1500.0,
              "weight": 15.0,
              "order": 1
            }
          ]
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

### 2. PUT /api/daily-sub-activities-update
**Description**: Update daily progress for a sub-activity

**Request Body**:
```json
{
  "sub_activities_id": "sub001",
  "koordinat": {
    "latitude": -6.2088,
    "longitude": 106.8456
  },
  "catatan_kegiatan": "Pekerjaan pembersihan lahan selesai 50%",
  "tanggal_progres": "2025-09-08",
  "progres_realisasi_per_hari": 15.5,
  "files": [
    {
      "file": "photo1.jpg",
      "path": "/uploads/2025/09/08/photo1.jpg"
    },
    {
      "file": "photo2.jpg", 
      "path": "/uploads/2025/09/08/photo2.jpg"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "daily_001",
    "subActivityId": "sub001",
    "koordinat": {
      "latitude": -6.2088,
      "longitude": 106.8456
    },
    "catatanKegiatan": "Pekerjaan pembersihan lahan selesai 50%",
    "progresRealisasiPerHari": 15.5,
    "tanggalProgres": "2025-09-08",
    "createdAt": "2025-09-08T10:30:00Z",
    "updatedAt": "2025-09-08T10:30:00Z"
  },
  "message": "Daily progress updated successfully"
}
```

**Functionality**:
- Creates or updates daily progress record
- Automatically calculates and updates weekly progress in `activity_schedules` table
- Uses transaction for data consistency
- Week calculation follows Monday-Sunday pattern

### 3. GET /api/latest-daily-sub-activities
**Description**: Get the latest daily activities for the most recent date

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `projectId` (optional): Filter by specific project

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "daily_001",
      "subActivityId": "sub001",
      "koordinat": {
        "latitude": -6.2088,
        "longitude": 106.8456
      },
      "catatanKegiatan": "Pekerjaan pembersihan lahan selesai 50%",
      "file": [
        {
          "file": "photo1.jpg",
          "path": "/uploads/2025/09/08/photo1.jpg"
        }
      ],
      "progresRealisasiPerHari": 15.5,
      "tanggalProgres": "2025-09-08",
      "createdAt": "2025-09-08T10:30:00Z",
      "updatedAt": "2025-09-08T10:30:00Z",
      "subActivity": {
        "id": "sub001",
        "name": "Pembersihan Lahan",
        "satuan": "m2",
        "volumeKontrak": 1500.0,
        "weight": 15.0,
        "activity": {
          "id": "act001",
          "name": "Pekerjaan Persiapan",
          "project": {
            "id": "proj001",
            "pekerjaan": "Pembangunan Irigasi Desa Sukamaju",
            "penyediaJasa": "CV Maju Bersama"
          }
        }
      }
    }
  ],
  "latestDate": "2025-09-08",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": [] // Additional error details for validation errors
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

## Week Calculation Logic

The system uses the following logic for week calculation:
1. Week runs Monday-Sunday
2. Week number is calculated based on the month
3. Each month has 4-5 weeks depending on the calendar
4. When updating daily progress, the system finds the corresponding week and updates the weekly totals

## Real-time Updates

- Activity Schedule Table automatically refetches data every 15 seconds
- This ensures that any mobile updates are reflected in the web interface quickly
- The refetch continues even when the browser tab is not active
