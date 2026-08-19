import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { createAdminNotification } from '../../utils/notifications';

import { collection, onSnapshot, query, orderBy, doc, updateDoc, addDoc, serverTimestamp, getDoc, increment, arrayUnion } from 'firebase/firestore';
import { Calendar, Search, Clock, CreditCard, CheckCircle, XCircle, MoreVertical, Edit2, AlertTriangle, Phone, User, Info } from 'lucide-react';
import { motion } from 'motion/react';

export default function BookingsAdmin() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [detailsModal, setDetailsModal] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState<any>(null);
  const [rescheduleModal, setRescheduleModal] = useState<any>(null);


  const [cancelModal, setCancelModal] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('Customer requested');
  const [completionModal, setCompletionModal] = useState<any>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const stats = {
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    today: bookings.filter(b => b.date === todayStr && !['cancelled', 'no show'].includes((b.status || '').toLowerCase())).length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };
  
  const todaysSchedule = bookings
    .filter(b => b.date === todayStr && !['cancelled', 'no show', 'completed'].includes((b.status || '').toLowerCase()))
    .sort((a, b) => a.time.localeCompare(b.time));

  const getConflicts = (b: any) => {
    return bookings.filter(other => 
      other.id !== b.id && 
      other.date === b.date && 
      other.time === b.time && 
      !['cancelled', 'completed', 'no show'].includes((other.status || '').toLowerCase()) &&
      !['cancelled', 'completed', 'no show'].includes((b.status || '').toLowerCase())
    );
  };

  const handleCustomStatusChange = (b: any, newStatus: string) => {
    if (newStatus === 'confirmed') {
       // Direct confirm without modal
       handleStatusChange(b.id, 'confirmed', b.userId, b.amount, true);
    } else if (newStatus === 'cancelled') {
       setCancelModal(b);
       setCancelReason('Customer requested');
    } else if (newStatus === 'awaiting_confirmation') {
       // Open reschedule modal for awaiting confirmation
       setRescheduleModal({ booking: b, newDate: b.date, newTime: b.time, adminNote: '' });
    } else if (newStatus === 'completed') {
       const user = users.find(u => u.id === b.userId);
       let isBirthday = false;
       if (user && user.dob) {
          const dob = new Date(user.dob);
          const today = new Date();
          if (dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate()) {
             isBirthday = true;
          }
       }
       setCompletionModal({ booking: b, amountPaid: b.amount || '', isBirthday });
    } else {
       handleStatusChange(b.id, newStatus, b.userId, b.amount, true); // Direct change for others too
    }
  };

  
  const handleCompletionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completionModal) return;

    let finalAmount = parseFloat(completionModal.amountPaid);
    if (isNaN(finalAmount) || finalAmount <= 0) {
       alert("Please enter a valid amount.");
       return;
    }

    if (completionModal.isBirthday) {
       finalAmount = finalAmount * 0.8; // 20% discount
    }

    const earnedPoints = Math.floor((finalAmount / 100) * 10);

    try {
      // 1. Update Booking
      await updateDoc(doc(db, 'bookings', completionModal.booking.id), {
        status: 'completed',
        amountPaid: finalAmount,
        pointsEarned: earnedPoints,
        isBirthdayDiscount: completionModal.isBirthday,
        updatedAt: serverTimestamp(),
        activityHistory: arrayUnion({
           action: `Status updated to completed. Amount: ₹${finalAmount}${completionModal.isBirthday ? ' (20% Bday Discount Applied)' : ''}. Points Earned: ${earnedPoints}`,
           date: new Date().toISOString()
        })
      });

      // 2. Update User Profile & Reward Log
      if (completionModal.booking.userId) {
         const userRef = doc(db, 'users', completionModal.booking.userId);
         const userSnap = await getDoc(userRef);
         if (userSnap.exists()) {
             const userData = userSnap.data();
             const previousPoints = userData.rewardPoints || 0;
             const previousVisits = userData.totalVisits || 0;
             const newPoints = previousPoints + earnedPoints;
             const newVisits = previousVisits + 1;

             await updateDoc(userRef, {
                rewardPoints: newPoints,
                totalVisits: newVisits
             });

             // Add reward activity
             await addDoc(collection(db, 'rewardHistory'), {
                userId: completionModal.booking.userId,
                action: 'Points Earned',
                reason: `Earned points for ${completionModal.booking.service} (${finalAmount} INR)`,
                newPoints: newPoints,
                previousPoints: previousPoints,
                newVisits: newVisits,
                previousVisits: previousVisits,
                date: new Date().toISOString(),
                isBirthday: completionModal.isBirthday
             });
         }
      }

      setCompletionModal(null);
    } catch(err) {
       console.error("Completion error: ", err);
       alert("Failed to complete booking.");
    }
  };

  const handleAdminReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModal) return;
    try {
      await updateDoc(doc(db, 'bookings', rescheduleModal.booking.id), {
        date: rescheduleModal.newDate,
        time: rescheduleModal.newTime,
        status: 'awaiting_confirmation',
        updatedAt: serverTimestamp(),
        activityHistory: arrayUnion({
           action: 'Admin Rescheduled',
           date: new Date().toISOString(),
           note: `Changed to ${rescheduleModal.newDate} at ${rescheduleModal.newTime}${rescheduleModal.adminNote ? ' - ' + rescheduleModal.adminNote : ''}`
        })
      });
      // Notify customer
      try {
        await fetch('/api/notifications/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking: { ...rescheduleModal.booking, date: rescheduleModal.newDate, time: rescheduleModal.newTime, status: 'awaiting_confirmation', adminNote: rescheduleModal.adminNote }, type: 'reschedule_proposed' })
        });
      } catch(e) {}
      
      setRescheduleModal(null);
    } catch(e) {
      alert("Error rescheduling");
    }
  };
  
  const handleCancelBooking = async () => {
    if (!cancelModal) return;
    try {
       await updateDoc(doc(db, 'bookings', cancelModal.id), {
          status: 'cancelled',
          cancelReason: cancelReason,
          updatedAt: serverTimestamp(),
          activityHistory: arrayUnion({
             action: 'Cancelled',
             date: new Date().toISOString(),
             note: `Reason: ${cancelReason}`
          })
       });
       handleStatusChange(cancelModal.id, 'cancelled', cancelModal.userId, cancelModal.amount, true);
       setCancelModal(null);
    } catch(e) {
       alert("Error cancelling");
    }
  };

  const [newBooking, setNewBooking] = useState({
    customerId: '',
    customerName: '',
    phone: '',
    serviceName: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    paymentMethod: 'Cash',
    status: 'completed',
    notes: ''
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let selectedUser = users.find(u => u.id === newBooking.customerId);
      
      const bookingData = {
        userId: newBooking.customerId || null,
        customerName: selectedUser ? selectedUser.fullName : newBooking.customerName,
        phone: selectedUser ? selectedUser.phone : newBooking.phone,
        serviceName: newBooking.serviceName,
        amount: Number(newBooking.amount),
        date: newBooking.date,
        time: newBooking.time,
        paymentMethod: newBooking.paymentMethod,

        status: newBooking.status,
        notes: newBooking.notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        activityHistory: [{
           action: 'Booking Created',
           date: new Date().toISOString(),
           note: 'Created by Admin'
        }]
      };


      const docRef = await addDoc(collection(db, 'bookings'), bookingData);

      // Trigger notification if upcoming
      if (['pending', 'confirmed'].includes(newBooking.status)) {
        try {
          await fetch('/api/notifications/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking: { id: docRef.id, ...bookingData }, type: 'confirmation' })
          });
          createAdminNotification('New Booking Received', `New booking for ${bookingData.serviceName} on ${bookingData.date} at ${bookingData.time}.`);
        } catch (e) {
          console.error('Failed to trigger notification', e);
        }
      }


      // If status is completed and it's linked to a user, add points
      if (newBooking.status === 'completed' && newBooking.customerId) {
        await handleStatusChange(docRef.id, 'completed', newBooking.customerId, Number(newBooking.amount), true);
      } else {
         alert('Booking added successfully');
      }

      setShowAddModal(false);
      setNewBooking({
        customerId: '',
        customerName: '',
        phone: '',
        serviceName: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        paymentMethod: 'Cash',
        status: 'completed',
        notes: ''
      });
    } catch (error) {
      console.error(error);
      alert('Error adding booking');
    }
  };


  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'bookings'), orderBy('createdAt', 'desc')), (snap) => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);


  const handleStatusChange = async (bookingId: string, newStatus: string, userId: string, amount: number, skipConfirm = false) => {
    if (!skipConfirm && !window.confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) return;

    try {
      const bookingSnap = await getDoc(doc(db, 'bookings', bookingId));
      let pointsUsed = 0;
      if (bookingSnap.exists()) {
         pointsUsed = bookingSnap.data().pointsUsed || 0;
      }

      await updateDoc(doc(db, 'bookings', bookingId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        activityHistory: arrayUnion({
           action: `Status updated to ${newStatus}`,
           date: new Date().toISOString()
        })
      });

      if (['pending', 'confirmed', 'cancelled', 'completed', 'no show'].includes(newStatus)) {
        try {
          if (bookingSnap.exists()) {
            const data = bookingSnap.data();
            if (['pending', 'confirmed'].includes(newStatus)) {
              await fetch('/api/notifications/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ booking: { id: bookingId, ...data }, type: 'confirmation' })
              });
            }
          }
        } catch(e) {
          console.error('Error sending notification', e);
        }
      }

      if (newStatus === 'completed' && userId) {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        const settingsSnap = await getDoc(doc(db, 'loyaltySettings', 'config'));
        
        let pointsPerHundred = 10;
        if (settingsSnap.exists()) {
          pointsPerHundred = settingsSnap.data().pointsPerHundred || 10;
        }

        if (userSnap.exists()) {
          const userData = userSnap.data();
          // Also unlock points if any were used
          const earnedPoints = Math.floor(amount / 100) * pointsPerHundred;
          
          await updateDoc(userRef, {
            rewardPoints: (userData.rewardPoints || 0) + earnedPoints,
            lockedPoints: Math.max(0, (userData.lockedPoints || 0) - pointsUsed),
            totalVisits: (userData.totalVisits || 0) + 1,
          });

          await addDoc(collection(db, 'rewardHistory'), {
            userId: userId,
            adminId: 'admin',
            action: `Earned points from booking`,
            reason: `Service completed`,
            previousPoints: userData.rewardPoints || 0,
            newPoints: (userData.rewardPoints || 0) + earnedPoints,
            previousVisits: userData.totalVisits || 0,
            newVisits: (userData.totalVisits || 0) + 1,
            date: serverTimestamp()
          });
        }
      } else if ((newStatus === 'cancelled' || newStatus === 'no show') && userId && pointsUsed > 0) {
         // Release locked points back to user
         const userRef = doc(db, 'users', userId);
         await updateDoc(userRef, {
            rewardPoints: increment(pointsUsed),
            lockedPoints: increment(-pointsUsed)
         });
      }

    } catch (e) {
      console.error(e);
      alert('Error updating status');
    }
  };


  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-500/10 text-green-500';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500';
      case 'confirmed': return 'bg-blue-500/10 text-blue-500';
      case 'in progress': return 'bg-purple-500/10 text-purple-500';
      case 'cancelled': return 'bg-red-500/10 text-red-500';
      case 'no show': return 'bg-zinc-500/10 text-zinc-500';
      default: return 'bg-zinc-800 text-zinc-400';
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = (b.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (b.phone || '').includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || b.status?.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">Log New Service / Booking</h3>
            <form onSubmit={handleAddBooking} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Select Customer (Optional)</label>
                <select 
                  value={newBooking.customerId}
                  onChange={(e) => {
                    const u = users.find(user => user.id === e.target.value);
                    setNewBooking({...newBooking, customerId: e.target.value, customerName: u?.fullName || '', phone: u?.phone || ''});
                  }}
                  className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none focus:border-amber-500"
                >
                  <option value="">Walk-in / Unregistered</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName} ({u.phone})</option>
                  ))}
                </select>
              </div>

              {!newBooking.customerId && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Customer Name</label>
                    <input required type="text" value={newBooking.customerName} onChange={(e) => setNewBooking({...newBooking, customerName: e.target.value})} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Phone</label>
                    <input required type="text" value={newBooking.phone} onChange={(e) => setNewBooking({...newBooking, phone: e.target.value})} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Service / Package</label>
                <input required type="text" placeholder="e.g. Premium Haircut & Beard" value={newBooking.serviceName} onChange={(e) => setNewBooking({...newBooking, serviceName: e.target.value})} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Bill Amount (₹)</label>
                  <input required type="number" min="0" value={newBooking.amount} onChange={(e) => setNewBooking({...newBooking, amount: e.target.value})} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Date</label>
                  <input required type="date" value={newBooking.date} onChange={(e) => setNewBooking({...newBooking, date: e.target.value})} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Time</label>
                  <input required type="time" value={newBooking.time} onChange={(e) => setNewBooking({...newBooking, time: e.target.value})} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Payment Method</label>
                  <select value={newBooking.paymentMethod} onChange={(e) => setNewBooking({...newBooking, paymentMethod: e.target.value})} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none">
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / GPay / Paytm</option>
                    <option value="Card">Debit / Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Status</label>
                  <select value={newBooking.status} onChange={(e) => setNewBooking({...newBooking, status: e.target.value})} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none">
                    <option value="completed">Completed (Earns Points)</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Notes</label>
                <input type="text" placeholder="Optional notes..." value={newBooking.notes} onChange={(e) => setNewBooking({...newBooking, notes: e.target.value})} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-amber-500 text-black font-bold py-3 rounded-lg hover:bg-amber-400">Save Booking</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-zinc-800 text-white font-bold py-3 rounded-lg hover:bg-zinc-700">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Details Modal */}
      {detailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full relative">
            <h3 className="text-xl font-bold text-white mb-4">Booking Details</h3>
            
            <div className="space-y-3 text-sm text-zinc-300 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
               <p><strong className="text-zinc-500 w-24 inline-block">ID:</strong> {detailsModal.id}</p>
               <p><strong className="text-zinc-500 w-24 inline-block">Name:</strong> {detailsModal.customerName}</p>
               <p><strong className="text-zinc-500 w-24 inline-block">Phone:</strong> {detailsModal.phone}</p>
               <p><strong className="text-zinc-500 w-24 inline-block">Service:</strong> {detailsModal.serviceName}</p>
               <p><strong className="text-zinc-500 w-24 inline-block">Date:</strong> {detailsModal.date}</p>
               <p><strong className="text-zinc-500 w-24 inline-block">Time:</strong> {detailsModal.time}</p>
               <p><strong className="text-zinc-500 w-24 inline-block">Status:</strong> {detailsModal.status}</p>
               <p><strong className="text-zinc-500 w-24 inline-block">Amount:</strong> ₹{detailsModal.amount}</p>
               <p><strong className="text-zinc-500 w-24 inline-block">Notes:</strong> {detailsModal.notes || 'None'}</p>
               
               {detailsModal.activityHistory && detailsModal.activityHistory.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-zinc-800">
                     <p className="text-amber-500 font-bold mb-2">Activity History</p>
                     <div className="space-y-2">
                        {detailsModal.activityHistory.map((h: any, i: number) => (
                           <div key={i} className="text-xs bg-black p-2 rounded border border-zinc-800">
                              <p className="text-white font-medium">{h.action}</p>
                              {h.note && <p className="text-zinc-400 mt-0.5">{h.note}</p>}
                              <p className="text-zinc-600 mt-1">{new Date(h.date).toLocaleString()}</p>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
            </div>
            <div className="mt-6 flex gap-3">
               <a href={`tel:${detailsModal.phone}`} className="flex-1 bg-green-500/20 text-green-500 border border-green-500/30 flex items-center justify-center gap-2 py-2 rounded-lg font-bold">
                 <Phone size={16} /> Call Customer
               </a>
               <button onClick={() => setDetailsModal(null)} className="flex-1 bg-zinc-800 text-white font-bold py-2 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full relative">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><CheckCircle className="text-blue-500"/> Confirm Booking</h3>
            <p className="text-zinc-400 mb-6">You are about to confirm the following booking:</p>
            <div className="bg-black/50 p-4 rounded-lg mb-6 text-sm text-zinc-300 space-y-2 border border-zinc-800">
               <p><strong className="text-white">Customer:</strong> {confirmModal.customerName}</p>
               <p><strong className="text-white">Service:</strong> {confirmModal.serviceName}</p>
               <p><strong className="text-white">Date & Time:</strong> {confirmModal.date} at {confirmModal.time}</p>
            </div>
            <div className="flex gap-3">
               <button onClick={() => setConfirmModal(null)} className="flex-1 bg-zinc-800 text-white font-bold py-3 rounded-lg hover:bg-zinc-700">Cancel</button>
               <button onClick={() => {
                  handleStatusChange(confirmModal.id, 'confirmed', confirmModal.userId, confirmModal.amount, true);
                  setConfirmModal(null);
               }} className="flex-1 bg-blue-500 text-white font-bold py-3 rounded-lg hover:bg-blue-600">Confirm Booking</button>
            </div>
          </div>
        </div>
      )}


      
      {/* Completion Modal */}
      {completionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full relative">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><CheckCircle className="text-green-500"/> Complete Booking</h3>
            <form onSubmit={handleCompletionSubmit}>
              <div className="mb-4">
                <label className="block text-zinc-400 text-sm mb-2">Total Service Amount Paid (₹) *</label>
                <input 
                  type="number" 
                  required
                  value={completionModal.amountPaid}
                  onChange={(e) => setCompletionModal({...completionModal, amountPaid: e.target.value})}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white outline-none focus:border-amber-500"
                  placeholder="e.g. 1500"
                />
              </div>
              
              {completionModal.isBirthday && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-lg p-3 mb-4 text-sm flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <p>Today is the customer's birthday! A 20% discount will be automatically applied to this amount.</p>
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setCompletionModal(null)} className="flex-1 bg-zinc-800 text-white font-bold py-3 rounded-lg hover:bg-zinc-700">Cancel</button>
                <button type="submit" className="flex-1 bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600">Complete</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full relative">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><XCircle className="text-red-500"/> Cancel Booking</h3>
            <p className="text-zinc-400 mb-4">Please select a reason for cancellation:</p>
            <select 
               value={cancelReason} 
               onChange={(e) => setCancelReason(e.target.value)}
               className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white mb-6 outline-none focus:border-red-500"
            >
               <option value="Customer requested">Customer requested</option>
               <option value="Time unavailable">Time unavailable</option>
               <option value="Salon unavailable">Salon unavailable</option>
               <option value="Duplicate">Duplicate</option>
               <option value="Other">Other</option>
            </select>
            <div className="flex gap-3">
               <button onClick={() => setCancelModal(null)} className="flex-1 bg-zinc-800 text-white font-bold py-3 rounded-lg hover:bg-zinc-700">Go Back</button>
               <button onClick={handleCancelBooking} className="flex-1 bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600">Confirm Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full relative">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Clock className="text-amber-500"/> Reschedule Booking</h3>
            <form onSubmit={handleAdminReschedule}>
              <div className="mb-4">
                 <label className="block text-sm text-zinc-400 mb-1">New Date</label>
                 <input required type="date" value={rescheduleModal.newDate} onChange={(e) => setRescheduleModal({...rescheduleModal, newDate: e.target.value})} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none" />
              </div>
              <div className="mb-6">
                 <label className="block text-sm text-zinc-400 mb-1">New Time</label>
                 <input required type="time" value={rescheduleModal.newTime} onChange={(e) => setRescheduleModal({...rescheduleModal, newTime: e.target.value})} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none" />
              </div>
              <div className="mb-6">
                 <label className="block text-sm text-zinc-400 mb-1">Admin Note / Message (Optional)</label>
                 <textarea value={rescheduleModal.adminNote || ''} onChange={(e) => setRescheduleModal({...rescheduleModal, adminNote: e.target.value})} placeholder="e.g., Sorry, 4:00 PM is full. Can we do 4:15 PM?" className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none min-h-[80px]" />
                 {/* Quick Availability Check */}
                 {bookings.filter(b => b.id !== rescheduleModal.booking.id && b.date === rescheduleModal.newDate && b.time === rescheduleModal.newTime && !['cancelled', 'completed', 'no show'].includes(b.status?.toLowerCase())).length > 0 ? (
                    <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertTriangle size={12}/> Time slot has conflicts!</p>
                 ) : (
                    <p className="text-green-500 text-xs mt-2 flex items-center gap-1"><CheckCircle size={12}/> Time slot available</p>
                 )}
              </div>
              <div className="flex gap-3">
                 <button type="button" onClick={() => setRescheduleModal(null)} className="flex-1 bg-zinc-800 text-white font-bold py-3 rounded-lg hover:bg-zinc-700">Cancel</button>
                 <button type="submit" className="flex-1 bg-amber-500 text-black font-bold py-3 rounded-lg hover:bg-amber-400">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
         <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col justify-center items-center text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Today</p>
            <p className="text-3xl font-serif text-white font-bold">{stats.today}</p>
         </div>
         <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col justify-center items-center text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Pending</p>
            <p className="text-3xl font-serif text-yellow-500 font-bold">{stats.pending}</p>
         </div>
         <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col justify-center items-center text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Confirmed</p>
            <p className="text-3xl font-serif text-blue-500 font-bold">{stats.confirmed}</p>
         </div>
         <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col justify-center items-center text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Completed</p>
            <p className="text-3xl font-serif text-green-500 font-bold">{stats.completed}</p>
         </div>
         <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col justify-center items-center text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Cancelled</p>
            <p className="text-3xl font-serif text-red-500 font-bold">{stats.cancelled}</p>
         </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
         <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Calendar className="text-amber-500"/> Booking Management</h2>
          
          <div className="flex gap-4 w-full md:w-auto">
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 whitespace-nowrap"
            >
              + Log Service
            </button>

            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-amber-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no show">No Show</option>
            </select>
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search bookings..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>


        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-max text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="p-3 font-semibold text-sm">Date & Time</th>
                <th className="p-3 font-semibold text-sm">Customer</th>
                <th className="p-3 font-semibold text-sm">Service</th>
                <th className="p-3 font-semibold text-sm">Payment</th>
                <th className="p-3 font-semibold text-sm text-center">Status</th>
                <th className="p-3 font-semibold text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredBookings.map(b => {
                const conflicts = getConflicts(b);
                const hasConflict = conflicts.length > 0;
                
                return (
                <tr key={b.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="p-3 relative">
                    <p className="text-white font-medium">{b.date}</p>
                    <p className="text-xs text-zinc-500 flex items-center gap-1"><Clock size={12}/> {b.time}</p>
                    {hasConflict && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 w-max">
                        <AlertTriangle size={10} /> ⚠️ Time Conflict
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <p className="text-white font-medium flex items-center gap-2">
                       {b.customerName}
                       <button onClick={() => setDetailsModal(b)} className="text-zinc-500 hover:text-amber-500"><Info size={14}/></button>
                    </p>
                    <div className="flex items-center gap-2 text-zinc-500 text-xs">
                       <p>{b.phone}</p>
                       <a href={`tel:${b.phone}`} className="text-green-500 hover:text-green-400"><Phone size={12}/></a>
                    </div>
                  </td>
                  <td className="p-3">
                    <p className="text-zinc-300 text-sm font-medium">{b.serviceName || 'Custom Service'}</p>
                    <div className="mt-1 flex flex-col gap-0.5 text-[10px] font-mono">
                       <span className="text-zinc-400">Total: ₹{b.amount || 0}</span>
                       {b.discountApplied > 0 && <span className="text-amber-500">Reward Disc: -₹{b.discountApplied}</span>}
                       {b.isBirthdayDiscount && <span className="text-amber-500 font-bold">Bday Disc: 20% OFF</span>}
                       <span className="text-white font-bold text-xs">Collect: ₹{b.status === 'completed' ? (b.amountPaid || 0) : Math.max(0, (parseFloat(b.amount || '0') || 0) - (b.discountApplied || 0))}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 text-sm text-zinc-400">
                      <CreditCard size={14}/> {b.paymentMethod || 'Cash'}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getStatusColor(b.status)}`}>
                      {b.status || 'Pending'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end items-center gap-2">
                      <button 
                        onClick={() => setRescheduleModal({ booking: b, newDate: b.date, newTime: b.time })}
                        className="p-1.5 bg-black border border-zinc-800 text-zinc-400 hover:text-amber-500 rounded outline-none"
                        title="Reschedule"
                      >
                        <Edit2 size={14} />
                      </button>
                      <select 
                        value={b.status || 'pending'}
                        onChange={(e) => handleCustomStatusChange(b, e.target.value)}
                        className="bg-black border border-zinc-800 text-xs text-white rounded p-1 outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirm</option>
                        <option value="in progress">In Progress</option>
                        <option value="awaiting_confirmation">Awaiting Conf.</option>
                        <option value="completed">Complete</option>
                        <option value="cancelled">Cancel</option>
                        <option value="no show">No Show</option>
                      </select>
                    </div>
                  </td>
                </tr>
              )})}
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">No bookings found.</td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
        
        {/* Mobile Cards */}
        <div className="md:hidden space-y-4 mt-4">
           {filteredBookings.length === 0 ? (
              <p className="p-8 text-center text-zinc-500 border border-zinc-800 rounded-lg">No bookings found.</p>
           ) : (
              filteredBookings.map(b => {
                 const conflicts = getConflicts(b);
                 const hasConflict = conflicts.length > 0;
                 return (
                    <div key={b.id} className="bg-black border border-zinc-800 rounded-lg p-4 space-y-3">
                       <div className="flex justify-between items-start">
                          <div>
                             <p className="text-white font-medium text-lg">{b.customerName}</p>
                             <p className="text-zinc-400 text-sm">{b.serviceName || 'Custom Service'}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getStatusColor(b.status)}`}>{b.status || 'Pending'}</span>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1.5 text-zinc-300">
                             <Calendar size={14} className="text-amber-500" /> {b.date}
                          </div>
                          <div className="flex items-center gap-1.5 text-zinc-300">
                             <Clock size={14} className="text-amber-500" /> {b.time}
                          </div>
                       </div>
                       
                       {hasConflict && (
                          <div className="flex items-center gap-1 text-[10px] text-red-500 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                             <AlertTriangle size={12} /> ⚠️ Time Conflict Detected
                          </div>
                       )}
                       
                       <div className="flex justify-between items-center pt-2 border-t border-zinc-800/50">
                          <div className="flex items-center gap-3">
                             <button onClick={() => setDetailsModal(b)} className="text-zinc-400 hover:text-white flex items-center gap-1 text-xs"><Info size={14}/> Details</button>
                             <a href={`tel:${b.phone}`} className="text-green-500 hover:text-green-400 flex items-center gap-1 text-xs"><Phone size={14}/> Call</a>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             <button onClick={() => setRescheduleModal({ booking: b, newDate: b.date, newTime: b.time, adminNote: '' })} className="text-zinc-400 hover:text-amber-500 p-1"><Edit2 size={16}/></button>
                             <select 
                               value={b.status || 'pending'}
                               onChange={(e) => handleCustomStatusChange(b, e.target.value)}
                               className="bg-zinc-900 border border-zinc-700 text-xs text-white rounded p-1 outline-none"
                             >
                               <option value="pending">Pending</option>
                               <option value="confirmed">Confirm</option>
                               <option value="in progress">In Progress</option>
                               <option value="awaiting_confirmation">Awaiting Conf.</option>
                               <option value="completed">Complete</option>
                               <option value="cancelled">Cancel</option>
                               <option value="no show">No Show</option>
                             </select>
                          </div>
                       </div>
                    </div>
                 );
              })
           )}
        </div>


         </div>
         <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
             <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4"><Clock className="text-amber-500"/> Today's Schedule</h3>
             <div className="space-y-4">
                 {todaysSchedule.length === 0 ? (
                    <p className="text-zinc-500 text-sm">No more appointments today.</p>
                 ) : (
                    todaysSchedule.map(b => (
                       <div key={'today-'+b.id} className="bg-black border border-zinc-800 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-1">
                             <span className="text-amber-500 font-medium text-sm">{b.time}</span>
                             <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${getStatusColor(b.status)}`}>{b.status}</span>
                          </div>
                          <p className="text-white text-sm font-medium">{b.customerName}</p>
                          <p className="text-zinc-500 text-xs truncate">{b.serviceName}</p>
                       </div>
                    ))
                 )}
             </div>
         </div>
      </div>

    </div>
  );
}
