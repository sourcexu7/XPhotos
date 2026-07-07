import { useMemo } from 'react'
import { decodeThumbHash } from '~/lib/utils/blurhash-client'

const DEFAULT_HASH = 'MggCBoBxh4d/eHeIiIiHd3eIAAAAAAA='

// 模块级缓存：相同 hash 只解码一次，避免大量组件实例重复 decode 占用主线程
const _cache = new Map<string, string>()

function cachedDecode(hash: string): string {
  const key = hash && hash !== '' ? hash : DEFAULT_HASH
  if (_cache.has(key)) return _cache.get(key)!
  const result = decodeThumbHash(key)
  _cache.set(key, result)
  return result
}

export const useBlurImageDataUrl = (hash: string): string => {
  return useMemo(() => cachedDecode(hash), [hash])
}
