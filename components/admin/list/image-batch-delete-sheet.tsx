'use client'

import type { ImageType } from '~/types'
import type { ImageListDataProps, ImageServerHandleProps } from '~/types/props'
import React, { useState } from 'react'
import { useButtonStore } from '~/app/providers/button-store-providers'
import { toast } from 'sonner'
import { useSwrInfiniteServerHook } from '~/hooks/use-swr-infinite-server-hook'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button, Modal } from 'antd'
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
  const t = useTranslations()

  async function submit() {
    if (!selectedIds || selectedIds.length === 0) {
      toast.warning(t('List.batchDeleteNoSelection'))
      return
    }
    try {
      setLoading(true)
      await fetch('/api/v1/images/batch-delete', {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedIds),
        method: 'DELETE',
      }).then(response => response.json())
      toast.success(t('List.batchDeleteSuccess'))
      setImageBatchDelete(false)
      await mutate()
      await totalMutate()
    } catch (e) {
      toast.error(t('List.batchDeleteFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={<div className="text-center text-lg font-semibold text-gray-900">{t('Button.yesDelete')}</div>}
      open={imageBatchDelete}
      onCancel={() => setImageBatchDelete(false)}
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:justify-center gap-3">
          <Button
            onClick={() => setImageBatchDelete(false)}
            className="w-full sm:w-auto hover:bg-gray-100 transition-colors"
          >
            {t('Button.canal')}
          </Button>
          <Button
            danger
            disabled={loading}
            onClick={() => submit()}
            className="w-full sm:w-auto bg-white border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm"
          >
            {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
            {t('Button.yesDelete')}
          </Button>
        </div>
      }
      centered
      width={420}
    >
      <div>
        <div className="text-center text-gray-500 mt-2">
          {t('List.batchDeleteDescriptionPrefix')}
          <span className="font-bold text-[#E53E3E]">{selectedIds?.length || 0}</span>
          {t('List.batchDeleteDescriptionSuffix')}
        </div>
        
        <div className="max-h-[200px] overflow-y-auto my-4 bg-white p-3 rounded-lg border border-gray-100">
          <div className="text-xs text-gray-400 mb-2">{t('List.batchDeleteIdsLabel')}</div>
          <div className="grid grid-cols-1 gap-1">
            {selectedIds?.map(id => (
              <div key={id} className="text-xs font-mono text-gray-600 truncate">
                {id}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}

