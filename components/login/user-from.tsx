'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next-nprogress-bar'
import { toast } from 'sonner'
import { SafeParseReturnType, z } from 'zod'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '~/components/ui/input-otp'
import { ReloadIcon } from '@radix-ui/react-icons'
import { cn } from '~/lib/utils'
import { useTranslations } from 'next-intl'
import { authClient } from '~/server/auth/auth-client'
import { PasskeyLogin } from '~/components/auth/passkey-login'
import { Form, Input, Button as AntButton, Card, Typography, Space, Divider, theme } from 'antd'

export const UserFrom = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) => {
  const router = useRouter()
  const t = useTranslations()
  const { token } = theme.useToken()

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState<string>('')
  const [otp, setOtp] = useState(false)

  const [form] = Form.useForm()

  useEffect(() => {
    // 自动聚焦邮箱字段
    const emailField = form.getFieldInstance?.('email') as HTMLInputElement | undefined
    emailField?.focus()
  }, [form])

  const onFinish = async () => {
    if (otp) {
      await verifyTotp()
    } else {
      await handleLogin()
    }
  }
  
  function zHandle(): SafeParseReturnType<string | any, string | any> {
    const values = form.getFieldsValue()
    const parsedCredentials = z
      .object({ email: z.string().email(), password: z.string().min(8) })
      .safeParse({ email: values.email, password: values.password })
    return parsedCredentials
  }

  const verifyTotp = async () => {
    const { error } = await authClient.twoFactor.verifyTotp({ code: token })

    if (error) {
      toast.error('双因素口令验证失败！')
      return
    }

    toast.success('登录成功！')
    setTimeout(() => {
      location.replace('/admin')
    }, 1000)
  }

  const handleLogin = async () => {
    setIsLoading(true)

    try {
      const parsedCredentials = zHandle()
      if (!parsedCredentials.success) {
        toast.error('请检查您的账号密码格式！')
        return
      }
      const { email, password } = parsedCredentials.data
      const { error } = await authClient.signIn.email({ email, password, callbackURL: '/' }, {
        onSuccess(ctx) {
          if (ctx.data.twoFactorRedirect) {
            setOtp(true)
          }
        }
      })

      if (error) {
        toast.error('账号或密码错误！')
        return
      }
    } catch (e) {
      console.error(e)
      toast.error('登录过程中出现错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card
        bordered
        style={{ maxWidth: 420, width: '100%', boxShadow: token.boxShadowSecondary }}
        bodyStyle={{ padding: token.paddingLG }}
        title={<Typography.Title level={4} style={{ margin: 0 }}>{t('Login.title')}</Typography.Title>}
        extra={<Typography.Link onClick={() => router.push('/sign-up')}>{t('Login.signUp')}</Typography.Link>}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          initialValues={{ email, password }}
          style={{ display: 'flex', flexDirection: 'column', gap: token.marginLG }}
        >
          <Form.Item
            label={t('Login.email')}
            name="email"
            rules={[{ required: true, message: t('Login.email') }, { type: 'email', message: '邮箱格式不正确' }]}
          >
            <Input
              placeholder={t('Login.email')}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </Form.Item>
          <Form.Item
            label={t('Login.password')}
            name="password"
            rules={[{ required: true, message: t('Login.password') }, { min: 8, message: '至少 8 位密码' }]}
          >
            <Input.Password
              placeholder={t('Login.password')}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </Form.Item>
          {otp && (
            <Space orientation="vertical" style={{ width: '100%' }} size={token.marginSM}>
              <Typography.Text type="secondary" style={{ userSelect: 'none' }}>{t('Login.otp')}</Typography.Text>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <InputOTP
                  className="object-center"
                  maxLength={6}
                  value={token}
                  onChange={(value: string) => setToken(value)}
                  onComplete={(value: string) => setToken(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </Space>
          )}
          <AntButton
            type="primary"
            htmlType="submit"
            block
            disabled={isLoading}
          >
            {isLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />} {t('Login.signIn')}
          </AntButton>
          <Divider plain style={{ margin: `${token.marginLG}px 0 ${token.marginSM}px` }}>{t('Login.or')}</Divider>
          <PasskeyLogin className="w-full" email={email} />
          <AntButton block onClick={() => router.push('/')}>{t('Login.goHome')}</AntButton>
        </Form>
      </Card>
    </div>
  )
}