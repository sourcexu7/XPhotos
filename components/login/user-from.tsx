'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { useTranslations } from 'next-intl'
import { motion, useReducedMotion } from 'motion/react'
import { ConfigProvider, App as AntdApp, Form, Input, Button, Typography, Space, Spin, theme, type FormInstance } from 'antd'
import { BorderBeam } from '~/components/ui/border-beam'
import {
  LockOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  CameraOutlined,
  ApartmentOutlined,
  PictureOutlined,
  ClusterOutlined,
  SunOutlined,
  MoonOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import { useTheme } from 'next-themes'
import { useUserThemeToggle } from '~/lib/theme/use-user-theme-toggle'

const { Title, Paragraph, Text } = Typography

const BackgroundElements = () => {
  const reduce = useReducedMotion()
  const { token } = theme.useToken()

  const elements = [
    { Icon: CameraOutlined, delay: 0, duration: 20, xStart: -20, xEnd: 20 },
    { Icon: ApartmentOutlined, delay: 5, duration: 25, xStart: 20, xEnd: -20 },
    { Icon: PictureOutlined, delay: 10, duration: 22, xStart: -15, xEnd: 15 },
    { Icon: ClusterOutlined, delay: 15, duration: 28, xStart: 15, xEnd: -15 },
  ]

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {elements.map(({ Icon, delay, duration, xStart, xEnd }, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            top: `${15 + i * 20}%`,
            left: `${10 + i * 20}%`,
            color: token.colorTextSecondary,
            opacity: 0.05,
          }}
          animate={reduce ? {} : {
            x: [xStart, xEnd, xStart],
            y: [0, 10, -10, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay,
          }}
        >
          <Icon style={{ fontSize: 80 + i * 20 }} />
        </motion.div>
      ))}

      <div
        style={{
          position: 'absolute',
          top: '25%',
          left: '25%',
          width: 384,
          height: 384,
          borderRadius: '50%',
          backgroundColor: token.colorPrimary,
          opacity: 0.08,
          filter: 'blur(60px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '25%',
          right: '25%',
          width: 320,
          height: 320,
          borderRadius: '50%',
          backgroundColor: token.colorInfo,
          opacity: 0.06,
          filter: 'blur(60px)',
        }}
      />
    </div>
  )
}

type LoginFormValues = {
  username: string
  password: string
  captchaCode: string
}

// 服务端登录接口返回的验证码数据
type CaptchaData = { id: string; svg: string }

export const UserFrom = () => {
  const t = useTranslations()
  const reduce = useReducedMotion()
  const { token } = theme.useToken()
  const { resolvedTheme } = useTheme()
  const { toggle } = useUserThemeToggle()

  const [form] = Form.useForm<LoginFormValues>()
  const [loading, setLoading] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <motion.div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: token.margin,
        position: 'relative',
        backgroundColor: token.colorBgLayout,
        overflow: 'hidden',
      }}
      initial={reduce ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <BackgroundElements />

      <Link
        href="/"
        style={{
          position: 'absolute',
          top: token.marginLG,
          left: token.marginLG,
          display: 'flex',
          alignItems: 'center',
          gap: token.marginXS,
          color: token.colorTextSecondary,
          zIndex: 30,
          textDecoration: 'none',
          fontSize: token.fontSize,
        }}
      >
        <ArrowLeftOutlined />
        <span style={{ fontSize: token.fontSizeSM, fontWeight: 500 }}>
          {t('Login.goHome')}
        </span>
      </Link>

      {mounted && (
        <button
          onClick={toggle}
          style={{
            position: 'absolute',
            top: token.marginLG,
            right: token.marginLG,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: token.borderRadius,
            backgroundColor: token.colorBgContainer,
            border: `1px solid ${token.colorBorder}`,
            cursor: 'pointer',
            zIndex: 30,
          }}
          aria-label={resolvedTheme === 'dark' ? t('Theme.lightMode') : t('Theme.darkMode')}
        >
          {resolvedTheme === 'dark' ? (
            <SunOutlined style={{ color: token.colorTextSecondary }} />
          ) : (
            <MoonOutlined style={{ color: token.colorTextSecondary }} />
          )}
        </button>
      )}

      <motion.div
        initial={reduce ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: 420,
          position: 'relative',
          zIndex: 20,
        }}
      >
        {/* 慢速品牌色流光：登录面板氛围装饰，prefers-reduced-motion 下自动隐藏 */}
        <BorderBeam duration={12} size={140} color={token.colorPrimary} borderRadius={16}>
          <div
            style={{
              position: 'relative',
              backgroundColor: token.colorBgContainer,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: token.borderRadiusLG * 2,
              boxShadow: token.boxShadowSecondary,
              padding: token.marginLG * 1.5,
              backdropFilter: 'blur(16px)',
            }}
          >
          <Space
            orientation="vertical"
            size={token.marginLG}
            style={{ width: '100%', alignItems: 'center' }}
          >
            <motion.div
              initial={reduce ? {} : { scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: 'relative' }}
            >
              <div
                style={{
                  width: 96,
                  height: 96,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: token.borderRadiusLG,
                  backgroundColor: token.colorPrimaryBg,
                  border: `1px solid ${token.colorPrimaryBorder}`,
                  boxShadow: token.boxShadow,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {logoError ? (
                  <span
                    style={{
                      fontSize: token.fontSizeHeading5,
                      fontWeight: 700,
                      color: token.colorText,
                    }}
                  >
                    XP
                  </span>
                ) : (
                  <Image
                    src="/favicon.svg"
                    alt="XPhotos"
                    width={48}
                    height={48}
                    style={{ objectFit: 'contain' }}
                    onError={() => setLogoError(true)}
                    priority
                  />
                )}
              </div>
            </motion.div>

            <motion.div
              initial={reduce ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              style={{ textAlign: 'center' }}
            >
              <Title
                level={3}
                style={{
                  margin: 0,
                  textAlign: 'center',
                  color: token.colorText,
                }}
              >
                XPhotos
              </Title>
              <Paragraph
                type="secondary"
                style={{
                  marginTop: token.marginXS,
                  marginBottom: 0,
                  fontSize: token.fontSizeLG,
                }}
              >
                {t('Login.systemTitle')}
              </Paragraph>
            </motion.div>
          </Space>

          <motion.div
            initial={reduce ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            style={{ marginTop: token.marginLG }}
          >
            <ConfigProvider
              theme={{
                token: {
                  borderRadius: token.borderRadius,
                  colorPrimary: token.colorPrimary,
                },
              }}
            >
              <AntdApp>
                <LoginFormBody
                  form={form}
                  loading={loading}
                  error={error}
                  setError={setError}
                  setLoading={setLoading}
                  t={t}
                  reduce={reduce}
                />
              </AntdApp>
            </ConfigProvider>
          </motion.div>
          </div>
        </BorderBeam>

        <div
          style={{
            textAlign: 'center',
            marginTop: token.marginXL,
            color: token.colorTextTertiary,
            fontSize: token.fontSizeSM,
          }}
        >
          <p style={{ margin: 0 }}>© 2026 XPhotos. All rights reserved.</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

function LoginFormBody({
  form,
  loading,
  error,
  setError,
  setLoading,
  t,
  reduce,
}: {
  form: FormInstance<LoginFormValues>
  loading: boolean
  error: string
  setError: (error: string) => void
  setLoading: (loading: boolean) => void
  t: (key: string) => string
  reduce: boolean | null
}) {
  const { token } = theme.useToken()
  const { message } = AntdApp.useApp()

  // ============ 验证码：加载 / 刷新（no-store，确保不复用、不受缓存影响） ============
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null)
  const [captchaLoading, setCaptchaLoading] = useState(true)

  const loadCaptcha = React.useCallback(async () => {
    setCaptchaLoading(true)
    try {
      const res = await fetch('/api/v1/captcha', { cache: 'no-store' })
      if (!res.ok) {
        setCaptcha(null)
        return
      }
      const data = (await res.json()) as { id?: string; svg?: string }
      if (!data?.id || !data?.svg) {
        setCaptcha(null)
        return
      }
      setCaptcha({ id: data.id, svg: data.svg })
    } catch {
      setCaptcha(null)
    } finally {
      setCaptchaLoading(false)
    }
  }, [])

  // 刷新验证码：清空已输入的验证码（旧码可能已被消费/即将过期）
  const refreshCaptcha = React.useCallback(() => {
    if (captchaLoading) return
    form.setFieldValue('captchaCode', '')
    loadCaptcha()
  }, [captchaLoading, form, loadCaptcha])

  React.useEffect(() => {
    loadCaptcha()
  }, [loadCaptcha])

  const handleSubmit = async (values: LoginFormValues) => {
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
          email: values.username,
          captchaId: captcha?.id ?? '',
          captchaCode: values.captchaCode ?? '',
        }),
      })

      if (!res.ok) {
        let data: { message?: string } = {}
        try {
          data = await res.json()
        } catch {
        }
        // 无论何种失败都换新验证码：验证码可能已被消费（一次性）或即将过期
        setError(resolveLoginApiErrorMessage(data.message, t))
        await loadCaptcha()
        form.setFieldValue('captchaCode', '')
        setLoading(false)
        return
      }

      message.success(t('Login.loginSuccess'))
      setLoading(false)
      window.location.href = '/admin'
    } catch (err) {
      console.error(err)
      setError(t('Login.unknownError'))
      await loadCaptcha()
      form.setFieldValue('captchaCode', '')
      setLoading(false)
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      requiredMark={false}
      disabled={loading}
    >
      <Form.Item
        label={t('Login.usernameOrEmail')}
        name="username"
        rules={[{ required: true, message: t('Login.invalidFormat') }]}
      >
        <Input
          size="large"
          prefix={<UserOutlined />}
          placeholder={t('Login.usernamePlaceholder')}
          autoFocus
        />
      </Form.Item>

      <Form.Item
        label={t('Login.password')}
        name="password"
        rules={[{ required: true, message: t('Login.invalidFormat') }]}
      >
        <Input.Password
          size="large"
          prefix={<LockOutlined />}
          placeholder={t('Login.passwordPlaceholder')}
        />
      </Form.Item>

      <Form.Item
        label={t('Login.captcha')}
        required
        style={{ marginBottom: token.marginLG }}
      >
        <div
          style={{
            display: 'flex',
            gap: token.marginSM,
            alignItems: 'center',
          }}
        >
          <Form.Item
            name="captchaCode"
            noStyle
            rules={[{ required: true, message: t('Login.captchaRequired') }]}
          >
            <Input
              size="large"
              prefix={<SafetyCertificateOutlined />}
              placeholder={t('Login.captchaPlaceholder')}
              maxLength={5}
              autoComplete="off"
              style={{ flex: 1, minWidth: 0 }}
            />
          </Form.Item>

          {/* 点击图片即可刷新：验证码一次性使用，失败/过期后点击换新码 */}
          <div
            role="button"
            tabIndex={0}
            onClick={refreshCaptcha}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                refreshCaptcha()
              }
            }}
            title={t('Login.captchaRefreshTitle')}
            aria-label={t('Login.captchaRefreshTitle')}
            style={{
              width: 120,
              height: 40,
              flexShrink: 0,
              cursor: 'pointer',
              borderRadius: token.borderRadius,
              border: `1px solid ${token.colorBorder}`,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: token.colorFillQuaternary,
            }}
          >
            {captchaLoading ? (
              <Spin size="small" />
            ) : captcha ? (
              <span
                style={{ display: 'block', width: '100%', height: '100%' }}
                dangerouslySetInnerHTML={{ __html: captcha.svg }}
              />
            ) : (
              <SyncOutlined
                style={{ color: token.colorTextSecondary, fontSize: 18 }}
                aria-hidden
              />
            )}
          </div>
        </div>
      </Form.Item>

      {error && (
        <Form.Item style={{ marginBottom: 0 }}>
          <Text type="danger" style={{ fontSize: token.fontSizeSM }}>
            {error}
          </Text>
        </Form.Item>
      )}

      <Form.Item style={{ marginTop: token.margin, marginBottom: 0 }}>
        <motion.div
          whileHover={reduce ? {} : { scale: 1.01 }}
          whileTap={reduce ? {} : { scale: 0.98 }}
        >
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={loading}
            style={{ height: 44, fontSize: token.fontSize, fontWeight: 500 }}
          >
            {loading ? t('Login.loggingIn') : t('Login.signIn')}
          </Button>
        </motion.div>
      </Form.Item>
    </Form>
  )
}

function resolveLoginApiErrorMessage(
  raw: string | undefined,
  t: (key: string) => string,
): string {
  const m = (raw ?? '').trim()
  if (!m) return t('Login.credentialsError')

  // 服务端结构化错误码优先（验证码 / 登录锁定）
  const codeMap: Record<string, string> = {
    CAPTCHA_REQUIRED: t('Login.captchaRequired'),
    CAPTCHA_MISMATCH: t('Login.captchaError'),
    CAPTCHA_EXPIRED: t('Login.captchaExpired'),
    CAPTCHA_USED: t('Login.captchaUsed'),
    CAPTCHA_VERIFY_FAILED: t('Login.captchaVerifyFailed'),
    LOGIN_LOCKED: t('Login.loginLocked'),
  }
  if (codeMap[m]) return codeMap[m]

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