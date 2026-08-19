import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface OptimizedImageProps extends React.ComponentProps<'img'> {
  src: string;
  alt: string;
  className?: string;
  loading?: string;
  fallbackSrc?: string;
  blurColor?: string;
  priority?: boolean;
}

const OptimizedImage = React.memo(function OptimizedImage({ 
  src, 
  alt, 
  className = "", 
  fallbackSrc = "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=800",
  blurColor = "bg-zinc-900/50",
  priority = false,
  ...props 
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(src);
  
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setCurrentSrc(src);
    setIsLoaded(false);
    setError(false);
    setRetryCount(0);
  }, [src]);

  const handleError = () => {
    if (retryCount < 2) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setCurrentSrc(`${src}?retry=${retryCount + 1}`);
      }, 1000);
    } else {
      setError(true);
      setCurrentSrc(fallbackSrc);
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Blur Placeholder */}
      <div 
        className={`absolute inset-0 ${blurColor} transition-opacity duration-700 ease-in-out ${
          isLoaded ? 'opacity-0 z-0' : 'opacity-100 z-10'
        }`}
      >
        <div className="absolute inset-0 animate-pulse bg-white/5" />
      </div>

      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        onLoad={() => setIsLoaded(true)}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
});
export default OptimizedImage;
