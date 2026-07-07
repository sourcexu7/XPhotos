'use client'

import { Drawer, Switch, Typography, Tag, theme } from 'antd'
import { useButtonStore } from '~/app/providers/button-store-providers'
import type { ImageType } from '~/types'
import type { ImageDataProps } from '~/types/props'
import React from 'react'
import ExifView from '~/components/admin/album/exif-view.tsx'
import LivePhoto from '~/components/album/live-photo'
import { MotionImage } from '~/components/album/motion-image'
import { useBlurImageDataUrl } from '~/hooks/use-blurhash'

const { Text } = Typography

export default function ImageView() {
  const { imageView, imageViewData, setImageView, setImageViewData } = useButtonStore(
    (state) => state,
  )
  const { token } = theme.useToken()

  const props: ImageDataProps = {
    data: imageViewData,
  }

  const dataURL = useBlurImageDataUrl(imageViewData.blurhash || '')

  return (
    <Drawer
      title={imageViewData.title || '图片预览'}
      placement="left"
      size={600}
      open={imageView}
      onClose={() => {
        setImageView(false)
        setImageViewData({} as ImageType)
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginLG }}>
        <div
          style={{
            borderRadius: token.borderRadiusLG,
            overflow: 'hidden',
            border: `1px solid ${token.colorBorderSecondary}`,
            minHeight: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: token.boxShadowSecondary,
          }}
        >
          {imageViewData?.type === 1 ? (
            <MotionImage
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }}
              src={imageViewData.preview_url || imageViewData.url}
              overrideSrc={imageViewData.preview_url || imageViewData.url}
              alt={imageViewData.detail}
              width={imageViewData.width}
              height={imageViewData.height}
              unoptimized
              loading="lazy"
              placeholder="blur"
              blurDataURL={dataURL}
            />
          ) : (
            <LivePhoto
              url={imageViewData.preview_url || imageViewData.url || ''}
              videoUrl={imageViewData.video_url || ''}
            />
          )}
        </div>

        {imageViewData?.labels && imageViewData.labels.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: token.marginXS }}>
            {imageViewData?.labels.map((tag: string) => (
              <Tag key={tag} color="default">
                {tag}
              </Tag>
            ))}
          </div>
        )}

        <div
          style={{
            backgroundColor: token.colorBgElevated,
            borderRadius: token.borderRadiusLG,
            padding: token.marginLG,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: 600, color: token.colorTextTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            EXIF 信息
          </Text>
          <div style={{ marginTop: token.marginSM }}>
            <ExifView {...props} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: token.marginLG }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: 500, color: token.colorTextTertiary }}>尺寸</Text>
            <Text style={{ fontFamily: 'monospace' }}>{imageViewData?.width} x {imageViewData?.height}</Text>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: 500, color: token.colorTextTertiary }}>位置</Text>
            <Text style={{ fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`${imageViewData?.lat}, ${imageViewData?.lon}`}>
              {imageViewData?.lat && imageViewData?.lon ? `${imageViewData.lat}, ${imageViewData.lon}` : '无位置信息'}
            </Text>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: 500, color: token.colorTextTertiary }}>详情描述</Text>
          <div
            style={{
              fontSize: 14,
              color: token.colorTextSecondary,
              backgroundColor: token.colorBgElevated,
              padding: token.margin,
              borderRadius: token.borderRadius,
              border: `1px solid ${token.colorBorderSecondary}`,
              minHeight: 60,
            }}
          >
            {imageViewData?.detail || '暂无描述'}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: token.margin,
            borderRadius: token.borderRadiusLG,
            border: `1px solid ${token.colorBorderSecondary}`,
            backgroundColor: token.colorBgContainer,
          }}
        >
          <Text style={{ fontSize: 14, color: token.colorText }}>显示状态</Text>
          <Switch checked={imageViewData?.show === 0} disabled size="small" />
        </div>
      </div>
    </Drawer>
  )
}
