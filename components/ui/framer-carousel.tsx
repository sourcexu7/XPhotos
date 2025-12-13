'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export interface CarouselItem {
  id: string;
  url: string;
  title: string;
  link: string;
}

interface FramerCarouselProps {
  items: CarouselItem[];
}

export function FramerCarousel({ items }: FramerCarouselProps) {
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);

  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth || 1;
      const targetX = -index * containerWidth;

      animate(x, targetX, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      });
    }
  }, [index, x]);

  if (!items || items.length === 0) return null;

  return (
    <div className='lg:p-10 sm:p-4 p-2 max-w-4xl mx-auto'>
      <div className='flex flex-col gap-3'>
        <div className='relative overflow-hidden rounded-lg' ref={containerRef}>
          <motion.div className='flex' style={{ x }}>
            {items.map((item) => (
              <div key={item.id} className='shrink-0 w-full h-[500px] relative group'>
                <Link href={item.link} className="block w-full h-full">
                  <img
                    src={item.url}
                    alt={item.title}
                    className='w-full h-full object-cover rounded-lg select-none pointer-events-none'
                    draggable={false}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <h3 className="text-xl font-bold">{item.title}</h3>
                  </div>
                </Link>
              </div>
            ))}
          </motion.div>

          {/* Navigation Buttons */}
          <motion.button
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform z-10
              ${
                index === 0
                  ? 'opacity-40 cursor-not-allowed'
                  : 'bg-white hover:scale-110 hover:opacity-100 opacity-70'
              }`}
          >
            <ChevronLeft className='w-6 h-6 text-black' />
          </motion.button>

          {/* Next Button */}
          <motion.button
            disabled={index === items.length - 1}
            onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
            className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform z-10
              ${
                index === items.length - 1
                  ? 'opacity-40 cursor-not-allowed'
                  : 'bg-white hover:scale-110 hover:opacity-100 opacity-70'
              }`}
          >
            <ChevronRight className='w-6 h-6 text-black' />
          </motion.button>
          {/* Progress Indicator */}
          <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-white/20 rounded-xl border border-white/30'>
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-8 bg-white' : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
