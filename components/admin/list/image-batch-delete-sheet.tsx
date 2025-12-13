'use client'

import type { ImageType } from '~/types'
import type { ImageListDataProps, ImageServerHandleProps } from '~/types/props'
import React, { useState } from 'react'
import { useButtonStore } from '~/app/providers/button-store-providers'
import { toast } from 'sonner'
import { useSwrInfiniteServerHook } from '~/hooks/use-swr-infinite-server-hook'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '~/components/ui/dialog'
import { useSwrPageTotalServerHook } from '~/hooks/use-swr-page-total-server-hook'

export default function ImageBatchDeleteSheet(props : Readonly<ImageServerHandleProps & { dataProps: ImageListDataProps } & { pageNum: number } & { album: string } & { selectedIds?: string[] }>) {
  const { dataProps, pageNum, album, selectedIds, ...restProps } = props
  const { mutate } = useSwrInfiniteServerHook(restProps, pageNum, album)
  const { mutate: totalMutate } = useSwrPageTotalServerHook(props, album)
  const { imageBatchDelete, setImageBatchDelete } = useButtonStore(
    (state) => state,
  )
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!selectedIds || selectedIds.length === 0) {
      toast.warning('请选择要删除的图片')
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
      toast.success('删除成功！')
      setImageBatchDelete(false)
      await mutate()
      await totalMutate()
    } catch (e) {
      toast.error('删除失败！')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog 
      open={imageBatchDelete} 
      onOpenChange={(open) => {
        if (!open) setImageBatchDelete(false)
      }}
    >
      <DialogContent className="sm:max-w-[400px] rounded-lg bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold text-gray-900">确认删除</DialogTitle>
          <DialogDescription className="text-center text-gray-500 mt-2">
            您即将删除 <span className="font-bold text-[#E53E3E]">{selectedIds?.length || 0}</span> 张照片。<br/>
            此操作无法撤销，是否继续？
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[200px] overflow-y-auto my-4 bg-gray-50 p-3 rounded-md border border-gray-100">
          <div className="text-xs text-gray-400 mb-2">即将删除的图片 ID：</div>
          <div className="grid grid-cols-1 gap-1">
            {selectedIds?.map(id => (
              <div key={id} className="text-xs font-mono text-gray-600 truncate">
                {id}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="sm:justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => setImageBatchDelete(false)}
            className="w-full sm:w-auto hover:bg-gray-100 transition-colors"
          >
            取消
          </Button>
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => submit()}
            className="w-full sm:w-auto bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm"
          >
            {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
            确认删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}