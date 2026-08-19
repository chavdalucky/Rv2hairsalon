import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';
import { triggerHaptic } from '../utils/haptics';
import { trackEvent } from '../utils/analytics';

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    // Check initial state from body class
    setIsLight(document.body.classList.contains('light-mode'));
  }, []);

  const toggleTheme = () => {
    triggerHaptic('light');
    trackEvent('Dark/Light mode changed');
    const isCurrentlyLight = document.body.classList.contains('light-mode');
    
    if (isCurrentlyLight) {
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
      setIsLight(false);
    } else {
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
      setIsLight(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800 text-amber-500 hover:bg-zinc-700 transition-colors border border-zinc-700 hover:border-amber-500/50 relative overflow-hidden ml-2"
      title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
    >
      <motion.div
        initial={false}
        animate={{ 
          rotate: isLight ? 180 : 0,
          scale: isLight ? 0 : 1,
          opacity: isLight ? 0 : 1
        }}
        transition={{ duration: 0.3 }}
        className="absolute"
      >
        <Moon size={18} />
      </motion.div>
      <motion.div
        initial={false}
        animate={{ 
          rotate: isLight ? 0 : -180,
          scale: isLight ? 1 : 0,
          opacity: isLight ? 1 : 0
        }}
        transition={{ duration: 0.3 }}
        className="absolute"
      >
        <Sun size={18} />
      </motion.div>
    </button>
  );
}
