'use client'

import React from 'react'
import Link from 'next/link'
import { Menu } from 'antd'
import { AppstoreOutlined, UploadOutlined, UnorderedListOutlined, PictureOutlined } from '@ant-design/icons'
import { usePathname } from 'next/navigation'

export default function AntdSidebar() {
  const pathname = usePathname() || '/admin'

  const items = [
    { key: '/admin', icon: <AppstoreOutlined />, label: <Link href="/admin">Dashboard</Link> },
    { key: '/admin/upload', icon: <UploadOutlined />, label: <Link href="/admin/upload">Upload</Link> },
    { key: '/admin/list', icon: <UnorderedListOutlined />, label: <Link href="/admin/list">List</Link> },
    { key: '/admin/album', icon: <PictureOutlined />, label: <Link href="/admin/album">Album</Link> },
  ]

  return <Menu theme="dark" mode="inline" selectedKeys={[pathname]} items={items} />
}
