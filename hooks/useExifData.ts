'use client'

import { useCallback } from 'react'
import { exifReader } from '~/lib/utils/file'
import { applyReferenceExif as applyRefExif, extractGpsFromExif, getImageDimensions } from '~/lib/utils/exifUtils'
import type { ExifType } from '~/types'

export interface ExifData {
  exif: ExifType
  lat: string
  lon: string
  width: number
  height: number
  tags: any
}

export function useExifData() {
  const loadExifData = useCallback(async (file: File): Promise<ExifData> => {
    const { tags, exifObj } = await exifReader(file)
    const { lat, lon } = extractGpsFromExif(tags)
    const { width, height } = await getImageDimensions(file)

    return {
      exif: exifObj,
      lat,
      lon,
      width,
      height,
      tags,
    }
  }, [])

  const applyReferenceExif = useCallback(async (refFile: File, targetExif: Partial<ExifType>): Promise<Partial<ExifType>> => {
    return await applyRefExif(refFile, targetExif)
  }, [])

  return {
    loadExifData,
    applyReferenceExif,
  }
}
