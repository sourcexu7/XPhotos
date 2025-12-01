'use client'

import { notification } from 'antd'

export function openNotification({ message = '提示', description = '' }: { message?: string; description?: string }) {
  notification.open({ message, description })
}

export default notification
