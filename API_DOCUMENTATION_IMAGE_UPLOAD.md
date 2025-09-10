# Image Upload API Documentation

## Overview
API untuk mengelola upload dan delete gambar yang terintegrasi dengan React Native mobile app. Gambar disimpan di MinIO storage dengan sistem penamaan yang unique dan terorganisir berdasarkan tanggal.

## Endpoints

### 1. Upload Image
**POST** `/api/upload-image`

Upload gambar ke MinIO storage dengan validasi dan auto-generate unique filename.

#### Request
- **Content-Type**: `multipart/form-data`
- **Body**: FormData dengan field `file` berisi image file

#### Example Request (React Native)
```typescript
const uploadImage = async (imageUri: string, fileName: string, fileType: string) => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: fileType,
    name: fileName,
  } as any);

  const response = await fetch(`${API_BASE_URL}/api/upload-image`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.json();
};
```

#### Response Success (200)
```typescript
{
  "success": true,
  "data": {
    "fileName": "1726048320123_abc123def_photo.jpg",    // Unique generated filename
    "path": "images/2024/09/1726048320123_abc123def_photo.jpg", // Full path in MinIO
    "url": "https://s3.keenos.id/siger/images/2024/09/1726048320123_abc123def_photo.jpg?...", // Presigned URL (optional)
    "size": 2048576,        // File size in bytes
    "mimeType": "image/jpeg" // MIME type
  }
}
```

#### Response Error (400/500)
```typescript
{
  "success": false,
  "message": "File size exceeds 5MB limit" // Error message
}
```

#### Validation Rules
- **File Type**: Only images allowed (`image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`)
- **File Size**: Maximum 5MB
- **Required Field**: `file` field must be present in FormData

#### Generated Filename Format
- Pattern: `{timestamp}_{randomString}_{originalName}.{extension}`
- Example: `1726048320123_abc123def_photo.jpg`
- Path: `images/{YYYY}/{MM}/{filename}`

---

### 2. Delete Image  
**DELETE** `/api/delete-image`

Hapus gambar dari MinIO storage berdasarkan filename.

#### Request
- **Content-Type**: `application/json`
- **Body**:
```typescript
{
  "fileName": "images/2024/09/1726048320123_abc123def_photo.jpg", // Required: full path or just filename
  "bucket": "siger" // Optional: bucket name (default from env)
}
```

#### Example Request (React Native)
```typescript
const deleteImage = async (fileName: string) => {
  const response = await fetch(`${API_BASE_URL}/api/delete-image`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: fileName,
    }),
  });

  return response.json();
};
```

#### Response Success (200)
```typescript
{
  "success": true,
  "message": "File images/2024/09/1726048320123_abc123def_photo.jpg deleted successfully"
}
```

#### Response Error (404/500)
```typescript
{
  "success": false,
  "message": "File not found in bucket siger"
}
```

---

## Integration dengan Daily Sub Activities

### Upload Flow
1. **Upload Image**: POST `/api/upload-image` → Get `fileName` dan `path`
2. **Submit Activity**: POST `/api/daily-sub-activities-update` dengan field `files`

### Example Integration
```typescript
// 1. Upload semua gambar terlebih dahulu
const uploadedFiles = await Promise.all(
  images.map(async (image) => {
    const result = await uploadImage(image.uri, image.name, image.type);
    if (result.success) {
      return {
        file: result.data.fileName,
        path: result.data.path,
      };
    }
    return null;
  })
);

// 2. Filter hanya yang berhasil upload
const validFiles = uploadedFiles.filter(Boolean);

// 3. Submit activity dengan files
const activityPayload = {
  sub_activities_id: "...",
  user_id: "...",
  // ... fields lain
  files: validFiles, // Format yang dibutuhkan API daily-sub-activities-update
};

await fetch(`${API_BASE_URL}/api/daily-sub-activities-update`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(activityPayload),
});
```

---

## Environment Variables

Pastikan environment variables berikut sudah di-set di `.env.local`:

```bash
# MinIO Configuration
MINIO_HOST=s3.keenos.id
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET_NAME=siger
```

---

## Error Handling

### Common Error Responses

#### 400 - Bad Request
- No file provided
- Invalid file type
- File size exceeds limit
- Invalid request format

#### 404 - Not Found  
- File not found (for delete)

#### 500 - Server Error
- MinIO connection error
- Upload/delete operation failed

### Error Response Format
```typescript
{
  "success": false,
  "message": "Descriptive error message"
}
```

---

## File Organization

### MinIO Structure
```
bucket: siger/
├── images/
│   ├── 2024/
│   │   ├── 09/
│   │   │   ├── 1726048320123_abc123def_photo1.jpg
│   │   │   ├── 1726048320456_def456ghi_photo2.png
│   │   │   └── ...
│   │   ├── 10/
│   │   └── ...
│   └── 2025/
└── ...
```

### Benefits
- **Organized**: Files grouped by year/month
- **Unique Names**: No filename conflicts
- **Scalable**: Easy to manage large number of files
- **Traceable**: Timestamp embedded in filename

---

## Testing

### Health Check Endpoints
- `GET /api/upload-image` - Check upload API status
- `GET /api/delete-image` - Check delete API status

### Manual Testing
```bash
# Test upload
curl -X POST http://localhost:3000/api/upload-image \
  -F "file=@/path/to/test-image.jpg"

# Test delete  
curl -X DELETE http://localhost:3000/api/delete-image \
  -H "Content-Type: application/json" \
  -d '{"fileName":"images/2024/09/test_file.jpg"}'
```

---

## Security Considerations

1. **File Type Validation**: Only images allowed
2. **File Size Limit**: 5MB maximum
3. **Unique Filenames**: Prevents overwriting
4. **Presigned URLs**: Temporary access (7 days)
5. **Environment Variables**: Sensitive data not in code

---

## Performance Tips

1. **Parallel Uploads**: Upload multiple files simultaneously
2. **Client-side Validation**: Check file size/type before upload
3. **Compression**: Consider image compression on client
4. **Error Handling**: Implement retry logic for failed uploads
5. **Progress Tracking**: Show upload progress to users
