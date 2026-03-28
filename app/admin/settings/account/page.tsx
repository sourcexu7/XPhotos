'use client'

import React, { useEffect } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { authClient } from '~/lib/auth-client'
import { Button, Input, Form, Card, Space, Divider, theme, Progress } from 'antd'
import { SaveOutlined, User, Lock, SafetyOutlined, AlertCircle } from '@ant-design/icons'
import AdminPageHeader from '~/components/admin/layout/page-header'
import { User as UserIcon, Lock as LockIcon, Shield, KeyRound } from 'lucide-react'

const { TextArea } = Input

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1

  const strengthMap = {
    0: { label: '非常弱', color: '#ff4d4f' },
    1: { label: '弱', color: '#ff7875' },
    2: { label: '一般', color: '#ffc53d' },
    3: { label: '中等', color: '#52c41a' },
    4: { label: '强', color: '#1890ff' },
    5: { label: '非常强', color: '#722ed1' },
  }

  return {
    score: (score / 5) * 100,
    label: strengthMap[score as keyof typeof strengthMap]?.label || '非常弱',
    color: strengthMap[score as keyof typeof strengthMap]?.color || '#ff4d4f',
  }
}

export default function Account() {
  const [avatarForm] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [avatarLoading, setAvatarLoading] = React.useState(false)
  const [passwordLoading, setPasswordLoading] = React.useState(false)
  const { token } = theme.useToken()
  const t = useTranslations()
  const { data: session, isPending } = authClient.useSession()
  const [newPassword, setNewPassword] = React.useState('')
  const passwordStrength = getPasswordStrength(newPassword)
  
  async function updateUserInfo(values: any) {
    try {
      setAvatarLoading(true)
      const { error } = await authClient.updateUser({
        image: values.avatar,
      })
      if (error) {
        toast.error(t('Tips.updateFailed'))
      } else {
        toast.success(t('Tips.updateSuccess'))
      }
    } catch (e) {
      toast.error(t('Tips.updateFailed'))
    } finally {
      setAvatarLoading(false)
    }
  }

  async function updatePassword(values: any) {
    // 校验旧密码规则，不小于 8 位
    if (values.currentPassword.length < 8) {
      toast.error(t('Password.passwordMinLength'))
      return
    }
    // 校验新密码规则，不小于 8 位
    if (values.newPassword.length < 8) {
      toast.error(t('Password.passwordMinLength'))
      return
    }
    // 校验 2 个新密码是否一致
    if (values.newPassword !== values.confirmPassword) {
      toast.error(t('Password.passwordMismatch'))
      return
    }
    try {
      setPasswordLoading(true)
      const { error } = await authClient.changePassword({
        newPassword: values.newPassword,
        currentPassword: values.currentPassword,
        revokeOtherSessions: true,
      })
      if (error) {
        toast.error(t('Tips.updateFailed'))
      } else {
        toast.success(t('Tips.updateSuccess'))
        passwordForm.resetFields()
      }
    } catch (e) {
      toast.error(t('Tips.updateFailed'))
    } finally {
      setPasswordLoading(false)
    }
  }

  useEffect(()=>{
    if (session?.user?.image) {
      avatarForm.setFieldsValue({
        avatar: session.user.image.toString()
      })
    }
  },[session, avatarForm])

  return (
    <div className="space-y-4" style={{ height: '100%' }}>
      <AdminPageHeader
        title={t('Link.account')}
        description={t('AdminHeader.accountDesc')}
        breadcrumbs={[{ title: t('Link.settings') }, { title: t('Link.account') }]}
      />
      <Card
        style={{ height: '100%', borderRadius: token.borderRadiusLG }}
      >
        <Space orientation="vertical" size={token.marginLG} style={{ width: '100%', maxWidth: 600 }}>
          {/* 头像设置 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-900">
              <UserIcon className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold">{t('Account.avatar')}</h3>
            </div>
            <Form
              form={avatarForm}
              layout="vertical"
              onFinish={updateUserInfo}
              disabled={isPending}
            >
              <Form.Item
                name="avatar"
              >
                <TextArea
                  rows={4}
                  placeholder={t('Account.inputAvatar')}
                />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={avatarLoading || isPending}
                >
                  {t('Button.submit')}
                </Button>
              </Form.Item>
            </Form>
          </div>

          <Divider />

          {/* 修改密码 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-900">
              <LockIcon className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold">修改密码</h3>
            </div>
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={updatePassword}
            >
              <Form.Item
                label={
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-gray-400" />
                    {t('Password.onePassword')}
                  </div>
                }
                name="currentPassword"
                rules={[
                  { required: true, message: t('Password.oldPasswordRequired') },
                  { min: 8, message: t('Password.passwordMinLength') }
                ]}
              >
                <Input.Password placeholder={t('Password.inputOldPassword')} />
              </Form.Item>

              <Form.Item
                label={
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-400" />
                    {t('Password.twoPassword')}
                  </div>
                }
                name="newPassword"
                rules={[
                  { required: true, message: t('Password.newPasswordRequired') },
                  { min: 8, message: t('Password.passwordMinLength') }
                ]}
              >
                <Input.Password 
                  placeholder={t('Password.inputTwoPassword')} 
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </Form.Item>

              {newPassword && (
                <div className="space-y-2 px-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">密码强度</span>
                    <span className="font-medium" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <Progress 
                    percent={passwordStrength.score} 
                    strokeColor={passwordStrength.color}
                    showInfo={false}
                    size="small"
                  />
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>• 至少 8 个字符</p>
                    <p>• 包含大小写字母</p>
                    <p>• 包含数字和特殊字符</p>
                  </div>
                </div>
              )}

              <Form.Item
                label={
                  <div className="flex items-center gap-2">
                    <SafetyOutlined className="h-4 w-4 text-gray-400" />
                    {t('Password.threePassword')}
                  </div>
                }
                name="confirmPassword"
                rules={[
                  { required: true, message: t('Password.confirmPasswordRequired') },
                  { min: 8, message: t('Password.passwordMinLength') }
                ]}
              >
                <Input.Password placeholder={t('Password.inputThreePassword')} />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={passwordLoading}
                >
                  {t('Button.submit')}
                </Button>
              </Form.Item>
            </Form>
          </div>
        </Space>
      </Card>
    </div>
  )
}
