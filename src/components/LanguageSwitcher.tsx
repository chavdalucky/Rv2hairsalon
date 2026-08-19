import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { triggerHaptic } from '../utils/haptics';
import { trackEvent } from '../utils/analytics';
import { Globe, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative z-[100]" ref={dropdownRef}>
      <button 
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="flex items-center gap-1.5 p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50"
      >
        <Globe size={18} />
        <span className="uppercase text-sm font-bold tracking-widest">{language === 'en' ? 'EN' : 'GU'}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-36 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden py-1 z-[100]"
          >
            <button
              type="button"
              onClick={() => { setLanguage('en'); setIsOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-800 transition-colors flex items-center justify-between ${language === 'en' ? 'text-amber-500 font-bold bg-zinc-800/50' : 'text-zinc-400'}`}
            >
              English
              {language === 'en' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>}
            </button>
            <button
              type="button"
              onClick={() => { setLanguage('gu'); setIsOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-800 transition-colors flex items-center justify-between ${language === 'gu' ? 'text-amber-500 font-bold bg-zinc-800/50' : 'text-zinc-400'}`}
            >
              ગુજરાતી
              {language === 'gu' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
