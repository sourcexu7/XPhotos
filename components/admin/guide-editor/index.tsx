'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button, Drawer, Space, App, Typography, Spin, Empty, Tooltip, Badge } from 'antd'
import { 
  UnorderedListOutlined,
  SaveOutlined,
  EyeOutlined,
  EditOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  ReloadOutlined,
  PictureOutlined
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
  onSave?: () => void
}

const SPECIAL_TEMPLATES = ['itinerary', 'expense', 'checklist', 'transport', 'photo', 'tips']

export default function GuideEditor({ guideId, onSave }: GuideEditorProps) {
  const { message } = App.useApp()
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [isTocDrawerOpen, setIsTocDrawerOpen] = useState(false)
  const [isCoverDrawerOpen, setIsCoverDrawerOpen] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [moduleContentData, setModuleContentData] = useState<any>(null)
  const [modulesWithData, setModulesWithData] = useState<Module[]>([])
  const [isLoadingModuleData, setIsLoadingModuleData] = useState(false)
  const [guide, setGuide] = useState<Guide | null>(null)
  const [coverImage, setCoverImage] = useState<string>('')
  const [selectedAlbumIds, setSelectedAlbumIds] = useState<string[]>([])

  const { data: modules, isLoading, error } = useSWR<Module[]>(`${API_BASE}/module/${guideId}`, async (url: string) => {
    const res = await fetch(url)
    const json = await res.json()
    return json.data || []
  })

  const fetchGuide = useCallback(async () => {
    try {
      const res = await fetch(`${GUIDES_API}/${guideId}`)
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
      // API 已经返回了 moduleData，直接使用
      // 如果某些模块没有 moduleData，再单独加载
      const modulesWithDataPromises = moduleList.map(async (mod) => {
        if (SPECIAL_TEMPLATES.includes(mod.template || '')) {
          if (mod.moduleData !== undefined) {
            return mod
          }
          const res = await fetch(`${API_BASE}/module-data/${mod.id}`)
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
      // 保存封面和相册关联
      await fetch(`${GUIDES_API}/${guideId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cover_image: coverImage,
        }),
      })
      
      await fetch(`${GUIDES_API}/${guideId}/albums`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          album_ids: selectedAlbumIds,
        }),
      })
      
      message.success('保存成功')
      onSave?.()
    } catch (error) {
      message.error('保存失败')
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

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <Spin size="large" tip="加载中...">
          <div className="text-center p-8" />
        </Spin>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <Empty 
            description={
              <span className="text-gray-600">加载失败，请刷新重试</span>
            } 
          />
          <Button 
            type="primary" 
            className="mt-4" 
            onClick={() => mutate(`${API_BASE}/module/${guideId}`)}
          >
            刷新
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* 工具栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Badge 
            status={isPreviewMode ? "processing" : "default"} 
            style={{ 
              backgroundColor: isPreviewMode ? '#3B82F6' : '#10B981' 
            }} 
          />
          <span className="text-sm font-medium text-gray-700">
            {isPreviewMode ? '预览模式' : '编辑模式'}
          </span>
        </div>
        <Space size="middle">
          <Tooltip title="刷新数据">
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => mutate(`${API_BASE}/module/${guideId}`)}
              className="rounded-lg"
            />
          </Tooltip>
          <Tooltip title="封面设置">
            <Button 
              icon={<PictureOutlined />} 
              onClick={() => setIsCoverDrawerOpen(true)}
              className="rounded-lg"
            >
              封面
            </Button>
          </Tooltip>
          <Tooltip title={isPreviewMode ? '切换编辑' : '切换预览'}>
            <Button 
              icon={isPreviewMode ? <EditOutlined /> : <EyeOutlined />} 
              onClick={togglePreview}
              className="rounded-lg"
            >
              {isPreviewMode ? '编辑' : '预览'}
            </Button>
          </Tooltip>
          <Tooltip title={isFullscreen ? '退出全屏' : '全屏编辑'}>
            <Button 
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />} 
              onClick={toggleFullscreen}
              className="rounded-lg"
            />
          </Tooltip>
          <Button 
            icon={<UnorderedListOutlined />} 
            onClick={() => setIsTocDrawerOpen(true)}
            className="rounded-lg"
          >
            目录管理
          </Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={handleSave}
            className="rounded-lg bg-blue-600 hover:bg-blue-700"
          >
            保存
          </Button>
        </Space>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {isPreviewMode ? (
          /* 纯预览模式 */
          <div className="flex-1 p-6 overflow-auto bg-gray-50">
            <div className="max-w-4xl mx-auto bg-white rounded-xl p-8 shadow-sm">
              {isLoadingModuleData ? (
                <Spin size="large" tip="加载预览数据...">
                  <div className="flex items-center justify-center py-12" />
                </Spin>
              ) : (
                <GuidePreview guideId={guideId} />
              )}
            </div>
          </div>
        ) : (
          /* 编辑+预览模式 */
          <>
            {/* 左侧模块列表 */}
            <div className="w-72 border-r border-gray-200 bg-white overflow-auto">
              <div className="p-4">
                <ModuleManager
                  guideId={guideId}
                  selectedModule={selectedModule}
                  onModuleSelect={setSelectedModule}
                />
              </div>
            </div>

            {/* 中间编辑区 */}
            <div className="flex-1 overflow-auto bg-white border-r border-gray-200">
              <div className="p-6">
                <ContentEditor 
                  module={selectedModule} 
                  onContentDataChange={setModuleContentData}
                />
              </div>
            </div>

            {/* 右侧预览区 */}
            <div className="w-96 overflow-auto bg-gray-50">
              <div className="p-4 sticky top-0 bg-gray-50 z-10 border-b border-gray-200">
                <Typography.Text strong className="text-sm text-gray-700">
                  📱 实时预览
                </Typography.Text>
              </div>
              <div className="h-[calc(100%-64px)] p-4">
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
        title="目录管理"
        placement="right"
        size="large"
        onClose={() => setIsTocDrawerOpen(false)}
        open={isTocDrawerOpen}
        className="rounded-l-xl"
      >
        <TableOfContentsManager 
          guideId={guideId} 
          modules={modules || []}
        />
      </Drawer>

      {/* 封面编辑抽屉 */}
      <Drawer
        title="封面设置"
        placement="right"
        size="large"
        onClose={() => setIsCoverDrawerOpen(false)}
        open={isCoverDrawerOpen}
        className="rounded-l-xl"
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