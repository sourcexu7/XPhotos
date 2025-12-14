"use client";

import * as React from "react";
import { cn } from "~/lib/utils"; // Your utility for merging class names
import { ArrowRight } from "lucide-react";
import Link from "next/link";

// Define the props for the DestinationCard component
interface DestinationCardProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl: string;
  location: string;
  flag?: string;
  stats: string;
  href: string;
  themeColor: string; // e.g., "150 50% 25%" for a deep green
  exploreText?: string;
}

// Helper to convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Hook to extract color from bottom 20% of image
function useImageColor(imageUrl: string, fallback: string) {
  const [color, setColor] = React.useState(fallback);

  React.useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // We only care about the bottom 20%
        const heightToSample = Math.floor(img.height * 0.2);
        const startY = img.height - heightToSample;
        
        if (heightToSample <= 0) return;

        canvas.width = img.width;
        canvas.height = heightToSample;

        // Draw the bottom part of the image onto the canvas
        ctx.drawImage(img, 0, startY, img.width, heightToSample, 0, 0, img.width, heightToSample);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let r = 0, g = 0, b = 0;
        let count = 0;

        // Sample every 10th pixel to save performance
        for (let i = 0; i < data.length; i += 4 * 10) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }

        if (count > 0) {
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);
          setColor(rgbToHsl(r, g, b));
        }
      } catch (e) {
        // console.warn("Failed to extract color from image", e);
        // Keep fallback on error (e.g. CORS)
      }
    };
  }, [imageUrl]);

  return color;
}

const DestinationCard = React.forwardRef<HTMLDivElement, DestinationCardProps>(
  ({ className, imageUrl, location, flag, stats, href, themeColor: initialThemeColor, exploreText = "Explore Now", ...props }, ref) => {
    
    const themeColor = useImageColor(imageUrl, initialThemeColor);

    return (
      // The 'group' class enables hover effects on child elements
      <div
        ref={ref}
        style={{
          // @ts-ignore - CSS custom properties are valid
          "--theme-color": themeColor,
        } as React.CSSProperties}
        className={cn("group w-full h-full", className)}
        {...props}
      >
        <Link
          href={href}
          className="relative block w-full h-full overflow-hidden shadow-lg 
                     transition-all duration-500 ease-in-out 
                     group-hover:scale-105 group-hover:shadow-[0_0_60px_-15px_hsl(var(--theme-color)/0.6)]"
          aria-label={`Explore details for ${location}`}
          style={{
             boxShadow: `0 0 40px -15px hsl(var(--theme-color) / 0.5)`
          }}
        >
          {/* Background Image with Parallax Zoom */}
          <div
            className="absolute inset-0 bg-cover bg-center 
                       transition-transform duration-500 ease-in-out group-hover:scale-110"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />

          {/* Themed Gradient Overlay - Removed */}
          {/* <div
            className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-80"
            style={{
              background: `linear-gradient(to bottom, transparent, hsl(var(--theme-color) / 0.8))`,
              opacity: 0.4
            }}
          /> */}
          
          {/* Content */}
          <div className="relative flex flex-col justify-center items-center h-full p-6 text-white text-center">
            <h3 className="text-4xl font-bold tracking-[0.2em] uppercase drop-shadow-lg">
              {location}
            </h3>
            {flag && <span className="text-2xl mt-2 drop-shadow-md">{flag}</span>}
            <p className="text-sm text-white/90 mt-3 font-medium tracking-widest uppercase opacity-0 transform translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
              {stats}
            </p>

            {/* Explore Button - Removed for SamAlive style */}
          </div>
        </Link>
      </div>
    );
  }
);
DestinationCard.displayName = "DestinationCard";

export { DestinationCard };
