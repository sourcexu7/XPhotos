import { UserFrom } from '~/components/login/user-from'
import { Metadata } from 'next'
import { FrontendAntdProvider } from '~/app/providers/antd-config-provider'

export const metadata: Metadata = {
  title: '登录 - XPhotos',
  description: '登录 XPhotos 后台管理系统',
}

export default function LoginPage() {
  return (
    // 前台按钮黑白主题：登录页属前台入口，Button 保持黑白配色
    <div className="relative min-h-screen w-full flex items-center justify-center">
      <FrontendAntdProvider>
        {/* 这里的 UserFrom 对应 components/login/user-from.tsx */}
        <UserFrom />
      </FrontendAntdProvider>
    </div>
  )
}
