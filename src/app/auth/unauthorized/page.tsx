'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Shield, ArrowLeft, Home } from 'lucide-react'

/**
 * Unauthorized Access Page
 * Displayed when users try to access resources they don't have permission for
 * Provides clear messaging about insufficient permissions
 */

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">SIGER</h1>
          <p className="text-gray-600">
            Sistem Informasi Gerakan Nasional Rehabilitasi Hutan dan Lahan
          </p>
        </div>

        <Card className="rounded-2xl shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <Shield className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-xl text-orange-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertTitle>Insufficient Permissions</AlertTitle>
              <AlertDescription>
                You don&apos;t have permission to access this resource. Please contact your administrator
                if you believe this is an error.
              </AlertDescription>
            </Alert>

            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 font-medium text-gray-900">What you can do:</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Contact your system administrator for access</li>
                <li>• Return to the previous page</li>
                <li>• Go back to the main dashboard</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/monitoring-evaluasi">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>

              <Button variant="outline" onClick={() => window.history.back()} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>

            <div className="mt-4 text-center text-sm text-gray-600">
              <p>Need help? Contact your system administrator</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
