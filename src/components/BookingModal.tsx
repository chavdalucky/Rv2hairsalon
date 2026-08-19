import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import AppointmentForm from './AppointmentForm';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialService?: string;
}

export default function BookingModal({ isOpen, onClose, initialService }: BookingModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
             <div className="flex items-center justify-between p-6 border-b border-zinc-800 shrink-0">
               <div>
                   <h3 className="text-2xl font-serif font-bold text-white tracking-wide">Book Appointment</h3>
                   <p className="text-zinc-400 text-sm mt-1">Complete your request details below.</p>
               </div>
               <button
                 onClick={onClose}
                 className="p-2 bg-black/50 rounded-full text-zinc-400 hover:text-white transition-colors"
               >
                 <X size={20} />
               </button>
             </div>
             
             <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
               <AppointmentForm 
                 initialService={initialService} 
                 onCancel={onClose}
                 isModal={true}
               />
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
