import re

with open('src/components/AppointmentForm.tsx', 'r') as f:
    content = f.read()

# I will move openWhatsApp definition above handleSubmit, or just rewrite it inside or below and call it.
old_submit = """      await createAdminNotification(
        'New Appointment Request',
        `${formData.name} requested ${formData.service} on ${formData.date} at ${formData.time}`
      );

      setStatus('success');
    } catch (error) {"""
new_submit = """      await createAdminNotification(
        'New Appointment Request',
        `${formData.name} requested ${formData.service} on ${formData.date} at ${formData.time}`
      );

      setStatus('success');
      
      const message = `Hello! I want to book an appointment at RV 2 Luxe Salon.
Name: ${formData.name}
Phone: ${formData.phone}
Service: ${formData.service}
Date: ${formData.date}
Time: ${formData.time}
Notes: ${formData.notes || 'None'}`;
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/918000068138?text=${encodedMessage}`, '_blank');
      
      // Close the modal automatically after a short delay since it opens in new tab
      if (onSuccess) {
         setTimeout(() => onSuccess(), 1500);
      }
    } catch (error) {"""

content = content.replace(old_submit, new_submit)

with open('src/components/AppointmentForm.tsx', 'w') as f:
    f.write(content)
