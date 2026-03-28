import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 统一导出所有工具函数
export { filterStringArray } from './array'
export { clearAllAuthData } from './auth-utils'
export { encodeBrowserThumbHash, decodeThumbHash } from './blurhash-client'
export { fetcher } from './fetcher'
export { getActiveFilterCount, buildSWRKey } from './filters'
export { getUserLocale, setUserLocale } from './locale'
export { normalizeStorageFolder } from './storage'
export { exifReader, uploadFile } from './file'
