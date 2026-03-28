// ...existing code...
'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from '~/components/ui/sidebar'

type ProjectItem = {
  title?: string
  name?: string
  url: string
  icon?: React.ComponentType<{ size?: number }>
}

type ProjectsProps = {
  projects: {
    title?: string
    items: ProjectItem[]
  }
}

/**
 * NavProjects: 渲染 projects 区块
 * 兼容 items 中使用 title 或 name 字段的写法
 */
export function NavProjects({ projects }: ProjectsProps) {
  const pathname = usePathname()

  if (!projects) return null

  return (
    <SidebarGroup className="mt-4">
      {projects.title && <SidebarGroupLabel>{projects.title}</SidebarGroupLabel>}

      {projects.items?.map((item) => {
        const label = item.title ?? item.name ?? item.url
        const Icon = item.icon
        const active = pathname?.startsWith(item.url)

        return (
          <SidebarMenu key={item.url}>
            <SidebarMenuItem>
              <Link
                href={item.url}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                  active ? 'bg-gray-100' : 'hover:bg-gray-100'
                }`}
              >
                {Icon ? <Icon size={16} /> : null}
                <span>{label}</span>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        )
      })}
    </SidebarGroup>
  )
}
// ...existing code...