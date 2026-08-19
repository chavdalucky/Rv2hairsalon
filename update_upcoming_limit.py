import re

with open('src/components/UpcomingAppointment.tsx', 'r') as f:
    content = f.read()

old_block = """        // Fetch all recent bookings and filter/sort client-side for the latest upcoming active one
        const q = query(
          collection(db, 'bookings'),
          where('userId', '==', user.uid)
        );"""

new_block = """        // Fetch all recent bookings and filter/sort client-side for the latest upcoming active one
        const q = query(
          collection(db, 'bookings'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(20)
        );"""

content = content.replace(old_block, new_block)

with open('src/components/UpcomingAppointment.tsx', 'w') as f:
    f.write(content)
print("Updated UpcomingAppointment limit")
