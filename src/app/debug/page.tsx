'use client'

import { useEffect, useState } from 'react'

export default function DebugPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        console.log('Projects data:', data)
        setProjects(data.data || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Error:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Debug Page</h1>
      <h2 className="mb-2 text-xl">Projects ({projects.length}):</h2>
      <pre className="overflow-auto rounded bg-gray-100 p-4 text-sm">
        {JSON.stringify(projects, null, 2)}
      </pre>
    </div>
  )
}
