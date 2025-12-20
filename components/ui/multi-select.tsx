'use client'

import * as React from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '~/lib/utils'
import { Badge } from '~/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '~/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Button } from '~/components/ui/button'

export interface MultiSelectOption {
  label: string
  value: string
}

interface MultiSelectProps {
  label?: string
  placeholder?: string
  options: MultiSelectOption[]
  selected: string[]
  onChange: (values: string[]) => void
  className?: string
}

/**
 * Bug修复：统一多选筛选组件，适配暗黑/亮色主题，避免固定定位导致遮挡
 */
export function MultiSelect({
  label,
  placeholder,
  options,
  selected,
  onChange,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  // Bug修复：使用 useMemo 确保 selectedSet 在 selected 变化时正确更新
  const selectedSet = React.useMemo(() => new Set(selected), [selected])

  const toggle = React.useCallback((value: string) => {
    const next = new Set(selected)
    if (next.has(value)) {
      next.delete(value)
    } else {
      next.add(value)
    }
    onChange(Array.from(next))
  }, [selected, onChange])

  const clearAll = React.useCallback(() => {
    onChange([])
  }, [onChange])

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {label && (
        <div className="text-[11px] md:text-xs text-muted-foreground">{label}</div>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-between bg-background/60 hover:bg-accent/60 border-border/60',
              !selected.length && 'text-muted-foreground'
            )}
          >
            <span className="truncate text-left">
              {selected.length ? `${selected.length} 项已选` : (placeholder || '请选择')}
            </span>
            <ChevronDown className="h-4 w-4 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          className="w-[min(420px,var(--radix-popover-trigger-width))] p-1 bg-popover/95 backdrop-blur-md border border-border/50 shadow-lg rounded-md max-h-[320px] overflow-hidden"
        >
          <Command>
            <CommandInput 
              placeholder={placeholder || '搜索...'} 
              className="h-9 border-0 focus:ring-0"
            />
            <CommandList className="max-h-[280px] overflow-y-auto">
              <CommandEmpty>无结果</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => toggle(option.value)}
                    className="flex items-center justify-between px-3 py-2 rounded-md text-sm cursor-pointer data-[selected]:bg-accent data-[selected]:text-accent-foreground hover:bg-accent/50 hover:text-accent-foreground"
                  >
                    <span>{option.label}</span>
                    {selectedSet.has(option.value) && <Check className="h-4 w-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          <div className="mt-2 flex justify-end">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={(e) => {
                // Bug修复：阻止事件冒泡，避免触发 Popover 的关闭事件
                e.preventDefault()
                e.stopPropagation()
                clearAll()
              }}
              onMouseDown={(e) => {
                // Bug修复：阻止 mousedown 事件冒泡
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              清空
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {/* Bug修复：在 Popover 外部显示已选标签，即使 Popover 关闭也能看到并移除 */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {selected.map((val) => (
            <Badge
              key={val}
              variant="secondary"
              className="flex items-center gap-1.5 pr-1 [&>svg.lucide-x]:pointer-events-auto"
            >
              <span className="max-w-[120px] truncate text-xs">{val}</span>
              <X
                className="lucide-x h-3 w-3 cursor-pointer hover:text-destructive transition-colors shrink-0"
                style={{ pointerEvents: 'auto' }}
                onClick={(e) => {
                  // Bug修复：阻止事件冒泡，避免触发其他事件
                  e.preventDefault()
                  e.stopPropagation()
                  toggle(val)
                }}
                onMouseDown={(e) => {
                  // Bug修复：阻止 mousedown 事件冒泡，确保点击事件能正确触发
                  e.preventDefault()
                  e.stopPropagation()
                }}
                role="button"
                tabIndex={0}
                aria-label={`移除 ${val}`}
                onKeyDown={(e) => {
                  // 支持键盘操作
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    e.stopPropagation()
                    toggle(val)
                  }
                }}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

