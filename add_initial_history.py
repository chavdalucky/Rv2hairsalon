import re
with open('src/components/AppointmentForm.tsx', 'r') as f:
    content = f.read()

initial_history = """
        userId: auth.currentUser ? auth.currentUser.uid : null,
        email: auth.currentUser ? auth.currentUser.email : null,
        activityHistory: [{
           action: 'Booking Created',
           date: new Date().toISOString(),
           note: 'Submitted via web form'
        }]
      });
"""

content = re.sub(r"        userId: auth\.currentUser \? auth\.currentUser\.uid : null,\n        email: auth\.currentUser \? auth\.currentUser\.email : null\n      \}\);", initial_history, content)

with open('src/components/AppointmentForm.tsx', 'w') as f:
    f.write(content)


with open('src/components/admin/BookingsAdmin.tsx', 'r') as f:
    content = f.read()

admin_initial_history = """
        status: newBooking.status,
        notes: newBooking.notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        activityHistory: [{
           action: 'Booking Created',
           date: new Date().toISOString(),
           note: 'Created by Admin'
        }]
      };
"""

content = re.sub(r"        status: newBooking\.status,\n        notes: newBooking\.notes,\n        createdAt: serverTimestamp\(\),\n        updatedAt: serverTimestamp\(\)\n      \};", admin_initial_history, content)

with open('src/components/admin/BookingsAdmin.tsx', 'w') as f:
    f.write(content)

