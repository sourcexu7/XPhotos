import { FrontendAntdProvider } from '~/app/providers/antd-config-provider'

export default async function ThemeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    // 前台按钮黑白主题：主题相册路由组内所有 antd Button 统一黑白配色
    <FrontendAntdProvider>
      {children}
    </FrontendAntdProvider>
  )
}
