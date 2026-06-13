'use client'

import { message, Alert, Button, Modal, Input } from 'antd'
import { RocketOutlined } from '@ant-design/icons'
import React, { useState } from 'react'
import { useQRCode } from 'next-qrcode'
import { motion } from 'framer-motion'
import { authClient } from '~/lib/auth-client'
import AdminPageHeader from '~/components/admin/layout/page-header'
import { useTranslations } from 'next-intl'

export default function Authenticator() {
  const t = useTranslations()
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [uri, setUri] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [removePassword, setRemovePassword] = useState('')

  const { data: session, isPending } = authClient.useSession()

  async function enable2FA() {
    if (!password) {
      message.error(t('Tips.passwordRequired'))
      return
    }
    const { data, error } = await authClient.twoFactor.enable({
      password: password,
      issuer: 'PicImpact',
    })

    if (error) {
      message.error(t('Tips.enable2FAFailed'))
    }

    if (data) {
      setUri(data.totpURI)
    }
  }

  const { SVG } = useQRCode()

  async function verifyTotpHandle() {
    try {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: otpCode
      })
      if (error) {
        message.error(t('Tips.setupFailed'))
      } else {
        message.success(t('Tips.setupSuccess'))
      }
    } catch {
      message.error(t('Tips.setupFailed'))
    }
  }

  async function disable2FA() {
    try {
      setDeleteLoading(true)
      const { error } = await authClient.twoFactor.disable({
        password: password
      })
      if (error) {
        message.error(t('Tips.removeFailed'))
      } else {
        message.success(t('Tips.removeSuccess'))
      }
    } catch (e) {
      message.error(t('Tips.removeFailed'))
    } finally {
      setPassword('')
      setUri('')
      setDeleteLoading(false)
    }
  }

  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <AdminPageHeader
        title={t('Link.authenticator')}
        description={t('AdminHeader.authenticatorDesc')}
        breadcrumbs={[{ title: t('Link.settings') }, { title: t('Link.authenticator') }]}
      />
      {
        isPending ? <p className="m-2">{t('Tips.syncingStatus')}</p>
          : session?.user?.twoFactorEnabled ?
            <div className="flex flex-col space-y-2">
              <Alert
                message={t('Tips.congratulations')}
                description={t('Tips.twoFactorEnabled')}
                icon={<RocketOutlined />}
                type="success"
                style={{ maxWidth: '256px' }}
              />
              <Button
                danger
                className="cursor-pointer w-36"
                onClick={() => {
                  setShowRemoveModal(true)
                  setRemovePassword('')
                }}
              >
                {t('Button.removeTwoFactor')}
              </Button>
              <Modal
                open={showRemoveModal}
                onCancel={() => setShowRemoveModal(false)}
                title={t('Tips.confirmRemoveTwoFactor')}
                centered
                okButtonProps={{ danger: true, loading: deleteLoading }}
                okText={t('Tips.yes')}
                cancelText="取消"
                onOk={() => {
                  if (!removePassword) {
                    message.error(t('Tips.passwordRequired'))
                    return Promise.reject()
                  }
                  return new Promise<void>((resolve) => {
                    setPassword(removePassword)
                    disable2FA()
                    setShowRemoveModal(false)
                    resolve()
                  })
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
                  <Input.Password
                    placeholder="请输入密码"
                    value={removePassword}
                    onChange={(e) => setRemovePassword(e.target.value)}
                  />
                </div>
              </Modal>
            </div>
            : <div className="space-y-2">
              <h4 className="text-medium font-medium">{t('Tips.stepOne')}</h4>
              <Input.Password
                id="password"
                className="w-full sm:w-64"
                required
                value={password}
                placeholder="请输入密码"
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                className="cursor-pointer w-full sm:w-64"
                onClick={async () => {
                  await enable2FA()
                }}
              >
                生成二维码
              </Button>
              <h4 className="text-medium font-medium">{t('Tips.stepTwo')}</h4>
              <p className="text-small text-default-400">{t('Tips.scanQRCode')}</p>
              {
                uri &&
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 1 }}
                >
                  <SVG
                    text={uri}
                    options={{
                      margin: 2,
                      width: 180,
                      color: {
                        dark: '#010599FF',
                        light: '#FFBF60FF',
                      },
                    }}
                  />
                </motion.div>
              }
              <h4 className="text-medium font-medium">{t('Tips.stepThree')}</h4>
              <p className="text-small text-default-400">{t('Tips.enterSixDigits')}</p>
              <div className="flex justify-center">
                <Input
                  maxLength={6}
                  style={{ width: 200, textAlign: 'center', letterSpacing: 8, fontSize: 18 }}
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div className="gap space-y-2 w-full sm:w-64">
                <Button
                  onClick={() => verifyTotpHandle()}
                  className="cursor-pointer w-full sm:w-64"
                  disabled={otpCode.length !== 6}
                >
                  {t('Tips.completeSetup')}
                </Button>
              </div>
            </div>
      }
    </div>
  )
}
