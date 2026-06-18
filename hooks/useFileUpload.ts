'use client'

import { useState, useCallback, useRef } from 'react'
import { uploadFile } from '~/lib/utils/file'
import { uploadPreviewImage } from '~/lib/utils/uploadUtils'
import { heicTo, isHeic } from 'heic-to'

export interface UploadResult {
  url: string
  previewUrl: string
  imageId: string
  fileName: string
  originalKey?: string
  previewKey?: string
}

export interface UseFileUploadOptions {
  album: string
  storage: string
  alistMountPath: string
  previewCompressQuality: number
  previewImageMaxWidthLimitSwitchOn: boolean
  previewImageMaxWidthLimit: number
  onProgress?: (progress: number, stage: string) => void
  onStageChange?: (stage: string) => void
  onSuccess?: (result: UploadResult) => void
  onError?: (error: Error) => void
}

export function useFileUpload(options: UseFileUploadOptions) {
  // 用 ref 保持最新 options，避免回调因依赖变化反复重建
  const optionsRef = useRef(options)
  optionsRef.current = options

  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStage, setUploadStage] = useState('')

  const handleProgress = useCallback((progress: number, stage: string) => {
    setUploadProgress(progress)
    setUploadStage(stage)
    optionsRef.current.onProgress?.(progress, stage)
    optionsRef.current.onStageChange?.(stage)
  }, [])

  const upload = useCallback(async (file: File, existingImageId?: string): Promise<UploadResult> => {
    setIsUploading(true)
    setUploadProgress(0)
    setUploadStage('准备上传中')
    handleProgress(0, '准备上传中')

    try {
      const fileName = file.name.split('.').slice(0, -1).join('.')
      let uploadFileObj: File = file

      // HEIC 格式转换
      if (await isHeic(file)) {
        handleProgress(10, '转换 HEIC 格式中')
        const outputBuffer: Blob | Blob[] = await heicTo({
          blob: file,
          type: 'image/jpeg',
        })
        uploadFileObj = new File([outputBuffer], fileName + '.jpg', { type: 'image/jpeg' })
      }

      // 上传原图
      handleProgress(20, '上传原图中')
      const originRes = await uploadFile(
        uploadFileObj,
        optionsRef.current.album,
        optionsRef.current.storage,
        optionsRef.current.alistMountPath,
        {
          existingImageId,
          onProgress: (p: number) => {
            const mappedProgress = 20 + (p * 0.4)
            handleProgress(mappedProgress, '上传原图中')
          },
          onStageChange: (stage: string) => {
            setUploadStage(stage)
          },
        }
      )

      if (originRes?.code !== 200) {
        throw new Error('Upload failed')
      }

      handleProgress(60, '原图上传完成')

      // 上传预览图
      handleProgress(60, '上传预览图中')
      const previewType = optionsRef.current.album === '/' ? '/preview' : optionsRef.current.album + '/preview'
      const previewRes = await uploadPreviewImage(
        file,
        previewType,
        {
          storage: optionsRef.current.storage,
          alistMountPath: optionsRef.current.alistMountPath,
          previewCompressQuality: optionsRef.current.previewCompressQuality,
          previewImageMaxWidthLimitSwitchOn: optionsRef.current.previewImageMaxWidthLimitSwitchOn,
          previewImageMaxWidthLimit: optionsRef.current.previewImageMaxWidthLimit,
          existingImageId,
          onProgress: (p: number) => {
            const mappedProgress = 60 + (p * 0.35)
            handleProgress(mappedProgress, '上传预览图中')
          },
          onStageChange: (stage: string) => {
            setUploadStage(stage)
          },
        }
      )

      handleProgress(100, '完成')

      const result: UploadResult = {
        url: originRes.data.url,
        previewUrl: previewRes.url,
        imageId: originRes.data.imageId,
        fileName: originRes.data.fileName,
        originalKey: originRes.data.key,
        previewKey: previewRes.key,
      }

      optionsRef.current.onSuccess?.(result)
      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Upload failed')
      optionsRef.current.onError?.(err)
      throw err
    } finally {
      setIsUploading(false)
    }
  }, [handleProgress])

  return {
    isUploading,
    uploadProgress,
    uploadStage,
    upload,
  }
}
