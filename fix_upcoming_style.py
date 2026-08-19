import re

new_code = """import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Calendar, Clock, Scissors, ArrowRight, User, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { triggerHaptic } from '../utils/haptics';

export default function UpcomingAppointment() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // Fetch up to 5 recent bookings to cycle through
        const q = query(
          collection(db, 'bookings'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        );

        const unsub = onSnapshot(q, (snap) => {
          if (!snap.empty) {
            setAppointments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          } else {
            setAppointments([]);
          }
          setLoading(false);
        });
        return () => unsub();
      } else {
        setAppointments([]);
        setLoading(false);
      }
    });
    
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (appointments.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % appointments.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [appointments.length]);

  if (loading || appointments.length === 0) return null;

  const appointment = appointments[currentIndex];

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'confirmed') return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    if (s === 'cancelled') return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (s === 'expired') return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
    if (s === 'completed') return 'text-green-500 bg-green-500/10 border-green-500/20';
    return 'text-amber-500 bg-amber-500/10 border-amber-500/20'; // pending/upcoming
  };

  const getStatusText = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'pending' || s === 'awaiting_confirmation') return 'UPCOMING';
    return s.toUpperCase();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto px-4 mt-8 mb-4 relative z-20 w-full flex justify-center"
    >
      <div className="w-full bg-gradient-to-r from-zinc-900 to-black border border-amber-500/30 rounded-2xl p-6 md:p-8 shadow-[0_0_30px_rgba(245,158,11,0.1)] relative overflow-hidden group min-h-[220px] md:min-h-[140px] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={appointment.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 w-full h-full"
          >
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 w-full md:w-auto text-center sm:text-left">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Calendar className="text-amber-500 w-7 h-7" />
              </div>
              
              <div className="flex flex-col items-center sm:items-start">
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Booking Status
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${getStatusColor(appointment.status)}`}>
                    {getStatusText(appointment.status)}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-serif text-white font-bold">{appointment.serviceName || 'Premium Salon Service'}</h3>
                
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mt-3 text-sm text-zinc-400">
                  <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
                    <Clock className="text-amber-500 w-4 h-4" />
                    <span className="font-medium text-white">{appointment.date}</span> at <span className="font-medium text-white">{appointment.time}</span>
                  </div>
                  {appointment.barber && (
                    <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
                      <User className="text-amber-500 w-4 h-4" />
                      <span className="font-medium text-white">{appointment.barber}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 shrink-0 mt-4 md:mt-0">
               <Link 
                 to="/dashboard"
                 onClick={() => triggerHaptic('light')}
                 className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-white font-bold uppercase tracking-wider text-sm rounded-xl transition-all"
               >
                 <Edit2 className="w-4 h-4" /> Reschedule
               </Link>
               <Link 
                 to="/dashboard"
                 onClick={() => triggerHaptic('light')}
                 className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_25px_rgba(245,158,11,0.3)] group/btn"
               >
                 Manage Booking
                 <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
               </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
"""

with open('src/components/UpcomingAppointment.tsx', 'w') as f:
    f.write(new_code)
