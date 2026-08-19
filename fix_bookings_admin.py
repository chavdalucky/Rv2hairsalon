import re
with open('src/components/admin/BookingsAdmin.tsx', 'r') as f:
    content = f.read()

# Add Phone, User, AlertTriangle to lucide-react imports if missing
if "AlertTriangle" not in content:
    content = content.replace("Edit2 } from 'lucide-react'", "Edit2, AlertTriangle, Phone, User, Info } from 'lucide-react'")

# Insert states and helper methods
state_injections = """
  const [detailsModal, setDetailsModal] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState<any>(null);
  const [rescheduleModal, setRescheduleModal] = useState<any>(null);

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
       setConfirmModal(b);
    } else {
       handleStatusChange(b.id, newStatus, b.userId, b.amount);
    }
  };

  const handleAdminReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModal) return;
    try {
      await updateDoc(doc(db, 'bookings', rescheduleModal.booking.id), {
        date: rescheduleModal.newDate,
        time: rescheduleModal.newTime,
        status: 'pending', // Re-evaluate
        updatedAt: serverTimestamp()
      });
      // Notify customer
      try {
        await fetch('/api/notifications/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking: { ...rescheduleModal.booking, date: rescheduleModal.newDate, time: rescheduleModal.newTime, status: 'pending' }, type: 'confirmation' })
        });
      } catch(e) {}
      
      setRescheduleModal(null);
    } catch(e) {
      alert("Error rescheduling");
    }
  };
"""

content = content.replace("  const [users, setUsers] = useState<any[]>([]);", "  const [users, setUsers] = useState<any[]>([]);" + state_injections)


# Modals
modals = """
      {/* Details Modal */}
      {detailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full relative">
            <h3 className="text-xl font-bold text-white mb-4">Booking Details</h3>
            <div className="space-y-3 text-sm text-zinc-300">
               <p><strong className="text-zinc-500 w-24 inline-block">ID:</strong> {detailsModal.id}</p>
               <p><strong className="text-zinc-500 w-24 inline-block">Name:</strong> {detailsModal.customerName}</p>
               <p><strong className="text-zinc-500 w-24 inline-block">Phone:</strong> {detailsModal.phone}</p>
               <p><strong className="text-zinc-500 w-24 inline-block">Service:</strong> {detailsModal.serviceName}</p>
               <p><strong className="text-zinc-500 w-24 inline-block">Date:</strong> {detailsModal.date}</p>
               <p><strong className="text-zinc-500 w-24 inline-block">Time:</strong> {detailsModal.time}</p>
               <p><strong className="text-zinc-500 w-24 inline-block">Status:</strong> {detailsModal.status}</p>
               <p><strong className="text-zinc-500 w-24 inline-block">Amount:</strong> ₹{detailsModal.amount}</p>
               <p><strong className="text-zinc-500 w-24 inline-block">Notes:</strong> {detailsModal.notes || 'None'}</p>
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
"""

content = content.replace("      <div className=\"bg-zinc-900 border border-zinc-800 rounded-xl p-6\">", modals + "\n      <div className=\"bg-zinc-900 border border-zinc-800 rounded-xl p-6\">")

# Modify Table Row
old_tr = """              {filteredBookings.map(b => (
                <tr key={b.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="p-3">
                    <p className="text-white font-medium">{b.date}</p>
                    <p className="text-xs text-zinc-500 flex items-center gap-1"><Clock size={12}/> {b.time}</p>
                  </td>
                  <td className="p-3">
                    <p className="text-white font-medium">{b.customerName}</p>
                    <p className="text-zinc-500 text-xs">{b.phone}</p>
                  </td>
                  <td className="p-3">
                    <p className="text-zinc-300 text-sm font-medium">{b.serviceName || 'Custom Service'}</p>
                    <div className="mt-1 flex flex-col gap-0.5 text-[10px] font-mono">
                       <span className="text-zinc-400">Total: ₹{b.amount || 0}</span>
                       {b.discountApplied > 0 && <span className="text-amber-500">Discount: -₹{b.discountApplied}</span>}
                       <span className="text-white font-bold text-xs">Collect: ₹{Math.max(0, (parseFloat(b.amount || '0') || 0) - (b.discountApplied || 0))}</span>
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
                    <div className="flex justify-end gap-2">
                      <select 
                        value={b.status || 'pending'}
                        onChange={(e) => handleStatusChange(b.id, e.target.value, b.userId, b.amount)}
                        className="bg-black border border-zinc-800 text-xs text-white rounded p-1 outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirm</option>
                        <option value="in progress">In Progress</option>
                        <option value="completed">Complete</option>
                        <option value="cancelled">Cancel</option>
                        <option value="no show">No Show</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}"""

new_tr = """              {filteredBookings.map(b => {
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
                       {b.discountApplied > 0 && <span className="text-amber-500">Discount: -₹{b.discountApplied}</span>}
                       <span className="text-white font-bold text-xs">Collect: ₹{Math.max(0, (parseFloat(b.amount || '0') || 0) - (b.discountApplied || 0))}</span>
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
                        <option value="completed">Complete</option>
                        <option value="cancelled">Cancel</option>
                        <option value="no show">No Show</option>
                      </select>
                    </div>
                  </td>
                </tr>
              )})}"""

content = content.replace(old_tr, new_tr)

with open('src/components/admin/BookingsAdmin.tsx', 'w') as f:
    f.write(content)
