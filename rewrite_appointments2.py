with open('src/components/MyAppointments.tsx', 'r') as f:
    content = f.read()

import re

# Add getDoc and increment to firestore imports
content = content.replace("doc, updateDoc", "doc, updateDoc, getDoc, getDocs, increment, addDoc, serverTimestamp")

# Add CheckSquare to lucide-react imports
content = content.replace("CheckCircle }", "CheckCircle, CheckSquare, ChevronUp, ChevronDown }")

# Add state variables
state_vars = """  const [isMinimized, setIsMinimized] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState<any>(null);"""
content = content.replace("const [toast, setToast]", "const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);\n" + state_vars)

# In the useEffect where we fetch appointments, handle expiry and set active appointment
new_effect = """  useEffect(() => {
    if (!userId && !userPhone && !userEmail) {
       setLoading(false);
       return;
    }
    
    // Fetch all bookings or handle it client side for simplicity
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    
    const unsub = onSnapshot(q, async (snap) => {
      const allBookings = snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
      
      const filtered = allBookings.filter(b => {
         const matchUserId = b.userId && b.userId === userId;
         
         const cleanUserPhone = userPhone ? userPhone.replace(/\\D/g, '').slice(-10) : '';
         const cleanBookingPhone = b.phone ? b.phone.replace(/\\D/g, '').slice(-10) : '';
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
  }, [userId, userPhone, userEmail]);"""


old_effect_pattern = re.compile(r"  useEffect\(\(\) => \{.*?\}, \[userId, userPhone, userEmail\]\);", re.DOTALL)
content = old_effect_pattern.sub(new_effect.replace('\\', '\\\\'), content)

# Add handleComplete method
handle_complete = """  const handleComplete = async (bookingId: string, amount: string | number) => {
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
  };"""

content = content.replace("const handleCancel = async () => {", handle_complete + "\n\n  const handleCancel = async () => {")


# Top active card JSX
top_card_jsx = """
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
                    
                    <div className="flex flex-col gap-3 min-w-[200px]">
                       <button onClick={() => handleComplete(activeAppointment.id, activeAppointment.amount || 0)} className="w-full py-3 bg-amber-500 text-black font-bold uppercase tracking-widest text-sm rounded-lg hover:bg-amber-400 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2">
                          <CheckSquare size={18} /> Service Done
                       </button>
                       <div className="flex gap-2">
                          <button onClick={() => setRescheduleData({ id: activeAppointment.id, date: activeAppointment.date, time: activeAppointment.time })} className="flex-1 py-2 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors text-xs flex items-center justify-center gap-1">
                             <Edit2 size={12} /> Reschedule
                          </button>
                          <button onClick={() => setCancelData({ id: activeAppointment.id, serviceName: activeAppointment.serviceName || 'Salon Service' })} className="flex-1 py-2 bg-red-500/10 text-red-500 font-medium rounded-lg hover:bg-red-500/20 transition-colors text-xs flex items-center justify-center gap-1">
                             <X size={12} /> Cancel
                          </button>
                       </div>
                    </div>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      )}
"""

content = content.replace("{/* Toast Notification */}", top_card_jsx + "\n      {/* Toast Notification */}")

filter_active = """{filteredAppointments.filter(apt => apt.id !== activeAppointment?.id).map((booking) => {"""
content = content.replace("{filteredAppointments.map((booking) => {", filter_active)


rebook_jsx = """{booking.status === 'expired' && (
                    <div className="mt-4 pt-4 border-t border-zinc-800/50">
                       <p className="text-zinc-400 text-sm mb-3">Your previous booking has expired. Would you like to book a new appointment?</p>
                       <a href="/services" className="inline-block px-4 py-2 bg-zinc-800 text-white hover:bg-zinc-700 transition-colors rounded text-sm font-medium">
                          Book a New Appointment
                       </a>
                    </div>
                  )}"""

content = content.replace("</motion.div>\n            );\n          })}", rebook_jsx + "\n              </motion.div>\n            );\n          })}")

# Also replace "getStatusColor" so it can handle "expired"
content = content.replace("case 'cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';", "case 'cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';\n      case 'expired': return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';")


with open('src/components/MyAppointments.tsx', 'w') as f:
    f.write(content)

