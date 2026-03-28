/**
 * 彻底清除所有认证相关的数据
 */
export function clearAllAuthData() {
  // 清除所有 cookie
  const cookies = document.cookie.split(';')
  
  cookies.forEach((cookie) => {
    const name = cookie.split('=')[0].trim()
    
    // 清除 pic-impact 相关的 cookie
    if (name.toLowerCase().includes('pic-impact')) {
      // 尝试多种路径和域名组合
      const domains = [
        window.location.hostname,
        '.' + window.location.hostname,
        '',
      ]
      
      const paths = ['/', '']
      
      domains.forEach(domain => {
        paths.forEach(path => {
          if (domain) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=${domain}`
          } else {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`
          }
        })
      })
    }
  })
  
  // 清除本地存储
  try {
    localStorage.clear()
  } catch (e) {
    console.warn('Failed to clear localStorage', e)
  }
  
  // 清除会话存储
  try {
    sessionStorage.clear()
  } catch (e) {
    console.warn('Failed to clear sessionStorage', e)
  }
}
