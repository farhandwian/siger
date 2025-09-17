'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateAddendum } from '@/hooks/useAddendum'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus } from 'lucide-react'

// Create a form-specific schema that works with react-hook-form
const CreateAddendumFormSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  effectiveDate: z.string().min(1, 'Effective date is required'),
  weekNumber: z.number().int().positive().min(1, 'Week number must be positive'),
})

type CreateAddendumFormData = z.infer<typeof CreateAddendumFormSchema>

/**
 * CreateAddendumModal Component
 * 
 * Modal dialog for creating a new addendum
 * Includes form validation and API integration
 */
interface CreateAddendumModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectTitle?: string
}

export function CreateAddendumModal({
  isOpen,
  onClose,
  projectId,
  projectTitle
}: CreateAddendumModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createAddendum = useCreateAddendum()

  // Form setup with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<CreateAddendumFormData>({
    resolver: zodResolver(CreateAddendumFormSchema),
    defaultValues: {
      projectId,
      title: '',
      description: '',
      effectiveDate: '',
      weekNumber: 1,
    }
  })

  // Close modal and reset form
  const handleClose = () => {
    reset()
    onClose()
  }

  // Form submission handler
  const onSubmit = async (data: CreateAddendumFormData) => {
    setIsSubmitting(true)
    
    try {
      // Convert the form data to the API format
      const apiData = {
        ...data,
        effectiveDate: new Date(data.effectiveDate),
        description: data.description || undefined,
      }
      await createAddendum.mutateAsync(apiData)
      handleClose()
    } catch (error) {
      // Error is handled by the mutation itself
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error creating addendum:', error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Buat Addendum Baru
          </DialogTitle>
          <DialogDescription>
            Buat addendum untuk proyek: {projectTitle || 'Proyek yang dipilih'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Judul Addendum <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Masukkan judul addendum"
              {...register('title')}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Deskripsi
            </Label>
            <Textarea
              id="description"
              placeholder="Masukkan deskripsi addendum (opsional)"
              rows={3}
              {...register('description')}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Date and Week Number Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Effective Date */}
            <div className="space-y-2">
              <Label htmlFor="effectiveDate" className="text-sm font-medium">
                Tanggal Berlaku <span className="text-red-500">*</span>
              </Label>
              <Input
                id="effectiveDate"
                type="date"
                {...register('effectiveDate')}
                className={errors.effectiveDate ? 'border-red-500' : ''}
              />
              {errors.effectiveDate && (
                <p className="text-sm text-red-600">{errors.effectiveDate.message}</p>
              )}
            </div>

            {/* Week Number */}
            <div className="space-y-2">
              <Label htmlFor="weekNumber" className="text-sm font-medium">
                Minggu Mulai Berlaku <span className="text-red-500">*</span>
              </Label>
              <Input
                id="weekNumber"
                type="number"
                min="1"
                placeholder="1"
                {...register('weekNumber', { valueAsNumber: true })}
                className={errors.weekNumber ? 'border-red-500' : ''}
              />
              {errors.weekNumber && (
                <p className="text-sm text-red-600">{errors.weekNumber.message}</p>
              )}
            </div>
          </div>

          {/* Information Alert */}
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Catatan:</strong> Setelah addendum dibuat, status proyek akan berubah menjadi 
              &quot;Draft Addendum&quot; dan jadwal hanya dapat diedit mulai dari minggu ke-{watch('weekNumber') || 1} ke depan.
            </AlertDescription>
          </Alert>

          {/* Error Display */}
          {createAddendum.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {createAddendum.error instanceof Error 
                  ? createAddendum.error.message 
                  : 'Terjadi kesalahan saat membuat addendum'}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Membuat...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Buat Addendum
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
