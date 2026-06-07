import SharedAlbumsPage from '~/components/layout/shared-albums-page'

// /albums "景行集" —— 完整作品列表画廊页。
// 页面逻辑放在 shared-albums-page.tsx 中，供两个路由组同时复用：
//   1) /(default)/albums/page.tsx        ← 静态路由（首选）
//   2) /(theme)/[...album]/page.tsx       ← 当匹配歧义落入 catch-all 时兜底渲染
export default function AlbumsPage() {
  return <SharedAlbumsPage />
}
