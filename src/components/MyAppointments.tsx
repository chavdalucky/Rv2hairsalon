import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../lib/LanguageContext';
import { db } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDoc, getDocs, increment, addDoc, serverTimestamp, deleteDoc, arrayUnion, limit } from 'firebase/firestore';
import { Calendar, Clock, CreditCard, Scissors, Star, Search, X, Edit2, AlertCircle, CheckCircle, CheckSquare, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHaptic } from '../utils/haptics';

export default function MyAppointments({ userId, userPhone, userEmail }: { userId: string, userPhone?: string, userEmail?: string }) {
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [rescheduleData, setRescheduleData] = useState<{ id: string, date: string, time: string } | null>(null);
  const [cancelData, setCancelData] = useState<{ id: string, serviceName: string } | null>(null);
  const [deleteData, setDeleteData] = useState<{ id: string } | null>(null);

  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});

  const toggleCard = (id: string) => {
    setCollapsedCards(prev => ({...prev, [id]: !prev[id]}));
    triggerHaptic('light');
  };

  const [activeAppointment, setActiveAppointment] = useState<any>(null);

  useEffect(() => {
    if (!userId && !userPhone && !userEmail) {
       setLoading(false);
       return;
    }
    
    // Using a where clause on userId requires a composite index if used with orderBy('createdAt', 'desc')
    // We will query by userId only and sort client-side to be safe
    let q;
    if (userId) {
      q = query(collection(db, 'bookings'), where('userId', '==', userId));
    } else {
      q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(50));
    }
    
    const unsub = onSnapshot(q, async (snap) => {
      const allBookings = snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
      
      allBookings.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      
      const filtered = allBookings.filter(b => {
         const matchUserId = b.userId && b.userId === userId;
         
         const cleanUserPhone = userPhone ? userPhone.replace(/\D/g, '').slice(-10) : '';
         const cleanBookingPhone = b.phone ? b.phone.replace(/\D/g, '').slice(-10) : '';
         const matchPhone = cleanUserPhone && cleanBookingPhone && cleanUserPhone === cleanBookingPhone;
         
         const matchEmail = userEmail && b.email && b.email.toLowerCase() === userEmail.toLowerCase();
         
         return matchUserId || matchPhone || matchEmail;
      });

      // Check for expiry
      const now = new Date();
      let updatedSome = false;
      
      for (const b of filtered) {
         if (['pending', 'confirmed'].includes((b.status || '').toLowerCase())) {
            if (b.date) {
               const bookingDate = new Date(`${b.date}T${b.time || '23:59'}`);
               if (bookingDate < now) {
                   try {
                     await updateDoc(doc(db, 'bookings', b.id), { status: 'expired' });
                     updatedSome = true;
                   } catch(e) {}
               }
            }
         }
      }
      
      if (!updatedSome) {
          setAppointments(filtered);
          
          const active = filtered.find(b => ['pending', 'confirmed'].includes((b.status || '').toLowerCase()));
          setActiveAppointment(active || null);
          
          setLoading(false);
      }
    });
    
    return () => unsub();
  }, [userId, userPhone, userEmail]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'pending': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'confirmed': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'expired': return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
      default: return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const matchesSearch = (apt.serviceName || '').toLowerCase().includes(search.toLowerCase()) || (apt.id || '').toLowerCase().includes(search.toLowerCase());
      
      let matchesStatus = true;
      if (statusFilter !== 'all') {
         const s = (apt.status || 'pending').toLowerCase();
         if (statusFilter === 'upcoming') {
            matchesStatus = ['pending', 'awaiting_confirmation'].includes(s);
         } else if (statusFilter === 'expired') {
            matchesStatus = s === 'expired';
         } else {
            matchesStatus = s === statusFilter;
         }
      }
      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, statusFilter]);

    const handleComplete = async (bookingId: string, amount: string | number) => {
    if (!window.confirm('Are you sure you want to mark this service as completed?')) return;
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'completed',
        updatedAt: new Date()
      });
      
      // Award points
      if (userId) {
         const userRef = doc(db, 'users', userId);
         const userSnap = await getDoc(userRef);
         const settingsSnap = await getDoc(doc(db, 'loyaltySettings', 'config'));
         
         let pointsPerHundred = 10;
         if (settingsSnap.exists()) {
             pointsPerHundred = settingsSnap.data().pointsPerHundred || 10;
         }
         
         if (userSnap.exists()) {
            const userData = userSnap.data();
            const numericAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g,"")) : amount;
            const earnedPoints = Math.floor((numericAmount || 0) / 100) * pointsPerHundred;
            
            await updateDoc(userRef, {
              rewardPoints: (userData.rewardPoints || 0) + earnedPoints,
              totalVisits: (userData.totalVisits || 0) + 1,
            });
            
            await addDoc(collection(db, 'rewardHistory'), {
               userId: userId,
               adminId: 'customer_self',
               action: `Earned points from booking`,
               reason: `Service completed by customer`,
               previousPoints: userData.rewardPoints || 0,
               newPoints: (userData.rewardPoints || 0) + earnedPoints,
               previousVisits: userData.totalVisits || 0,
               newVisits: (userData.totalVisits || 0) + 1,
               date: serverTimestamp()
            });
         }
      }
      
      showToast('Service marked as completed!', 'success');
      triggerHaptic('heavy');
    } catch (e) {
      console.error(e);
      showToast('Failed to update status.', 'error');
    }
  };

  
  const handleDelete = async () => {
    if (!deleteData) return;
    try {
      await deleteDoc(doc(db, 'bookings', deleteData.id));
      showToast('Appointment deleted successfully.', 'success');
      triggerHaptic('heavy');
      setDeleteData(null);
    } catch (e) {
      console.error(e);
      showToast('Failed to delete appointment.', 'error');
      triggerHaptic('heavy');
    }
  };


  const handleCancel = async () => {
    if (!cancelData) return;
    try {
      await updateDoc(doc(db, 'bookings', cancelData.id), {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
        activityHistory: arrayUnion({
           action: 'Customer Cancelled',
           date: new Date().toISOString(),
           note: 'Cancelled by customer via dashboard'
        })
      });
      showToast('Appointment cancelled successfully.', 'success');
      setCancelData(null);
      triggerHaptic('heavy');
    } catch (e) {
      console.error(e);
      showToast('Failed to cancel appointment.', 'error');
      triggerHaptic('heavy');
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleData) return;
    try {
      await updateDoc(doc(db, 'bookings', rescheduleData.id), {
        date: rescheduleData.date,
        time: rescheduleData.time,
        status: 'pending', // Revert to pending for admin confirmation
        updatedAt: serverTimestamp(),
        activityHistory: arrayUnion({
           action: 'Customer Requested Reschedule',
           date: new Date().toISOString(),
           note: `Requested new time: ${rescheduleData.date} at ${rescheduleData.time}`
        })
      });

      
      try {
        await fetch('/api/notifications/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            booking: { 
              id: rescheduleData.id, 
              date: rescheduleData.date, 
              time: rescheduleData.time,
              status: 'pending' 
            }, 
            type: 'confirmation' 
          })
        });
      } catch(e) {
        console.error(e);
      }

      showToast('Appointment rescheduled successfully.', 'success');
      setRescheduleData(null);
      triggerHaptic('heavy');
    } catch (e) {
      console.error(e);
      showToast('Failed to reschedule appointment.', 'error');
      triggerHaptic('heavy');
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-8 flex justify-center mt-8">
        <div className="animate-pulse flex items-center gap-2 text-amber-500">
          <Calendar size={20} />
          <span>Loading appointments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden shadow-2xl mt-8 relative">
      
            <div className="p-6 border-b border-zinc-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
          <Calendar size={24} className="text-amber-500" /> My Appointments
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search bookings..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-48 bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {activeAppointment && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl mb-8 relative">
           <div className="p-4 flex items-center justify-between border-b border-amber-500/20 cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
              <h3 className="text-amber-500 font-bold flex items-center gap-2">
                 <Star size={18} className="fill-amber-500" /> Upcoming Appointment
              </h3>
              <button className="text-amber-500/80 hover:text-amber-500">
                 {isMinimized ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              </button>
           </div>
           
           <AnimatePresence>
             {!isMinimized && (
               <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                 <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                       <h4 className="text-white font-bold text-2xl mb-2">{activeAppointment.serviceName || 'Salon Service'}</h4>
                       <div className="flex flex-col gap-2">
                         <span className="flex items-center gap-2 text-zinc-300">
                            <Calendar size={16} className="text-amber-500" />
                            {activeAppointment.date ? new Date(activeAppointment.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Date not set'}
                         </span>
                         <span className="flex items-center gap-2 text-zinc-300">
                            <Clock size={16} className="text-amber-500" />
                            {activeAppointment.time || 'Time not set'}
                         </span>
                       </div>
                    </div>
                    
                    <div className="flex flex-col gap-3 w-full md:w-auto">
                       
                       <div className="flex flex-wrap gap-2">
                          <button onClick={() => setRescheduleData({ id: activeAppointment.id, date: activeAppointment.date, time: activeAppointment.time })} className="flex-1 py-2 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors text-xs flex items-center justify-center gap-1 min-w-[100px]">
                             <Edit2 size={12} /> Reschedule
                          </button>
                          <button onClick={() => setCancelData({ id: activeAppointment.id, serviceName: activeAppointment.serviceName || 'Salon Service' })} className="flex-1 py-2 bg-red-500/10 text-red-500 font-medium rounded-lg hover:bg-red-500/20 transition-colors text-xs flex items-center justify-center gap-1 min-w-[100px]">
                             <X size={12} /> Cancel
                          </button>
                          <button onClick={() => setDeleteData({ id: activeAppointment.id })} className="flex-1 py-2 bg-red-500/10 text-red-500 border border-red-500/20 font-medium rounded-lg hover:bg-red-500/20 transition-colors text-xs flex items-center justify-center gap-1 min-w-[100px]">
                             <Trash2 size={12} /> Delete
                          </button>
                       </div>
                    </div>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold shadow-lg ${
              toast.type === 'success' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>


      
      <div className="divide-y divide-zinc-800/50">
        <AnimatePresence>
          {filteredAppointments.filter(apt => apt.id !== activeAppointment?.id).map((booking) => {
            const isUpcoming = ['pending', 'confirmed'].includes((booking.status || 'pending').toLowerCase());
            
            return (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key={booking.id} 
                className="p-6 flex flex-col hover:bg-black/20 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 w-full">
                  <div className="flex flex-col gap-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(booking.status)}`}>
                      {booking.status || 'Pending'}
                    </span>
                    <span className="text-zinc-500 text-xs font-mono uppercase tracking-wider">
                      ID: {booking.id.slice(0, 8)}
                    </span>
                  </div>
                  
                  <h4 className="text-white font-bold text-xl flex items-center gap-2">
                    <Scissors size={20} className="text-amber-500" /> {booking.serviceName || 'Salon Service'}
                  </h4>
                  
                  <div className="flex flex-wrap items-center gap-4 text-zinc-400 text-sm">
                    <span className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-md border border-zinc-800">
                      <Clock size={14} className="text-amber-500" /> 
                      <span className="font-medium text-white">{booking.date}</span> at <span className="font-medium text-white">{booking.time}</span>
                    </span>
                    {booking.barber && (
                      <span className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-md border border-zinc-800">
                        <span className="text-xs uppercase tracking-wider text-zinc-500">Stylist:</span>
                        <span className="font-medium text-white">{booking.barber}</span>
                      </span>
                    )}
                  </div>
                </div>
                
                <button onClick={() => toggleCard(booking.id)} className="p-2 text-zinc-400 hover:text-white transition-colors bg-zinc-900 rounded-full flex-shrink-0 self-start lg:self-center ml-auto">
                   {collapsedCards[booking.id] ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>
              </div>

              <AnimatePresence>
                {!collapsedCards[booking.id] && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 flex flex-col lg:flex-row lg:items-end lg:justify-end gap-4 border-t border-zinc-800/50 mt-4">
                      <div className="flex flex-col lg:items-end justify-between gap-4 w-full">
                  <div className="flex items-center gap-4 lg:justify-end">
                    <div className="text-left lg:text-right bg-zinc-950 p-3 rounded-xl border border-zinc-800/50 min-w-[160px]">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-zinc-500 uppercase tracking-wider">Service:</span>
                        <span className="text-white">₹{booking.amount || '0'}</span>
                      </div>
                      {booking.discountApplied > 0 && (
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="text-amber-500 uppercase tracking-wider">Discount:</span>
                          <span className="text-amber-500">-₹{booking.discountApplied}</span>
                        </div>
                      )}
                      <div className="border-t border-zinc-800/50 my-1 pt-1 flex justify-between items-center">
                         <span className="text-xs text-zinc-500 uppercase tracking-wider">To Pay:</span>
                         <span className="text-xl font-serif text-white font-bold tracking-wide">
                            ₹{Math.max(0, (parseFloat(booking.amount || '0') || 0) - (booking.discountApplied || 0))}
                         </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 flex items-center lg:justify-end gap-1 mt-1 uppercase">
                        <CreditCard size={10}/> {booking.paymentMethod || 'Cash To Collect'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center flex-wrap gap-2 mt-2 lg:mt-0 justify-end">
                    {isUpcoming && (
                      <>
                        <button 
                          onClick={() => {
                            setRescheduleData({ id: booking.id, date: booking.date, time: booking.time });
                            triggerHaptic('light');
                          }}
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Edit2 size={14} /> Reschedule
                        </button>
                        <button 
                          onClick={() => {
                            setCancelData({ id: booking.id, serviceName: booking.serviceName || 'Salon Service' });
                            triggerHaptic('light');
                          }}
                          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                          <X size={14} /> Cancel
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => setDeleteData({ id: booking.id })}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>

                  {booking.status === 'awaiting_confirmation' && (
                    <div className="mt-4 pt-4 border-t border-amber-500/20 bg-amber-500/5 p-4 rounded-xl">
                      <p className="text-amber-500 text-sm mb-3"><AlertCircle size={14} className="inline mr-1"/> Admin has proposed this new time. Do you accept?</p>
                      <div className="flex gap-3">
                        <button 
                          onClick={async () => {
                             try {
                                await updateDoc(doc(db, 'bookings', booking.id), { status: 'confirmed', updatedAt: serverTimestamp() });
                                showToast('Time accepted and confirmed!', 'success');
                             } catch(e) {}
                          }}
                          className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold rounded-lg transition-colors"
                        >
                          Accept New Time
                        </button>
                        <button 
                          onClick={() => {
                            setRescheduleData({ id: booking.id, date: booking.date, time: booking.time });
                          }}
                          className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Request Another
                        </button>
                      </div>
                    </div>
                  )}

                  {booking.status === 'expired' && (
                    <div className="mt-4 pt-4 border-t border-zinc-800/50">
                       <p className="text-zinc-400 text-sm mb-3">Your previous booking has expired. Would you like to book a new appointment?</p>
                       <a href="/services" className="inline-block px-4 py-2 bg-zinc-800 text-white hover:bg-zinc-700 transition-colors rounded text-sm font-medium">
                          Book a New Appointment
                       </a>
                    </div>
                  )}
                      </div>
                  </motion.div>
                )}
              </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredAppointments.length === 0 && (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-zinc-950 border border-zinc-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Calendar className="text-amber-500 w-10 h-10" />
            </div>
            <h4 className="text-white text-lg font-serif mb-2">No Appointments Found</h4>
            <p className="text-zinc-500 max-w-sm mx-auto">
              {search || statusFilter !== 'all' 
                ? "We couldn't find any appointments matching your filters." 
                : "You don't have any appointments yet. Book a service to get started."}
            </p>
            {(!search && statusFilter === 'all') && (
              <a href="/services" className="mt-6 inline-flex items-center justify-center px-6 py-3 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors">
                Book a Service
              </a>
            )}
          </div>
        )}
      </div>

      
      {typeof document !== 'undefined' && createPortal(
        <>
{/* Reschedule Modal */}
      <AnimatePresence>
        {rescheduleData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setRescheduleData(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6"
            >
              <button onClick={() => setRescheduleData(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
              
              <h3 className="text-xl font-serif text-white mb-6">Reschedule</h3>
              
              <form onSubmit={handleReschedule} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">New Date</label>
                  <input 
                    type="date" 
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={rescheduleData.date}
                    onChange={(e) => setRescheduleData({...rescheduleData, date: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">New Time</label>
                  <input 
                    type="time" 
                    required
                    value={rescheduleData.time}
                    onChange={(e) => setRescheduleData({...rescheduleData, time: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setRescheduleData(null)} className="flex-1 px-4 py-3 bg-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-700 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 px-4 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    Confirm 
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
          </AnimatePresence>


          {/* Delete Modal */}
      <AnimatePresence>
        {deleteData && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setDeleteData(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-serif text-white mb-2">Delete Appointment?</h3>
              <p className="text-zinc-400 mb-6">
                Are you sure you want to delete this appointment? This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button onClick={() => setDeleteData(null)} className="flex-1 px-4 py-3 bg-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-700 transition-colors">
                  Cancel
                </button>
                <button onClick={handleDelete} className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
          </AnimatePresence>

          {/* Cancel Modal */}
      <AnimatePresence>
        {cancelData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setCancelData(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-serif text-white mb-2">Cancel?</h3>
              <p className="text-zinc-400 mb-6">
                Are you sure you want to cancel your upcoming <strong className="text-white">{cancelData.serviceName}</strong> appointment? This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button onClick={() => setCancelData(null)} className="flex-1 px-4 py-3 bg-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-700 transition-colors">
                  Keep Appointment
                </button>
                <button onClick={handleCancel} className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  Yes, Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
          </AnimatePresence>
    
        </>,
        document.body
      )}
    </div>
  );
}
