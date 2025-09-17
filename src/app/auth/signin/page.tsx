'use client'

import { useState, Suspense } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff } from 'lucide-react'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { AnimatedDotPattern } from '@/components/shared/animated-dot-pattern'
import { AnimatedMapMarker } from '@/components/shared/animated-map-marker'
import { SigerLogo } from '@/components/shared/siger-logo'

/**
 * Sign In Page Component
 * Redesigned to match Figma mockup with animations and modern UI
 * Features animated backgrounds, floating markers, and improved UX
 */

const SignInSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

type SignInFormData = z.infer<typeof SignInSchema>

function SignInForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<SignInFormData>({
    email: '',
    password: '',
  })
  const [validationErrors, setValidationErrors] = useState<Partial<SignInFormData>>({})

  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/monitoring-evaluasi'

  const validateForm = (data: SignInFormData): boolean => {
    try {
      SignInSchema.parse(data)
      setValidationErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<SignInFormData> = {}
        error.errors.forEach(err => {
          if (err.path[0]) {
            errors[err.path[0] as keyof SignInFormData] = err.message
          }
        })
        setValidationErrors(errors)
      }
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm(formData)) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email atau password tidak valid')
      } else {
        // Wait for session to be established
        const session = await getSession()
        if (session) {
          router.push(callbackUrl)
          router.refresh()
        }
      }
    } catch (error) {
      setError('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange =
    (field: keyof SignInFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }))
      // Clear validation error when user starts typing
      if (validationErrors[field]) {
        setValidationErrors(prev => ({ ...prev, [field]: undefined }))
      }
      if (error) setError(null)
    }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* Dark background with animated dot pattern */}
      <div className="fixed inset-0 z-0 bg-[#0F1419]">
        <AnimatedDotPattern />
      </div>

      {/* Left side - Form container */}
      <div className="relative z-20 flex w-full items-center justify-center px-6 lg:w-1/2 lg:px-12">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-12"
          >
            <SigerLogo />
          </motion.div>

          {/* Form Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col gap-8"
          >
            {/* Title Section */}
            <div className="space-y-3">
              <h1 className="text-4xl font-bold leading-tight text-white">Masuk Akun</h1>
              <p className="text-lg text-gray-400">Silahkan masukkan email dan password</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 p-4"
                >
                  <Alert variant="destructive" className="border-0 bg-transparent p-0">
                    <AlertDescription className="text-red-400">{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <div className="space-y-4">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-white">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    disabled={isLoading}
                    required
                    className={`h-12 rounded-lg border-gray-200 bg-white text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 ${
                      validationErrors.email ? 'border-red-500' : ''
                    }`}
                    placeholder="Email"
                  />
                  {validationErrors.email && (
                    <p className="text-xs text-red-400">{validationErrors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-white">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange('password')}
                      disabled={isLoading}
                      required
                      className={`h-12 rounded-lg border-gray-200 bg-white pr-12 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 ${
                        validationErrors.password ? 'border-red-500' : ''
                      }`}
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="text-xs text-red-400">{validationErrors.password}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full transform rounded-lg bg-[#ffc928] font-semibold text-[#1a365d] transition-all duration-200 hover:scale-[1.02] hover:bg-[#ffc928]/90 active:scale-[0.98] disabled:transform-none disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? 'Memproses...' : 'Masuk'}
              </Button>
            </form>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-16 max-w-xs text-sm text-gray-400"
          >
            DIREKTORAT JENDERAL SUMBER DAYA AIR KEMENTRIAN PEKERJAAN UMUM
          </motion.div>
        </motion.div>
      </div>

      {/* Right side - Floating marker and empty space */}
      <div className="relative hidden items-center justify-center lg:flex lg:w-1/2">
        <AnimatedMapMarker />
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="relative flex min-h-screen overflow-hidden">
        <div className="fixed inset-0 z-0 bg-[#0F1419]">
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-white">Loading...</div>
          </div>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
