import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 将 #RRGGBB / #RGB 颜色转为指定透明度的 rgba 字符串。
 * 用于给 antd token 颜色（如 token.colorBorder）附加透明度，非 hex 输入原样返回。
 */
export function withAlpha(color: string, alpha: number) {
  if (!color.startsWith('#')) return color
  const hex = color.slice(1)
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
