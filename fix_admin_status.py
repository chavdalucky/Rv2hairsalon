import re
with open('src/components/admin/BookingsAdmin.tsx', 'r') as f:
    content = f.read()

# Make sure increment is imported
if "increment" not in content:
    content = content.replace("serverTimestamp, addDoc", "serverTimestamp, addDoc, increment")
    content = content.replace("updateDoc, deleteDoc", "updateDoc, deleteDoc, increment")

handle_status_code = """
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
        updatedAt: serverTimestamp()
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
"""

content = re.sub(r"  const handleStatusChange = async \([\s\S]*?    } catch \(e\) \{\n      console\.error\(e\);\n      alert\('Error updating status'\);\n    \}\n  \};", handle_status_code, content)

with open('src/components/admin/BookingsAdmin.tsx', 'w') as f:
    f.write(content)
