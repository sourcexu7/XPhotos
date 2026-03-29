import * as React from 'react'

import { cn } from '~/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Minimal white input per design
        'h-10 w-full min-w-0 rounded-[4px] px-3 text-sm text-[#333333] bg-white border border-[#e6e6e6] cursor-text',
        // hover
        'hover:border-[#dcdcdc] hover:cursor-text',
        // focus: light blue border and subtle inner 1px glow, no outer shadow
        "focus-visible:border-[#4299e1] focus-visible:shadow-[inset_0_0_0_1px_rgba(66,153,225,0.12)] focus-visible:outline-none",
        // disabled
        'disabled:bg-[#fafafa] disabled:cursor-not-allowed disabled:text-[#999999] disabled:border-[#e6e6e6]',
        // accessibility / invalid
        'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
        className
      )}
      {...props}
    />
  )
}

export { Input }
