'use client'

import { useSelectionStore } from '~/stores/selection-store'
import { Button } from 'antd'
import { XCircleIcon, Trash2Icon } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { useButtonStore } from '~/app/providers/button-store-providers'

export function SelectionToolbar() {
  const { selectedIds, isSelectionMode, clear: clearSelection } = useSelectionStore()
  const { setImageBatchDelete } = useButtonStore((state) => state)
  const selectedCount = selectedIds.size

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
            type="text"
            size="small"
            onClick={handleDelete}
            className="flex items-center gap-2 text-red-400 hover:!bg-red-500/20 hover:!text-red-300 transition-colors border-none"
          >
            <Trash2Icon className="h-4 w-4 inline-block" />
            删除
          </Button>
          <Button
            type="text"
            size="middle"
            onClick={clearSelection}
            className="text-gray-400 hover:!bg-gray-500/20 hover:!text-gray-300 transition-colors rounded-full border-none p-0 flex items-center justify-center"
          >
            <XCircleIcon className="h-5 w-5" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
