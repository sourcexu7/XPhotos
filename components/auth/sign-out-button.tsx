'use client'

import { authClient } from '~/lib/auth-client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'

export function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success('已退出登录')
          // 强制刷新并跳转，确保中间件重新校验 Cookie
          router.push('/login')
          router.refresh()
        },
      },
    })
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors w-full"
    >
      <LogOut size={16} />
      退出登录
    </button>
  )
}
