import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';

interface PremiumToastProps {
  message: string;
  visible: boolean;
  type: 'add' | 'remove';
}

export default function PremiumToast({ message, visible, type }: PremiumToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl bg-black/80 backdrop-blur-md border border-amber-500/50 shadow-[0_10px_40px_rgba(245,158,11,0.15)]"
        >
          {type === 'add' ? (
            <Heart className="w-5 h-5 fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
          ) : (
            <Heart className="w-5 h-5 text-white/70" />
          )}
          <span className="text-white font-medium tracking-wide">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
