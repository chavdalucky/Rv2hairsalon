import { useLanguage } from '../lib/LanguageContext';
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export default function LuxuryExploreCTA() {
  const { t } = useLanguage();
  return (
    <Link 
      to="/services" 
      className="group relative w-[90vw] max-w-[320px] sm:max-w-none sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-transparent border border-zinc-700 text-white font-bold uppercase tracking-widest text-xs sm:text-sm rounded flex items-center justify-center gap-3 overflow-hidden hover:bg-zinc-900 hover:border-amber-500 transition-all duration-300 ease-out will-change-transform hover:-translate-y-[2px] animate-luxury-border-glow mx-auto"
    >
      {/* Shimmer Sweep every 5s */}
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay overflow-hidden rounded">
        <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 skew-x-[-15deg] animate-luxury-button-shimmer-slow" />
      </div>

      <span className="relative z-10 flex items-center justify-center gap-2 w-full text-center whitespace-nowrap flex-nowrap transition-colors duration-300 group-hover:text-amber-500">
        {t("home.hero.servicesBtn")} 
        <motion.div
          animate={{ x: [0, 6, 0] }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="will-change-transform"
        >
          <ArrowRight size={18} />
        </motion.div>
      </span>
    </Link>
  );
}
