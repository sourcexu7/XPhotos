"use client";

import React, {
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { 
  LayoutGrid, 
  List, 
  Search, 
  ArrowUpDown, 
} from "lucide-react";
import { useTranslations } from 'next-intl';

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

export type ProjectStatus = "inProgress" | "upcoming" | "completed" | "paused";

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

export type SortBy = "manual" | "date" | "name" | "progress";
export type SortDir = "asc" | "desc";

export type ModernDashboardProps = {
  stats?: Stat[];
  projects: Project[];
  view?: "grid" | "list";
  defaultView?: "grid" | "list";
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
  return classes.filter(Boolean).join(" ");
};

const clamp = (n: number, min: number, max: number) => {
  return Math.min(Math.max(n, min), max);
};

/**
 * ===================================
 * Main Component
 * ===================================
 */
export function ModernDashboard({
  stats,
  projects,
  defaultView = "grid",
  defaultSearchQuery = "",
  defaultSortBy = "progress",
  defaultSortDir = "desc",
  pageSize = 9,
  className = "",
  emptyProjectsLabel,
}: ModernDashboardProps) {
  const t = useTranslations('Dashboard');
  
  // State
  const [viewMode, setViewMode] = useState<"grid" | "list">(defaultView);
  const [query, setQuery] = useState<string>(defaultSearchQuery);
  const [sortBy, setSortBy] = useState<SortBy>(defaultSortBy);
  const [sortDir, setSortDir] = useState<SortDir>(defaultSortDir);
  const [page, setPage] = useState<number>(1);

  const searchInputId = useId();

  // Filter and sort
  const preparedProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = projects.slice();

    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.subtitle?.toLowerCase().includes(q) ?? false)
      );
    }

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "progress":
          cmp = (a.progress ?? 0) - (b.progress ?? 0);
          break;
        default:
          cmp = 0;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [projects, query, sortBy, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(preparedProjects.length / pageSize));
  const currentPage = clamp(page, 1, totalPages);
  const pagedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return preparedProjects.slice(start, start + pageSize);
  }, [preparedProjects, currentPage, pageSize]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [query, sortBy, sortDir]);

  return (
    <div className={cx("flex flex-col w-full h-full bg-transparent", className)}>
      
      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">{s.label}</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Controls Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        
        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            id={searchInputId}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none"
            >
              <option value="progress">{t('sortByProgress')}</option>
              <option value="name">{t('sortByName')}</option>
            </select>

            <button
              onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowUpDown className={cx("size-4 text-slate-600 dark:text-slate-400 transition-transform", sortDir === "asc" && "rotate-180")} />
            </button>

            <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
              <button
                onClick={() => setViewMode("list")}
                className={cx(
                  "p-1.5 rounded-md transition-colors",
                  viewMode === "list" ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <List className="size-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cx(
                  "p-1.5 rounded-md transition-colors",
                  viewMode === "grid" ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100" : "text-slate-400 hover:text-slate-600"
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
        "flex-1",
        viewMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" 
          : "flex flex-col gap-3"
      )}>
        {pagedProjects.map((p) => (
          <div
            key={p.id}
            className={cx(
              "group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200",
              viewMode === "list" ? "flex items-center p-4 gap-6" : "p-5 flex flex-col"
            )}
          >
            {/* Header */}
            <div className={cx("flex justify-between items-start", viewMode === "list" && "w-64 shrink-0")}>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate pr-4" title={p.name}>
                  {p.name}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{p.subtitle}</p>
              </div>
            </div>

            {/* Progress */}
            <div className={cx("flex-1", viewMode === "grid" && "mt-6 mb-4")}>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-500 dark:text-slate-400">{t('visibility')}</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{p.progress}{t('percentPublic')}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${p.progress}%` }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className={cx(
              "flex items-center justify-between",
              viewMode === "grid" ? "mt-auto pt-4 border-t border-slate-100 dark:border-slate-800" : "w-48 justify-end gap-4"
            )}>
              <div className="flex items-center gap-2">
                <span className={cx(
                  "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                  p.status === 'completed' 
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
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
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
            {emptyProjectsLabel || t('noResults')}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {t('pageInfo', { current: currentPage, total: totalPages })}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {t('previous')}
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {t('next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
