import React from 'react';
import { cn } from "../lib/utils";

interface ImageInfo {
  url: string;
  shortName: string;
  size: number;
  mimeType?: string;
  isOptimized?: boolean; // Add flag to indicate if image is optimized or not
  source?: string; // Add source property to indicate the image source
}

interface ImageSizeDisplayProps {
  images: ImageInfo[];
  className?: string;
  showMimeType?: boolean;
}

export function ImageSizeDisplay({ images, className, showMimeType = true }: ImageSizeDisplayProps) {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className={cn("mt-2 space-y-2", className)}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {images.map((image, index) => (
          <div 
            key={index} 
            className={cn(
              "flex items-center gap-2 bg-background3 rounded-md p-2 overflow-hidden",
              image.source === 'collection' && "border-l-2 border-yellowText"
            )}
          >
            <div className="flex-shrink-0 w-10 h-10 overflow-hidden rounded-md bg-background2">
              <img 
                src={image.url} 
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItaW1hZ2UiPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiIHJ5PSIyIj48L3JlY3Q+PGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIxLjUiPjwvY2lyY2xlPjxwb2x5bGluZSBwb2ludHM9IjIxIDE1IDE2IDEwIDUgMjEiPjwvcG9seWxpbmU+PC9zdmc+';
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate" title={image.url.split('/').pop()}>
                  {image.shortName}
                </p>
                {image.source === 'collection' && (
                  <span className="text-[10px] px-1 py-0.5 bg-background5 text-yellowText rounded-sm">Collection</span>
                )}
              </div>
              <p className="text-xs flex items-center">
                <span className={image.isOptimized ? "text-greenText" : "text-redText"}>
                  {image.size}KB
                </span>
                {showMimeType && (
                  <span className="text-text3 ml-1">• {image.mimeType || 'Unknown'}</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}