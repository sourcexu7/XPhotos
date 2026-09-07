'use client'

import React, { useState } from 'react'
import { Button as AntButton, Col, Flex, Grid, Radio, Row, Select, theme } from 'antd'
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
  style,
}: {
  value: string | undefined
  onChange: (v: string) => void
  placeholder: string
  options: string[]
  style?: React.CSSProperties
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
      style={style}
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
  style,
}: {
  value: string[]
  onChange: (vals: string[]) => void
  onOperatorChange: (op: 'and' | 'or') => void
  operator: 'and' | 'or'
  options: string[]
  placeholder: string
  style?: React.CSSProperties
}) {
  const t = useTranslations()
  return (
    <Flex gap={8} align="center" style={style}>
      <Select
        mode="tags"
        value={value}
        onChange={(vals) => onChange(vals)}
        placeholder={placeholder}
        allowClear
        tokenSeparators={[',', '，', ' ']}
        style={{ minWidth: 220, flex: 1 }}
        options={options.map(tag => ({ label: tag, value: tag }))}
      />
      <Radio.Group
        value={operator}
        onChange={(e) => onOperatorChange(e.target.value)}
        optionType="button"
        buttonStyle="solid"
        size="small"
        aria-label="标签筛选逻辑"
        options={[
          { label: t('List.tagsOperatorAnd'), value: 'and' },
          { label: t('List.tagsOperatorOr'), value: 'or' },
        ]}
      />
    </Flex>
  )
}

/** 操作按钮区：查询 / 重置 / 视图切换（桌面端） */
function ActionButtons({
  onApply, onReset, layout, setLayout, showSwitch, marginLeftAuto,
}: {
  onApply: () => void
  onReset: () => void
  layout: 'card' | 'list'
  setLayout: (l: 'card' | 'list') => void
  showSwitch?: boolean
  marginLeftAuto?: boolean
}) {
  const t = useTranslations()
  const { token } = theme.useToken()
  return (
    <Flex
      gap={token.marginXS}
      align="center"
      style={{ marginLeft: marginLeftAuto ? 'auto' : 0 }}
    >
      <AntButton type="primary" onClick={onApply}>
        {t('Button.query')}
      </AntButton>
      <AntButton onClick={onReset}>
        {t('Button.reset')}
      </AntButton>
      {showSwitch && (
        <AntButton
          type="text"
          icon={layout === 'card' ? <UnorderedListOutlined /> : <AppstoreOutlined />}
          onClick={() => setLayout(layout === 'card' ? 'list' : 'card')}
        >
          {layout === 'card' ? t('List.viewList') : t('List.viewCard')}
        </AntButton>
      )}
    </Flex>
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
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const isDesktop = !!screens.md
  const [showAdvanced, setShowAdvanced] = useState(false)

  const advancedSelects = (
    <>
      <SearchableSelect
        value={filters.selectedCamera}
        onChange={(v) => onChange({ selectedCamera: v })}
        placeholder={t('List.selectCamera')}
        options={cameras}
        style={{ width: 160 }}
      />
      <SearchableSelect
        value={filters.selectedLens}
        onChange={(v) => onChange({ selectedLens: v })}
        placeholder={t('List.selectLens')}
        options={lenses}
        style={{ width: 160 }}
      />
      <SearchableSelect
        value={filters.selectedExposure}
        onChange={(v) => onChange({ selectedExposure: v })}
        placeholder={t('List.selectShutter')}
        options={exifPresets.shutterSpeeds}
        style={{ width: 130 }}
      />
      <SearchableSelect
        value={filters.selectedAperture}
        onChange={(v) => onChange({ selectedAperture: v })}
        placeholder={t('List.selectAperture')}
        options={exifPresets.apertures}
        style={{ width: 120 }}
      />
      <SearchableSelect
        value={filters.selectedISO}
        onChange={(v) => onChange({ selectedISO: v })}
        placeholder={t('List.selectISO')}
        options={exifPresets.isos}
        style={{ width: 110 }}
      />
    </>
  )

  return (
    <Flex vertical gap={token.marginSM}>
      {/* 主要筛选行：桌面端单行铺开，移动端 wrap 折行 */}
      <Flex gap={token.marginSM} wrap="wrap" align="center">
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
          style={{ width: 140 }}
          options={albums?.map(a => ({ label: a.name, value: a.album_value })) || []}
        />

        <Select
          value={filters.showStatus || undefined}
          onChange={(v) => onChange({ showStatus: v })}
          placeholder={t('List.selectShowStatus')}
          allowClear
          style={{ width: 140 }}
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
          style={{ width: 120 }}
          options={[
            { label: t('List.featuredOn'), value: '1' },
            { label: t('List.featuredOff'), value: '0' },
          ]}
        />

        {/* 移动端：高级筛选开关 */}
        {!isDesktop && (
          <AntButton
            icon={<SlidersOutlined />}
            onClick={() => setShowAdvanced(!showAdvanced)}
            aria-expanded={showAdvanced}
            aria-label="展开高级筛选"
          >
            {t('List.advancedFilters')}
            {showAdvanced ? <UpOutlined /> : <DownOutlined />}
          </AntButton>
        )}

        {/* 桌面端：高级筛选器直接显示 */}
        {isDesktop && (
          <>
            {advancedSelects}
            <TagsSelect
              value={filters.selectedTags}
              onChange={(vals) => onChange({ selectedTags: vals })}
              onOperatorChange={(op) => onChange({ labelsOperator: op })}
              operator={filters.labelsOperator}
              options={tagsList}
              placeholder={t('List.filterTags')}
            />
          </>
        )}

        <ActionButtons
          onApply={onApply}
          onReset={onReset}
          layout={layout}
          setLayout={setLayout}
          showSwitch
          marginLeftAuto={!isDesktop}
        />
      </Flex>

      {/* 移动端：高级筛选器（折叠，两列栅格） */}
      {!isDesktop && showAdvanced && (
        <Row
          gutter={[token.marginSM, token.marginSM]}
          style={{
            padding: token.marginSM,
            border: `1px solid ${token.colorBorder}`,
            borderRadius: token.borderRadiusLG,
            background: token.colorBgContainer,
          }}
        >
          <Col xs={12}>
            <SearchableSelect
              value={filters.selectedCamera}
              onChange={(v) => onChange({ selectedCamera: v })}
              placeholder={t('List.selectCamera')}
              options={cameras}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12}>
            <SearchableSelect
              value={filters.selectedLens}
              onChange={(v) => onChange({ selectedLens: v })}
              placeholder={t('List.selectLens')}
              options={lenses}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12}>
            <SearchableSelect
              value={filters.selectedExposure}
              onChange={(v) => onChange({ selectedExposure: v })}
              placeholder={t('List.selectShutter')}
              options={exifPresets.shutterSpeeds}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12}>
            <SearchableSelect
              value={filters.selectedAperture}
              onChange={(v) => onChange({ selectedAperture: v })}
              placeholder={t('List.selectAperture')}
              options={exifPresets.apertures}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24}>
            <SearchableSelect
              value={filters.selectedISO}
              onChange={(v) => onChange({ selectedISO: v })}
              placeholder={t('List.selectISO')}
              options={exifPresets.isos}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24}>
            <TagsSelect
              value={filters.selectedTags}
              onChange={(vals) => onChange({ selectedTags: vals })}
              onOperatorChange={(op) => onChange({ labelsOperator: op })}
              operator={filters.labelsOperator}
              options={tagsList}
              placeholder={t('List.filterTags')}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      )}
    </Flex>
  )
}
