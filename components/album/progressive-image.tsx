'use client'

import { ProgressiveImageProps } from '~/types/props.ts'
import { useEffect, useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import { useTranslations } from 'next-intl'
import { MotionImage } from '~/components/album/motion-image'
import { useBlurImageDataUrl } from '~/hooks/use-blurhash'

export default function ProgressiveImage(
  props: Readonly<ProgressiveImageProps>,
) {
  const t = useTranslations()

  const [showLightbox, setShowLightbox] = useState(Boolean(props.showLightbox))

  useEffect(() => {
    setShowLightbox(Boolean(props.showLightbox))
  }, [props.showLightbox])

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


      <Lightbox
        open={showLightbox}
        close={() => {
          setShowLightbox(false)
          if (props.onShowLightboxChange) {
            props.onShowLightboxChange(false)
          }
        }}
        slides={[{
          src: props.previewUrl,
          alt: props.alt || 'image',
        }]}
        plugins={[]}
        carousel={{ finite: true }}
        render={{
          buttonPrev: () => null,
          buttonNext: () => null,
          buttonClose: () => null,
          slide: ({ slide }) => (
            <div
              onClick={() => {
                setShowLightbox(false)
                if (props.onShowLightboxChange) {
                  props.onShowLightboxChange(false)
                }
              }}
              className="w-full h-full flex items-center justify-center cursor-pointer"
            >
              <img
                src={slide.src}
                alt={slide.alt}
                className="max-w-[100vw] max-h-[90vh] mx-auto object-contain cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
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
