'use client'

import { createPortal } from 'react-dom'
import { Dialog, DialogContent, DialogTitle } from '~/components/ui/dialog'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'

export function Modal({ children }: { children: React.ReactNode }) {
  return createPortal(
    <Dialog
      defaultOpen={true}
      modal={false}
    >
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(event: any) => event.preventDefault()}
        className="h-full w-full rounded-none max-w-full sm:rounded-md sm:shadow-xl bg-transparent border-none p-0"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <VisuallyHidden.Root>
          <DialogTitle>图片预览</DialogTitle>
        </VisuallyHidden.Root>
        {children}
      </DialogContent>
    </Dialog>,
    document.getElementById('modal-root')!
  )
}