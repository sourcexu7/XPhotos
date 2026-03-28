'use client'

import React from 'react'
import { Select } from 'antd'
import { useTranslations } from 'next-intl'

interface FilterSelectProps {
  value?: string
  onChange: (value: string) => void
  placeholder: string
  options: { label: string; value: string }[]
  width?: string
  className?: string
}

export default function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
  width = '120px',
  className = '',
}: FilterSelectProps) {
  const t = useTranslations()

  return (
    <Select
      value={value || undefined}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full md:w-[${width}] ${className}`}
      options={[{ label: t('Words.all'), value: 'all' }, ...options]}
    />
  )
}
