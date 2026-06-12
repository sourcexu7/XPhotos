import Link from 'next/link'
import { fetchConfigsByKeys } from '~/lib/db/query/configs'
import { Button } from '~/components/ui/button'

export default async function Logo() {
  let data: { config_value?: string | null }[] = []
  try {
    data = await fetchConfigsByKeys(['custom_title'])
  } catch (err) {
    // 数据库或缓存异常时保持默认标题，避免整个页面崩掉
    data = []
  }
  const title = Array.isArray(data) && data.length > 0 ? (data[0]?.config_value ?? 'XPhotos') : 'XPhotos'

  return (
    <Link href="/" className="select-none">
      <Button variant="link" className="cursor-pointer">{title}</Button>
    </Link>
  )
}