'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { authClient } from '~/lib/auth-client'
import { App as AntApp, Button, Input, Form, Card, Space, theme } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import AdminPageHeader from '~/components/admin/layout/page-header'

export default function Account() {
  const [passwordForm] = Form.useForm()
  const [passwordLoading, setPasswordLoading] = React.useState(false)
  const { token } = theme.useToken()
  const t = useTranslations()
  const { message: antMessage } = AntApp.useApp()
  
  async function updatePassword(values: any) {
    if (values.currentPassword.length < 8) {
      antMessage.error(t('Password.passwordMinLength'))
      return
    }
    if (values.newPassword.length < 8) {
      antMessage.error(t('Password.passwordMinLength'))
      return
    }
    if (values.newPassword !== values.confirmPassword) {
      antMessage.error(t('Password.passwordMismatch'))
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
        antMessage.error(t('Tips.updateFailed'))
      } else {
        antMessage.success(t('Tips.updateSuccess'))
        passwordForm.resetFields()
      }
    } catch (e) {
      antMessage.error(t('Tips.updateFailed'))
    } finally {
      setPasswordLoading(false)
    }
  }

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
