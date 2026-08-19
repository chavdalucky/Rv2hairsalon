import re
with open('src/components/MyAppointments.tsx', 'r') as f:
    content = f.read()

# Add deleteData state
state_code = """  const [rescheduleData, setRescheduleData] = useState<{ id: string, date: string, time: string } | null>(null);
  const [cancelData, setCancelData] = useState<{ id: string, serviceName: string } | null>(null);
  const [deleteData, setDeleteData] = useState<{ id: string } | null>(null);"""
content = re.sub(r"  const \[rescheduleData, setRescheduleData\].*\n  const \[cancelData, setCancelData\].*", state_code, content)

# Change handleDelete
delete_func = """  const handleDelete = async () => {
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
  };"""
content = re.sub(r"  const handleDelete = async \(bookingId: string\) => \{[\s\S]*?triggerHaptic\('heavy'\);\n    \}\n  \};", delete_func, content)

# Change onClick in handleDelete
content = content.replace("onClick={() => handleDelete(booking.id)}", "onClick={() => setDeleteData({ id: booking.id })}")

# Update statuses array
content = content.replace("const statuses = ['all', 'upcoming', 'confirmed', 'completed', 'cancelled'];", "const statuses = ['all', 'upcoming', 'confirmed', 'completed', 'cancelled', 'expired'];")

# Add expired modal logic
delete_modal = """
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
              <h3 className="text-xl font-serif text-white mb-2">Delete Booking History?</h3>
              <p className="text-zinc-400 mb-6">
                Are you sure you want to delete this booking history? This action cannot be undone.
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
"""
content = content.replace("          {/* Cancel Modal */}", delete_modal + "\n          {/* Cancel Modal */}")

# Add lowercase handling in status checking
content = content.replace("a.status !== statusFilter", "(a.status || '').toLowerCase() !== statusFilter")
content = content.replace("a.status !== 'pending' && a.status !== 'confirmed'", "(a.status || '').toLowerCase() !== 'pending' && (a.status || '').toLowerCase() !== 'confirmed'")
content = content.replace("a.status !== 'cancelled' && a.status !== 'no show'", "(a.status || '').toLowerCase() !== 'cancelled' && (a.status || '').toLowerCase() !== 'no show'")


with open('src/components/MyAppointments.tsx', 'w') as f:
    f.write(content)

