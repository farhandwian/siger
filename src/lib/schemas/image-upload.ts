// src/lib/schemas/image-upload.ts
import { z } from 'zod'

/**
 * Schema untuk response upload image
 */
export const ImageUploadResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    fileName: z.string(),
    path: z.string(),
    url: z.string().optional(), // Optional URL untuk akses langsung
    size: z.number(),
    mimeType: z.string(),
  }),
  message: z.string().optional(),
})

/**
 * Schema untuk request delete image
 */
export const DeleteImageRequestSchema = z.object({
  fileName: z.string(),
  bucket: z.string().optional(), // Optional, akan use default jika tidak ada
})

/**
 * Schema untuk response delete image
 */
export const DeleteImageResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})

export type ImageUploadResponse = z.infer<typeof ImageUploadResponseSchema>
export type DeleteImageRequest = z.infer<typeof DeleteImageRequestSchema>
export type DeleteImageResponse = z.infer<typeof DeleteImageResponseSchema>
