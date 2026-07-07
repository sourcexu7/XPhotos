'use client'

import type { ImageListDataProps, ImageServerHandleProps } from '~/types/props'
import React, { useState } from 'react'
import { useButtonStore } from '~/app/providers/button-store-providers'
import { message } from 'antd'
import { useSwrInfiniteServerHook } from '~/hooks/use-swr-infinite-server-hook'
import { Button, Checkbox, Modal, theme } from 'antd'
import { useTranslations } from 'next-intl'
import { useSwrPageTotalServerHook } from '~/hooks/use-swr-page-total-server-hook'

export default function ImageBatchDeleteSheet(props : Readonly<ImageServerHandleProps & { dataProps: ImageListDataProps } & { pageNum: number } & { album: string } & { selectedIds?: string[] }>) {
  const { dataProps, pageNum, album, selectedIds, ...restProps } = props
  const { mutate } = useSwrInfiniteServerHook(restProps, pageNum, album)
  const { mutate: totalMutate } = useSwrPageTotalServerHook(restProps.args, album)
  const { imageBatchDelete, setImageBatchDelete } = useButtonStore(
    (state) => state,
  )
  const [loading, setLoading] = useState(false)
  const [deleteStorage, setDeleteStorage] = useState(true) // 默认同时清理对象存储，与 deleteImage 保持一致
  const t = useTranslations()
  const { token } = theme.useToken()

  async function submit() {
    if (!selectedIds || selectedIds.length === 0) {
      message.warning(t('List.batchDeleteNoSelection'))
      return
    }
    try {
      setLoading(true)
      await fetch('/api/v1/images/batch-delete', {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedIds, deleteStorage }),
        method: 'DELETE',
      }).then(response => response.json())
      message.success(t('List.batchDeleteSuccess'))
      setImageBatchDelete(false)
      await mutate()
      await totalMutate()
    } catch (e) {
      message.error(t('List.batchDeleteFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={<div style={{ textAlign: 'center', fontSize: 18, fontWeight: 600, color: token.colorText }}>{t('Button.yesDelete')}</div>}
      open={imageBatchDelete}
      onCancel={() => setImageBatchDelete(false)}
      footer={
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: token.margin }}>
          <Button onClick={() => setImageBatchDelete(false)}>{t('Button.canal')}</Button>
          <Button
            danger
            type="primary"
            loading={loading}
            onClick={() => submit()}
          >
            {t('Button.yesDelete')}
          </Button>
        </div>
      }
      centered
      width={420}
    >
      <div>
        <div style={{ textAlign: 'center', color: token.colorTextSecondary, marginTop: 8 }}>
          {t('List.batchDeleteDescriptionPrefix')}
          <span style={{ fontWeight: 700, color: token.colorError }}>{selectedIds?.length || 0}</span>
          {t('List.batchDeleteDescriptionSuffix')}
        </div>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Checkbox
            checked={deleteStorage}
            onChange={(e) => setDeleteStorage(e.target.checked)}
          >
            <span style={{ fontSize: 14, color: token.colorText }}>
              {t('List.batchDeleteStorageCheckbox')}
            </span>
          </Checkbox>
        </div>
        {deleteStorage && (
          <div style={{ marginTop: 4, textAlign: 'center', fontSize: 12, color: token.colorWarning }}>
            {t('List.batchDeleteStorageHint')}
          </div>
        )}

        <div style={{
          maxHeight: 200,
          overflowY: 'auto',
          margin: '16px 0',
          backgroundColor: token.colorBgContainer,
          padding: 12,
          borderRadius: token.borderRadius,
          border: `1px solid ${token.colorBorderSecondary}`,
        }}>
          <div style={{ fontSize: 12, color: token.colorTextTertiary, marginBottom: 8 }}>{t('List.batchDeleteIdsLabel')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {selectedIds?.map(id => (
              <div key={id} style={{
                fontSize: 12,
                fontFamily: 'monospace',
                color: token.colorTextSecondary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {id}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}

