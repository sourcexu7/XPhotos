'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '~/lib/utils';
import { useInView } from 'framer-motion';
import { AspectRatio } from '~/components/ui/aspect-ratio';
import type { ImageType } from '~/types';
import { useRouter } from 'next-nprogress-bar';
import { useBlurImageDataUrl } from '~/hooks/use-blurhash';

interface ImageGalleryProps {
  images: ImageType[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  // Distribute images into 3 columns for the masonry layout
  const columns = React.useMemo(() => {
    const newColumns: ImageType[][] = [[], [], []];
    images.forEach((image, index) => {
      newColumns[index % 3].push(image);
    });
    return newColumns;
  }, [images]);

  return (
    <div className="relative flex w-full flex-col items-center justify-center py-10 px-4">
      <div className="mx-auto grid w-full max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {columns.map((columnImages, colIndex) => (
          <div key={colIndex} className="grid gap-6 h-fit">
            {columnImages.map((image, index) => {
              const ratio = image.width && image.height ? image.width / image.height : 16 / 9;
              return (
                <AnimatedImage
                  key={image.id}
                  image={image}
                  ratio={ratio}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

interface AnimatedImageProps {
  image: ImageType;
  className?: string;
  ratio: number;
}

function AnimatedImage({ image, ratio }: AnimatedImageProps) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();
  const blurDataURL = useBlurImageDataUrl(image.blurhash);

  return (
    <div 
      ref={ref}
      className="group relative cursor-pointer"
      onClick={() => router.push(`/preview/${image.id}`)}
    >
      <AspectRatio
        ratio={ratio}
        className="bg-muted relative size-full rounded-xl overflow-hidden"
      >
        <img
          alt={image.detail || 'Image'}
          src={image.preview_url || image.url}
          className={cn(
            'size-full object-cover transition-all duration-700 ease-in-out',
            isLoading ? 'scale-110 blur-lg' : 'scale-100 blur-0',
            !isInView && 'opacity-0'
          )}
          onLoad={() => setIsLoading(false)}
          loading="lazy"
        />
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </AspectRatio>
    </div>
  );
}
