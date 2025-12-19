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
  const selectedSet = new Set(selected)

  const toggle = (value: string) => {
    const next = new Set(selectedSet)
    if (next.has(value)) {
      next.delete(value)
    } else {
      next.add(value)
    }
    onChange(Array.from(next))
  }

  const clearAll = () => onChange([])

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
          {selected.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {selected.map((val) => (
                <Badge
                  key={val}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  <span className="max-w-[120px] truncate">{val}</span>
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggle(val)}
                  />
                </Badge>
              ))}
            </div>
          )}
          <div className="mt-2 flex justify-end">
            <Button size="sm" variant="ghost" onClick={clearAll}>
              清空
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

