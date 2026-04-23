'use client'

import React, {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { 
  LayoutGrid, 
  List, 
  Search, 
  ArrowUpDown, 
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next-nprogress-bar'

/**
 * ===================================
 * Types & Interfaces
 * ===================================
 */
export type Stat = {
  id: string;
  label: string;
  value: number | string;
};

export type ProjectStatus = 'inProgress' | 'upcoming' | 'completed' | 'paused';

export type Project = {
  id: string;
  name: string;
  subtitle?: string;
  date?: string;
  progress?: number;
  status?: ProjectStatus;
  accentColor?: string;
  participants?: string[];
  daysLeft?: number | string;
  bgColorClass?: string;
};

export type SortBy = 'manual' | 'date' | 'name' | 'progress';
export type SortDir = 'asc' | 'desc';

export type ModernDashboardProps = {
  stats?: Stat[];
  projects: Project[];
  view?: 'grid' | 'list';
  defaultView?: 'grid' | 'list';
  searchQuery?: string;
  defaultSearchQuery?: string;
  sortBy?: SortBy;
  defaultSortBy?: SortBy;
  sortDir?: SortDir;
  defaultSortDir?: SortDir;
  pageSize?: number;
  className?: string;
  loading?: boolean;
  emptyProjectsLabel?: string;
};

/**
 * ===================================
 * Utilities
 * ===================================
 */
const cx = (...classes: Array<string | false | null | undefined>) => {
  return classes.filter(Boolean).join(' ')
}

const clamp = (n: number, min: number, max: number) => {
  return Math.min(Math.max(n, min), max)
}

/**
 * ===================================
 * Main Component
 * ===================================
 */
export function ModernDashboard({
  stats,
  projects,
  defaultView = 'grid',
  defaultSearchQuery = '',
  defaultSortBy = 'progress',
  defaultSortDir = 'desc',
  pageSize = 9,
  className = '',
  emptyProjectsLabel,
}: ModernDashboardProps) {
  const t = useTranslations('Dashboard')
  const router = useRouter()
  
  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultView)
  const [query, setQuery] = useState<string>(defaultSearchQuery)
  const [sortBy, setSortBy] = useState<SortBy>(defaultSortBy)
  const [sortDir, setSortDir] = useState<SortDir>(defaultSortDir)
  const [page, setPage] = useState<number>(1)

  // Filter and sort
  const preparedProjects = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = projects.slice()

    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.subtitle?.toLowerCase().includes(q) ?? false)
      )
    }

    list.sort((a, b) => {
      let cmp = 0
      switch (sortBy) {
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
        case 'progress':
          cmp = (a.progress ?? 0) - (b.progress ?? 0)
          break
        default:
          cmp = 0
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return list
  }, [projects, query, sortBy, sortDir])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(preparedProjects.length / pageSize))
  const currentPage = clamp(page, 1, totalPages)
  const pagedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return preparedProjects.slice(start, start + pageSize)
  }, [preparedProjects, currentPage, pageSize])

  // Reset page on filter change
  useEffect(() => {
    setPage(1)
  }, [query, sortBy, sortDir])

  const getStatRoute = (id: string): string | null => {
    switch (id) {
      case 'albums':
        return '/admin/album'
      case 'total':
      case 'public':
      case 'cameras':
        return '/admin/list'
      default:
        return null
    }
  }

  return (
    <div className={cx('flex flex-col w-full h-full bg-transparent', className)}>
      
      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => {
            const route = getStatRoute(s.id)
            const common =
              'bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors'

            if (!route) {
              return (
                <div key={s.id} className={common}>
                  <div className="text-sm text-slate-600 dark:text-slate-500 mb-1">{s.label}</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</div>
                </div>
              )
            }

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => router.push(route)}
                className={`${common} cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200`}
                aria-label={`跳转到 ${s.label}`}
              >
                <div className="text-sm text-slate-600 dark:text-slate-500 mb-1">{s.label}</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</div>
              </button>
            )
          })}
        </div>
      )}

      {/* Controls Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        
        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t('searchPlaceholder')}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 ml-auto">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
              <SelectTrigger className="w-[180px] px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <SelectValue placeholder={t('sortByProgress')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="progress">{t('sortByProgress')}</SelectItem>
                <SelectItem value="name">{t('sortByName')}</SelectItem>
              </SelectContent>
            </Select>

            <button
              onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
              aria-label="切换排序方向"
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <ArrowUpDown className={cx('size-4 text-slate-700 dark:text-slate-500 transition-transform', sortDir === 'asc' && 'rotate-180')} />
            </button>

            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1">
              <button
                onClick={() => setViewMode('list')}
                aria-label="切换为列表视图"
                className={cx(
                  'p-1.5 rounded-md transition-all duration-200',
                  viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                )}
              >
                <List className="size-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                aria-label="切换为网格视图"
                className={cx(
                  'p-1.5 rounded-md transition-all duration-200',
                  viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                )}
              >
                <LayoutGrid className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid/List */}
      <div className={cx(
        'flex-1',
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' 
          : 'flex flex-col gap-3'
      )}>
        {pagedProjects.map((p) => (
          <div
            key={p.id}
            className={cx(
              'group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200',
              viewMode === 'list' ? 'flex items-center p-4 gap-6' : 'p-5 flex flex-col'
            )}
          >
            {/* Header */}
            <div className={cx('flex justify-between items-start', viewMode === 'list' && 'w-64 shrink-0')}>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate pr-4" title={p.name}>
                  {p.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-500 mt-1">{p.subtitle}</p>
              </div>
            </div>

            {/* Progress */}
            <div className={cx('flex-1', viewMode === 'grid' && 'mt-6 mb-4')}>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-600 dark:text-slate-500">{t('visibility')}</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{p.progress}{t('percentPublic')}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${p.progress}%` }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className={cx(
              'flex items-center justify-between',
              viewMode === 'grid' ? 'mt-auto pt-4 border-t border-slate-100 dark:border-slate-700' : 'w-48 justify-end gap-4'
            )}>
              <div className="flex items-center gap-2">
                <span className={cx(
                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                  p.status === 'completed' 
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                )}>
                  {p.status === 'completed' ? t('allPublic') : t('hiddenItems')}
                </span>
              </div>
              
              <div className="text-xs text-slate-400">
                {p.daysLeft}
              </div>
            </div>
          </div>
        ))}

        {pagedProjects.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-600 dark:text-slate-500">
            {emptyProjectsLabel || t('noResults')}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-500">
            {t('pageInfo', { current: currentPage, total: totalPages })}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:focus:ring-0"
              aria-label="上一页"
              aria-disabled={currentPage === 1}
            >
              {t('previous')}
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:focus:ring-0"
              aria-label="下一页"
              aria-disabled={currentPage === totalPages}
            >
              {t('next')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
