'use client'

import React, { useEffect } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { authClient } from '~/lib/auth-client'
import { Button, Input, Form, Card, Space, Divider, theme } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import AdminPageHeader from '~/components/admin/layout/page-header'

const { TextArea } = Input

export default function Account() {
  const [avatarForm] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [avatarLoading, setAvatarLoading] = React.useState(false)
  const [passwordLoading, setPasswordLoading] = React.useState(false)
  const { token } = theme.useToken()
  const t = useTranslations()
  const { data: session, isPending } = authClient.useSession()
  
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
          <Form
            form={avatarForm}
            layout="vertical"
            onFinish={updateUserInfo}
            disabled={isPending}
          >
            <Form.Item
              label={t('Account.avatar')}
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

          <Divider />

          {/* 修改密码 */}
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={updatePassword}
          >
            <Form.Item
              label={t('Password.onePassword')}
              name="currentPassword"
              rules={[
                { required: true, message: t('Password.oldPasswordRequired') },
                { min: 8, message: t('Password.passwordMinLength') }
              ]}
            >
              <Input.Password placeholder={t('Password.inputOldPassword')} />
            </Form.Item>

            <Form.Item
              label={t('Password.twoPassword')}
              name="newPassword"
              rules={[
                { required: true, message: t('Password.newPasswordRequired') },
                { min: 8, message: t('Password.passwordMinLength') }
              ]}
            >
              <Input.Password placeholder={t('Password.inputTwoPassword')} />
            </Form.Item>

            <Form.Item
              label={t('Password.threePassword')}
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
        </Space>
      </Card>
    </div>
  )
}
