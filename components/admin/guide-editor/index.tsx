'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Button, Drawer, Space, App, Typography, Spin, Empty, Tooltip, Dropdown, theme } from 'antd'
import { 
  UnorderedListOutlined,
  SaveOutlined,
  EyeOutlined,
  EditOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  ReloadOutlined,
  PictureOutlined,
  GlobalOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import ModuleManager from './module-manager'
import ContentEditor from './content-editor'
import TableOfContentsManager from './toc-manager'
import GuidePreview from './guide-preview'
import ModulePreview from './modules/module-preview'
import GuideCoverEditor from './cover-editor'
import useSWR, { mutate } from 'swr'

const API_BASE = '/api/v1/guide-modules'
const GUIDES_API = '/api/v1/guides'

interface Module {
  id: string
  guide_id: string
  name: string
  template: string | null
  sort: number
  is_hidden: boolean
  createdAt: string
  updatedAt: string | null
  contents?: Content[]
  moduleData?: any
}

interface Content {
  id: string
  module_id: string
  type: string
  content: any
  sort: number
}

interface Album {
  id: string
  name: string
  album_value: string
  cover?: string
}

interface GuideAlbumsRelation {
  id: string
  guide_id: string
  album_id: string
  album: Album
}

interface Guide {
  id: string
  title: string
  country: string
  city: string
  days: number
  cover_image?: string
  albums: GuideAlbumsRelation[]
}

interface GuideEditorProps {
  guideId: string
  guideShow?: number
  onSave?: () => void
}

const SPECIAL_TEMPLATES = ['itinerary', 'expense', 'checklist', 'transport', 'photo', 'tips', 'railway', 'timeline', 'notes', 'review', 'seat']

export default function GuideEditor({ guideId, guideShow, onSave }: GuideEditorProps) {
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const t = useTranslations('Guides')
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [isTocDrawerOpen, setIsTocDrawerOpen] = useState(false)
  const [isCoverDrawerOpen, setIsCoverDrawerOpen] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [moduleContentData, setModuleContentData] = useState<any>(null)
  const [, setModulesWithData] = useState<Module[]>([])
  const [isLoadingModuleData, setIsLoadingModuleData] = useState(false)
  const [guide, setGuide] = useState<Guide | null>(null)
  const [coverImage, setCoverImage] = useState<string>('')
  const [selectedAlbumIds, setSelectedAlbumIds] = useState<string[]>([])
  const [leftPanelWidth, setLeftPanelWidth] = useState(320)
  const resizingRef = useRef<{ startX: number; startWidth: number } | null>(null)

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    resizingRef.current = { startX: e.clientX, startWidth: leftPanelWidth }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [leftPanelWidth])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return
      const delta = e.clientX - resizingRef.current.startX
      const newWidth = Math.max(200, Math.min(600, resizingRef.current.startWidth + delta))
      setLeftPanelWidth(newWidth)
    }
    const handleMouseUp = () => {
      if (resizingRef.current) {
        resizingRef.current = null
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const { data: modules, isLoading, error } = useSWR<Module[]>(`${API_BASE}/module/${guideId}`, async (url: string) => {
    const res = await fetch(url, { credentials: 'include' })
    const json = await res.json()
    return json.data || []
  })

  const fetchGuide = useCallback(async () => {
    try {
      const res = await fetch(`${GUIDES_API}/${guideId}`, { credentials: 'include' })
      const result = await res.json()
      if (result.data) {
        setGuide(result.data)
        setCoverImage(result.data.cover_image || '')
        setSelectedAlbumIds(result.data.albums?.map((a: GuideAlbumsRelation) => a.album_id) || [])
      }
    } catch (error) {
      console.error('Failed to fetch guide:', error)
    }
  }, [guideId])

  useEffect(() => {
    fetchGuide()
  }, [fetchGuide])

  const loadAllModuleData = useCallback(async (moduleList: Module[]) => {
    setIsLoadingModuleData(true)
    try {
      const modulesWithDataPromises = moduleList.map(async (mod) => {
        if (SPECIAL_TEMPLATES.includes(mod.template || '')) {
          if (mod.moduleData !== undefined) {
            return mod
          }
          const res = await fetch(`${API_BASE}/module-data/${mod.id}`, { credentials: 'include' })
          const json = await res.json()
          return { ...mod, moduleData: json.data || [] }
        }
        return mod
      })
      const result = await Promise.all(modulesWithDataPromises)
      setModulesWithData(result)
    } catch (error) {
      console.error('Failed to load module data:', error)
      setModulesWithData(moduleList)
    } finally {
      setIsLoadingModuleData(false)
    }
  }, [])

  useEffect(() => {
    if (isPreviewMode && modules && modules.length > 0) {
      loadAllModuleData(modules)
    }
  }, [isPreviewMode, modules, loadAllModuleData])

  const handleSave = async () => {
    try {
      await fetch(`${GUIDES_API}/${guideId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cover_image: coverImage,
        }),
      })
      
      await fetch(`${GUIDES_API}/${guideId}/albums`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          album_ids: selectedAlbumIds,
        }),
      })
      
      message.success(t('saveSuccess'))
      onSave?.()
    } catch (error) {
      console.error('handleSave error:', error)
      message.error(t('saveFailed'))
    }
  }

  const handleCoverChange = (url: string) => {
    setCoverImage(url)
  }

  const handleAlbumsChange = (albumIds: string[]) => {
    setSelectedAlbumIds(albumIds)
  }

  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleFrontendPreview = () => {
    if (guideShow !== 1) {
      message.warning(t('guideNotPublicTip') || '攻略未公开，前台无法预览')
      return
    }
    window.open(`/guides/${guideId}`, '_blank')
  }

  if (isLoading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: token.colorBgLayout }}>
        <Spin size="large" tip={t('loading')}>
          <div style={{ textAlign: 'center', padding: 32 }} />
        </Spin>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: token.colorBgLayout }}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Empty description={<Typography.Text type="secondary">{t('loadFailed')}</Typography.Text>} />
          <Button type="primary" style={{ marginTop: 16 }} onClick={() => mutate(`${API_BASE}/module/${guideId}`)}>
            {t('refresh')}
          </Button>
        </div>
      </div>
    )
  }

  // 次操作菜单（低频操作收入 More 下拉）
  const moreMenuItems = [
    {
      key: 'refresh',
      icon: <ReloadOutlined />,
      label: t('refreshData'),
      onClick: () => mutate(`${API_BASE}/module/${guideId}`),
    },
    {
      key: 'cover',
      icon: <PictureOutlined />,
      label: t('coverSettings'),
      onClick: () => setIsCoverDrawerOpen(true),
    },
    {
      key: 'fullscreen',
      icon: isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />,
      label: isFullscreen ? t('exitFullscreen') : t('fullscreenEdit'),
      onClick: toggleFullscreen,
    },
  ]

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      ...(isFullscreen ? { position: 'fixed' as const, inset: 0, zIndex: 50, background: token.colorBgContainer } : {}),
    }}>
      {/* 次级工具栏（E1: 灰底区别于页面主栏） */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${token.paddingSM}px ${token.paddingLG}px`,
        background: token.colorBgLayout,
        borderBottom: `1px solid ${token.colorBorder}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: token.marginSM }}>
          <span style={{ color: isPreviewMode ? token.colorPrimary : token.colorSuccess }}>
            {isPreviewMode ? <EyeOutlined /> : <EditOutlined />}
          </span>
          <Typography.Text strong style={{ fontSize: token.fontSize }}>
            {isPreviewMode ? t('previewMode') : t('editMode')}
          </Typography.Text>
        </div>
        <Space size="middle">
          {/* 高频操作 */}
          <Tooltip title={isPreviewMode ? t('switchToEdit') : t('switchToPreview')}>
            <Button 
              icon={isPreviewMode ? <EditOutlined /> : <EyeOutlined />} 
              onClick={togglePreview}
            >
              {isPreviewMode ? t('edit') : t('preview')}
            </Button>
          </Tooltip>
          <Tooltip title={guideShow !== 1 ? (t('guideNotPublicTip') || '攻略未公开，前台无法预览') : (t('frontendPreviewTip') || '在新窗口打开前台页面')}>
            <Button 
              icon={<GlobalOutlined />} 
              onClick={handleFrontendPreview}
              disabled={guideShow !== 1}
            >
              {t('frontendPreview') || '前台预览'}
            </Button>
          </Tooltip>
          <Button 
            icon={<UnorderedListOutlined />} 
            onClick={() => setIsTocDrawerOpen(true)}
          >
            {t('tocManager')}
          </Button>
          {/* 低频操作收入 More */}
          <Dropdown menu={{ items: moreMenuItems }} placement="bottomRight">
            <Button icon={<MoreOutlined />} />
          </Dropdown>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={handleSave}
          >
            {t('save')}
          </Button>
        </Space>
      </div>

      {/* 主内容区 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {isPreviewMode ? (
          /* 纯预览模式 */
          <div style={{ flex: 1, padding: token.paddingLG, overflow: 'auto', background: token.colorBgLayout }}>
            <div style={{ maxWidth: 896, margin: '0 auto', background: token.colorBgContainer, borderRadius: token.borderRadiusLG, padding: token.paddingXL, boxShadow: token.boxShadowTertiary }}>
              {isLoadingModuleData ? (
                <Spin size="large" tip={t('loadingPreviewData')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }} />
                </Spin>
              ) : (
                <GuidePreview guideId={guideId} />
              )}
            </div>
          </div>
        ) : (
          /* 编辑+预览模式 */
          <>
            {/* 左侧模块列表（可拖拽调整宽度） */}
            <div style={{ width: leftPanelWidth, borderRight: `1px solid ${token.colorBorder}`, background: token.colorBgContainer, overflow: 'auto', position: 'relative', flexShrink: 0 }}>
              <div style={{ padding: token.padding }}>
                <ModuleManager
                  guideId={guideId}
                  selectedModule={selectedModule}
                  onModuleSelect={setSelectedModule}
                />
              </div>
              {/* 拖拽调整宽度的把手 */}
              <div
                onMouseDown={handleResizeStart}
                style={{
                  position: 'absolute',
                  top: 0,
                  right: -3,
                  width: 6,
                  height: '100%',
                  cursor: 'col-resize',
                  zIndex: 10,
                }}
              />
            </div>

            {/* 中间编辑区 */}
            <div style={{ flex: 1, overflow: 'auto', background: token.colorBgContainer, borderRight: `1px solid ${token.colorBorder}` }}>
              <div style={{ padding: token.paddingLG }}>
                <ContentEditor 
                  module={selectedModule} 
                  onContentDataChange={setModuleContentData}
                />
              </div>
            </div>

            {/* 右侧预览区（E5: 小屏隐藏） */}
            <div className="hidden lg:flex" style={{ width: 384, overflow: 'auto', background: token.colorBgLayout, flexDirection: 'column' }}>
              <div style={{ padding: token.padding, position: 'sticky', top: 0, background: token.colorBgLayout, zIndex: 10, borderBottom: `1px solid ${token.colorBorder}` }}>
                <Typography.Text strong style={{ fontSize: token.fontSizeSM }}>
                  {t('realTimePreview')}
                </Typography.Text>
              </div>
              <div style={{ flex: 1, padding: token.padding, overflow: 'auto' }}>
                <ModulePreview 
                  type={selectedModule?.template || 'text'}
                  data={moduleContentData}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* 目录管理抽屉 */}
      <Drawer
        title={t('tocManager')}
        placement="right"
        size="large"
        onClose={() => setIsTocDrawerOpen(false)}
        open={isTocDrawerOpen}
      >
        <TableOfContentsManager 
          guideId={guideId} 
          modules={modules || []}
          onModuleSelect={() => {}}
        />
      </Drawer>

      {/* 封面编辑抽屉 */}
      <Drawer
        title={t('coverSettings')}
        placement="right"
        size="large"
        onClose={() => setIsCoverDrawerOpen(false)}
        open={isCoverDrawerOpen}
      >
        <GuideCoverEditor
          guideId={guideId}
          guideTitle={guide?.title || ''}
          coverImage={coverImage}
          albums={guide?.albums || []}
          onCoverChange={handleCoverChange}
          onAlbumsChange={handleAlbumsChange}
        />
      </Drawer>
    </div>
  )
}
