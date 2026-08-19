import re
with open('server/notifications.ts', 'r') as f:
    content = f.read()

send_notif_addition = """
  // Also create an in-app notification if userId exists
  if (booking.userId) {
     try {
        let title = 'Appointment Update';
        let body = `Your appointment status has been updated.`;
        
        if (type === 'confirmation') {
           title = 'Appointment Confirmed';
           body = `Your appointment for ${booking.serviceName || 'a service'} on ${booking.date} at ${booking.time} is confirmed.`;
        } else if (type === 'reschedule_proposed') {
           title = 'Reschedule Proposed';
           body = `Admin proposed a new time for your appointment: ${booking.date} at ${booking.time}. Please confirm in your dashboard.`;
        } else if (type.startsWith('reminder')) {
           title = 'Appointment Reminder';
           body = `Reminder: You have an appointment for ${booking.serviceName || 'a service'} on ${booking.date} at ${booking.time}.`;
        }
        
        await addDoc(collection(serverDb!, 'notifications'), {
           userId: booking.userId,
           title: title,
           body: body,
           type: 'Announcement',
           read: false,
           timestamp: Timestamp.now()
        });
     } catch (e) {
        console.error('Failed to create in-app notification', e);
     }
  }

  return results;
"""

content = content.replace("  return results;\n}", send_notif_addition + "\n}")

with open('server/notifications.ts', 'w') as f:
    f.write(content)

