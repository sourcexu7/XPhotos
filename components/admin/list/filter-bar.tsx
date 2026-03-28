'use client'

import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible'
import { Checkbox } from '~/components/ui/checkbox'
import { Button as AntButton, Tooltip } from 'antd'
import { Rows3, LayoutGrid, ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { AlbumType } from '~/types'
import FilterSelect from './filter-select'

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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-3 flex-wrap items-start md:items-center">
        <FilterSelect
          value={filters.album}
          onChange={(v) => onChange({ album: v })}
          placeholder={t('List.selectAlbum')}
          width="160px"
          options={albums?.map(a => ({ label: a.name, value: a.album_value })) || []}
        />

        <FilterSelect
          value={filters.showStatus}
          onChange={(v) => onChange({ showStatus: v })}
          placeholder={t('List.selectShowStatus')}
          width="120px"
          options={[
            { label: t('Words.public'), value: '0' },
            { label: t('Words.private'), value: '1' }
          ]}
        />

        <FilterSelect
          value={filters.featured}
          onChange={(v) => onChange({ featured: v })}
          placeholder={t('List.selectFeatured')}
          width="120px"
          options={[
            { label: t('List.featuredOn'), value: '1' },
            { label: t('List.featuredOff'), value: '0' }
          ]}
        />

        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced} className="w-full md:w-auto">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1 h-9 px-3 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              {t('List.advancedFilters')}
              <ChevronDown size={14} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-200">
            <FilterSelect
              value={filters.selectedCamera}
              onChange={(v) => onChange({ selectedCamera: v })}
              placeholder={t('List.selectCamera')}
              options={cameras.map(c => ({ label: c, value: c }))}
            />

            <FilterSelect
              value={filters.selectedLens}
              onChange={(v) => onChange({ selectedLens: v })}
              placeholder={t('List.selectLens')}
              options={lenses.map(l => ({ label: l, value: l }))}
            />

            <FilterSelect
              value={filters.selectedExposure}
              onChange={(v) => onChange({ selectedExposure: v })}
              placeholder={t('List.selectShutter')}
              width="100px"
              options={exifPresets.shutterSpeeds.map(s => ({ label: s, value: s }))}
            />

            <FilterSelect
              value={filters.selectedAperture}
              onChange={(v) => onChange({ selectedAperture: v })}
              placeholder={t('List.selectAperture')}
              width="90px"
              options={exifPresets.apertures.map(a => ({ label: a, value: a }))}
            />

            <FilterSelect
              value={filters.selectedISO}
              onChange={(v) => onChange({ selectedISO: v })}
              placeholder={t('List.selectISO')}
              width="80px"
              options={exifPresets.isos.map(i => ({ label: i, value: i }))}
            />

            <Popover>
              <PopoverTrigger asChild>
                <button className="h-9 px-3 border border-gray-200 rounded-md text-sm text-left w-full md:w-auto min-w-[100px] bg-white text-gray-950 hover:bg-gray-50 transition-colors">
                  {filters.selectedTags.length > 0
                    ? t('List.tagCount', { count: filters.selectedTags.length })
                    : t('List.filterTags')}
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-3 w-64">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{t('List.selectTags')}</span>
                  <div className="flex gap-1">
                    <button
                      className={`px-2 py-0.5 text-xs border rounded ${filters.labelsOperator === 'and' ? 'bg-primary text-white border-primary' : 'hover:bg-gray-50'}`}
                      onClick={() => onChange({ labelsOperator: 'and' })}
                    >
                      {t('List.tagsOperatorAnd')}
                    </button>
                    <button
                      className={`px-2 py-0.5 text-xs border rounded ${filters.labelsOperator === 'or' ? 'bg-primary text-white border-primary' : 'hover:bg-gray-50'}`}
                      onClick={() => onChange({ labelsOperator: 'or' })}
                    >
                      {t('List.tagsOperatorOr')}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto my-2">
                  {tagsList.map(tag => (
                    <label key={tag} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <Checkbox
                        checked={filters.selectedTags.includes(tag)}
                        onCheckedChange={(v) => {
                          const next = v
                            ? [...filters.selectedTags, tag]
                            : filters.selectedTags.filter(t => t !== tag)
                          onChange({ selectedTags: next })
                        }}
                      />
                      <span className="text-xs truncate" title={tag}>{tag}</span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end pt-2 border-t">
                  <button
                    className="text-xs text-gray-500 hover:text-primary"
                    onClick={() => onChange({ selectedTags: [] })}
                  >
                    {t('List.clearSelectedTags')}
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex items-center gap-2 ml-auto md:ml-0 w-full md:w-auto mt-2 md:mt-0">
          <Tooltip title={t('List.applyFiltersTooltip')}>
            <AntButton
              type="primary"
              className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 border-none shadow-sm transition-all text-white"
              onClick={onApply}
            >
              {t('Button.query')}
            </AntButton>
          </Tooltip>
          <Tooltip title={t('List.resetFiltersTooltip')}>
            <AntButton
              className="flex-1 md:flex-none hover:text-blue-600 hover:border-blue-600 transition-all"
              onClick={onReset}
            >
              {t('Button.reset')}
            </AntButton>
          </Tooltip>
          <Tooltip title={layout === 'card' ? t('List.switchToListLayout') : t('List.switchToCardLayout')}>
            <AntButton
              type="text"
              className="flex flex-1 items-center gap-1 text-gray-600 hover:bg-gray-50 hover:text-blue-600 md:flex-none"
              icon={layout === 'card' ? <Rows3 size={14} /> : <LayoutGrid size={14} />}
              onClick={() => setLayout(layout === 'card' ? 'list' : 'card')}
            >
              {layout === 'card' ? t('List.viewCard') : t('List.viewList')}
            </AntButton>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
