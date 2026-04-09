'use client'

import React from 'react'
import { Select } from 'antd'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { Checkbox } from '~/components/ui/checkbox'
import { Button as AntButton, Tooltip } from 'antd'
import { Rows3, LayoutGrid } from 'lucide-react'
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

  return (
    <div className="flex flex-col md:flex-row gap-3 flex-wrap items-start md:items-center">
      <Select
        value={filters.album || undefined}
        onChange={(v) => onChange({ album: v })}
        placeholder={t('List.selectAlbum')}
        className="w-full md:w-[140px] border-border rounded-lg"
        options={[
          { label: t('Words.all'), value: 'all' },
          ...(albums?.map(a => ({ label: a.name, value: a.album_value })) || [])
        ]}
      />

      <Select
        value={filters.showStatus || undefined}
        onChange={(v) => onChange({ showStatus: v })}
        placeholder={t('List.selectShowStatus')}
        className="w-full md:w-[140px] border-border rounded-lg"
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
        className="w-full md:w-[120px] border-border rounded-lg"
        options={[
          { label: t('Words.all'), value: 'all' },
          { label: t('List.featuredOn'), value: '1' },
          { label: t('List.featuredOff'), value: '0' }
        ]}
      />

      <Select
        value={filters.selectedCamera || undefined}
        onChange={(v) => onChange({ selectedCamera: v })}
        placeholder={t('List.selectCamera')}
        className="w-full md:w-[120px] border-border rounded-lg"
        options={[
          { label: t('Words.all'), value: 'all' },
          ...cameras.map(c => ({ label: c, value: c }))
        ]}
      />

      <Select
        value={filters.selectedLens || undefined}
        onChange={(v) => onChange({ selectedLens: v })}
        placeholder={t('List.selectLens')}
        className="w-full md:w-[120px] border-border rounded-lg"
        options={[
          { label: t('Words.all'), value: 'all' },
          ...lenses.map(l => ({ label: l, value: l }))
        ]}
      />

      <Select
        value={filters.selectedExposure || undefined}
        onChange={(v) => onChange({ selectedExposure: v })}
        placeholder={t('List.selectShutter')}
        className="w-full md:w-[100px] border-border rounded-lg"
        options={[
          { label: t('Words.all'), value: 'all' },
          ...exifPresets.shutterSpeeds.map(s => ({ label: s, value: s }))
        ]}
      />

      <Select
        value={filters.selectedAperture || undefined}
        onChange={(v) => onChange({ selectedAperture: v })}
        placeholder={t('List.selectAperture')}
        className="w-full md:w-[90px] border-border rounded-lg"
        options={[
          { label: t('Words.all'), value: 'all' },
          ...exifPresets.apertures.map(a => ({ label: a, value: a }))
        ]}
      />

      <Select
        value={filters.selectedISO || undefined}
        onChange={(v) => onChange({ selectedISO: v })}
        placeholder={t('List.selectISO')}
        className="w-full md:w-[80px] border-border rounded-lg"
        options={[
          { label: t('Words.all'), value: 'all' },
          ...exifPresets.isos.map(i => ({ label: i, value: i }))
        ]}
      />

      <Popover>
        <PopoverTrigger asChild>
          <button className="h-9 px-3 border border-border rounded-lg text-sm text-left w-full md:w-auto min-w-[100px] bg-card text-foreground hover:bg-muted transition-all duration-200">
            {filters.selectedTags.length > 0
              ? t('List.tagCount', { count: filters.selectedTags.length })
              : t('List.filterTags')}
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-3 w-64 border border-border rounded-lg bg-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">{t('List.selectTags')}</span>
            <div className="flex gap-1">
              <button
                className={`px-2 py-0.5 text-xs border rounded-lg ${filters.labelsOperator === 'and' ? 'bg-primary text-white border-primary' : 'border-border hover:bg-muted'}`}
                onClick={() => onChange({ labelsOperator: 'and' })}
              >
                {t('List.tagsOperatorAnd')}
              </button>
              <button
                className={`px-2 py-0.5 text-xs border rounded-lg ${filters.labelsOperator === 'or' ? 'bg-primary text-white border-primary' : 'border-border hover:bg-muted'}`}
                onClick={() => onChange({ labelsOperator: 'or' })}
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

      <div className="flex items-center gap-2 ml-auto md:ml-0 w-full md:w-auto mt-2 md:mt-0">
        <Tooltip title={t('List.applyFiltersTooltip')}>
          <AntButton
            type="primary"
            className="flex-1 md:flex-none bg-primary hover:bg-primary/90 border-none transition-all text-white rounded-lg"
            onClick={onApply}
          >
            {t('Button.query')}
          </AntButton>
        </Tooltip>
        <Tooltip title={t('List.resetFiltersTooltip')}>
          <AntButton
            className="flex-1 md:flex-none border border-border hover:border-primary hover:text-primary transition-all rounded-lg"
            onClick={onReset}
          >
            {t('Button.reset')}
          </AntButton>
        </Tooltip>
        <Tooltip title={layout === 'card' ? t('List.switchToListLayout') : t('List.switchToCardLayout')}>
          <AntButton
            type="text"
            className="flex flex-1 items-center gap-1 text-foreground hover:bg-muted hover:text-primary md:flex-none rounded-lg"
            icon={layout === 'card' ? <Rows3 size={14} /> : <LayoutGrid size={14} />}
            onClick={() => setLayout(layout === 'card' ? 'list' : 'card')}
          >
            {layout === 'card' ? t('List.viewCard') : t('List.viewList')}
          </AntButton>
        </Tooltip>
      </div>
    </div>
  )
}
