import re
with open('server/notifications.ts', 'r') as f:
    content = f.read()

# Make sure we can create an in-app notification.
# The cron is running on the backend, so we need to addDoc to 'notifications' collection in Firestore.

in_app_notification_code = """
        if (shouldUpdate) {
          await updateDoc(doc(serverDb!, 'bookings', booking.id), { remindersSent });
          // Also create an in-app notification
          try {
             if (booking.userId) {
                await addDoc(collection(serverDb!, 'notifications'), {
                   userId: booking.userId,
                   title: 'Appointment Reminder',
                   body: `You have an appointment for ${booking.serviceName || 'a service'} on ${booking.date} at ${booking.time}.`,
                   type: 'Announcement',
                   read: false,
                   timestamp: Timestamp.now()
                });
             }
          } catch(e) {
             console.error('Failed to create in-app notification', e);
          }
        }
"""

content = re.sub(r"        if \(shouldUpdate\) \{\n          await updateDoc\(doc\(serverDb!, 'bookings', booking.id\), \{ remindersSent \}\);\n        \}", in_app_notification_code, content)

with open('server/notifications.ts', 'w') as f:
    f.write(content)

