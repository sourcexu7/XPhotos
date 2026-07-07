'use client'

import React, { useState } from 'react'
import { Select } from 'antd'
import { Button as AntButton } from 'antd'
import { UnorderedListOutlined, AppstoreOutlined, UpOutlined, DownOutlined, SlidersOutlined } from '@ant-design/icons'
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
  exifPresets: { shutterSpeeds: string[]; apertures: string[]; isos: string[] }
  tagsList: string[]
  layout: 'card' | 'list'
  setLayout: (layout: 'card' | 'list') => void
}

/**
 * 通用可搜索/可输入的筛选下拉
 * - 选中值 => 精确匹配
 * - 直接在输入框里写的值 => 也是精确匹配（走服务端 = 逻辑）
 * - allowClear => 点 × 清空
 */
function SearchableSelect({
  value,
  onChange,
  placeholder,
  options,
  className,
}: {
  value: string | undefined
  onChange: (v: string) => void
  placeholder: string
  options: string[]
  className?: string
}) {
  const optionList = options.map(o => ({ label: o, value: o }))

  return (
    <Select
      value={value || undefined}
      onChange={(v) => onChange(v ?? '')}
      placeholder={placeholder}
      showSearch
      allowClear
      filterOption={(input, option) =>
        (option?.label ?? '')
          .toString()
          .toLowerCase()
          .includes(input.toLowerCase())
      }
      className={className || 'border-border rounded-lg'}
      options={optionList}
    />
  )
}

/**
 * 标签筛选：下拉多选 + 支持自由输入新标签
 * 选中的值会作为 JSONB contains 的条件数组传入服务端
 */
function TagsSelect({
  value,
  onChange,
  onOperatorChange,
  operator,
  options,
  placeholder,
  className,
}: {
  value: string[]
  onChange: (vals: string[]) => void
  onOperatorChange: (op: 'and' | 'or') => void
  operator: 'and' | 'or'
  options: string[]
  placeholder: string
  className?: string
}) {
  const t = useTranslations()
  return (
    <div className="flex items-center gap-2">
      <Select
        mode="tags"
        value={value}
        onChange={(vals) => onChange(vals)}
        placeholder={placeholder}
        allowClear
        tokenSeparators={[',', '，', ' ']}
        className={className || 'border-border rounded-lg'}
        style={{ minWidth: 220, width: 260 }}
        options={options.map(tag => ({ label: tag, value: tag }))}
      />
      <div className="flex rounded-lg border border-border overflow-hidden text-xs" role="group" aria-label="标签筛选逻辑">
        <button
          className={`px-2 h-8 ${operator === 'and' ? 'bg-primary text-white' : 'bg-card hover:bg-muted text-foreground'}`}
          onClick={() => onOperatorChange('and')}
          aria-pressed={operator === 'and'}
          type="button"
        >
          {t('List.tagsOperatorAnd')}
        </button>
        <button
          className={`px-2 h-8 ${operator === 'or' ? 'bg-primary text-white' : 'bg-card hover:bg-muted text-foreground'}`}
          onClick={() => onOperatorChange('or')}
          aria-pressed={operator === 'or'}
          type="button"
        >
          {t('List.tagsOperatorOr')}
        </button>
      </div>
    </div>
  )
}

/** 操作按钮区：查询 / 重置 / 视图切换（桌面端） */
function ActionButtons({
  onApply, onReset, layout, setLayout, showSwitch,
}: {
  onApply: () => void
  onReset: () => void
  layout: 'card' | 'list'
  setLayout: (l: 'card' | 'list') => void
  showSwitch?: boolean
}) {
  const t = useTranslations()
  return (
    <div className="flex items-center gap-2 ml-auto md:ml-0">
      <AntButton
        type="primary"
        className="bg-primary hover:bg-primary/90 border-none transition-all text-white rounded-lg"
        onClick={onApply}
      >
        {t('Button.query')}
      </AntButton>
      <AntButton
        className="border border-border hover:border-primary hover:text-primary transition-all rounded-lg"
        onClick={onReset}
      >
        {t('Button.reset')}
      </AntButton>
      {showSwitch && (
        <AntButton
          type="text"
          className="hidden md:flex items-center gap-1 text-foreground hover:bg-muted hover:text-primary rounded-lg"
          icon={layout === 'card' ? <UnorderedListOutlined /> : <AppstoreOutlined />}
          onClick={() => setLayout(layout === 'card' ? 'list' : 'card')}
        >
          {layout === 'card' ? t('List.viewList') : t('List.viewCard')}
        </AntButton>
      )}
    </div>
  )
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
          showSearch
          allowClear
          filterOption={(input, option) =>
            (option?.label ?? '')
              .toString()
              .toLowerCase()
              .includes(input.toLowerCase())
          }
          className="min-w-[140px] md:w-[140px] border-border rounded-lg"
          options={albums?.map(a => ({ label: a.name, value: a.album_value })) || []}
        />

        <Select
          value={filters.showStatus || undefined}
          onChange={(v) => onChange({ showStatus: v })}
          placeholder={t('List.selectShowStatus')}
          allowClear
          className="min-w-[140px] md:w-[140px] border-border rounded-lg"
          options={[
            { label: t('Words.public'), value: '0' },
            { label: t('Words.private'), value: '1' },
          ]}
        />

        <Select
          value={filters.featured || undefined}
          onChange={(v) => onChange({ featured: v })}
          placeholder={t('List.selectFeatured')}
          allowClear
          className="min-w-[120px] md:w-[120px] border-border rounded-lg"
          options={[
            { label: t('List.featuredOn'), value: '1' },
            { label: t('List.featuredOff'), value: '0' },
          ]}
        />

        {/* 移动端：高级筛选按钮 */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="md:hidden flex items-center gap-1 h-9 px-3 border border-border rounded-lg text-sm bg-card text-foreground hover:bg-muted transition-all whitespace-nowrap"
          aria-expanded={showAdvanced}
          aria-label="展开高级筛选"
        >
          <SlidersOutlined />
          {t('List.advancedFilters')}
          {showAdvanced ? <UpOutlined /> : <DownOutlined />}
        </button>

        {/* 桌面端：高级筛选器直接显示 */}
        <div className="hidden md:flex gap-3 flex-wrap items-center">
          <SearchableSelect
            value={filters.selectedCamera}
            onChange={(v) => onChange({ selectedCamera: v })}
            placeholder={t('List.selectCamera')}
            options={cameras}
            className="w-[160px] border-border rounded-lg"
          />
          <SearchableSelect
            value={filters.selectedLens}
            onChange={(v) => onChange({ selectedLens: v })}
            placeholder={t('List.selectLens')}
            options={lenses}
            className="w-[160px] border-border rounded-lg"
          />
          <SearchableSelect
            value={filters.selectedExposure}
            onChange={(v) => onChange({ selectedExposure: v })}
            placeholder={t('List.selectShutter')}
            options={exifPresets.shutterSpeeds}
            className="w-[130px] border-border rounded-lg"
          />
          <SearchableSelect
            value={filters.selectedAperture}
            onChange={(v) => onChange({ selectedAperture: v })}
            placeholder={t('List.selectAperture')}
            options={exifPresets.apertures}
            className="w-[120px] border-border rounded-lg"
          />
          <SearchableSelect
            value={filters.selectedISO}
            onChange={(v) => onChange({ selectedISO: v })}
            placeholder={t('List.selectISO')}
            options={exifPresets.isos}
            className="w-[110px] border-border rounded-lg"
          />

          <TagsSelect
            value={filters.selectedTags}
            onChange={(vals) => onChange({ selectedTags: vals })}
            onOperatorChange={(op) => onChange({ labelsOperator: op })}
            operator={filters.labelsOperator}
            options={tagsList}
            placeholder={t('List.filterTags')}
          />
        </div>

        <ActionButtons
          onApply={onApply}
          onReset={onReset}
          layout={layout}
          setLayout={setLayout}
          showSwitch
        />
      </div>

      {/* 移动端：高级筛选器（折叠） */}
      {showAdvanced && (
        <div className="md:hidden grid grid-cols-2 gap-3 p-3 border border-border rounded-lg bg-card">
          <SearchableSelect
            value={filters.selectedCamera}
            onChange={(v) => onChange({ selectedCamera: v })}
            placeholder={t('List.selectCamera')}
            options={cameras}
            className="w-full border-border rounded-lg"
          />
          <SearchableSelect
            value={filters.selectedLens}
            onChange={(v) => onChange({ selectedLens: v })}
            placeholder={t('List.selectLens')}
            options={lenses}
            className="w-full border-border rounded-lg"
          />
          <SearchableSelect
            value={filters.selectedExposure}
            onChange={(v) => onChange({ selectedExposure: v })}
            placeholder={t('List.selectShutter')}
            options={exifPresets.shutterSpeeds}
            className="w-full border-border rounded-lg"
          />
          <SearchableSelect
            value={filters.selectedAperture}
            onChange={(v) => onChange({ selectedAperture: v })}
            placeholder={t('List.selectAperture')}
            options={exifPresets.apertures}
            className="w-full border-border rounded-lg"
          />
          <SearchableSelect
            value={filters.selectedISO}
            onChange={(v) => onChange({ selectedISO: v })}
            placeholder={t('List.selectISO')}
            options={exifPresets.isos}
            className="w-full border-border rounded-lg"
          />
          <div className="col-span-2">
            <TagsSelect
              value={filters.selectedTags}
              onChange={(vals) => onChange({ selectedTags: vals })}
              onOperatorChange={(op) => onChange({ labelsOperator: op })}
              operator={filters.labelsOperator}
              options={tagsList}
              placeholder={t('List.filterTags')}
              className="w-full border-border rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}
