'use client'

import * as React from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '~/lib/utils'

const magicButtonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        minimal:
          'bg-card text-card-foreground border border-border rounded-lg hover:bg-muted hover:text-foreground data-[active=true]:bg-primary/10 data-[active=true]:border-primary data-[active=true]:text-primary aria-pressed:bg-primary/10 aria-pressed:border-primary aria-pressed:text-primary disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed',
        default:
          'bg-primary text-primary-foreground border border-transparent shadow-sm hover:bg-primary/90 rounded-lg',
        destructive:
          'bg-destructive text-white border border-transparent shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive/30 dark:focus-visible:ring-destructive/40',
        outline:
          'border border-border bg-background text-foreground shadow-none hover:bg-muted hover:text-foreground rounded-lg',
        secondary:
          'bg-secondary text-secondary-foreground border border-transparent shadow-sm hover:bg-secondary/80',
        ghost:
          'border border-transparent hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'border border-transparent text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'minimal',
      size: 'default',
    },
  }
)

interface MagicButtonProps extends React.ComponentProps<'button'>,
  VariantProps<typeof magicButtonVariants> {
  asChild?: boolean
  magnetic?: boolean
  glow?: boolean
}

export function MagicButton({
  className,
  variant,
  size,
  asChild = false,
  magnetic = true,
  glow = true,
  children,
  ...props
}: MagicButtonProps) {
  // 3D 倾斜效果
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  // 弹性动画
  const xSpring = useSpring(x, { damping: 15, stiffness: 150 })
  const ySpring = useSpring(y, { damping: 15, stiffness: 150 })
  
  // 旋转变换
  const rotateX = useTransform(ySpring, [-0.5, 0.5], [10, -10])
  const rotateY = useTransform(xSpring, [-0.5, 0.5], [-10, 10])
  
  // 发光效果强度
  const [isHovered, setIsHovered] = React.useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!magnetic) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = (mouseX / width) - 0.5
    const yPct = (mouseY / height) - 0.5
    
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
    setIsHovered(false)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  return (
    <motion.button
      data-slot="magic-button"
      className={cn(magicButtonVariants({ variant, size, className }))}
      style={{
        transformStyle: 'preserve-3d',
        rotateX,
        rotateY,
      } as React.CSSProperties}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props as any}
    >
      {glow && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%', opacity: 0 }}
          animate={{
            x: isHovered ? '100%' : '-100%',
            opacity: isHovered ? 1 : 0,
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      {/* 悬停时的微妙阴影 */}
      <motion.div
        className="absolute inset-0 rounded-lg bg-primary/0"
        animate={{
          backgroundColor: isHovered ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0)',
        }}
        transition={{ duration: 0.2 }}
      />
    </motion.button>
  )
}

export { magicButtonVariants }
