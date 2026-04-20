'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <header className="mb-10 sm:mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-[0.15em] mb-5 shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.637a2.25 2.25 0 0 1 1.141 1.952V18a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-1.886c0-.859.48-1.64 1.241-1.952l4.875-2.637" />
            </svg>
            Travel Guides
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 dark:text-slate-50 tracking-tight mb-5">
            攻略路书
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            探索我去过的地方，发现精彩的旅行故事与实用路书
          </p>
        </header>

        <div className="mb-10">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
              <div className="relative flex-1 max-w-lg">
                <input
                  type="text"
                  placeholder="搜索目的地或关键词..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/20 dark:focus:ring-blue-500/20 transition-all text-sm"
                />
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>

              <div className="flex gap-3 flex-wrap">
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm text-sm text-slate-900 dark:text-slate-100 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/20 dark:focus:ring-blue-500/20 appearance-none cursor-pointer min-w-[140px] transition-all"
                >
                  <option value="">全部国家</option>
                  {countries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm text-sm text-slate-900 dark:text-slate-100 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/20 dark:focus:ring-blue-500/20 appearance-none cursor-pointer min-w-[140px] transition-all"
                >
                  <option value="">全部城市</option>
                  {cities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                {activeFilters && (
                  <button
                    onClick={() => { setSearchText(''); setSelectedCountry(''); setSelectedCity('') }}
                    className="h-12 px-6 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 rounded-xl transition-all duration-200 whitespace-nowrap shadow-md hover:shadow-lg backdrop-blur-sm"
                  >
                    清除筛选
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredGuides.map((guide) => (
              <Link
                key={guide.id}
                href={`/guides/${guide.id}`}
                className="group block"
              >
                <article className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                  <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                    {guide.cover_image ? (
                      <Image
                        src={guide.cover_image}
                        alt={guide.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-16 h-16 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.637a2.25 2.25 0 0 1 1.141 1.952V18a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-1.886c0-.859.48-1.64 1.241-1.952l4.875-2.637" />
                        </svg>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/20 dark:border-slate-700/50 shadow-lg">
                      <svg className="w-4 h-4 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{guide.days} 天</span>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="space-y-3">
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50 mb-2.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2 leading-tight">
                          {guide.title}
                        </h2>

                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <svg className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                          <span className="font-medium text-slate-900 dark:text-slate-100">{guide.country}</span>
                          <span className="text-slate-300 dark:text-slate-600">/</span>
                          <span className="truncate">{guide.city}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                        <div className="group/btn flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 active:scale-[0.98] transition-all duration-200 backdrop-blur-sm">
                          阅读路书
                          <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center backdrop-blur-sm">
              <svg className="w-10 h-10 text-blue-400 dark:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-3">暂无路书</h3>
            <p className="text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto">当前没有符合条件的旅行路书</p>
          </div>
        )}
      </div>
    </div>
  )
}
