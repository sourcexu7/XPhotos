'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, useTransform, useSpring, useMotionValue } from 'framer-motion'
import type { ImageType } from '~/types'

// --- Types ---
export type AnimationPhase = 'scatter' | 'line' | 'circle' | 'bottom-strip';

interface FlipCardProps {
    src: string;
    index: number;
    total: number;
    phase: AnimationPhase;
    target: { x: number; y: number; rotation: number; scale: number; opacity: number };
}

// --- FlipCard Component ---
const IMG_WIDTH = 60  // Reduced from 100
const IMG_HEIGHT = 85 // Reduced from 140

function FlipCard({
    src,
    index,
    total,
    phase,
    target,
}: FlipCardProps) {
    return (
        <motion.div
            // Smoothly animate to the coordinates defined by the parent
            animate={{
                x: target.x,
                y: target.y,
                rotate: target.rotation,
                scale: target.scale,
                opacity: target.opacity,
            }}
            transition={{
                type: 'spring',
                stiffness: 40,
                damping: 15,
            }}

            // Initial style
            style={{
                position: 'absolute',
                width: IMG_WIDTH,
                height: IMG_HEIGHT,
                transformStyle: 'preserve-3d', // Essential for the 3D hover effect
                perspective: '1000px',
            }}
            className="cursor-pointer group"
        >
            <motion.div
                className="relative h-full w-full"
                style={{ transformStyle: 'preserve-3d' }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                whileHover={{ rotateY: 180 }}
            >
                {/* Front Face */}
                <div
                    className="absolute inset-0 h-full w-full overflow-hidden rounded-xl shadow-lg bg-gray-200"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <img
                        src={src}
                        alt={`hero-${index}`}
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-transparent" />
                </div>

                {/* Back Face */}
                <div
                    className="absolute inset-0 h-full w-full overflow-hidden rounded-xl shadow-lg bg-gray-900 flex flex-col items-center justify-center p-4 border border-gray-700"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                    <div className="text-center">
                        <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mb-1">View</p>
                        <p className="text-xs font-medium text-white">Details</p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}

// Helper for linear interpolation
const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t

interface ScrollMorphHeroProps {
    images: ImageType[];
}

export default function ScrollMorphHero({ images }: ScrollMorphHeroProps) {
    const [introPhase, setIntroPhase] = useState<AnimationPhase>('scatter')
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
    const containerRef = useRef<HTMLDivElement>(null)

    const TOTAL_IMAGES = images.length
    const MAX_SCROLL = 3000 // Virtual scroll range

    // --- Container Size ---
    useEffect(() => {
        if (!containerRef.current) return

        const handleResize = (entries: ResizeObserverEntry[]) => {
            for (const entry of entries) {
                setContainerSize({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                })
            }
        }

        const observer = new ResizeObserver(handleResize)
        observer.observe(containerRef.current)

        // Initial set
        setContainerSize({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight,
        })

        return () => observer.disconnect()
    }, [])

    // --- Virtual Scroll Logic ---
    const virtualScroll = useMotionValue(0)
    const scrollRef = useRef(0) // Keep track of scroll value without re-renders

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleWheel = (e: WheelEvent) => {
            // Prevent default to stop browser overscroll/bounce
            e.preventDefault()

            const newScroll = Math.min(Math.max(scrollRef.current + e.deltaY, 0), MAX_SCROLL)
            scrollRef.current = newScroll
            virtualScroll.set(newScroll)
        }

        // Touch support
        let touchStartY = 0
        const handleTouchStart = (e: TouchEvent) => {
            touchStartY = e.touches[0].clientY
        }
        const handleTouchMove = (e: TouchEvent) => {
            const touchY = e.touches[0].clientY
            const deltaY = touchStartY - touchY
            touchStartY = touchY

            const newScroll = Math.min(Math.max(scrollRef.current + deltaY, 0), MAX_SCROLL)
            scrollRef.current = newScroll
            virtualScroll.set(newScroll)
        }

        // Attach listeners to container instead of window for portability
        container.addEventListener('wheel', handleWheel, { passive: false })
        container.addEventListener('touchstart', handleTouchStart, { passive: false })
        container.addEventListener('touchmove', handleTouchMove, { passive: false })

        return () => {
            container.removeEventListener('wheel', handleWheel)
            container.removeEventListener('touchstart', handleTouchStart)
            container.removeEventListener('touchmove', handleTouchMove)
        }
    }, [virtualScroll])

    // 1. Morph Progress: 0 (Circle) -> 1 (Bottom Arc)
    // Happens between scroll 0 and 600
    const morphProgress = useTransform(virtualScroll, [0, 600], [0, 1])
    const smoothMorph = useSpring(morphProgress, { stiffness: 40, damping: 20 })

    // 2. Scroll Rotation (Shuffling): Starts after morph (e.g., > 600)
    // Rotates the bottom arc as user continues scrolling
    const scrollRotate = useTransform(virtualScroll, [600, 3000], [0, 360])
    const smoothScrollRotate = useSpring(scrollRotate, { stiffness: 40, damping: 20 })

    // --- Mouse Parallax ---
    const mouseX = useMotionValue(0)
    const smoothMouseX = useSpring(mouseX, { stiffness: 30, damping: 20 })

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect()
            const relativeX = e.clientX - rect.left

            // Normalize -1 to 1
            const normalizedX = (relativeX / rect.width) * 2 - 1
            // Move +/- 100px
            mouseX.set(normalizedX * 100)
        }
        container.addEventListener('mousemove', handleMouseMove)
        return () => container.removeEventListener('mousemove', handleMouseMove)
    }, [mouseX])

    // --- Intro Sequence ---
    useEffect(() => {
        const timer1 = setTimeout(() => setIntroPhase('line'), 500)
        const timer2 = setTimeout(() => setIntroPhase('circle'), 2500)
        return () => { clearTimeout(timer1); clearTimeout(timer2) }
    }, [])

    // --- Random Scatter Positions ---
    const scatterPositions = useMemo(() => {
        return images.map(() => ({
            x: (Math.random() - 0.5) * 1500,
            y: (Math.random() - 0.5) * 1000,
            rotation: (Math.random() - 0.5) * 180,
            scale: 0.6,
            opacity: 0,
        }))
    }, [images])

    // --- Render Loop (Manual Calculation for Morph) ---
    const [morphValue, setMorphValue] = useState(0)
    const [rotateValue, setRotateValue] = useState(0)
    const [parallaxValue, setParallaxValue] = useState(0)

    useEffect(() => {
        const unsubscribeMorph = smoothMorph.on('change', setMorphValue)
        const unsubscribeRotate = smoothScrollRotate.on('change', setRotateValue)
        const unsubscribeParallax = smoothMouseX.on('change', setParallaxValue)
        return () => {
            unsubscribeMorph()
            unsubscribeRotate()
            unsubscribeParallax()
        }
    }, [smoothMorph, smoothScrollRotate, smoothMouseX])

    // --- Content Opacity ---
    // Fade in content when arc is formed (morphValue > 0.8)
    const contentOpacity = useTransform(smoothMorph, [0.8, 1], [0, 1])
    const contentY = useTransform(smoothMorph, [0.8, 1], [20, 0])

    return (
        <div ref={containerRef} className="relative w-full h-full bg-background overflow-hidden">
            {/* Container */}
            <div className="flex h-full w-full flex-col items-center justify-center perspective-1000">

                {/* Intro Text (Fades out) */}
                <div className="absolute z-0 flex flex-col items-center justify-center text-center pointer-events-none top-1/2 -translate-y-1/2">
                    <motion.h1
                        initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                        animate={introPhase === 'circle' && morphValue < 0.5 ? { opacity: 1 - morphValue * 2, y: 0, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(10px)' }}
                        transition={{ duration: 1 }}
                        className="text-2xl font-medium tracking-tight text-foreground md:text-4xl"
                    >
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#9d4edd] to-[#ff9505]">
                            到最深处纵然那只是瞬间
                        </span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={introPhase === 'circle' && morphValue < 0.5 ? { opacity: 0.5 - morphValue } : { opacity: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="mt-4 text-xs font-bold tracking-[0.2em] text-muted-foreground"
                    >
                        SCROLL TO EXPLORE
                    </motion.p>
                </div>

                {/* Arc Active Content (Fades in) */}
                <motion.div
                    style={{ opacity: contentOpacity, y: contentY }}
                    className="absolute top-1/2 -translate-y-1/2 z-10 flex flex-col items-center justify-center text-center pointer-events-none px-4"
                >
                    <h2 className="text-3xl md:text-5xl font-semibold text-foreground tracking-tight mb-4">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#9d4edd] to-[#ff9505]">
                            到最深处纵然那只是瞬间
                        </span>
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground max-w-lg leading-relaxed">
                        Discover a world where technology meets creativity. <br className="hidden md:block" />
                        Scroll through our curated collection of innovations designed to shape the future.
                    </p>
                </motion.div>

                {/* Main Container */}
                <div className="relative flex items-center justify-center w-full h-full">
                    {images.map((image, i) => {
                        let target = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 }

                        // 1. Intro Phases (Scatter -> Line)
                        if (introPhase === 'scatter') {
                            target = scatterPositions[i]
                        } else if (introPhase === 'line') {
                            const lineSpacing = 70 // Adjusted for smaller images (60px width + 10px gap)
                            const lineTotalWidth = TOTAL_IMAGES * lineSpacing
                            const lineX = i * lineSpacing - lineTotalWidth / 2
                            target = { x: lineX, y: 0, rotation: 0, scale: 1, opacity: 1 }
                        } else {
                            // 2. Circle Phase & Morph Logic

                            // Responsive Calculations
                            const isMobile = containerSize.width < 768
                            const minDimension = Math.min(containerSize.width, containerSize.height)

                            // A. Calculate Circle Position
                            // Increase radius to surround the text
                            const circleRadius = Math.min(minDimension * 0.4, 400)

                            const circleAngle = (i / TOTAL_IMAGES) * 360
                            const circleRad = (circleAngle * Math.PI) / 180
                            const circlePos = {
                                x: Math.cos(circleRad) * circleRadius,
                                y: Math.sin(circleRad) * circleRadius,
                                rotation: circleAngle + 90,
                            }

                            // B. Calculate Bottom Arc Position
                            // "Rainbow" Arch: Convex up. Center is highest point.

                            // Radius:
                            const baseRadius = Math.min(containerSize.width, containerSize.height * 1.5)
                            const arcRadius = baseRadius * (isMobile ? 1.4 : 1.1)

                            // Position:
                            const arcApexY = containerSize.height * (isMobile ? 0.35 : 0.25)
                            const arcCenterY = arcApexY + arcRadius

                            // Spread angle:
                            const spreadAngle = isMobile ? 100 : 130
                            const startAngle = -90 - (spreadAngle / 2)
                            const step = spreadAngle / (TOTAL_IMAGES - 1)

                            // Apply Scroll Rotation (Shuffle) with Bounds
                            const scrollProgress = Math.min(Math.max(rotateValue / 360, 0), 1)
                            const maxRotation = spreadAngle * 0.8 
                            const boundedRotation = -scrollProgress * maxRotation

                            const currentArcAngle = startAngle + (i * step) + boundedRotation
                            const arcRad = (currentArcAngle * Math.PI) / 180

                            const arcPos = {
                                x: Math.cos(arcRad) * arcRadius + parallaxValue,
                                y: Math.sin(arcRad) * arcRadius + arcCenterY,
                                rotation: currentArcAngle + 90,
                                scale: isMobile ? 1.4 : 1.8, // Increased scale for active state
                            }

                            // C. Interpolate (Morph)
                            target = {
                                x: lerp(circlePos.x, arcPos.x, morphValue),
                                y: lerp(circlePos.y, arcPos.y, morphValue),
                                rotation: lerp(circlePos.rotation, arcPos.rotation, morphValue),
                                scale: lerp(1, arcPos.scale, morphValue),
                                opacity: 1,
                            }
                        }

                        return (
                            <FlipCard
                                key={i}
                                src={image.url}
                                index={i}
                                total={TOTAL_IMAGES}
                                phase={introPhase} // Pass intro phase for initial animations
                                target={target}
                            />
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
