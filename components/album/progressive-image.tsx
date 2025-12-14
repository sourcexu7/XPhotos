'use client'

import { ProgressiveImageProps } from '~/types/props.ts'
import { useEffect, useRef, useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import { useTranslations } from 'next-intl'
import { MotionImage } from '~/components/album/motion-image'
import { useBlurImageDataUrl } from '~/hooks/use-blurhash'
import Image from 'next/image'

/**
 * 渐进式图片展示组件，首先显示预览图，后台加载原始图片，当原始图片加载成功后替换预览图
 */
export default function ProgressiveImage(
  props: Readonly<ProgressiveImageProps>,
) {
  const t = useTranslations()
  
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [highDipImageUrl, setHighDipImageUrl] = useState<string | null>(null)
  const [showLightbox,setShowLightbox] = useState(Boolean(props.showLightbox))
  const zoomRef = useRef(null)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    setShowLightbox(Boolean(props.showLightbox))
  }, [props.showLightbox])
  
  // 只显示 previewUrl，不再加载原图
  useEffect(() => {
    setIsLoading(false)
    setLoadingProgress(100)
    setError(null)
    setHighDipImageUrl(null)
  }, [props.imageUrl])

  const dataURL = useBlurImageDataUrl(props.blurhash)

  return (
    <div className="relative">
      {(props.previewUrl && props.previewUrl.trim() !== '') ? (
        <MotionImage
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="object-contain md:max-h-[90vh] cursor-pointer"
          src={props.previewUrl}
          overrideSrc={props.previewUrl}
          placeholder="blur"
          unoptimized
          blurDataURL={dataURL}
          width={props.width}
          height={props.height}
          alt={props.alt || 'image'}
          onClick={() => setShowLightbox(true)}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-[90vh] bg-gray-100">
          <div className="text-gray-400">{t('Tips.imageLoadFailed')}</div>
        </div>
      )}

      {isLoading && (
        <div className="absolute bottom-0 left-0 w-full">
          <div
            className="h-1 bg-blue-500"
            style={{ width: `${loadingProgress}%` }}
          ></div>
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {loadingProgress}%
          </div>
        </div>
      )}

      {error && (
        <div className="absolute bottom-0 left-0 w-full">
          <div className="absolute bottom-2 right-2 text-white bg-black/60 text-w text-xs px-2 py-1 rounded  ">
            {error}
          </div>
        </div>
      )}

      <Lightbox
        open={showLightbox}
        close={() => {
          setShowLightbox(false)
          if (props.onShowLightboxChange) {
            props.onShowLightboxChange(false)
          }
        }}
        slides={[{
          src: highDipImageUrl || props.previewUrl,
          alt: props.alt,
        }]}
        plugins={[]}
        carousel={{ finite: true }}
        render={{
          buttonPrev: () => null,
          buttonNext: () => null,
          buttonClose: () => null,
          slide: ({ slide, rect }) => (
            <img
              src={slide.src}
              alt={slide.alt}
              style={{
                display: 'block',
                maxWidth: '100vw',
                maxHeight: '90vh',
                margin: '0 auto',
                cursor: 'pointer',
                objectFit: 'contain',
              }}
              onClick={() => {
                setShowLightbox(false)
                if (props.onShowLightboxChange) {
                  props.onShowLightboxChange(false)
                }
              }}
            />
          ),
        }}
        styles={{ root: { '--yarl__color_backdrop': 'rgba(0, 0, 0, .8)' } }}
        controller={{
          closeOnBackdropClick: true,
          closeOnPullUp: true,
          closeOnPullDown: true,
        }}
      />
    </div>
  )
}
