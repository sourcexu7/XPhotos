'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { MapPin, Calendar } from 'lucide-react'

interface Guide {
  id: string
  title: string
  country: string
  city: string
  days: number
  start_date?: string
  end_date?: string
  cover_image?: string
  content?: any
  show: number
  sort: number
  createdAt: string
}

function formatRange(start?: string, end?: string): string {
  const s = start ? new Date(start) : null
  const e = end ? new Date(end) : null
  if (!s && !e) return ''
  const fmt = (d: Date) =>
    `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  if (s && e) return `${fmt(s)} - ${fmt(e)}`
  return fmt((s ?? e)!)
}

export default function GuidesPage() {
  const [guides, setGuides] = useState<Guide[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/v1/public/guides')
        const result = await res.json()
        if (!cancelled && Array.isArray(result.data)) {
          const sorted = [...result.data].sort(
            (a, b) => (a.sort ?? 0) - (b.sort ?? 0),
          )
          setGuides(sorted)
        }
      } catch (error) {
        console.error('Failed to fetch guides:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const meta = useMemo(() => {
    const total = guides.length
    const countries = new Set(guides.map((g) => g.country).filter(Boolean)).size
    const days = guides.reduce((sum, g) => sum + (Number(g.days) || 0), 0)
    return { total, countries, days }
  }, [guides])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <section className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-8 sm:pb-10">
        <div className="max-w-6xl mx-auto flex items-end justify-between gap-8 flex-wrap sm:flex-nowrap">
          <div className="text-left">
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight leading-none text-foreground">
              攻略路书
            </h1>
            <p className="mt-2 text-sm text-muted-foreground/80 leading-relaxed">
              探索我去过的地方，发现旅行故事与路书。
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-4 sm:gap-8 shrink-0">
            <StatCell label="路书" value={meta.total} />
            <StatCell label="国家" value={meta.countries} />
            <StatCell label="总天数" value={meta.days} />
          </dl>
        </div>
      </section>

      <div className="h-px w-full bg-border/50" />

      {/* List */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <GuideSkeletons />
          ) : guides.length > 0 ? (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-12 lg:gap-14">
              {guides.map((guide, i) => (
                <motion.li
                  key={guide.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1], delay: i * 0.05 }}
                >
                  <GuideCard guide={guide} />
                </motion.li>
              ))}
            </ul>
          ) : (
            <EmptyState />
          )}
        </div>
      </section>
    </div>
  )
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-right">
      <dt className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
        {label}
      </dt>
      <dd className="mt-1 text-xl font-light text-foreground tabular-nums">
        {value}
      </dd>
    </div>
  )
}

function GuideCard({ guide }: { guide: Guide }) {
  const dateRange = formatRange(guide.start_date, guide.end_date)

  return (
    <Link href={`/guides/${guide.id}`} className="group block">
      <article className="flex flex-col">
        {/* 封面图 */}
        <div className="relative overflow-hidden rounded-xl bg-muted aspect-[4/3] border border-border/60">
          {guide.cover_image ? (
            <Image
              src={guide.cover_image}
              alt={guide.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 42vw"
              className="object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/60" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0" />

          {/* 天数徽章 — 毛玻璃单色 */}
          {guide.days > 0 && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-[11px] font-medium text-white/90 border border-white/10">
              <Calendar className="w-3 h-3 opacity-70" aria-hidden="true" />
              <span className="tabular-nums">{guide.days} 天</span>
            </div>
          )}
        </div>

        {/* 文字区 */}
        <header className="mt-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="font-medium text-foreground">{guide.country}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{guide.city}</span>
          </div>

          <h2 className="mt-2 text-xl sm:text-2xl font-light tracking-tight text-foreground leading-snug group-hover:text-foreground/60 transition-colors duration-300">
            {guide.title}
          </h2>

          {dateRange && (
            <p className="mt-1.5 text-xs text-muted-foreground tabular-nums tracking-wide">
              {dateRange}
            </p>
          )}
        </header>
      </article>
    </Link>
  )
}

function GuideSkeletons() {
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-12 lg:gap-14">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="flex flex-col">
          <div className="aspect-[4/3] rounded-lg bg-muted/70 border border-border/60 animate-pulse" />
          <div className="mt-5 space-y-2">
            <div className="h-3 w-32 rounded bg-muted/80 animate-pulse" />
            <div className="h-5 w-3/4 rounded bg-muted/80 animate-pulse" />
            <div className="h-3 w-24 rounded bg-muted/70 animate-pulse" />
          </div>
        </li>
      ))}
    </ul>
  )
}

function EmptyState() {
  return (
    <div className="py-20 text-center max-w-lg mx-auto">
      <h3 className="text-xl font-light text-foreground">暂无路书</h3>
      <p className="mt-2 text-sm text-muted-foreground">当前没有可展示的旅行路书。</p>
    </div>
  )
}
