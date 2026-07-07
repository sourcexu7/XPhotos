/**
 * Maps backend login API messages (English) to user-facing copy via next-intl.
 */
export function resolveLoginApiErrorMessage(
  raw: string | undefined,
  t: (key: string) => string,
): string {
  const m = (raw ?? '').trim()
  if (!m) return t('Login.credentialsError')

  const lower = m.toLowerCase()

  if (lower === 'invalid credentials' || /invalid credentials/i.test(m)) {
    return t('Login.credentialsError')
  }
  if (
    m === 'Username/Email and password are required' ||
    lower.includes('username/email and password are required')
  ) {
    return t('Login.invalidFormat')
  }
  if (
    m === 'Password login not supported for this user' ||
    lower.includes('password login not supported')
  ) {
    return t('Login.passwordLoginNotSupported')
  }

  return m
}
