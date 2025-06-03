import { cn } from "../lib/utils";

function formatFileSize(sizeInKB: number): string {
  if (!sizeInKB) return "Unknown";
  
  if (sizeInKB < 1000) {
    return `${sizeInKB.toFixed(1)} KB`;
  } else {
    return `${(sizeInKB / 1000).toFixed(1)} MB`;
  }
}

interface ImageInfo {
  url: string;
  name: string;
  shortName: string;
  size?: number; // Now optional to match the data structure
  mimeType?: string;
  alt?: string;
  source?: 'collection' | 'page';
  isOptimized?: boolean;
}

interface ImageSizeDisplayProps {
  images: ImageInfo[];
  className?: string;
  showMimeType?: boolean;
  showFileSize?: boolean;
  showAltText?: boolean; // New prop to show alt text
}

export function ImageSizeDisplay({ 
  images, 
  className, 
  showMimeType = true,
  showFileSize = true,
  showAltText = false // Default to false to maintain backward compatibility
}: ImageSizeDisplayProps) {
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
                {showFileSize && !showMimeType && (
                  <span className={image.isOptimized ? "text-greenText" : "text-redText"}>
                    {formatFileSize(image.size || 0)}
                  </span>
                )}
                
                {showMimeType && (
                  <span className="text-sm text-muted-foreground">
                    {image.mimeType || ''}
                  </span>
                )}
                
                {showAltText && (
                  <span className="text-text3">
                    {image.alt ? `"${image.alt}"` : 'No alt text'}
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}