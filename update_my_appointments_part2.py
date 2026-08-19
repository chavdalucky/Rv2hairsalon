import re
with open('src/components/MyAppointments.tsx', 'r') as f:
    content = f.read()

# Add Awaiting Confirmation state and actions
awaiting_conf = """
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
"""

content = content.replace("                  {booking.status === 'expired' && (", awaiting_conf + "\n                  {booking.status === 'expired' && (")


# Add status color helper
status_color_helper = """
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'pending': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'confirmed': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'awaiting_confirmation': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
    }
  };
"""

content = content.replace("  const filteredAppointments = appointments.filter(a => {", status_color_helper + "\n  const filteredAppointments = appointments.filter(a => {")

# Use status color
content = re.sub(r"<span className=\{`text-\[10px\] uppercase font-bold px-2 py-0\.5 rounded border \$\{[\s\S]*?\}`\}>", "<span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getStatusColor(booking.status)}`}>", content)


with open('src/components/MyAppointments.tsx', 'w') as f:
    f.write(content)

