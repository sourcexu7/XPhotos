import type { Metadata } from 'next'
import SharedTagPage from '~/components/layout/shared-tag-page'

interface TagPageProps {
  params: Promise<{ tag: string }>
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params
  const tagName = decodeURIComponent(tag).trim()
  return {
    title: tagName ? `标签：${tagName}` : '标签浏览',
  }
}

// /tag/:tag 标签浏览页 —— 展示某标签下的全部公开图片，
// 复用 /albums 的画廊筛选交互（相机/镜头/标签/关键字/排序）。
// 页面逻辑在 shared-tag-page.tsx 中，供两个路由组复用：
//   1) /(default)/tag/[tag]/page.tsx     ← 静态路由（首选）
//   2) /(theme)/[...album]/page.tsx       ← 当匹配歧义落入 catch-all 时兜底渲染
export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params
  return <SharedTagPage tag={tag} />
}
