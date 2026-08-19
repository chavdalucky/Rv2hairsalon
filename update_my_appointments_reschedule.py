import re
with open('src/components/MyAppointments.tsx', 'r') as f:
    content = f.read()
    
# Import arrayUnion if not there
if "arrayUnion" not in content:
    content = content.replace("deleteDoc } from 'firebase/firestore'", "deleteDoc, arrayUnion } from 'firebase/firestore'")

reschedule = """  const handleReschedule = async (e: React.FormEvent) => {
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
"""

content = re.sub(r"  const handleReschedule = async \(e: React\.FormEvent\) => \{[\s\S]*?updatedAt: new Date\(\)\n      \}\);", reschedule, content)


cancel = """  const handleCancel = async () => {
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
"""

content = re.sub(r"  const handleCancel = async \(\) => \{[\s\S]*?updatedAt: new Date\(\)\n      \}\);", cancel, content)


with open('src/components/MyAppointments.tsx', 'w') as f:
    f.write(content)

