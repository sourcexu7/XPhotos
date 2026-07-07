import type { Metadata } from 'next/types'

import { ThemeProvider } from '~/app/providers/next-ui-providers'
import { ToasterProviders } from '~/app/providers/toaster-providers'
import { ProgressBarProviders } from '~/app/providers/progress-bar-providers'
import { ButtonStoreProvider } from '~/app/providers/button-store-providers'
import { LoadingAnimationProviders } from '~/app/providers/loading-animation-providers'

import '~/style/globals.css'
// Ant Design global styles
import 'antd/dist/reset.css'
import '~/app/globals-antd.css'
import { fetchConfigsByKeys } from '~/lib/db/query/configs'

import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ConfigStoreProvider } from '~/app/providers/config-store-providers'
import { AntdConfigProvider } from '~/app/providers/antd-config-provider'
import { VisitTracker } from '~/components/analytics/visit-tracker'
import { RouteLoopGuard } from '~/components/analytics/route-loop-guard'
import Script from 'next/script'

type ConfigItem = {
  id: string
  config_key: string
  config_value: string | null
  detail: string | null
}

const DEFAULT_TITLE = 'XPhotos'
const DEFAULT_FAVICON = './favicon.ico'
const DEFAULT_UMAMI_HOST = 'https://cloud.umami.is/script.js'

function getConfigValue(data: ConfigItem[], key: string, defaultValue: string = ''): string {
  return data?.find((item) => item.config_key === key)?.config_value || defaultValue
}

export async function generateMetadata(): Promise<Metadata> {
  let data: ConfigItem[] = []
  
  try {
    data = await fetchConfigsByKeys(['custom_title', 'custom_favicon_url'])
  } catch (error) {
    console.error('Failed to fetch configs in generateMetadata:', error)
    // 使用默认值继续执行，避免阻塞页面渲染
  }

  return {
    title: getConfigValue(data, 'custom_title', DEFAULT_TITLE),
    icons: { icon: getConfigValue(data, 'custom_favicon_url', DEFAULT_FAVICON) },
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: DEFAULT_TITLE,
    },
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
}

export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode
  modal: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()
  
  let data: ConfigItem[] = []
  try {
    data = await fetchConfigsByKeys(['umami_analytics', 'umami_host'])
  } catch (error) {
    console.error('Failed to fetch configs in RootLayout:', error)
    // 使用默认值继续执行
  }

  const umamiHost = getConfigValue(data, 'umami_host', DEFAULT_UMAMI_HOST)
  const umamiAnalytics = getConfigValue(data, 'umami_analytics')

  return (
    <html lang={locale} suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={DEFAULT_TITLE} />
        <link rel="dns-prefetch" href="//xphotos7-1306526302.cos.ap-nanjing.myqcloud.com" />
        <link rel="preconnect" href="https://xphotos7-1306526302.cos.ap-nanjing.myqcloud.com" crossOrigin="" />
        {/*
          主题默认策略 inline 脚本：
            - 首页 "/" 默认 dark；其它所有页面默认 light
            - 用户显式切换主题后（写入 explicitThemePref），所有页面都优先遵循用户选择
            - 此脚本在 next-themes / React 之前运行，避免主题闪烁 (FOUC)

          协议关键字：
            localStorage.explicitThemePref = 'dark' | 'light'  ← 用户手动点切换按钮产生
            localStorage.theme                  = 'dark' | 'light'  ← next-themes 读写
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var e=window.location.pathname||"/",t=null,o=null;try{t=localStorage.getItem("explicitThemePref");o=localStorage.getItem("theme")}catch(e){}var r="dark",i="light",a=t?null:(e==="/"||e===""?r:i),n=a||o||i;try{localStorage.setItem("theme",n)}catch(e){}var l=document.documentElement;l.classList.remove(r,i);l.classList.add(n);var d=r===n?"#000000":"#ffffff";var c=document.querySelector('meta[name="theme-color"]');c&&c.setAttribute("content",d)}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ConfigStoreProvider>
            <ButtonStoreProvider>
              <ThemeProvider>
                <AntdConfigProvider>
                  <ToasterProviders />
                  <ProgressBarProviders>
                    <LoadingAnimationProviders>
                      <VisitTracker />
                      <RouteLoopGuard />
                      <div className="min-h-screen">
                        <main>
                          {children}
                        </main>
                      </div>
                      {modal}
                    </LoadingAnimationProviders>
                  </ProgressBarProviders>
                </AntdConfigProvider>
              </ThemeProvider>
            </ButtonStoreProvider>
          </ConfigStoreProvider>
        </NextIntlClientProvider>
        <div id="modal-root" />
        {umamiAnalytics && (
          <Script
            id="umami-analytics"
            strategy="afterInteractive"
            async
            src={umamiHost}
            data-website-id={umamiAnalytics}
          />
        )}
      </body>
    </html>
  )
}