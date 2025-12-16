import dynamic from 'next/dynamic'
import { App } from 'antd'

// 优化点: 动态加载后台主布局，减小首屏 bundle 体积（保留 SSR）
const AdminAntLayout = dynamic(() => import('~/components/admin/ant-layout'), {
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
      后台加载中...
    </div>
  ),
})

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AdminAntLayout>
      <App>
        {children}
      </App>
    </AdminAntLayout>
  )
}
