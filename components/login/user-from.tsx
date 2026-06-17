'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { motion, useReducedMotion } from 'motion/react'
import { ConfigProvider, App as AntdApp, Form, Input, Button, Typography, Space, theme, type FormInstance } from 'antd'
import {
  LockOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  CameraOutlined,
  ApartmentOutlined,
  PictureOutlined,
  ClusterOutlined,
  ReloadOutlined,
  SunOutlined,
  MoonOutlined,
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

export const UserFrom = () => {
  const router = useRouter()
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
        <div
          style={{
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
                  router={router}
                />
              </AntdApp>
            </ConfigProvider>
          </motion.div>
        </div>

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
  router,
}: {
  form: FormInstance<LoginFormValues>
  loading: boolean
  error: string
  setError: (error: string) => void
  setLoading: (loading: boolean) => void
  t: (key: string) => string
  reduce: boolean | null
  router: ReturnType<typeof useRouter>
}) {
  const { token } = theme.useToken()
  const { message } = AntdApp.useApp()
  const [captchaId, setCaptchaId] = useState<string>('')
  const [captchaSvg, setCaptchaSvg] = useState<string>('')
  const [captchaLoading, setCaptchaLoading] = useState(false)

  // 获取验证码
  const fetchCaptcha = async () => {
    setCaptchaLoading(true)
    try {
      const res = await fetch('/api/v1/captcha')
      if (res.ok) {
        const data = await res.json()
        setCaptchaId(data.id)
        setCaptchaSvg(data.svg)
        form.setFieldValue('captchaCode', '')
      }
    } catch {
      message.error(t('Login.captchaFailed'))
    } finally {
      setCaptchaLoading(false)
    }
  }

  // 组件挂载时获取验证码
  useEffect(() => {
    fetchCaptcha()
  }, [])

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
          captchaId: captchaId,
          captchaCode: values.captchaCode,
        }),
      })

      if (!res.ok) {
        let data: { message?: string } = {}
        try {
          data = await res.json()
        } catch {
        }
        setError(resolveLoginApiErrorMessage(data.message, t))
        setLoading(false)
        // 登录失败后刷新验证码
        fetchCaptcha()
        return
      }

      message.success(t('Login.loginSuccess'))
      router.refresh()
      router.push('/admin')
    } catch (err) {
      console.error(err)
      setError(t('Login.unknownError'))
      setLoading(false)
      fetchCaptcha()
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
        name="captchaCode"
        rules={[{ required: true, message: t('Login.captchaRequired') }]}
      >
        <Space style={{ width: '100%' }}>
          <Input
            size="large"
            placeholder={t('Login.captchaPlaceholder')}
            style={{ flex: 1 }}
            maxLength={5}
          />
          <div
            onClick={fetchCaptcha}
            style={{
              width: 120,
              height: 40,
              cursor: 'pointer',
              border: `1px solid ${token.colorBorder}`,
              borderRadius: token.borderRadius,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: token.colorBgContainer,
            }}
            title={t('Login.captchaRefreshTitle')}
          >
            {captchaLoading ? (
              <ReloadOutlined spin style={{ color: token.colorPrimary }} />
            ) : captchaSvg ? (
              <div dangerouslySetInnerHTML={{ __html: captchaSvg }} />
            ) : (
              <ReloadOutlined style={{ color: token.colorTextSecondary }} />
            )}
          </div>
        </Space>
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