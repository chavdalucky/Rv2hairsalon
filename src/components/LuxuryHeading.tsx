import { useLanguage } from '../lib/LanguageContext';
import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface LuxuryHeadingProps {
  className?: string;
  variants?: any;
}

export default function LuxuryHeading({ className, variants }: LuxuryHeadingProps) {
  const { t } = useLanguage();
  const words1 = [t("home.hero.word1"), t("home.hero.word2")];
  const words2 = [t("home.hero.word3"), t("home.hero.word4")];

  const renderWords = (words: string[], isGradient: boolean, startIndex: number) => {
    return words.map((word, index) => {
      const globalIndex = startIndex + index;
      
      // Delay between 0.1s and 0.4s per word
      const delay = globalIndex * 0.15;
      
      return (
        <span
          key={index}
          className={`animate-luxury-swing inline-block whitespace-nowrap ${
            isGradient 
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-500 to-amber-600 luxury-glow' 
              : 'text-white luxury-glow'
          }`}
          style={{
            '--swing-duration': `3s`,
            '--swing-delay': `${delay.toFixed(2)}s`
          } as React.CSSProperties}
        >
          {word}
        </span>
      );
    });
  };

  return (
    <motion.h1 
      variants={variants} 
      className={`relative font-serif font-bold mb-6 leading-tight drop-shadow-2xl z-10 ${className}`}
    >
      <div className="relative inline-block text-center z-10 overflow-hidden px-4 py-2">
        <div className="flex flex-wrap justify-center gap-[0.3em] z-10">
          {renderWords(words1, false, 0)}
        </div>
        <div className="flex flex-wrap justify-center gap-[0.3em] mt-2 z-10">
          {renderWords(words2, true, words1.length)}
        </div>
        
        {/* Shimmer Overlay */}
        <div 
          className="absolute inset-0 z-20 pointer-events-none mix-blend-color-dodge animate-luxury-shimmer-sweep"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 60%, transparent 100%)',
          }}
        />
      </div>
    </motion.h1>
  );
}
