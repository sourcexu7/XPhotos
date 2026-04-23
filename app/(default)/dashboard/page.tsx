'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { DashboardView, type PublicDashboardStats } from '~/components/public/dashboard/dashboard-view'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data, error, isLoading } = useSWR<PublicDashboardStats>(
    mounted ? '/api/v1/public/dashboard' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  )

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <DashboardView data={data} isLoading={isLoading} error={error} />
      </div>
    </div>
  )
}
