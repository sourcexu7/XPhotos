'use client'

import { useState, useCallback } from 'react'
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
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStage, setUploadStage] = useState('')

  const handleProgress = useCallback((progress: number, stage: string) => {
    setUploadProgress(progress)
    setUploadStage(stage)
    options.onProgress?.(progress, stage)
    options.onStageChange?.(stage)
  }, [options.onProgress, options.onStageChange])

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
        options.album,
        options.storage,
        options.alistMountPath,
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
      const previewType = options.album === '/' ? '/preview' : options.album + '/preview'
      const previewRes = await uploadPreviewImage(
        file,
        previewType,
        {
          storage: options.storage,
          alistMountPath: options.alistMountPath,
          previewCompressQuality: options.previewCompressQuality,
          previewImageMaxWidthLimitSwitchOn: options.previewImageMaxWidthLimitSwitchOn,
          previewImageMaxWidthLimit: options.previewImageMaxWidthLimit,
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

      options.onSuccess?.(result)
      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Upload failed')
      options.onError?.(err)
      throw err
    } finally {
      setIsUploading(false)
    }
  }, [options.album, options.storage, options.alistMountPath, options.previewCompressQuality, options.previewImageMaxWidthLimitSwitchOn, options.previewImageMaxWidthLimit, options.onSuccess, options.onError, handleProgress])

  return {
    isUploading,
    uploadProgress,
    uploadStage,
    upload,
  }
}
