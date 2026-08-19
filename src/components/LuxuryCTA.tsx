import { triggerHaptic } from '../utils/haptics';
import { trackEvent } from '../utils/analytics';
import { useLanguage } from '../lib/LanguageContext';
import React, { useState, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle } from 'lucide-react';

export default function LuxuryCTA() {
  const { t } = useLanguage();
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const addRipple = (e: MouseEvent<HTMLAnchorElement>) => {
    const button = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - button.left;
    const y = e.clientY - button.top;
    
    const newRipple = {
      x,
      y,
      id: Date.now()
    };
    
    setRipples((prev) => [...prev, newRipple]);
    
    // Remove ripple after animation completes
    setTimeout(() => {
      setRipples((prev) => prev.filter(r => r.id !== newRipple.id));
    }, 600);
  };

  return (
    <motion.a
      href="#" onClick={(e) => { e.preventDefault(); triggerHaptic('light'); trackEvent('Book Now button clicked'); window.dispatchEvent(new CustomEvent('open-booking-modal')); }}
      
      
      onMouseDown={addRipple}
      className="luxury-cta-btn group relative w-[90vw] max-w-[320px] sm:max-w-none sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-amber-500 text-black font-bold uppercase tracking-widest text-xs sm:text-sm rounded flex items-center justify-center gap-3 overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-luxury-pulse md:animate-none md:hover:-translate-y-1 md:hover:scale-[1.03] md:hover:shadow-[0_10px_30px_rgba(245,158,11,0.6)] transition-all duration-350 ease-out will-change-transform mx-auto"
      whileTap={{ scale: 0.98 }}
    >
      {/* Shimmer Sweep every 3-4s */}
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay">
        <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-60 skew-x-[-15deg] animate-luxury-button-shimmer" />
      </div>

      {/* Ripple Container */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded">
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.span
              key={ripple.id}
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute bg-white/40 rounded-full"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: 100,
                height: 100,
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2 w-full text-center whitespace-nowrap flex-nowrap">
        {t("home.hero.bookBtn")} 
        <motion.div
          animate={{ x: [0, 3, 0] }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="will-change-transform"
        >
          <MessageCircle size={18} />
        </motion.div>
      </span>
      
      {/* Existing hover fill effect */}
      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-350 ease-out z-0 rounded"></div>
    </motion.a>
  );
}
