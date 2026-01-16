/**
 * 存储相关工具函数
 * 提取重复的 storage_folder 规范化逻辑
 */

/**
 * 规范化存储文件夹路径
 * 统一处理 '/' 和尾部斜杠
 * 
 * @param raw 原始路径
 * @returns 规范化后的路径
 * 
 * @example
 * normalizeStorageFolder('/') => ''
 * normalizeStorageFolder('folder/') => 'folder'
 * normalizeStorageFolder('folder') => 'folder'
 */
export function normalizeStorageFolder(raw?: string | null): string {
  if (!raw) return ''
  if (raw === '/') return ''
  return raw.endsWith('/') ? raw.slice(0, -1) : raw
}

