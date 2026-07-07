'use client'

import { useState, useCallback, useEffect } from 'react'
import { message } from 'antd'

interface ExifPresets {
  cameraModels: string[]
  shutterSpeeds: string[]
  isos: string[]
  apertures: string[]
}

const defaultPresets: ExifPresets = {
  cameraModels: ['Canon EOS R5', 'Sony A7 III', 'Nikon Z7 II', 'Fujifilm X-T4', 'iPhone 13 Pro'],
  shutterSpeeds: ['1/8000', '1/4000', '1/2000', '1/1000', '1/500', '1/250', '1/125', '1/60', '1/30', '1/15', '1/8', '1/4', '1/2', '1'],
  isos: ['50', '100', '200', '400', '800', '1600', '3200', '6400'],
  apertures: ['1.4', '1.8', '2.0', '2.8', '3.5', '4.0', '5.6', '8.0', '11', '16'],
}

const PRESETS_STORAGE_KEY = 'picimpact_exif_presets'

export function useExifPresets() {
  const [presets, setPresets] = useState<ExifPresets>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(PRESETS_STORAGE_KEY)
        if (raw) return JSON.parse(raw)
      } catch {
        // Fall through to default
      }
    }
    return defaultPresets
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingText, setEditingText] = useState({
    cameraModels: '',
    shutterSpeeds: '',
    isos: '',
    apertures: '',
  })

  useEffect(() => {
    if (isModalOpen) {
      setEditingText({
        cameraModels: presets.cameraModels.join(','),
        shutterSpeeds: presets.shutterSpeeds.join(','),
        isos: presets.isos.join(','),
        apertures: presets.apertures.join(','),
      })
    }
  }, [isModalOpen, presets])

  const openModal = useCallback(() => {
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  const savePresets = useCallback(() => {
    const newPresets: ExifPresets = {
      cameraModels: editingText.cameraModels.split(',').map(s => s.trim()).filter(Boolean),
      shutterSpeeds: editingText.shutterSpeeds.split(',').map(s => s.trim()).filter(Boolean),
      isos: editingText.isos.split(',').map(s => s.trim()).filter(Boolean),
      apertures: editingText.apertures.split(',').map(s => s.trim()).filter(Boolean),
    }

    setPresets(newPresets)
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(newPresets))
    setIsModalOpen(false)
    message.success('预设保存成功')
  }, [editingText])

  const resetPresets = useCallback(() => {
    setPresets(defaultPresets)
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(defaultPresets))
    message.success('预设已重置')
  }, [])

  return {
    presets,
    isModalOpen,
    editingText,
    setEditingText,
    openModal,
    closeModal,
    savePresets,
    resetPresets,
  }
}
