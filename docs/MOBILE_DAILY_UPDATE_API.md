# API Documentation: PUT /api/daily-sub-activities-update

## Overview
API ini digunakan untuk mengupdate progress harian aktivitas konstruksi dari aplikasi mobile. API akan otomatis menghitung dan mengupdate progress mingguan di sistem.

## Endpoint
```
PUT /api/daily-sub-activities-update
```

## Request Headers
```
Content-Type: application/json
```

## Request Body Schema
```json
{
  "sub_activities_id": "string (required)",
  "koordinat": {
    "latitude": "number (optional)",
    "longitude": "number (optional)"
  },
  "catatan_kegiatan": "string (optional)",
  "tanggal_progres": "string (required, format: YYYY-MM-DD)",
  "progres_realisasi_per_hari": "number (required, 0-100)",
  "files": [
    {
      "file": "string (filename)",
      "path": "string (file path)"
    }
  ]
}
```

## Field Descriptions
- **sub_activities_id**: ID dari sub aktivitas yang akan diupdate progressnya
- **koordinat**: GPS coordinates tempat pekerjaan (opsional)
  - latitude: Koordinat lintang
  - longitude: Koordinat bujur
- **catatan_kegiatan**: Catatan atau deskripsi pekerjaan yang dilakukan (opsional)
- **tanggal_progres**: Tanggal progress dalam format YYYY-MM-DD (wajib)
- **progres_realisasi_per_hari**: Persentase progress yang dicapai hari ini (0-100, wajib)
- **files**: Array file yang diupload (opsional)
  - file: Nama file
  - path: Path lokasi file

## Example Request
```json
{
  "sub_activities_id": "cm0txl9yk00015wjn8h2r3k7c",
  "koordinat": {
    "latitude": -6.2088,
    "longitude": 106.8456
  },
  "catatan_kegiatan": "Pekerjaan pembersihan lahan area selatan selesai. Ditemukan beberapa pohon besar yang perlu dipotong.",
  "tanggal_progres": "2025-09-08",
  "progres_realisasi_per_hari": 25.5,
  "files": [
    {
      "file": "pembersihan_lahan_1.jpg",
      "path": "/uploads/2025/09/08/pembersihan_lahan_1.jpg"
    },
    {
      "file": "pembersihan_lahan_2.jpg",
      "path": "/uploads/2025/09/08/pembersihan_lahan_2.jpg"
    }
  ]
}
```

## Success Response (200)
```json
{
  "success": true,
  "data": {
    "id": "daily_activity_001",
    "subActivityId": "cm0txl9yk00015wjn8h2r3k7c",
    "koordinat": {
      "latitude": -6.2088,
      "longitude": 106.8456
    },
    "catatanKegiatan": "Pekerjaan pembersihan lahan area selatan selesai. Ditemukan beberapa pohon besar yang perlu dipotong.",
    "file": [
      {
        "file": "pembersihan_lahan_1.jpg",
        "path": "/uploads/2025/09/08/pembersihan_lahan_1.jpg"
      },
      {
        "file": "pembersihan_lahan_2.jpg",
        "path": "/uploads/2025/09/08/pembersihan_lahan_2.jpg"
      }
    ],
    "progresRealisasiPerHari": 25.5,
    "tanggalProgres": "2025-09-08",
    "createdAt": "2025-09-08T10:30:15.123Z",
    "updatedAt": "2025-09-08T10:30:15.123Z"
  },
  "message": "Daily progress updated successfully"
}
```

## Error Responses

### 400 - Bad Request (Validation Error)
```json
{
  "success": false,
  "error": "Invalid request data",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["sub_activities_id"],
      "message": "Sub activity ID is required"
    }
  ]
}
```

### 404 - Not Found
```json
{
  "success": false,
  "error": "Sub activity not found"
}
```

### 500 - Internal Server Error
```json
{
  "success": false,
  "error": "Failed to update daily progress"
}
```

## Business Logic

### 1. Data Validation
- Memvalidasi semua input sesuai schema
- Memastikan `sub_activities_id` valid dan ada di database
- Format tanggal harus YYYY-MM-DD
- Progress harus antara 0-100

### 2. Week Calculation
- Sistem menghitung minggu berdasarkan tanggal progress
- Menggunakan sistem Senin-Minggu
- Menentukan tahun, bulan, dan minggu ke berapa

### 3. Data Update Process
- **Step 1**: Create/update record di tabel `daily_sub_activities`
- **Step 2**: Hitung total progress mingguan dari semua daily activities dalam minggu yang sama
- **Step 3**: Update/create record di tabel `activity_schedules` dengan total progress mingguan
- **Step 4**: Proses menggunakan database transaction untuk konsistensi data

### 4. Real-time Sync
- Activity Schedule Table di web akan otomatis refresh setiap 15 detik
- Update dari mobile akan terlihat di web dalam maksimal 15 detik

## Usage Examples for Mobile Development

### React Native / Expo
```javascript
const updateDailyProgress = async (progressData) => {
  try {
    const response = await fetch('http://your-api-url/api/daily-sub-activities-update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(progressData),
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Progress updated successfully:', result.data);
      return result.data;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Failed to update progress:', error);
    throw error;
  }
};

// Usage
const progressData = {
  sub_activities_id: "cm0txl9yk00015wjn8h2r3k7c",
  koordinat: {
    latitude: -6.2088,
    longitude: 106.8456
  },
  catatan_kegiatan: "Pekerjaan selesai sesuai target",
  tanggal_progres: "2025-09-08",
  progres_realisasi_per_hari: 30.0,
  files: []
};

updateDailyProgress(progressData);
```

### Flutter
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<Map<String, dynamic>> updateDailyProgress(Map<String, dynamic> progressData) async {
  final url = Uri.parse('http://your-api-url/api/daily-sub-activities-update');
  
  final response = await http.put(
    url,
    headers: {
      'Content-Type': 'application/json',
    },
    body: jsonEncode(progressData),
  );
  
  final result = jsonDecode(response.body);
  
  if (result['success']) {
    print('Progress updated successfully: ${result['data']}');
    return result['data'];
  } else {
    throw Exception(result['error']);
  }
}

// Usage
final progressData = {
  'sub_activities_id': 'cm0txl9yk00015wjn8h2r3k7c',
  'koordinat': {
    'latitude': -6.2088,
    'longitude': 106.8456
  },
  'catatan_kegiatan': 'Pekerjaan selesai sesuai target',
  'tanggal_progres': '2025-09-08',
  'progres_realisasi_per_hari': 30.0,
  'files': []
};

updateDailyProgress(progressData);
```

## Testing
Untuk testing, gunakan data berikut:
```bash
curl -X PUT http://localhost:3000/api/daily-sub-activities-update \
  -H "Content-Type: application/json" \
  -d '{
    "sub_activities_id": "sub_activity_id_from_database",
    "koordinat": {
      "latitude": -6.2088,
      "longitude": 106.8456
    },
    "catatan_kegiatan": "Test progress dari mobile",
    "tanggal_progres": "2025-09-08",
    "progres_realisasi_per_hari": 15.5,
    "files": [
      {
        "file": "test.jpg",
        "path": "/uploads/test.jpg"
      }
    ]
  }'
```

## Notes for Mobile Development
1. **GPS Permission**: Pastikan aplikasi mobile meminta permission untuk GPS
2. **File Upload**: Implement file upload terlebih dahulu, kemudian gunakan path hasil upload di API ini
3. **Offline Support**: Pertimbangkan menyimpan data offline dan sync ketika ada koneksi
4. **Progress Validation**: Validasi input progress di client side sebelum kirim ke API
5. **Error Handling**: Implement proper error handling untuk berbagai scenario error
6. **Date Format**: Pastikan format tanggal selalu YYYY-MM-DD
7. **Progress Calculation**: Progress adalah nilai absolut untuk hari itu, bukan kumulatif
