// src/lib/minio.ts
import { Client } from 'minio'

/**
 * MinIO Client Configuration
 * Menggunakan kredensial dari environment variables
 */
const minioClient = new Client({
  endPoint: process.env.MINIO_HOST || 's3.keenos.id',
  port: 443, // HTTPS port
  useSSL: true, // Menggunakan HTTPS
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
})

export { minioClient }

/**
 * Generate unique filename untuk menghindari konflik
 * Format: timestamp_randomstring_originalname
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substr(2, 9)
  const extension = originalName.split('.').pop()
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')

  return `${timestamp}_${randomString}_${nameWithoutExt}.${extension}`
}

/**
 * Generate path untuk menyimpan file
 * Format: images/YYYY/MM/filename
 */
export function generateImagePath(fileName: string): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')

  return `images/${year}/${month}/${fileName}`
}

/**
 * Validate file type - hanya accept image files
 */
export function isValidImageType(mimeType: string): boolean {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  return allowedTypes.includes(mimeType.toLowerCase())
}

/**
 * Validate file size - maksimal 5MB
 */
export function isValidFileSize(size: number, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024 // Convert MB to bytes
  return size <= maxSizeBytes
}

/**
 * Get bucket name from environment
 */
export function getBucketName(): string {
  return process.env.MINIO_BUCKET_NAME || 'siger'
}
