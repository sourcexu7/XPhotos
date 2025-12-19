import type { Metadata } from 'next/types'

import { ThemeProvider } from '~/app/providers/next-ui-providers'
import { ToasterProviders } from '~/app/providers/toaster-providers'
import { ProgressBarProviders } from '~/app/providers/progress-bar-providers'
import { ButtonStoreProvider } from '~/app/providers/button-store-providers'

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
  const data = await fetchConfigsByKeys(['custom_title', 'custom_favicon_url'])

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
  const data = await fetchConfigsByKeys(['umami_analytics', 'umami_host'])

  const umamiHost = getConfigValue(data, 'umami_host', DEFAULT_UMAMI_HOST)
  const umamiAnalytics = getConfigValue(data, 'umami_analytics')

  return (
    <html className="overflow-y-auto scrollbar-hide" lang={locale} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={DEFAULT_TITLE} />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ConfigStoreProvider>
            <ButtonStoreProvider>
              <ThemeProvider>
                <AntdConfigProvider>
                  <ToasterProviders />
                  <ProgressBarProviders>
                    <VisitTracker />
                    {children}
                    {modal}
                    {/* 新增：全局底部版权标注 */}
                    <footer className="w-full border-t border-white/10 bg-background/70 backdrop-blur-md text-center text-[12px] md:text-[13px] text-muted-foreground py-4">
                      © 2025 Source 禁止商用
                    </footer>
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