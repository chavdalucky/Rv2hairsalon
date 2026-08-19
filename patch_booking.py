with open('src/components/BookingModal.tsx', 'r') as f:
    content = f.read()

import_stmt = "import { createAdminNotification } from '../utils/notifications';\n"
if "createAdminNotification" not in content:
    content = content.replace("import { auth, db } from '../../firebase';", "import { auth, db } from '../../firebase';\n" + import_stmt)

trigger = """        try {
          await fetch('/api/notifications/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking: { id: docRef.id, ...bookingData }, type: 'confirmation' })
          });
        } catch (e) {
          console.error(e);
        }
"""
if "createAdminNotification(" not in content:
    new_trigger = trigger + "        createAdminNotification('New Booking Received', `New booking for ${selectedService.name} on ${selectedDate} at ${selectedTime}.`);\n"
    content = content.replace(trigger, new_trigger)
else:
    print("Already added to BookingModal.tsx")

with open('src/components/BookingModal.tsx', 'w') as f:
    f.write(content)
