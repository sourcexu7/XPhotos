'use client'

import React, { useEffect, useMemo, useState } from 'react'
import type { Config } from '~/types'
import { Modal, Form } from 'antd'
import { toast } from 'sonner'
import { useSWRConfig } from 'swr'
import { useButtonStore } from '~/app/providers/button-store-providers'
import { StorageForm } from '~/components/admin/settings/storages/storage-form'
import { configsToValues, normalizeStorageValues, valuesToConfigs } from '~/components/admin/settings/storages/storage-config-mapper'

export default function COSEditModal() {
  const [loading, setLoading] = useState(false)
  const { mutate } = useSWRConfig()
  const { cosEdit, setCosEdit, setCosEditData, cosData } = useButtonStore((state) => state)
  const [form] = Form.useForm()

  const initialValues = useMemo(() => configsToValues(cosData), [cosData])

  useEffect(() => {
    if (cosEdit) {
      form.setFieldsValue(initialValues)
    }
  }, [cosEdit, initialValues, form])

  async function onOk() {
    setLoading(true)
    try {
      const raw = await form.validateFields()
      const normalized = normalizeStorageValues('cos', raw)
      if (!normalized.ok) {
        toast.error(normalized.message || '配置不完整')
        return
      }

      form.setFieldsValue(normalized.values)

      const nextConfigs = valuesToConfigs(normalized.values, cosData)
      setCosEditData(nextConfigs)

      await fetch('/api/v1/settings/update-cos-info', {
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
        body: JSON.stringify(nextConfigs),
      }).then((res) => res.json())

      toast.success('更新成功')
      mutate('/api/v1/settings/cos-info')
      setCosEdit(false)
      setCosEditData([] as Config[])
    } catch (e: any) {
      if (e?.errorFields) {
      } else {
        toast.error(e?.message || '更新失败')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={<span className="text-[15px] font-semibold text-slate-900">编辑 Tencent COS 配置</span>}
      open={cosEdit}
      onCancel={() => {
        setCosEdit(false)
        setCosEditData([] as Config[])
      }}
      onOk={onOk}
      confirmLoading={loading}
      okText="保存"
      cancelText="取消"
      destroyOnClose
      width={560}
      centered={false}
      maskClosable={!loading}
      className="admin-storage-edit-modal"
      styles={{
        content: {
          background: '#ffffff',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          boxShadow: '0 12px 40px rgba(15, 23, 42, 0.18)',
          borderRadius: 12,
          padding: 16,
        },
        header: {
          background: '#ffffff',
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
          marginBottom: 12,
          paddingBottom: 12,
        },
        body: {
          padding: 0,
          maxHeight: 'calc(100vh - 220px)',
          overflowY: 'auto',
        },
        footer: {
          background: '#ffffff',
          borderTop: '1px solid rgba(15, 23, 42, 0.08)',
          marginTop: 12,
          paddingTop: 12,
        },
        mask: {
          background: 'rgba(15, 23, 42, 0.35)',
        },
      }}
      okButtonProps={{
        className:
          'bg-slate-900 text-white border-slate-900 hover:!bg-slate-800 hover:!border-slate-800',
      }}
      cancelButtonProps={{
        className:
          'bg-white text-slate-700 border-slate-200 hover:!border-slate-300 hover:!text-slate-900',
      }}
    >
      <div className="rounded-lg bg-white text-slate-900">
        <StorageForm form={form} storageType="cos" initialValues={initialValues} />
      </div>
    </Modal>
  )
}

