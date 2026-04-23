'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Calendar, Search, X, Compass, ArrowRight } from 'lucide-react'

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
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10 sm:mb-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-[0.15em] mb-5 shadow-sm">
            <Compass className="w-4 h-4" />
            Travel Guides
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 dark:text-slate-50 tracking-tight mb-5">
            攻略路书
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            探索我去过的地方，发现精彩的旅行故事与实用路书
          </p>
        </motion.header>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-10"
        >
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="搜索目的地或关键词..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full h-12 pl-12 pr-10 rounded-xl border border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-400 dark:focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 dark:focus:ring-indigo-500/20 transition-all text-sm"
                />
                {searchText && (
                  <button
                    onClick={() => setSearchText('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>

              <div className="flex gap-3 flex-wrap">
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-400 dark:focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 dark:focus:ring-indigo-500/20 appearance-none cursor-pointer min-w-[140px] transition-all"
                >
                  <option value="">全部国家</option>
                  {countries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-400 dark:focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 dark:focus:ring-indigo-500/20 appearance-none cursor-pointer min-w-[140px] transition-all"
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
                    className="h-12 px-6 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 hover:from-indigo-600 hover:to-indigo-700 dark:hover:from-indigo-700 dark:hover:to-indigo-800 rounded-xl transition-all duration-200 whitespace-nowrap shadow-md hover:shadow-lg backdrop-blur-sm"
                  >
                    清除筛选
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-700" />
                <div className="p-6">
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4 mb-3" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredGuides.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
          >
            <AnimatePresence>
              {filteredGuides.map((guide) => (
                <motion.div
                  key={guide.id}
                  variants={itemVariants}
                  layout
                >
                  <Link href={`/guides/${guide.id}`} className="group block">
                    <article className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                      {/* Cover Image */}
                      <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                        {guide.cover_image ? (
                          <Image
                            src={guide.cover_image}
                            alt={guide.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Compass className="w-16 h-16 text-slate-300 dark:text-slate-600" />
                          </div>
                        )}

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

                        {/* Days Badge */}
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-white/20 dark:border-slate-700/50 shadow-lg">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{guide.days} 天</span>
                        </div>

                        {/* Title on Image */}
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          <h2 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-indigo-200 transition-colors duration-200 line-clamp-2 leading-tight drop-shadow-lg">
                            {guide.title}
                          </h2>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 sm:p-6">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
                          <MapPin className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                          <span className="font-medium text-slate-900 dark:text-slate-100">{guide.country}</span>
                          <span className="text-slate-300 dark:text-slate-600">/</span>
                          <span className="truncate">{guide.city}</span>
                        </div>

                        {/* CTA Button */}
                        <div className="group/btn flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:from-indigo-600 hover:to-indigo-700 dark:hover:from-indigo-700 dark:hover:to-indigo-800 active:scale-[0.98] transition-all duration-200 backdrop-blur-sm">
                          阅读路书
                          <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
                        </div>
                      </div>
                    </article>
                  </Link>
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
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-800/20 flex items-center justify-center backdrop-blur-sm">
              <Compass className="w-10 h-10 text-indigo-400 dark:text-indigo-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-3">暂无路书</h3>
            <p className="text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto">当前没有符合条件的旅行路书</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
