/**
 * 节流 Hook
 * 用于优化高频事件处理，如滚动、窗口调整大小等
 * 
 * 性能优化：
 * - 限制函数执行频率，减少计算开销
 * - 可配置间隔时间，平衡响应速度和性能
 */

import { useRef, useCallback } from 'react'

/**
 * 节流 Hook
 * @param callback 需要节流的回调函数
 * @param delay 节流间隔时间（毫秒），默认 300ms
 * @returns 节流后的函数
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const lastRun = useRef<number>(Date.now())
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now()
      const timeSinceLastRun = now - lastRun.current

      // 如果距离上次执行时间超过延迟时间，立即执行
      if (timeSinceLastRun >= delay) {
        lastRun.current = now
        callback(...args)
      } else {
        // 否则，设置定时器延迟执行
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
          lastRun.current = Date.now()
          callback(...args)
        }, delay - timeSinceLastRun)
      }
    }) as T,
    [callback, delay]
  )
}

