import re

with open('src/components/admin/BookingsAdmin.tsx', 'r') as f:
    content = f.read()

# Add arrayUnion to imports if not there
if "arrayUnion" not in content:
    content = content.replace("increment } from 'firebase/firestore'", "increment, arrayUnion } from 'firebase/firestore'")

# State changes
state_changes = """
  const [cancelModal, setCancelModal] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('Customer requested');

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
"""

content = content.replace("  const getConflicts = (b: any) => {", state_changes + "\n  const getConflicts = (b: any) => {")

# Modify handleCustomStatusChange
custom_status = """  const handleCustomStatusChange = (b: any, newStatus: string) => {
    if (newStatus === 'confirmed') {
       setConfirmModal(b);
    } else if (newStatus === 'cancelled') {
       setCancelModal(b);
       setCancelReason('Customer requested');
    } else {
       handleStatusChange(b.id, newStatus, b.userId, b.amount);
    }
  };"""

content = re.sub(r"  const handleCustomStatusChange = \(b: any, newStatus: string\) => \{[\s\S]*?\};", custom_status, content)

# Modify handleAdminReschedule
admin_reschedule = """  const handleAdminReschedule = async (e: React.FormEvent) => {
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
           note: `Changed to ${rescheduleModal.newDate} at ${rescheduleModal.newTime}`
        })
      });
      // Notify customer
      try {
        await fetch('/api/notifications/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking: { ...rescheduleModal.booking, date: rescheduleModal.newDate, time: rescheduleModal.newTime, status: 'awaiting_confirmation' }, type: 'reschedule_proposed' })
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
"""

content = re.sub(r"  const handleAdminReschedule = async \(e: React\.FormEvent\) => \{[\s\S]*?  \};\n", admin_reschedule, content)

# Add activityHistory to handleStatusChange
handle_status = """      await updateDoc(doc(db, 'bookings', bookingId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        activityHistory: arrayUnion({
           action: `Status updated to ${newStatus}`,
           date: new Date().toISOString()
        })
      });"""

content = re.sub(r"      await updateDoc\(doc\(db, 'bookings', bookingId\), \{\n        status: newStatus,\n        updatedAt: serverTimestamp\(\)\n      \}\);", handle_status, content)

# Add Cancel Modal and Stats/Today UI
cancel_modal_jsx = """
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
"""

content = content.replace("      {/* Reschedule Modal */}", cancel_modal_jsx + "\n      {/* Reschedule Modal */}")


stats_ui = """
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
         <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-xl p-6">"""

content = content.replace("      <div className=\"bg-zinc-900 border border-zinc-800 rounded-xl p-6\">", stats_ui)


todays_schedule_ui = """
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
"""

content = content.replace("      </div>\n    </div>\n  );\n}", todays_schedule_ui + "\n    </div>\n  );\n}")

# Mobile responsive layout for main table
responsive_table = """
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-max text-left border-collapse">
"""
content = content.replace("        <div className=\"overflow-x-auto\">\n          <table", responsive_table)

mobile_cards = """
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
                             <button onClick={() => setRescheduleModal({ booking: b, newDate: b.date, newTime: b.time })} className="text-zinc-400 hover:text-amber-500 p-1"><Edit2 size={16}/></button>
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
"""
content = content.replace("          </table>\n        </div>", mobile_cards)

# Fix <option> tags in desktop table select
content = content.replace("<option value=\"in progress\">In Progress</option>\n                        <option value=\"completed\">Complete</option>", "<option value=\"in progress\">In Progress</option>\n                        <option value=\"awaiting_confirmation\">Awaiting Conf.</option>\n                        <option value=\"completed\">Complete</option>")


with open('src/components/admin/BookingsAdmin.tsx', 'w') as f:
    f.write(content)

