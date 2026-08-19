import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Heart } from 'lucide-react';

interface LoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginPopup({ isOpen, onClose }: LoginPopupProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-zinc-900 border border-amber-500/30 rounded-2xl p-8 z-[101] shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                <Heart className="w-8 h-8 text-amber-500 fill-amber-500/20" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-white mb-2">Save Your Favourites</h2>
              <p className="text-zinc-400">Sign in to curate your personal collection of premium services.</p>
            </div>
            
            <a 
              href="/signup" 
              className="flex items-center justify-center gap-2 w-full py-4 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]"
            >
              <Lock size={18} />
              Sign In to Continue
            </a>
            
            <div className="mt-6 text-center">
              <p className="text-zinc-500 text-sm">
                Don't have an account? <a href="/signup" className="text-amber-500 hover:underline">Sign up</a>
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
