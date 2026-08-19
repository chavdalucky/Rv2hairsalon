import re
with open('src/components/MyAppointments.tsx', 'r') as f:
    content = f.read()

if "deleteDoc" not in content[:300]:
    content = content.replace("serverTimestamp } from", "serverTimestamp, deleteDoc } from")
    
with open('src/components/MyAppointments.tsx', 'w') as f:
    f.write(content)

with open('src/components/admin/BookingsAdmin.tsx', 'r') as f:
    content = f.read()

if "increment" not in content[:300]:
    content = content.replace("serverTimestamp } from", "serverTimestamp, increment } from")
    content = content.replace("addDoc } from", "addDoc, increment } from")
    
with open('src/components/admin/BookingsAdmin.tsx', 'w') as f:
    f.write(content)
