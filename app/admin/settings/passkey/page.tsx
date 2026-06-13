'use client'

import { message, Alert, Button, Modal, theme } from 'antd'
import { LoadingOutlined, RocketOutlined, DeleteOutlined, SafetyOutlined, MobileOutlined } from '@ant-design/icons'
import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { authClient } from '~/lib/auth-client'
import { PasskeyRegister } from '~/components/auth/passkey-register'
import { useTranslations } from 'next-intl'
import AdminPageHeader from '~/components/admin/layout/page-header'

interface Passkey {
  id: string
  name?: string
  createdAt: Date
  deviceType: string
  backedUp: boolean
  transports?: string
  credentialID: string
  aaguid?: string
}

export default function PasskeySettings() {
  const { token } = theme.useToken()
  const t = useTranslations('Passkey')
  const [passkeys, setPasskeys] = useState<Passkey[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState('')

  const { data: session, isPending } = authClient.useSession()

  // 加载用户�?passkeys
  const loadPasskeys = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await authClient.passkey.listUserPasskeys()

      if (error) {
        console.error('Failed to load passkeys:', error)
        message.error(t('loadError'))
        return
      }

      if (data) {
        setPasskeys(data)
      }
    } catch (error) {
      console.error('Error loading passkeys:', error)
      message.error(t('loadingError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  // 删除 passkey
  const deletePasskey = async (passkeyId: string) => {
    try {
      setDeleteLoading(passkeyId)
      const { error } = await authClient.passkey.deletePasskey({
        id: passkeyId
      })

      if (error) {
        message.error(t('deleteFailed'))
        return
      }

      message.success(t('deleteSuccess'))
      loadPasskeys() // 重新加载列表
    } catch (error) {
      console.error('Delete passkey error:', error)
      message.error(t('deleteFailed'))
    } finally {
      setDeleteLoading('')
    }
  }

  useEffect(() => {
    if (session?.user) {
      loadPasskeys()
    }
  }, [session, loadPasskeys])

  const handlePasskeyRegistered = () => {
    loadPasskeys()
  }

  return (
    <div className="flex h-full max-w-sm flex-1 flex-col space-y-4">
      <AdminPageHeader
        title={t('title')}
        description="管理 Passkey 登录设备与删除操作。"
        breadcrumbs={[{ title: '设置' }, { title: t('title') }]}
      />

      {isPending ? (
        <p className="m-2">{t('syncingStatus')}</p>
      ) : (
        <div className="space-y-4">
          {/* 注册新的 Passkey */}
          <div className="space-y-2">
            <h3 className="text-md font-medium">{t('addNew')}</h3>
            <p className="text-sm text-muted-foreground text-wrap">
              {t('description')}
            </p>
            <PasskeyRegister
              email={session?.user?.email}
              onSuccess={handlePasskeyRegistered}
              className="w-full"
            />
          </div>

          {/* 现有�?Passkeys */}
          <div className="space-y-2">
            <h3 className="text-md font-medium">{t('registeredList', { count: passkeys.length })}</h3>

            {loading ? (
              <div className="flex items-center space-x-2">
                <LoadingOutlined style={{ fontSize: 16 }} />
                <span>{t('loading')}</span>
              </div>
            ) : passkeys.length === 0 ? (
              <Alert
                message={t('noPasskeys')}
                description={t('noPasskeysDescription')}
                icon={<SafetyOutlined />}
                type="info"
                style={{ maxWidth: '384px' }}
              />
            ) : (
              <div className="space-y-2">
                {passkeys.map((passkey) => (
                  <motion.div
                    key={passkey.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {passkey.deviceType === 'platform' ? (
                          <MobileOutlined />
                        ) : (
                          <SafetyOutlined />
                        )}
                      <div>
                        <p className="font-medium">
                          {passkey.name || t('unnamedPasskey')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('createdOn')}: {new Date(passkey.createdAt).toLocaleDateString()}
                          {passkey.backedUp && ` �?${t('backedUp')}`}
                          {passkey.deviceType === 'platform' ? ` �?${t('platformDevice')}` : ` �?${t('crossPlatformDevice')}`}
                        </p>
                        {passkey.credentialID && (
                          <p className="text-xs text-muted-foreground font-mono">
                            ID: {passkey.credentialID.slice(0, 12)}...
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        Modal.confirm({
                          title: t('deletePasskey'),
                          content: (
                            <div style={{ padding: '16px 0' }}>
                              <p>{t('deleteConfirmation')}</p>
                              <p style={{ fontSize: '14px', color: token.colorTextSecondary, marginTop: 8 }}>
                                Passkey: {passkey.name || t('unnamedPasskey')}
                              </p>
                              <p style={{ fontSize: '12px', color: token.colorTextTertiary, marginTop: 4 }}>
                                {t('createdOn')}: {new Date(passkey.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ),
                          okText: t('confirmDelete'),
                          cancelText: '取消',
                          okButtonProps: { danger: true, loading: deleteLoading === passkey.id },
                          centered: true,
                          onOk: () => deletePasskey(passkey.id),
                        })
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* 提示信息 */}
          {passkeys.length > 0 && (
            <Alert
              message={t('tipTitle')}
              description={t('tipDescription')}
              icon={<RocketOutlined />}
              type="success"
            />
          )}
        </div>
      )}
    </div>
  )
}
