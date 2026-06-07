/**
 * 主题默认策略：全站默认 light（白天），
 * 只有用户手动点击主题切换按钮后才会切换为 dark（黑夜），
 * 并在之后的访问中保持用户选择。
 *
 * 该组件不再做任何“按路径自动推荐主题”的逻辑：
 * - 不再调用 setTheme
 * - 不再监听 resolvedTheme / theme
 * - 仅作为 children 的一个透明包裹层
 *
 * 主题的默认值由 app/providers/next-ui-providers.tsx 中的
 * ThemeProvider 配置决定：defaultTheme="light" + enableSystem={false}
 */

interface DarkThemeEnforcerProps {
  children: React.ReactNode
}

export default function DarkThemeEnforcer({ children }: DarkThemeEnforcerProps) {
  return <>{children}</>
}
