import re
with open('src/components/MyAppointments.tsx', 'r') as f:
    content = f.read()

# Fix handleCancel
old_cancel = """  const handleCancel = async () => {
    if (!cancelData) return;
    try {
      await updateDoc(doc(db, 'bookings', cancelData.id), {
        status: 'cancelled',
        updatedAt: new Date()
      });
      // Optionally trigger cancellation notification if needed, omitted here for brevity

      showToast('Appointment cancelled successfully.', 'success');
      setCancelData(null);
      triggerHaptic('heavy');
    } catch (e) {
      console.error(e);
      showToast('Failed to cancel appointment.', 'error');
      triggerHaptic('heavy');
    }
  };"""

new_cancel = """  const handleCancel = async () => {
    if (!cancelData) return;
    const dataToCancel = cancelData;
    setCancelData(null); // Close modal instantly
    try {
      await updateDoc(doc(db, 'bookings', dataToCancel.id), {
        status: 'cancelled',
        updatedAt: new Date()
      });
      showToast('Appointment cancelled successfully.', 'success');
      triggerHaptic('heavy');
    } catch (e) {
      console.error(e);
      showToast('Failed to cancel appointment.', 'error');
      triggerHaptic('heavy');
    }
  };"""

content = content.replace(old_cancel, new_cancel)

# Fix handleReschedule
old_reschedule = """  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleData) return;
    try {
      await updateDoc(doc(db, 'bookings', rescheduleData.id), {
        date: rescheduleData.date,
        time: rescheduleData.time,
        status: 'pending', // Revert to pending for admin confirmation
        updatedAt: new Date()
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

      showToast('Appointment rescheduled. Awaiting confirmation.', 'success');
      setRescheduleData(null);
      triggerHaptic('heavy');
    } catch (e) {
      console.error(e);
      showToast('Failed to reschedule appointment.', 'error');
      triggerHaptic('heavy');
    }
  };"""

new_reschedule = """  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleData) return;
    const dataToReschedule = rescheduleData;
    setRescheduleData(null); // Close modal instantly
    try {
      await updateDoc(doc(db, 'bookings', dataToReschedule.id), {
        date: dataToReschedule.date,
        time: dataToReschedule.time,
        status: 'pending', // Revert to pending for admin confirmation
        updatedAt: new Date()
      });
      
      try {
        await fetch('/api/notifications/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
             booking: { 
               id: dataToReschedule.id, 
               date: dataToReschedule.date, 
               time: dataToReschedule.time,
              status: 'pending' 
             }, 
             type: 'confirmation' 
           })
        });
      } catch(e) {
        console.error(e);
      }

      showToast('Appointment rescheduled. Awaiting confirmation.', 'success');
      triggerHaptic('heavy');
    } catch (e) {
      console.error(e);
      showToast('Failed to reschedule appointment.', 'error');
      triggerHaptic('heavy');
    }
  };"""

content = content.replace(old_reschedule, new_reschedule)

with open('src/components/MyAppointments.tsx', 'w') as f:
    f.write(content)
