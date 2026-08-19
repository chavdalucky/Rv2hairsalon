with open('src/components/admin/BookingsAdmin.tsx', 'r') as f:
    content = f.read()

import_stmt = "import { createAdminNotification } from '../../utils/notifications';\n"
if "createAdminNotification" not in content:
    content = content.replace("import { db } from '../../../firebase';", "import { db } from '../../../firebase';\n" + import_stmt)

trigger = """      const docRef = await addDoc(collection(db, 'bookings'), bookingData);

      // Trigger notification if upcoming
      if (['pending', 'confirmed'].includes(newBooking.status)) {
        try {
          await fetch('/api/notifications/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking: { id: docRef.id, ...bookingData }, type: 'confirmation' })
          });
        } catch (e) {
          console.error('Failed to trigger notification', e);
        }
      }"""

new_trigger = """      const docRef = await addDoc(collection(db, 'bookings'), bookingData);

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
      }"""

if "createAdminNotification('New Booking Received'" not in content:
    content = content.replace(trigger, new_trigger)

update_trigger = """      if (['pending', 'confirmed'].includes(newStatus)) {
        try {
          const bookingSnap = await getDoc(doc(db, 'bookings', bookingId));
          if (bookingSnap.exists()) {
            await fetch('/api/notifications/trigger', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ booking: { id: bookingId, ...bookingSnap.data() }, type: 'confirmation' })
            });
          }
        } catch (e) {
          console.error('Failed to trigger notification', e);
        }
      }"""

new_update_trigger = """      if (['pending', 'confirmed', 'cancelled', 'completed'].includes(newStatus)) {
        try {
          const bookingSnap = await getDoc(doc(db, 'bookings', bookingId));
          if (bookingSnap.exists()) {
            const data = bookingSnap.data();
            if (['pending', 'confirmed'].includes(newStatus)) {
              await fetch('/api/notifications/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ booking: { id: bookingId, ...data }, type: 'confirmation' })
              });
            }
            createAdminNotification(`Appointment ${newStatus}`, `Booking for ${data.serviceName} was marked as ${newStatus}.`);
          }
        } catch (e) {
          console.error('Failed to trigger notification', e);
        }
      }"""

if "Appointment ${newStatus}" not in content:
    content = content.replace(update_trigger, new_update_trigger)

with open('src/components/admin/BookingsAdmin.tsx', 'w') as f:
    f.write(content)
