import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace("<MyAppointments userId={user?.uid || ''} />", "<MyAppointments userId={user?.uid || ''} userPhone={userProfile?.phone || formData.phone} userEmail={user?.email || formData.email} />")

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)
