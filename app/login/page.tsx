import { UserFrom } from '~/components/login/user-from'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '登录 - XPhotos',
  description: '登录 XPhotos 后台管理系统',
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center">
      {/* 这里的 UserFrom 对应 components/login/user-from.tsx */}
      <UserFrom />
    </div>
  )
}
