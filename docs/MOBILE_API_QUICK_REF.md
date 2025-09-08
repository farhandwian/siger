# Quick Reference: Mobile Daily Progress API

## API Endpoint
```
PUT /api/daily-sub-activities-update
```

## Required Payload
```json
{
  "sub_activities_id": "string",
  "tanggal_progres": "YYYY-MM-DD", 
  "progres_realisasi_per_hari": 0-100
}
```

## Optional Fields
```json
{
  "koordinat": {
    "latitude": number,
    "longitude": number
  },
  "catatan_kegiatan": "string",
  "files": [
    {
      "file": "filename.jpg",
      "path": "/upload/path/filename.jpg"
    }
  ]
}
```

## Success Response
```json
{
  "success": true,
  "data": { /* updated record */ },
  "message": "Daily progress updated successfully"
}
```

## For Mobile Prompting:

**"Create a mobile app feature that:**
1. **Shows list of sub-activities** from `/api/full-projects`
2. **Has a daily progress form** with:
   - Sub-activity selection
   - Progress percentage input (0-100)
   - GPS coordinates (auto-capture)
   - Notes text field
   - Photo upload (multiple)
   - Date picker (default today)
3. **Submits to** `PUT /api/daily-sub-activities-update`
4. **Handles success/error responses**
5. **Shows confirmation message**

**Key Requirements:**
- GPS permission for coordinates
- Camera permission for photos  
- File upload before API call
- Progress validation (0-100)
- Date format: YYYY-MM-DD
- Error handling for network/validation
- Offline storage option"

## Sample Request for Testing:
```javascript
{
  "sub_activities_id": "get_from_full_projects_api",
  "koordinat": {
    "latitude": -6.2088,
    "longitude": 106.8456
  },
  "catatan_kegiatan": "Pekerjaan pembersihan selesai",
  "tanggal_progres": "2025-09-08",
  "progres_realisasi_per_hari": 25.5,
  "files": [
    {
      "file": "progress_photo.jpg",
      "path": "/uploads/2025/09/08/progress_photo.jpg"
    }
  ]
}
```
