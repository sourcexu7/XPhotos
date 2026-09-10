'use client'

import React from 'react'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { useTheme } from 'next-themes'

const { defaultAlgorithm, darkAlgorithm } = theme

/**
 * Button 黑白配色（对齐 style/globals.css 白瓷令牌，仅前台使用）：
 * 浅色 --primary #0A0A0A / --primary-foreground #FFFFFF；
 * 暗色 --primary #FAFAFA / --primary-foreground #0A0A0A。
 * antd v6 FloatButton 内部渲染 Button，本配置同时覆盖普通按钮与
 * 筛选/排序/主题切换悬浮按钮。仅改颜色，不动尺寸/形状/布局/交互。
 * 注意：组件级覆盖 colorPrimary 后，hover/active/浅底等派生色仍取
 * 全局种子色（蓝），必须逐一显式覆盖，否则对应状态会回退为蓝色。
 */
function buttonColorTheme(isDark: boolean) {
  const c = isDark
    ? {
        primary: '#FAFAFA', // 实底主色（暗）
        primaryHover: '#FFFFFF', // 悬停提亮
        primaryActive: '#D9D9D9', // 按下减淡
        onPrimary: '#0A0A0A', // 实底文字/图标
        primaryBg: '#1F1F1F', // filled/text 变体主色浅底（暗）
        primaryBgHover: '#262626',
        primaryBorder: '#424242',
      }
    : {
        primary: '#0A0A0A', // 实底主色（浅）
        primaryHover: '#333333', // 悬停提亮
        primaryActive: '#000000', // 按下加深
        onPrimary: '#FFFFFF', // 实底文字/图标
        primaryBg: '#F5F5F5', // filled/text 变体主色浅底（浅）
        primaryBgHover: '#EBEBEB',
        primaryBorder: '#D9D9D9',
      }
  return {
    // primary 实底（type="primary"、FloatButton type="primary" 激活态）
    colorPrimary: c.primary,
    colorPrimaryHover: c.primaryHover,
    colorPrimaryActive: c.primaryActive,
    primaryColor: c.onPrimary,
    primaryShadow: isDark ? 'none' : '0 2px 0 rgba(10, 10, 10, 0.08)',
    // primary 浅底变体（variant="filled"/"text"、ghost）
    colorPrimaryBg: c.primaryBg,
    colorPrimaryBgHover: c.primaryBgHover,
    colorPrimaryBorder: c.primaryBorder,
    // default 描边按钮 hover/active（antd 默认取全局派生色，偏蓝）
    defaultHoverColor: c.primary,
    defaultHoverBorderColor: c.primary,
    defaultActiveColor: c.primaryActive,
    defaultActiveBorderColor: c.primaryActive,
    // link 按钮
    colorLink: c.primary,
    colorLinkHover: c.primaryHover,
    colorLinkActive: c.primaryActive,
  }
}

const THEME_CONFIG = {
  token: {
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1677ff',
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    borderRadiusXS: 2,
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeXL: 20,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    marginXXS: 4,
    marginXS: 8,
    marginSM: 12,
    margin: 16,
    marginMD: 20,
    marginLG: 24,
    marginXL: 32,
    marginXXL: 48,
    paddingXXS: 4,
    paddingXS: 8,
    paddingSM: 12,
    padding: 16,
    paddingMD: 20,
    paddingLG: 24,
    paddingXL: 32,
    boxShadow:
      '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
    boxShadowSecondary:
      '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
    motionDurationSlow: '0.3s',
    motionDurationMid: '0.2s',
    motionDurationFast: '0.1s',
  },
}

export function AntdConfigProvider({ children }: { children: React.ReactNode }) {
  const { theme: currentTheme } = useTheme()
  const isDark = currentTheme === 'dark'

  const customTheme = {
    ...THEME_CONFIG,
    algorithm: isDark ? darkAlgorithm : defaultAlgorithm,
    components: {
      Layout: {
        headerBg: isDark ? '#141414' : '#ffffff',
        siderBg: isDark ? '#141414' : '#ffffff',
        bodyBg: isDark ? '#000000' : '#f5f5f5',
      },
      Menu: {
        itemBg: 'transparent',
        itemSelectedBg: isDark ? 'rgba(22, 119, 255, 0.15)' : 'rgba(22, 119, 255, 0.1)',
        itemHoverBg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        horizontalItemSelectedColor: '#1677ff',
        itemSelectedColor: '#1677ff',
      },
      Card: {
        headerBg: 'transparent',
        boxShadow:
          '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
      },
    },
  }

  return (
    <ConfigProvider theme={customTheme} locale={zhCN}>
      {children}
    </ConfigProvider>
  )
}

/**
 * 前台按钮主题 Provider：在根 Provider（antd 默认蓝）之上，仅对 Button
 * 叠加黑白配色（buttonColorTheme）。只在前台布局（(default)/(theme)/login）
 * 中包裹；后台 /admin/** 不包裹，保持 antd 默认蓝色系，实现前后台
 * 按钮风格隔离——互不干扰、各自一致。
 */
export function FrontendAntdProvider({ children }: { children: React.ReactNode }) {
  const { theme: currentTheme } = useTheme()
  const isDark = currentTheme === 'dark'

  return (
    <ConfigProvider
      theme={{
        components: {
          Button: buttonColorTheme(isDark),
        },
      }}
    >
      {children}
    </ConfigProvider>
  )
}
