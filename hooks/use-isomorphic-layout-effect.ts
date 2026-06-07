/**
 * 同构的 useLayoutEffect：在浏览器里用 useLayoutEffect，
 * SSR 环境下回退为 useEffect，避免 Next.js 控制台警告。
 */
import { useEffect, useLayoutEffect } from 'react'

export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect
