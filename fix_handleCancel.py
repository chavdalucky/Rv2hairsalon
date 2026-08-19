import re
with open('src/components/MyAppointments.tsx', 'r') as f:
    content = f.read()

handle_cancel_code = """
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
"""

content = content.replace("  const handleReschedule = async (e: React.FormEvent) => {", handle_cancel_code + "\n  const handleReschedule = async (e: React.FormEvent) => {")

with open('src/components/MyAppointments.tsx', 'w') as f:
    f.write(content)
