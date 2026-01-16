'use client'

import { useSelectionStore } from '~/stores/selection-store'
import { Button } from '~/components/ui/button'
import { DownloadIcon, XCircleIcon, Trash2Icon } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { useButtonStore } from '~/app/providers/button-store-providers'

export function SelectionToolbar() {
  const { selectedIds, isSelectionMode, clear: clearSelection } = useSelectionStore()
  const { setImageBatchDelete } = useButtonStore((state) => state)
  const selectedCount = selectedIds.size

  const handleDownload = async () => {
    if (selectedCount === 0) {
      toast.warning('请先选择要下载的图片')
      return
    }

    toast.info(`已选择 ${selectedCount} 张图片，开始准备下载...`)

    try {
      const response = await fetch('/api/v1/download/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageIds: Array.from(selectedIds) }),
        credentials: 'include', // 关键修复：确保跨域请求携带 Cookie
      })

      if (!response.ok) {
        let errorMessage = '下载请求失败';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } else {
            errorMessage = await response.text();
          }
        } catch (e) {
          // Ignore parsing error, use default message
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `xphotos_${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('文件已开始下载！')
      clearSelection() // 下载后清空选择
    } catch (error) {
      console.error('Download failed:', error)
      toast.error(`下载失败: ${error.message}`)
    }
  }

  const handleDelete = () => {
    if (selectedCount === 0) {
      toast.warning('请先选择要删除的图片')
      return
    }
    setImageBatchDelete(true)
  }

  return (
    <AnimatePresence>
      {isSelectionMode && selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 w-auto bg-gray-800/80 dark:bg-black/80 backdrop-blur-md text-white rounded-lg shadow-2xl z-50 flex items-center gap-4 px-4 py-3 border border-gray-700/60"
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{selectedCount}</span>
            <span className="text-sm text-gray-300">项已选中</span>
          </div>
          <div className="h-6 w-px bg-gray-600/80"></div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="flex items-center gap-2 text-white hover:bg-blue-500/20 hover:text-blue-300 transition-colors"
          >
            <DownloadIcon className="h-4 w-4" />
            下载
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="flex items-center gap-2 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
          >
            <Trash2Icon className="h-4 w-4" />
            删除
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearSelection}
            className="text-gray-400 hover:bg-gray-500/20 hover:text-gray-300 transition-colors rounded-full"
          >
            <XCircleIcon className="h-5 w-5" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
