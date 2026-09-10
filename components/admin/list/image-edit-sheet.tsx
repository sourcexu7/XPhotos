'use client'

import { useButtonStore } from '~/app/providers/button-store-providers'
import type { ImageType } from '~/types'
import type { ImageServerHandleProps } from '~/types/props'
import { useSwrInfiniteServerHook } from '~/hooks/use-swr-infinite-server-hook'
import React, { useState, useRef, useMemo, useEffect } from 'react'
import { App as AntApp, Button, Switch, Drawer, Input, InputNumber, DatePicker, Modal, Checkbox } from 'antd'
import { ReloadOutlined, RobotOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { TagInput } from 'emblor'
import { exifReader } from '~/lib/utils/file'
import { useTranslations } from 'next-intl'

const GroupTitle = ({ title }: { title: string }) => (
  <div className="text-sm font-medium text-foreground uppercase tracking-wide mb-4 mt-6 pb-2 border-b border-border">
    {title}
  </div>
)

const InputField = ({ label, id, value, onChange, type = 'text', placeholder = '' }: any) => (
  <div className="w-full space-y-1 mb-4">
    <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
      {label}
    </label>
    {type === 'number' ? (
      <InputNumber
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(v) => onChange({ target: { value: v ?? '' } })}
        className="w-full"
      />
    ) : (
      <Input id={id} type={type} placeholder={placeholder} value={value} onChange={onChange} allowClear />
    )}
  </div>
)

interface AiTagSuggestion {
  matches: { primary: string; secondaries: string[] }[]
  newTags: { name: string; parentName: string }[]
}

export default function ImageEditSheet(props : Readonly<ImageServerHandleProps & { pageNum: number } & { album: string }>) {
  const { pageNum, album, ...restProps } = props
  const { mutate } = useSwrInfiniteServerHook(restProps, pageNum, album)
  const { imageEdit, image, setImageEdit, setImageEditData } = useButtonStore(
    (state) => state,
  )
  const [loading, setLoading] = useState(false)
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null)
  const referenceInputRef = useRef<HTMLInputElement | null>(null)
  // 现有标签列表（用于编辑时自动补全）
  const [allTagOptions, setAllTagOptions] = useState<{ id: string; text: string }[]>([])
  // ===== AI 一键推荐标签 =====
  const [aiTagAvailable, setAiTagAvailable] = useState(false)
  const [aiRecommending, setAiRecommending] = useState(false)
  const [aiApplying, setAiApplying] = useState(false)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<AiTagSuggestion | null>(null)
  const [aiSelected, setAiSelected] = useState<Record<string, boolean>>({})
  const t = useTranslations('List')
  const { message } = AntApp.useApp()

  const tagItems = useMemo(() => {
    if (!image?.labels) return []
    return image.labels.map((label: string) => ({ id: label, text: label }))
  }, [image?.labels])

  // 抽屉打开时拉取标签树，构建自动补全候选；同时探测 AI 标签能力（不可用时按钮不渲染，纯手动兜底）
  useEffect(() => {
    if (!imageEdit) return
    fetch('/api/v1/settings/tags/get?tree=true')
      .then(r => r.json())
      .then((res: { data?: { category?: string | null; children?: { name: string }[] }[] }) => {
        const names = new Set<string>()
        for (const node of res?.data ?? []) {
          if (node.category) names.add(node.category)
          for (const child of node.children ?? []) names.add(child.name)
        }
        setAllTagOptions(Array.from(names).map(name => ({ id: name, text: name })))
      })
      .catch(() => {})
    fetch('/api/v1/ai-tag/status')
      .then(r => r.json())
      .then((res: { data?: { enabled?: boolean; configured?: boolean } }) => {
        setAiTagAvailable(!!(res?.data?.enabled && res?.data?.configured))
      })
      .catch(() => setAiTagAvailable(false))
  }, [imageEdit])

  const applyReferenceExif = async (file: File) => {
    try {
      const { tags, exifObj } = await exifReader(file)
      setImageEditData({
        ...image,
        exif: { ...(image?.exif || {}), ...exifObj },
        lat: tags?.GPSLatitude?.description || image?.lat || '',
        lon: tags?.GPSLongitude?.description || image?.lon || '',
      } as ImageType)
      message.success(t('exifExtractedNoRef'))
    } catch (err) {
      console.error('Reference EXIF parse failed', err)
      message.error(t('exifParseFailed'))
    }
  }

  async function submit() {
    if (!image.url) { message.error(t('urlRequired')); return }
    if (!image.height || image.height <= 0) { message.error(t('heightRequired')); return }
    if (!image.width || image.width <= 0) { message.error(t('widthRequired')); return }
    try {
      setLoading(true)
      await fetch('/api/v1/images/update', { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(image), method: 'PUT' }).then(response => response.json())
      message.success(t('updateSuccess'))
      setImageEditData({} as ImageType)
      setImageEdit(false)
      await mutate()
    } catch (e) { message.error(t('updateFailed')) } finally { setLoading(false) }
  }

  // ===== AI 一键推荐标签（人工审核后应用，不会自动写入）=====

  const closeAiModal = () => {
    setAiModalOpen(false)
    setAiSuggestion(null)
    setAiSelected({})
  }

  const handleAiRecommend = async () => {
    // 基于压缩后的 WebP 预览图分析；无预览图时回退原图
    const imageUrl = image?.preview_url || image?.url
    if (!imageUrl) { message.error(t('aiRecommendFailed')); return }
    try {
      setAiRecommending(true)
      const res = await fetch('/api/v1/ai-tag/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      })
      const json = await res.json().catch(() => null)
      const data = json?.data as AiTagSuggestion | undefined
      if (res.ok && json?.code === 200 && data && (data.matches?.length || data.newTags?.length)) {
        // 默认全选，由用户在弹窗中审核调整
        const sel: Record<string, boolean> = {}
        data.matches.forEach(m => {
          sel[`p:${m.primary}`] = true
          m.secondaries.forEach(s => { sel[`s:${m.primary}:${s}`] = true })
        })
        data.newTags.forEach(nt => { sel[`n:${nt.name}`] = true })
        setAiSuggestion(data)
        setAiSelected(sel)
        setAiModalOpen(true)
      } else {
        // AI 失效/关闭/无推荐：兜底为手动模式
        message.info(t('aiNoSuggestion'))
      }
    } catch {
      message.error(t('aiRecommendFailed'))
    } finally {
      setAiRecommending(false)
    }
  }

  const toggleAiGroup = (primary: string, secondaries: string[], checked: boolean) => {
    setAiSelected(prev => {
      const next = { ...prev, [`p:${primary}`]: checked }
      secondaries.forEach(s => { next[`s:${primary}:${s}`] = checked })
      return next
    })
  }

  const applyAiSelection = async () => {
    if (!aiSuggestion) return
    try {
      setAiApplying(true)
      const selectedPrimaries = new Set<string>()
      const selectedSecondaryMap: Record<string, string[]> = {}
      aiSuggestion.matches.forEach(m => {
        if (aiSelected[`p:${m.primary}`]) selectedPrimaries.add(m.primary)
        const secs = m.secondaries.filter(s => aiSelected[`s:${m.primary}:${s}`])
        if (secs.length > 0) selectedSecondaryMap[m.primary] = secs
      })
      const selectedNew = aiSuggestion.newTags.filter(nt => aiSelected[`n:${nt.name}`])

      // 新标签先创建（符合标签体系：挂在指定一级标签下），失败不阻断
      for (const nt of selectedNew) {
        try {
          await fetch('/api/v1/settings/tags/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: nt.name, parentName: nt.parentName }),
          })
        } catch { /* 忽略，标签仍作为普通标签写入图片 */ }
      }

      const currentLabels: string[] = Array.isArray(image?.labels) ? [...image.labels] : []
      const has = (n: string) => currentLabels.some(l => l.toLowerCase() === n.toLowerCase())
      selectedPrimaries.forEach(p => { if (!has(p)) currentLabels.push(p) })
      const categoryMap: Record<string, string> = { ...((image as any).tagCategoryMap || {}) }
      Object.entries(selectedSecondaryMap).forEach(([primary, secs]) => {
        secs.forEach(s => {
          if (!has(s)) currentLabels.push(s)
          categoryMap[s] = primary
        })
      })
      selectedNew.forEach(nt => {
        if (!has(nt.name)) currentLabels.push(nt.name)
        categoryMap[nt.name] = nt.parentName
      })

      setImageEditData({ ...image, labels: currentLabels, tagCategoryMap: categoryMap } as ImageType)
      closeAiModal()
    } finally {
      setAiApplying(false)
    }
  }

  return (
    <Drawer
      title={t('editImageTitle')}
      placement="left"
      size="large"
      open={imageEdit}
      onClose={() => { setImageEdit(false); setImageEditData({} as ImageType) }}
      mask={false}
      styles={{
        header: { padding: '16px 24px', background: 'var(--card)' },
        body: { padding: 0 },
      }}
      footer={
        <div className="p-4 bg-card border-t border-border">
          <Button 
            type="primary"
            disabled={loading}
            onClick={() => submit()} 
            className="w-full h-10 bg-primary hover:bg-primary/90 border-none text-base font-medium shadow-sm transition-all duration-200 transform hover:scale-[1.01]"
          >
            {loading && <ReloadOutlined spin style={{ marginRight: 8, fontSize: 16 }} />}
            {t('saveChanges')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col h-full bg-card">
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
          <GroupTitle title={t('basicInfo')} />
          <div className="space-y-4">
            <InputField label={t('titleLabel')} id="title" value={image?.title ?? ''} onChange={(e:any) => setImageEditData({...image, title: e.target.value})} placeholder={t('titlePlaceholder')} />
            <InputField label={t('detailLabel')} id="detail" value={image?.detail ?? ''} onChange={(e:any) => setImageEditData({...image, detail: e.target.value})} placeholder={t('detailPlaceholder')} />
            
            {/* emblor TagInput 外层 div 的 border 类不可覆盖，Tailwind v4 下默认取 currentColor（近黑），
                与内层容器边框叠加成显眼黑框：这里把外层边框透明化，仅保留内层 antd Input 风格描边 */}
            <div className="mb-4 [&_.rounded-md.border]:border-transparent">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-muted-foreground">{t('tagLabel')}</label>
                {aiTagAvailable && (
                  <Button
                    size="small"
                    icon={<RobotOutlined />}
                    loading={aiRecommending}
                    onClick={handleAiRecommend}
                  >
                    {t('aiRecommendBtn')}
                  </Button>
                )}
              </div>
              <TagInput
                tags={tagItems}
                setTags={(newTags: any) => setImageEditData({...image, labels: newTags?.map((label: any) => label.text)})}
                placeholder={t('tagPlaceholder')}
                enableAutocomplete
                autocompleteOptions={allTagOptions}
                styleClasses={{
                  inlineTagsContainer: 'rounded-[6px] border border-[#d9d9d9] bg-card p-2 gap-2 min-h-[44px] transition-all duration-200 hover:border-[#4096ff] focus-within:border-[#1677ff] focus-within:ring-2 focus-within:ring-[#1677ff]/20 dark:border-[#424242] dark:hover:border-[#4096ff] dark:focus-within:border-[#1677ff]',
                  input: 'w-full min-w-[100px] focus-visible:outline-none shadow-none px-2 h-8 text-sm text-foreground font-normal placeholder:text-muted-foreground',
                  tag: { body: 'h-7 bg-muted border border-border rounded text-xs px-2 flex items-center gap-1 text-foreground', closeButton: 'text-muted-foreground hover:text-destructive transition-colors' },
                }}
                activeTagIndex={activeTagIndex}
                setActiveTagIndex={setActiveTagIndex}
              />
            </div>

            <div className="p-4 border border-border rounded-lg bg-muted/50 transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{t('showStatus')}</span>
                <Switch 
                  checked={image?.show === 0} 
                  onChange={(checked) => setImageEditData({...image, show: checked ? 0 : 1})} 
                  checkedChildren={t('show')} 
                  unCheckedChildren={t('hide')}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>

            <InputField label={t('sortWeightDesc')} id="sort" type="number" value={image?.sort ?? 0} onChange={(e:any) => setImageEditData({...image, sort: Number(e.target.value)})} />
          </div>

          <GroupTitle title={t('linkResources')} />
          <div className="space-y-4">
            <InputField label={t('originalUrl')} id="url" value={image?.url ?? ''} onChange={(e:any) => setImageEditData({...image, url: e.target.value})} />
            <InputField label={t('previewUrl')} id="preview_url" value={image?.preview_url ?? ''} onChange={(e:any) => setImageEditData({...image, preview_url: e.target.value})} />
            <InputField label={t('videoUrl')} id="video_url" value={image?.video_url ?? ''} onChange={(e:any) => setImageEditData({...image, video_url: e.target.value})} />
          </div>

          <GroupTitle title={t('sizePosition')} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label={t('widthPx')} id="width" type="number" value={image?.width ?? 0} onChange={(e:any) => setImageEditData({...image, width: Number(e.target.value)})} />
            <InputField label={t('heightPx')} id="height" type="number" value={image?.height ?? 0} onChange={(e:any) => setImageEditData({...image, height: Number(e.target.value)})} />
            <InputField label={t('longitude')} id="lon" value={image?.lon ?? ''} onChange={(e:any) => setImageEditData({...image, lon: e.target.value})} />
            <InputField label={t('latitude')} id="lat" value={image?.lat ?? ''} onChange={(e:any) => setImageEditData({...image, lat: e.target.value})} />
          </div>

          <GroupTitle title={t('exifInfo')} />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button 
                size="small" 
                onClick={() => referenceInputRef.current?.click()}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground border-none transition-all duration-200"
              >
                {t('extractExifFromRef')}
              </Button>
              <input
                ref={referenceInputRef}
                type="file"
                accept="image/*,.cr2,.arw,.nef,.tif,.tiff,.dng"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) applyReferenceExif(file)
                  e.target.value = ''
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField label={t('cameraBrand')} id="exif_make" value={image?.exif?.make ?? ''} onChange={(e:any) => setImageEditData({...image, exif: {...image.exif, make: e.target.value}})} />
              <InputField label={t('cameraModel')} id="exif_model" value={image?.exif?.model ?? ''} onChange={(e:any) => setImageEditData({...image, exif: {...image.exif, model: e.target.value}})} />
            </div>
            <InputField label={t('lensModel')} id="exif_lens_model" value={image?.exif?.lens_model ?? ''} onChange={(e:any) => setImageEditData({...image, exif: {...image.exif, lens_model: e.target.value}})} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label={t('focalLength')} id="exif_focal_length" value={image?.exif?.focal_length ?? ''} onChange={(e:any) => setImageEditData({...image, exif: {...image.exif, focal_length: e.target.value}})} />
              <InputField label={t('aperture')} id="exif_f_number" value={image?.exif?.f_number ?? ''} onChange={(e:any) => setImageEditData({...image, exif: {...image.exif, f_number: e.target.value}})} />
              <InputField label={t('shutter')} id="exif_exposure_time" value={image?.exif?.exposure_time ?? ''} onChange={(e:any) => setImageEditData({...image, exif: {...image.exif, exposure_time: e.target.value}})} />
              <InputField label={t('iso')} id="exif_iso" value={image?.exif?.iso_speed_rating ?? ''} onChange={(e:any) => setImageEditData({...image, exif: {...image.exif, iso_speed_rating: e.target.value}})} />
            </div>
            <div className="mb-4 w-full space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{t('captureDate')}</label>
              <DatePicker
                style={{ width: '100%' }}
                placeholder={t('captureDate')}
                value={
                  image?.exif?.data_time
                    ? dayjs(image.exif.data_time.split(' ')[0].replace(/:/g, '-'), 'YYYY-MM-DD')
                    : undefined
                }
                onChange={(date) => {
                  const dateValue = date
                    ? `${date.format('YYYY-MM-DD').replace(/-/g, ':')} 00:00:00`
                    : ''
                  setImageEditData({ ...image, exif: { ...image.exif, data_time: dateValue } })
                }}
                allowClear
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI 推荐标签审核弹窗：全部采纳/取消勾选均由用户决定 */}
      <Modal
        title={
          <span className="flex items-center gap-2">
            <RobotOutlined />
            {t('aiRecommendModalTitle')}
          </span>
        }
        open={aiModalOpen}
        onCancel={closeAiModal}
        footer={[
          <Button key="cancel" onClick={closeAiModal}>{t('aiCancel')}</Button>,
          <Button key="apply" type="primary" loading={aiApplying} onClick={applyAiSelection}>
            {t('aiApplySelected')}
          </Button>,
        ]}
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {aiSuggestion?.matches.map(m => (
            <div key={m.primary} className="p-3 border border-border rounded-lg">
              <Checkbox
                checked={!!aiSelected[`p:${m.primary}`]}
                onChange={e => toggleAiGroup(m.primary, m.secondaries, e.target.checked)}
              >
                <span className="font-medium">{m.primary}</span>
              </Checkbox>
              {m.secondaries.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 pl-6">
                  {m.secondaries.map(s => (
                    <Checkbox
                      key={s}
                      checked={!!aiSelected[`s:${m.primary}:${s}`]}
                      onChange={e => setAiSelected(prev => ({ ...prev, [`s:${m.primary}:${s}`]: e.target.checked }))}
                    >
                      {s}
                    </Checkbox>
                  ))}
                </div>
              )}
            </div>
          ))}
          {!!aiSuggestion?.newTags.length && (
            <div className="p-3 border border-dashed border-border rounded-lg">
              <div className="text-xs text-muted-foreground mb-2">{t('aiNewTagBadge')}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {aiSuggestion.newTags.map(nt => (
                  <Checkbox
                    key={nt.name}
                    checked={!!aiSelected[`n:${nt.name}`]}
                    onChange={e => setAiSelected(prev => ({ ...prev, [`n:${nt.name}`]: e.target.checked }))}
                  >
                    {nt.name}（{nt.parentName}）
                  </Checkbox>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </Drawer>
  )
}