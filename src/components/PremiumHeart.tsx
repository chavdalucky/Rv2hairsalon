import { useState } from 'react';
import { triggerHaptic } from '../utils/haptics';
import { trackEvent } from '../utils/analytics';
import { auth } from '../../firebase';
import LoginPopup from './LoginPopup';
import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';

interface PremiumHeartProps {
  isFavorite: boolean;
  onClick: (e: any) => void;
}

export default function PremiumHeart({ isFavorite, onClick }: PremiumHeartProps) {
  const [animating, setAnimating] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);


  const handleClick = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!auth.currentUser) {
      setShowLoginPopup(true);
      return;
    }

    
    // Haptic feedback
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }

    if (!isFavorite) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 1000);
    }
    onClick(e);
  };


  return (
    <>
      <LoginPopup isOpen={showLoginPopup} onClose={() => setShowLoginPopup(false)} />
      <button 

      onClick={handleClick}
      className="relative pointer-events-auto cursor-pointer touch-manipulation z-50 p-2 -m-2 rounded-full focus:outline-none"
      aria-label={isFavorite ? "Remove from favourites" : "Add to favourites"}
    >
      <div className="relative flex items-center justify-center">
        <motion.div
          animate={isFavorite ? { scale: [1, 1.3, 0.9, 1.1, 1], rotate: [0, -10, 10, -5, 0] } : { scale: 1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className={`relative z-10 ${isFavorite ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' : ''}`}
        >
          <Heart 
            size={20} 
            className={`transition-colors duration-300 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-zinc-500 hover:text-red-400'}`} 
          />
        </motion.div>
        
        {/* Particles / Sparkles */}
        <AnimatePresence>
          {animating && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`sparkle-${i}`}
                  initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                  animate={{ 
                    opacity: 0, 
                    scale: [0, 1.5, 0],
                    x: Math.cos((i * 60) * (Math.PI / 180)) * 25,
                    y: Math.sin((i * 60) * (Math.PI / 180)) * 25
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute w-1.5 h-1.5 bg-amber-400 rounded-full blur-[1px]"
                />
              ))}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`heart-${i}`}
                  initial={{ opacity: 1, scale: 0, y: 0, x: 0 }}
                  animate={{ 
                    opacity: 0, 
                    scale: [0, 1, 0.5],
                    y: -40 - (Math.random() * 20),
                    x: (Math.random() - 0.5) * 40
                  }}
                  transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 }}
                  className="absolute text-red-500 pointer-events-none"
                >
                  <Heart size={10} className="fill-red-500" />
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>
      </div>
    </button>
    </>
  );
}
