/**
 * 跨浏览器剪贴板工具
 *
 * 复制失败常见原因：
 * 1) 页面不是 HTTPS / localhost（安全上下文要求）—— navigator.clipboard 为 undefined
 * 2) 用户手势丢失（不是直接由点击/触摸触发）—— writeText 返回 PermissionDenied
 * 3) 部分浏览器 / WebView 根本没有实现 clipboard API（旧浏览器 / 嵌入式环境）
 *
 * 为了覆盖这些场景，这里采用三级降级策略：
 *   ① navigator.clipboard.writeText（现代浏览器）
 *   ② document.execCommand('copy')（已废弃但几乎所有浏览器仍支持）
 *   ③ 失败后抛出错误，由调用方决定是否弹输入框让用户手动 Ctrl+C
 */

export type CopyResult = {
  success: boolean
  /** 使用的底层实现，便于排错 */
  method: 'clipboard-api' | 'exec-command' | 'failed'
}

/**
 * 判断当前运行环境是否为浏览器（SSR 下会返回 false，且不抛错）
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * 将文本复制到剪贴板。三级降级，返回是否成功，不抛异常。
 */
export async function copyToClipboard(text: string): Promise<CopyResult> {
  if (!isBrowser()) {
    return { success: false, method: 'failed' }
  }
  if (text == null) {
    return { success: false, method: 'failed' }
  }

  // --- Level 1: navigator.clipboard ---
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return { success: true, method: 'clipboard-api' }
    }
  } catch {
    // 继续走降级
  }

  // --- Level 2: execCommand + textarea ---
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    // 避免滚动到页面底部
    textarea.style.position = 'fixed'
    textarea.style.top = '0'
    textarea.style.left = '0'
    textarea.style.width = '1px'
    textarea.style.height = '1px'
    textarea.style.padding = '0'
    textarea.style.border = 'none'
    textarea.style.outline = 'none'
    textarea.style.boxShadow = 'none'
    textarea.style.background = 'transparent'
    textarea.style.opacity = '0'
    textarea.setAttribute('readonly', '')
    document.body.appendChild(textarea)
    textarea.select()
    textarea.setSelectionRange(0, text.length)

    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    if (ok) return { success: true, method: 'exec-command' }
  } catch {
    // 继续走降级
  }

  return { success: false, method: 'failed' }
}

/**
 * 在当前页面安全地构造一个分享链接：origin + /preview/:id
 * - 非浏览器环境下返回空字符串（SSR 保护）
 * - 拼接时不会产生双斜杠：无论 id 是否以斜杠开头，都保持唯一斜杠
 */
export function buildShareUrl(id?: string | null): string {
  if (!isBrowser() || !id) return ''
  const origin = window.location.origin || ''
  const cleanId = String(id).replace(/^\/+/, '')
  return `${origin}/preview/${cleanId}`
}
