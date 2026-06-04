'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Calendar, Search, X, Compass, ArrowRight, ChevronRight } from 'lucide-react'

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

export default function GuidesPage() {
  const [guides, setGuides] = useState<Guide[]>([])
  const [filteredGuides, setFilteredGuides] = useState<Guide[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [activeFilters, setActiveFilters] = useState(false)

  const countries = [...new Set(guides.map(g => g.country))]
  const cities = [...new Set(guides.map(g => g.city))]

  const fetchGuides = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/public/guides')
      const result = await res.json()
      if (result.data) {
        setGuides(result.data)
        setFilteredGuides(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch guides:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGuides()
  }, [])

  useEffect(() => {
    let filtered = [...guides]
    if (searchText) {
      filtered = filtered.filter(guide =>
        guide.title.toLowerCase().includes(searchText.toLowerCase()) ||
        guide.country.toLowerCase().includes(searchText.toLowerCase()) ||
        guide.city.toLowerCase().includes(searchText.toLowerCase())
      )
    }
    if (selectedCountry) {
      filtered = filtered.filter(guide => guide.country === selectedCountry)
    }
    if (selectedCity) {
      filtered = filtered.filter(guide => guide.city === selectedCity)
    }
    setFilteredGuides(filtered)
    setActiveFilters(!!(searchText || selectedCountry || selectedCity))
  }, [searchText, selectedCountry, selectedCity, guides])

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-950/20 dark:to-transparent -z-10" />
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-slate-900/70 backdrop-blur border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-[0.2em] mb-6 shadow-sm"
          >
            <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Travel Guides
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-light text-foreground tracking-tight mb-4"
          >
            攻略路书
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            探索我去过的地方，发现精彩的旅行故事与实用路书
          </motion.p>
        </div>
      </motion.section>

      {/* Search & Filter */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="px-4 sm:px-6 lg:px-8 mb-12"
      >
        <div className="max-w-5xl mx-auto">
          <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="搜索目的地或关键词..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full h-12 pl-12 pr-10 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all text-sm"
                />
                {searchText && (
                  <button
                    onClick={() => setSearchText('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              <div className="flex gap-3 flex-wrap">
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="h-12 px-4 rounded-xl border border-input bg-background text-sm text-foreground focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 appearance-none cursor-pointer min-w-[140px] transition-all"
                >
                  <option value="">全部国家</option>
                  {countries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="h-12 px-4 rounded-xl border border-input bg-background text-sm text-foreground focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 appearance-none cursor-pointer min-w-[140px] transition-all"
                >
                  <option value="">全部城市</option>
                  {cities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                {activeFilters && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => { setSearchText(''); setSelectedCountry(''); setSelectedCity('') }}
                    className="h-12 px-6 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl transition-all duration-200 whitespace-nowrap shadow-sm hover:shadow"
                  >
                    清除筛选
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Content */}
      <section className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-card/50 rounded-2xl overflow-hidden border border-border">
                  <div className="aspect-[4/3] bg-muted" />
                  <div className="p-6">
                    <div className="h-6 bg-muted rounded-lg w-3/4 mb-3" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredGuides.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            >
              <AnimatePresence>
                {filteredGuides.map((guide) => (
                  <motion.div
                    key={guide.id}
                    variants={itemVariants}
                    layout
                  >
                    <GuideCard guide={guide} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 flex items-center justify-center backdrop-blur-sm">
                <Compass className="w-10 h-10 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-2xl font-light text-foreground mb-3">暂无路书</h3>
              <p className="text-base text-muted-foreground max-w-md mx-auto">当前没有符合条件的旅行路书</p>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  )
}

function GuideCard({ guide }: { guide: Guide }) {
  return (
    <Link href={`/guides/${guide.id}`} className="group block">
      <article className="bg-card/80 backdrop-blur rounded-2xl overflow-hidden border border-border hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 relative">
        {/* Cover Image */}
        <div className="aspect-[4/3] relative overflow-hidden bg-muted">
          {guide.cover_image ? (
            <Image
              src={guide.cover_image}
              alt={guide.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-100 to-slate-200 dark:from-amber-900/30 dark:to-slate-800">
              <Compass className="w-16 h-16 text-amber-600/50 dark:text-amber-400/50" />
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300" />

          {/* Days Badge */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/20 dark:border-slate-700/50 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{guide.days} 天</span>
          </div>

          {/* Title on Image */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h2 className="text-lg sm:text-xl font-medium text-white mb-2 leading-tight drop-shadow-lg">
              {guide.title}
            </h2>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span className="font-medium text-foreground">{guide.country}</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="truncate">{guide.city}</span>
          </div>

          {/* CTA Button */}
          <div className="group/btn flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium text-sm shadow-sm hover:shadow hover:from-amber-600 hover:to-amber-700 active:scale-[0.98] transition-all duration-300">
            探索路书
            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
          </div>
        </div>
      </article>
    </Link>
  )
}
