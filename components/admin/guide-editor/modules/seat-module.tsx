'use client'

import React, { useState, useEffect } from 'react'
import {
  Input,
  Form,
  Select,
  Typography,
  Tag,
  Space,
  Upload,
  Image as AntImage,
  Button,
  App,
  theme,
} from 'antd'
import type { UploadProps } from 'antd'
import {
  UploadOutlined,
  EnvironmentOutlined,
  CameraOutlined,
  ClockCircleOutlined,
  AimOutlined,
} from '@ant-design/icons'
import ModuleBase from './module-base'

const { TextArea } = Input
const { Text, Paragraph } = Typography

interface SpotItem {
  id: string
  spotName?: string
  location?: string
  bestTime?: string
  season?: string
  direction?: string
  focalLength?: string
  aperture?: string
  shutterSpeed?: string
  iso?: string
  equipment?: string
  tips?: string
  sampleImage?: string
  notes?: string
}

interface SpotModuleProps {
  value: SpotItem[]
  onChange: (data: SpotItem[]) => void
}

const bestTimeOptions = [
  { value: 'sunrise', label: '日出' },
  { value: 'sunset', label: '日落' },
  { value: 'blue_hour', label: '蓝调时刻' },
  { value: 'golden_hour', label: '黄金时刻' },
  { value: 'midday', label: '正午' },
  { value: 'night', label: '夜间' },
  { value: 'anytime', label: '随时' },
]

const seasonOptions = [
  { value: 'spring', label: '春季' },
  { value: 'summer', label: '夏季' },
  { value: 'autumn', label: '秋季' },
  { value: 'winter', label: '冬季' },
  { value: 'all_season', label: '四季皆宜' },
]

const directionOptions = [
  { value: 'east', label: '朝东' },
  { value: 'south', label: '朝南' },
  { value: 'west', label: '朝西' },
  { value: 'north', label: '朝北' },
  { value: 'southeast', label: '东南' },
  { value: 'southwest', label: '西南' },
  { value: 'northeast', label: '东北' },
  { value: 'northwest', label: '西北' },
]

export default function SeatModule({ value, onChange }: SpotModuleProps) {
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const [uploading, setUploading] = useState(false)
  const [storageConfig, setStorageConfig] = useState<{ storage: string; folder: string } | null>(null)

  useEffect(() => {
    fetchStorageConfig()
  }, [])

  const fetchStorageConfig = async () => {
    try {
      const res = await fetch('/api/v1/settings/get?keys=storage_type,storage_folder', { credentials: 'include' })
      const result = await res.json()
      const data = Array.isArray(result) ? result : (result.data || [])
      const storage = data.find((c: any) => c.config_key === 'storage_type')?.config_value || 's3'
      const folder = data.find((c: any) => c.config_key === 'storage_folder')?.config_value || 'guides'
      setStorageConfig({ storage, folder })
    } catch {
      setStorageConfig({ storage: 's3', folder: 'guides' })
    }
  }

  const getBestTimeLabel = (time?: string) =>
    bestTimeOptions.find((o) => o.value === time)?.label || time || ''
  const getSeasonLabel = (season?: string) =>
    seasonOptions.find((o) => o.value === season)?.label || season || ''
  const getDirectionLabel = (direction?: string) =>
    directionOptions.find((o) => o.value === direction)?.label || direction || ''

  const handleImageUpload = (
    form: any,
    options: Parameters<NonNullable<UploadProps['customRequest']>>[0]
  ) => {
    const { file, onSuccess, onError } = options
    if (!storageConfig) {
      message.error('存储配置加载中，请稍后再试')
      onError?.(new Error('Storage config not loaded'))
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file as File)
      formData.append('storage', storageConfig.storage)
      formData.append('type', storageConfig.folder)

      fetch('/api/v1/file/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.code === 200 && result.data?.url) {
            form.setFieldValue('sampleImage', result.data.url)
            message.success('样图上传成功')
            onSuccess?.(result, file as File)
          } else {
            throw new Error(result.message || '上传失败')
          }
        })
        .catch((error) => {
          message.error('样图上传失败')
          onError?.(error as Error)
        })
        .finally(() => setUploading(false))
    } catch (error) {
      message.error('样图上传失败')
      onError?.(error as Error)
      setUploading(false)
    }
  }

  return (
    <ModuleBase
      title="摄影机位推荐"
      icon={<AimOutlined />}
      records={value || []}
      onChange={onChange}
      modalWidth={720}
      getDefaultRecord={() => ({
        id: Date.now().toString(),
      })}
      renderItem={(item: SpotItem) => (
        <div style={{ display: 'flex', gap: token.paddingMD }}>
          {item.sampleImage && (
            <div
              style={{
                width: 120,
                height: 90,
                flexShrink: 0,
                borderRadius: token.borderRadius,
                overflow: 'hidden',
              }}
            >
              <AntImage
                src={item.sampleImage}
                alt={item.spotName || '样图'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Space size={token.paddingXS} align="center" wrap style={{ marginBottom: token.paddingXS }}>
              <Text strong style={{ fontSize: token.fontSizeLG }}>
                {item.spotName || '未命名机位'}
              </Text>
              {item.bestTime && (
                <Tag color="orange">
                  <ClockCircleOutlined /> {getBestTimeLabel(item.bestTime)}
                </Tag>
              )}
              {item.season && <Tag color="green">{getSeasonLabel(item.season)}</Tag>}
              {item.direction && <Tag color="blue">{getDirectionLabel(item.direction)}</Tag>}
            </Space>
            {item.location && (
              <div style={{ fontSize: token.fontSizeSM, color: token.colorTextSecondary, marginBottom: token.paddingXS }}>
                <EnvironmentOutlined /> {item.location}
              </div>
            )}
            <Space size={token.paddingLG} wrap style={{ fontSize: token.fontSizeSM, color: token.colorTextSecondary }}>
              {item.focalLength && (
                <span>
                  <CameraOutlined /> {item.focalLength}
                </span>
              )}
              {item.aperture && <span>光圈 {item.aperture}</span>}
              {item.shutterSpeed && <span>快门 {item.shutterSpeed}</span>}
              {item.iso && <span>ISO {item.iso}</span>}
            </Space>
            {item.equipment && (
              <div style={{ fontSize: token.fontSizeSM, color: token.colorTextTertiary, marginTop: 4 }}>
                器材：{item.equipment}
              </div>
            )}
            {item.tips && (
              <Paragraph style={{ marginTop: token.paddingXS, marginBottom: 0, color: token.colorTextSecondary }}>
                {item.tips}
              </Paragraph>
            )}
            {item.notes && (
              <div style={{ fontSize: token.fontSizeSM, color: token.colorTextTertiary, marginTop: 4 }}>
                {item.notes}
              </div>
            )}
          </div>
        </div>
      )}
      renderEditForm={(form: any) => (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: token.paddingMD }}>
            <Form.Item label="机位名称" name="spotName">
              <Input placeholder="例如：故宫角楼" />
            </Form.Item>
            <Form.Item label="拍摄地点" name="location">
              <Input placeholder="例如：北京东城区" />
            </Form.Item>
            <Form.Item label="最佳时间" name="bestTime">
              <Select options={bestTimeOptions} placeholder="选择最佳拍摄时间" />
            </Form.Item>
            <Form.Item label="最佳季节" name="season">
              <Select options={seasonOptions} placeholder="选择最佳季节" />
            </Form.Item>
            <Form.Item label="拍摄方向" name="direction">
              <Select options={directionOptions} placeholder="选择拍摄方向" />
            </Form.Item>
            <Form.Item label="推荐焦段" name="focalLength">
              <Input placeholder="例如：16-35mm" />
            </Form.Item>
            <Form.Item label="光圈" name="aperture">
              <Input placeholder="例如：f/8" />
            </Form.Item>
            <Form.Item label="快门" name="shutterSpeed">
              <Input placeholder="例如：1/125s" />
            </Form.Item>
            <Form.Item label="ISO" name="iso">
              <Input placeholder="例如：100" />
            </Form.Item>
            <Form.Item label="器材" name="equipment">
              <Input placeholder="例如：三脚架、ND滤镜" />
            </Form.Item>
          </div>
          <Form.Item label="样图" name="sampleImage">
            <div style={{ display: 'flex', gap: token.paddingSM, alignItems: 'center' }}>
              <Input
                placeholder="粘贴图片 URL 或点击右侧上传"
                style={{ flex: 1 }}
                onChange={(e) => form.setFieldValue('sampleImage', e.target.value)}
              />
              <Upload
                showUploadList={false}
                customRequest={(options) => handleImageUpload(form, options)}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />} loading={uploading}>
                  上传图片
                </Button>
              </Upload>
            </div>
          </Form.Item>
          <Form.Item shouldUpdate={(prev, next) => prev.sampleImage !== next.sampleImage}>
            {({ getFieldValue }) => {
              const imgUrl = getFieldValue('sampleImage')
              return imgUrl ? (
                <div style={{ marginBottom: token.paddingMD }}>
                  <AntImage
                    src={imgUrl}
                    alt="样图预览"
                    style={{ maxWidth: 300, maxHeight: 200, borderRadius: token.borderRadius }}
                  />
                </div>
              ) : null
            }}
          </Form.Item>
          <Form.Item label="拍摄技巧" name="tips">
            <TextArea rows={3} placeholder="请输入拍摄技巧" />
          </Form.Item>
          <Form.Item label="注意事项" name="notes">
            <TextArea rows={2} placeholder="请输入注意事项" />
          </Form.Item>
        </>
      )}
    />
  )
}
