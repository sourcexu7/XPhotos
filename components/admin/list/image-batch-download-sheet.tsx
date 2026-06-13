'use client'

import React, { useEffect, useState } from 'react'
import { useButtonStore } from '~/app/providers/button-store-providers'
import { message } from 'antd'
import { ReloadOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons'
import { Button, Modal, Checkbox } from 'antd'
import { useTranslations } from 'next-intl'

type ImageRow = {
  id: string
  url?: string | null
  preview_url?: string | null
  video_url?: string | null
  title?: string | null
  image_name?: string | null
  del?: number | null
}

type Props = {
  selectedIds?: string[]
}

/** 猜测文件扩展名（优先使用 image_name 的扩展名，其次从 URL pathname 解析） */
function guessExtension(row: ImageRow, url: string): string {
  try {
    if (row.image_name) {
      const idx = row.image_name.lastIndexOf('.')
      if (idx >= 0) return row.image_name.slice(idx)
    }
    const u = new URL(url)
    const path = decodeURIComponent(u.pathname)
    const idx = path.lastIndexOf('.')
    if (idx >= 0) return path.slice(idx)
  } catch {
    /* noop */
  }
  return ''
}

function buildFileName(row: ImageRow, url: string, index: number): string {
  const ext = guessExtension(row, url) || '.jpg'
  const base = row.image_name
    ? row.image_name.replace(/\.[^.]+$/, '')
    : row.id
  const title = row.title ? `_${row.title.replace(/[\\/:*?"<>|\s]+/g, '_')}` : ''
  return `${String(index + 1).padStart(3, '0')}_${base}${title}${ext}`
}

export default function ImageBatchDownloadSheet({ selectedIds }: Props) {
  const { imageBatchDownload, setImageBatchDownload } = useButtonStore(
    (state) => state,
  )
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<ImageRow[]>([])
  const t = useTranslations()

  // 打开弹窗时拉取 URL 数据
  useEffect(() => {
    if (!imageBatchDownload) return
    if (!selectedIds || selectedIds.length === 0) {
      message.warning(t('List.batchDeleteNoSelection'))
      setImageBatchDownload(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/v1/images/by-ids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedIds }),
        }).then((r) => r.json())
        if (cancelled) return
        if (res && res.code === 200 && Array.isArray(res.data)) {
          setRows(res.data as ImageRow[])
        } else {
          message.error(String(res?.message || t('List.batchDeleteFailed')))
        }
      } catch (e) {
        if (!cancelled) message.error(t('List.batchDeleteFailed'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [imageBatchDownload, selectedIds, t, setImageBatchDownload])

  // 把 rows 的 url 扁平化；保留原始顺序，并按输入 selectedIds 顺序对齐
  const downloadables = (selectedIds ?? [])
    .map<{ id: string; url?: string | null; row: ImageRow; indexInSelected: number }>(
      (id, i) => {
        const row = rows.find((r) => r.id === id)
        return { id, url: row?.url, row: row!, indexInSelected: i }
      },
    )
    .filter((x) => !!x.url)

  const missingCount = (selectedIds?.length ?? 0) - downloadables.length

  async function triggerDownloadAll() {
    if (downloadables.length === 0) {
      message.warning(t('List.batchDownloadNoUrl'))
      return
    }

    // 逐个触发浏览器下载（带短间隔避免被浏览器拦截）
    // 注意：浏览器通常只允许用户触发的下载，连续下载会要求用户允许“多个下载”
    for (let i = 0; i < downloadables.length; i++) {
      const item = downloadables[i]
      const name = buildFileName(item.row, item.url!, i)
      const a = document.createElement('a')
      a.href = item.url!
      a.download = name
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      a.remove()
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
    message.success(
      t('List.batchDownloadTriggerCount', { count: downloadables.length }),
    )
  }

  function copyAllUrls() {
    const text = downloadables.map((x) => x.url).join('\n')
    if (!text) {
      message.warning(t('List.batchDownloadNoUrl'))
      return
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() =>
          message.success(t('List.batchDownloadCopied', { count: downloadables.length })),
        )
        .catch(() => fallbackCopy(text))
    } else {
      fallbackCopy(text)
    }
  }

  function fallbackCopy(text: string) {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
      message.success(t('List.batchDownloadCopied', { count: downloadables.length }))
    } catch {
      message.error(t('List.batchDeleteFailed'))
    }
    ta.remove()
  }

  function downloadUrlList() {
    const text = downloadables.map((x) => x.url).join('\n')
    if (!text) {
      message.warning(t('List.batchDownloadNoUrl'))
      return
    }
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = `image_urls_${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(href)
    message.success(t('List.batchDownloadTxtSaved'))
  }

  return (
    <Modal
      title={
        <div className="text-center text-lg font-semibold text-gray-900">
          {t('List.batchDownloadTitle')}
        </div>
      }
      open={imageBatchDownload}
      onCancel={() => setImageBatchDownload(false)}
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:justify-center gap-3">
          <Button onClick={() => setImageBatchDownload(false)}>
            {t('Button.canal')}
          </Button>
          <Button
            type="primary"
            disabled={loading || downloadables.length === 0}
            onClick={downloadUrlList}
            icon={<DownloadOutlined />}
          >
            {t('List.batchDownloadAsTxt')}
          </Button>
          <Button
            type="default"
            disabled={loading || downloadables.length === 0}
            onClick={copyAllUrls}
            icon={<CopyOutlined />}
          >
            {t('List.batchDownloadCopyAll')}
          </Button>
          <Button
            type="primary"
            danger
            disabled={loading || downloadables.length === 0}
            onClick={triggerDownloadAll}
          >
            {loading && <ReloadOutlined spin style={{ marginRight: 8, fontSize: 16 }} />}
            {t('List.batchDownloadTriggerAll')}
          </Button>
        </div>
      }
      centered
      width={720}
    >
      <div>
        <div className="text-center text-gray-500 mt-2">
          {t('List.batchDownloadDescription')}
          <span className="font-bold">{selectedIds?.length || 0}</span>
          {t('List.batchDownloadSuffix')}
        </div>

        <div className="flex justify-center items-center gap-4 mt-3 text-xs text-gray-500">
          <span className="text-emerald-600">
            {t('List.batchDownloadValidCount', { count: downloadables.length })}
          </span>
          {missingCount > 0 && (
            <span className="text-amber-600">
              {t('List.batchDownloadMissingCount', { count: missingCount })}
            </span>
          )}
        </div>

        <div className="max-h-[420px] overflow-y-auto my-4 bg-white p-3 rounded-lg border border-gray-100">
          <div className="text-xs text-gray-400 mb-2">
            {t('List.batchDownloadIdsLabel')}
          </div>
          <div className="grid grid-cols-1 gap-2">
            {(selectedIds ?? []).map((id, idx) => {
              const row = rows.find((r) => r.id === id)
              const hasUrl = !!row?.url
              const safe = hasUrl ? row!.url! : t('List.batchDownloadNoUrl')
              return (
                <div
                  key={id}
                  className="flex items-start gap-2 text-xs text-gray-700 py-1.5 border-b border-gray-50 last:border-0"
                >
                  <span className="w-8 text-right text-gray-400 tabular-nums">
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <div className="min-w-0 flex-1">
                    {hasUrl ? (
                      <a
                        href={row!.url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {row!.url}
                      </a>
                    ) : (
                      <span className="text-amber-600 break-all">{safe}</span>
                    )}
                    <div className="text-[11px] text-gray-400 truncate">
                      ID: <span className="font-mono">{id}</span>
                      {row?.title ? ` · ${row.title}` : ''}
                      {row?.del ? ` · (${t('List.batchDownloadMarkDeleted')})` : ''}
                    </div>
                  </div>
                  {hasUrl && (
                    <Button
                      size="small"
                      onClick={() => {
                        const a = document.createElement('a')
                        a.href = row!.url!
                        a.download = buildFileName(row!, row!.url!, idx)
                        a.target = '_blank'
                        a.rel = 'noopener noreferrer'
                        document.body.appendChild(a)
                        a.click()
                        a.remove()
                      }}
                    >
                      <DownloadOutlined />
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}

// suppress unused imports (some icons may be kept for future)
void Checkbox
