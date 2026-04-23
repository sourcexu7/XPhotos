'use client'

import React, { useState } from 'react'
import { Select } from 'antd'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { Checkbox } from '~/components/ui/checkbox'
import { Button as AntButton, Tooltip } from 'antd'
import { Rows3, LayoutGrid, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { AlbumType } from '~/types'

export interface FilterState {
  album: string
  showStatus: string
  featured: string
  selectedCamera: string
  selectedLens: string
  selectedExposure: string
  selectedAperture: string
  selectedISO: string
  selectedTags: string[]
  labelsOperator: 'and' | 'or'
}

export const defaultFilterState: FilterState = {
  album: '',
  showStatus: '',
  featured: '',
  selectedCamera: '',
  selectedLens: '',
  selectedExposure: '',
  selectedAperture: '',
  selectedISO: '',
  selectedTags: [],
  labelsOperator: 'and',
}

interface FilterBarProps {
  filters: FilterState
  onChange: (updates: Partial<FilterState>) => void
  onApply: () => void
  onReset: () => void
  albums?: AlbumType[]
  cameras: string[]
  lenses: string[]
  exifPresets: { shutterSpeeds: string[], apertures: string[], isos: string[] }
  tagsList: string[]
  layout: 'card' | 'list'
  setLayout: (layout: 'card' | 'list') => void
}

export default function FilterBar({
  filters,
  onChange,
  onApply,
  onReset,
  albums,
  cameras,
  lenses,
  exifPresets,
  tagsList,
  layout,
  setLayout,
}: FilterBarProps) {
  const t = useTranslations()
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div className="space-y-3">
      {/* 主要筛选器：移动端水平滚动，桌面端正常布局 */}
      <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 md:flex-wrap items-start md:items-center">
        <Select
          value={filters.album || undefined}
          onChange={(v) => onChange({ album: v })}
          placeholder={t('List.selectAlbum')}
          className="min-w-[140px] md:w-[140px] border-border rounded-lg"
          options={[
            { label: t('Words.all'), value: 'all' },
            ...(albums?.map(a => ({ label: a.name, value: a.album_value })) || [])
          ]}
        />

        <Select
          value={filters.showStatus || undefined}
          onChange={(v) => onChange({ showStatus: v })}
          placeholder={t('List.selectShowStatus')}
          className="min-w-[140px] md:w-[140px] border-border rounded-lg"
          options={[
            { label: t('Words.all'), value: 'all' },
            { label: t('Words.public'), value: '0' },
            { label: t('Words.private'), value: '1' }
          ]}
        />

        <Select
          value={filters.featured || undefined}
          onChange={(v) => onChange({ featured: v })}
          placeholder={t('List.selectFeatured')}
          className="min-w-[120px] md:w-[120px] border-border rounded-lg"
          options={[
            { label: t('Words.all'), value: 'all' },
            { label: t('List.featuredOn'), value: '1' },
            { label: t('List.featuredOff'), value: '0' }
          ]}
        />

        {/* 移动端：高级筛选按钮 */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="md:hidden flex items-center gap-1 h-9 px-3 border border-border rounded-lg text-sm bg-card text-foreground hover:bg-muted transition-all whitespace-nowrap"
          aria-expanded={showAdvanced}
          aria-label="展开高级筛选"
        >
          <SlidersHorizontal size={14} />
          高级筛选
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* 桌面端：高级筛选器直接显示 */}
        <div className="hidden md:flex gap-3 flex-wrap items-center">
          <Select
            value={filters.selectedCamera || undefined}
            onChange={(v) => onChange({ selectedCamera: v })}
            placeholder={t('List.selectCamera')}
            className="w-[120px] border-border rounded-lg"
            options={[
              { label: t('Words.all'), value: 'all' },
              ...cameras.map(c => ({ label: c, value: c }))
            ]}
          />

          <Select
            value={filters.selectedLens || undefined}
            onChange={(v) => onChange({ selectedLens: v })}
            placeholder={t('List.selectLens')}
            className="w-[120px] border-border rounded-lg"
            options={[
              { label: t('Words.all'), value: 'all' },
              ...lenses.map(l => ({ label: l, value: l }))
            ]}
          />

          <Select
            value={filters.selectedExposure || undefined}
            onChange={(v) => onChange({ selectedExposure: v })}
            placeholder={t('List.selectShutter')}
            className="w-[100px] border-border rounded-lg"
            options={[
              { label: t('Words.all'), value: 'all' },
              ...exifPresets.shutterSpeeds.map(s => ({ label: s, value: s }))
            ]}
          />

          <Select
            value={filters.selectedAperture || undefined}
            onChange={(v) => onChange({ selectedAperture: v })}
            placeholder={t('List.selectAperture')}
            className="w-[90px] border-border rounded-lg"
            options={[
              { label: t('Words.all'), value: 'all' },
              ...exifPresets.apertures.map(a => ({ label: a, value: a }))
            ]}
          />

          <Select
            value={filters.selectedISO || undefined}
            onChange={(v) => onChange({ selectedISO: v })}
            placeholder={t('List.selectISO')}
            className="w-[80px] border-border rounded-lg"
            options={[
              { label: t('Words.all'), value: 'all' },
              ...exifPresets.isos.map(i => ({ label: i, value: i }))
            ]}
          />

          <Popover>
            <PopoverTrigger asChild>
              <button 
                className="h-9 px-3 border border-border rounded-lg text-sm text-left min-w-[100px] bg-card text-foreground hover:bg-muted transition-all duration-200"
                aria-label={filters.selectedTags.length > 0 
                  ? t('List.tagCount', { count: filters.selectedTags.length })
                  : t('List.filterTags')}
                aria-haspopup="dialog"
              >
                {filters.selectedTags.length > 0
                  ? t('List.tagCount', { count: filters.selectedTags.length })
                  : t('List.filterTags')}
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-3 w-64 border border-border rounded-lg bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{t('List.selectTags')}</span>
                <div className="flex gap-1" role="group" aria-label="标签筛选逻辑">
                  <button
                    className={`px-2 py-0.5 text-xs border rounded-lg ${filters.labelsOperator === 'and' ? 'bg-primary text-white border-primary' : 'border-border hover:bg-muted'}`}
                    onClick={() => onChange({ labelsOperator: 'and' })}
                    aria-pressed={filters.labelsOperator === 'and'}
                    aria-label="AND逻辑：必须包含所有选中的标签"
                  >
                    {t('List.tagsOperatorAnd')}
                  </button>
                  <button
                    className={`px-2 py-0.5 text-xs border rounded-lg ${filters.labelsOperator === 'or' ? 'bg-primary text-white border-primary' : 'border-border hover:bg-muted'}`}
                    onClick={() => onChange({ labelsOperator: 'or' })}
                    aria-pressed={filters.labelsOperator === 'or'}
                    aria-label="OR逻辑：包含任意一个选中的标签"
                  >
                    {t('List.tagsOperatorOr')}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto my-2">
                {tagsList.map(tag => (
                  <label key={tag} className="flex items-center gap-2 cursor-pointer hover:bg-muted p-1 rounded-lg">
                    <Checkbox
                      checked={filters.selectedTags.includes(tag)}
                      onCheckedChange={(v) => {
                        const next = v
                          ? [...filters.selectedTags, tag]
                          : filters.selectedTags.filter(t => t !== tag)
                        onChange({ selectedTags: next })
                      }}
                    />
                    <span className="text-xs truncate text-foreground" title={tag}>{tag}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end pt-2 border-t border-border">
                <button
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => onChange({ selectedTags: [] })}
                  aria-label="清除所有选中的标签"
                >
                  {t('List.clearSelectedTags')}
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2 ml-auto md:ml-0">
          <Tooltip title={t('List.applyFiltersTooltip')}>
            <AntButton
              type="primary"
              className="bg-primary hover:bg-primary/90 border-none transition-all text-white rounded-lg"
              onClick={onApply}
            >
              {t('Button.query')}
            </AntButton>
          </Tooltip>
          <Tooltip title={t('List.resetFiltersTooltip')}>
            <AntButton
              className="border border-border hover:border-primary hover:text-primary transition-all rounded-lg"
              onClick={onReset}
            >
              {t('Button.reset')}
            </AntButton>
          </Tooltip>
          <Tooltip title={layout === 'card' ? t('List.switchToListLayout') : t('List.switchToCardLayout')}>
            <AntButton
              type="text"
              className="hidden md:flex items-center gap-1 text-foreground hover:bg-muted hover:text-primary rounded-lg"
              icon={layout === 'card' ? <Rows3 size={14} /> : <LayoutGrid size={14} />}
              onClick={() => setLayout(layout === 'card' ? 'list' : 'card')}
            >
              {layout === 'card' ? t('List.viewCard') : t('List.viewList')}
            </AntButton>
          </Tooltip>
        </div>
      </div>

      {/* 移动端：高级筛选器（折叠） */}
      {showAdvanced && (
        <div className="md:hidden grid grid-cols-2 gap-3 p-3 border border-border rounded-lg bg-card">
          <Select
            value={filters.selectedCamera || undefined}
            onChange={(v) => onChange({ selectedCamera: v })}
            placeholder={t('List.selectCamera')}
            className="w-full border-border rounded-lg"
            options={[
              { label: t('Words.all'), value: 'all' },
              ...cameras.map(c => ({ label: c, value: c }))
            ]}
          />

          <Select
            value={filters.selectedLens || undefined}
            onChange={(v) => onChange({ selectedLens: v })}
            placeholder={t('List.selectLens')}
            className="w-full border-border rounded-lg"
            options={[
              { label: t('Words.all'), value: 'all' },
              ...lenses.map(l => ({ label: l, value: l }))
            ]}
          />

          <Select
            value={filters.selectedExposure || undefined}
            onChange={(v) => onChange({ selectedExposure: v })}
            placeholder={t('List.selectShutter')}
            className="w-full border-border rounded-lg"
            options={[
              { label: t('Words.all'), value: 'all' },
              ...exifPresets.shutterSpeeds.map(s => ({ label: s, value: s }))
            ]}
          />

          <Select
            value={filters.selectedAperture || undefined}
            onChange={(v) => onChange({ selectedAperture: v })}
            placeholder={t('List.selectAperture')}
            className="w-full border-border rounded-lg"
            options={[
              { label: t('Words.all'), value: 'all' },
              ...exifPresets.apertures.map(a => ({ label: a, value: a }))
            ]}
          />

          <Select
            value={filters.selectedISO || undefined}
            onChange={(v) => onChange({ selectedISO: v })}
            placeholder={t('List.selectISO')}
            className="w-full border-border rounded-lg"
            options={[
              { label: t('Words.all'), value: 'all' },
              ...exifPresets.isos.map(i => ({ label: i, value: i }))
            ]}
          />

          <Popover>
            <PopoverTrigger asChild>
              <button 
                className="h-9 px-3 border border-border rounded-lg text-sm text-left bg-card text-foreground hover:bg-muted transition-all duration-200"
                aria-label={filters.selectedTags.length > 0 
                  ? t('List.tagCount', { count: filters.selectedTags.length })
                  : t('List.filterTags')}
                aria-haspopup="dialog"
              >
                {filters.selectedTags.length > 0
                  ? t('List.tagCount', { count: filters.selectedTags.length })
                  : t('List.filterTags')}
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-3 w-64 border border-border rounded-lg bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{t('List.selectTags')}</span>
                <div className="flex gap-1" role="group" aria-label="标签筛选逻辑">
                  <button
                    className={`px-2 py-0.5 text-xs border rounded-lg ${filters.labelsOperator === 'and' ? 'bg-primary text-white border-primary' : 'border-border hover:bg-muted'}`}
                    onClick={() => onChange({ labelsOperator: 'and' })}
                    aria-pressed={filters.labelsOperator === 'and'}
                  >
                    {t('List.tagsOperatorAnd')}
                  </button>
                  <button
                    className={`px-2 py-0.5 text-xs border rounded-lg ${filters.labelsOperator === 'or' ? 'bg-primary text-white border-primary' : 'border-border hover:bg-muted'}`}
                    onClick={() => onChange({ labelsOperator: 'or' })}
                    aria-pressed={filters.labelsOperator === 'or'}
                  >
                    {t('List.tagsOperatorOr')}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto my-2">
                {tagsList.map(tag => (
                  <label key={tag} className="flex items-center gap-2 cursor-pointer hover:bg-muted p-1 rounded-lg">
                    <Checkbox
                      checked={filters.selectedTags.includes(tag)}
                      onCheckedChange={(v) => {
                        const next = v
                          ? [...filters.selectedTags, tag]
                          : filters.selectedTags.filter(t => t !== tag)
                        onChange({ selectedTags: next })
                      }}
                    />
                    <span className="text-xs truncate text-foreground" title={tag}>{tag}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end pt-2 border-t border-border">
                <button
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => onChange({ selectedTags: [] })}
                >
                  {t('List.clearSelectedTags')}
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  )
}
