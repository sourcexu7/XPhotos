'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { DashboardView, type PublicDashboardStats } from '~/components/public/dashboard/dashboard-view'
import AdminPageHeader from '~/components/admin/layout/page-header'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DataOverviewPage() {
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

  return (
    <div className="p-6">
      <AdminPageHeader 
        title="数据一览" 
        description="公开统计数据展示" 
      />
      <DashboardView data={data} isLoading={isLoading} error={error} />
    </div>
  )
}
