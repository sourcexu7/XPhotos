'use client'

/**
 * 统一确认弹框服务（基于 Ant Design Modal.confirm）
 *
 * 使用方式（返回 Promise，便于 await）：
 *
 *   import { confirm, message } from '~/lib/admin/dialog'
 *
 *   const ok = await confirm({
 *     title: '确认删除？',
 *     description: '此操作不可恢复，将永久删除该项目。',
 *     confirmText: '删除',
 *     cancelText: '取消',
 *     danger: true,
 *   })
 *
 *   if (ok) {
 *     message.success('已删除')
 *   }
 */

import { Modal, message, type ModalFuncProps } from 'antd'

export interface ConfirmOptions {
  title: React.ReactNode
  description?: React.ReactNode
  confirmText?: string
  cancelText?: string
  /** 是否使用危险按钮样式（红色），默认 false */
  danger?: boolean
  /** 是否允许通过点击遮罩/按 Esc 关闭，默认 true */
  dismissable?: boolean
  /** 点击"确认"前的二次校验。返回 false 或返回 false 的 Promise 则不关闭弹框 */
  onBeforeConfirm?: () => boolean | Promise<boolean> | void
}

export function confirm(options: ConfirmOptions): Promise<boolean> {
  const {
    title,
    description,
    confirmText = '确认',
    cancelText = '取消',
    danger = false,
    dismissable = true,
    onBeforeConfirm,
  } = options

  return new Promise<boolean>((resolve) => {
    const modalConfig: ModalFuncProps = {
      title,
      content: description,
      okText: confirmText,
      cancelText,
      okButtonProps: danger ? { danger: true } : undefined,
      maskClosable: dismissable,
      closable: dismissable,
      keyboard: dismissable,
      centered: true,
      okCancel: true,
      onOk: async () => {
        if (onBeforeConfirm) {
          try {
            const result = await onBeforeConfirm()
            if (result === false) return Promise.reject(false)
          } catch {
            return Promise.reject(false)
          }
        }
        resolve(true)
      },
      onCancel: () => {
        resolve(false)
      },
    }
    Modal.confirm(modalConfig)
  })
}

/**
 * 统一的 toast 入口（基于 antd message）
 * 使用：
 *   import { message } from '~/lib/admin/dialog'
 *   message.success('操作成功')
 *   message.error('网络异常')
 *
 * 或使用子对象 message：
 *   message.success('...')
 */
// Re-export message（与 antd `message` 等价，外部直接 `message.success(...)` 即可）
export { message }
