import re

with open('src/components/AppointmentForm.tsx', 'r') as f:
    content = f.read()

old_wa = """  const openWhatsApp = () => {
    const message = `Hello RV 2 Luxe Salon,
I would like to request an appointment.
Name: ${formData.name}
Phone: ${formData.phone}
Service: ${formData.service}
Date: ${formData.date}
Time: ${formData.time}
Notes: ${formData.notes || 'None'}
Booking Status: Appointment Request Submitted

Please confirm my appointment.
Thank you.`;"""

new_wa = """  const openWhatsApp = () => {
    const message = `Hello! I want to book an appointment at RV 2 Luxe Salon.
Name: ${formData.name}
Phone: ${formData.phone}
Service: ${formData.service}
Date: ${formData.date}
Time: ${formData.time}
Notes: ${formData.notes || 'None'}`;"""

content = content.replace(old_wa, new_wa)

with open('src/components/AppointmentForm.tsx', 'w') as f:
    f.write(content)
