'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        className={className}
        initial={{
          opacity: 0,
          y: 20,
          filter: 'blur(4px)',
          scale: 0.98,
        }}
        animate={{
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: -20,
          filter: 'blur(4px)',
          scale: 0.98,
        }}
        transition={{
          duration: 0.4,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export function StaggerChildren({
  children,
  className,
  delay = 0.08,
  startDelay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  startDelay?: number
}) {
  return (
    <motion.div className={className}>
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
          animate={{
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
          }}
          transition={{
            duration: 0.4,
            delay: startDelay + index * delay,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}

export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, filter: 'blur(4px)' }}
      animate={{
        opacity: 1,
        filter: 'blur(0px)',
      }}
      transition={{
        duration: 0.5,
        delay,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.div>
  )
}

export function SlideUp({
  children,
  className,
  delay = 0,
  distance = 30,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  distance?: number
}) {
  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        y: distance,
        filter: 'blur(4px)',
      }}
      animate={{
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
      }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  )
}

export function ScaleIn({
  children,
  className,
  delay = 0,
  scaleFrom = 0.9,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  scaleFrom?: number
}) {
  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        scale: scaleFrom,
        filter: 'blur(4px)',
      }}
      animate={{
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
      }}
      transition={{
        duration: 0.4,
        delay,
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }}
    >
      {children}
    </motion.div>
  )
}
