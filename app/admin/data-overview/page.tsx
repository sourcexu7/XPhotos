'use client'

import { useEffect, useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { DashboardView, type PublicDashboardStats } from '~/components/public/dashboard/dashboard-view'
import AdminPageHeader from '~/components/admin/layout/page-header'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DataOverviewPage() {
  const [mounted, setMounted] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const { mutate } = useSWRConfig()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const { data, error, isLoading } = useSWR<PublicDashboardStats>(
    mounted ? '/api/v1/public/dashboard' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  )

  const handleClearCache = async () => {
    const confirmed = window.confirm(
      '确定要清空所有 Redis 缓存吗？\n\n清除后系统将从数据库重新拉取数据，可能短暂增加数据库压力。'
    )
    if (!confirmed) return

    try {
      setClearing(true)
      const res = await fetch('/api/v1/settings/cache/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error(`请求失败：${res.status}`)
      const body = await res.json().catch(() => ({}))
      const deleted = typeof body?.data?.deleted === 'number' ? body.data.deleted : undefined

      // 让前台 SWR 重新拉取最新数据（不走本地 stale 缓存）
      await mutate(
        (key) => typeof key === 'string' && key.startsWith('/api/'),
        undefined,
        { revalidate: true }
      )

      setToast({
        type: 'success',
        message:
          typeof deleted === 'number'
            ? `缓存已清除，共删除 ${deleted} 条 key`
            : '缓存已清除',
      })
    } catch (e) {
      console.error(e)
      setToast({
        type: 'error',
        message: e instanceof Error ? `清除失败：${e.message}` : '清除失败',
      })
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="p-6 relative">
      <AdminPageHeader title="数据一览" description="公开统计数据展示" />

      <div className="flex items-start justify-between mb-4">
        <div />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearCache}
            disabled={clearing}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="一键清除 Redis 缓存"
          >
            {clearing ? '正在清除…' : '一键清除 Redis 缓存'}
          </button>
        </div>
      </div>

      <DashboardView data={data} isLoading={isLoading} error={error} />

      {toast && (
        <div
          role="status"
          className={
            'fixed bottom-6 right-6 z-50 px-4 py-2 rounded-lg shadow-lg text-sm border ' +
            (toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/30 dark:border-rose-700 dark:text-rose-300')
          }
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
