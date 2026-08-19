import re

with open('src/components/AppointmentForm.tsx', 'r') as f:
    content = f.read()

old_func = """  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'submitting' || status === 'success') return;
    
    if (!validate()) return;

    setStatus('submitting');
    try {
      await addDoc(collection(db, 'bookings'), {
        customerName: formData.name,
        phone: formData.phone,
        date: formData.date,
        time: formData.time,
        serviceName: formData.service,
        notes: formData.notes,
        status: 'Pending',
        createdAt: serverTimestamp(),
        paymentMethod: 'Cash',
        amount: 'TBD'
      });

      await createAdminNotification(
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
    } catch (error) {
      console.error('Error submitting appointment:', error);
      toast('Unable to submit your appointment right now. Please try again.');
      setStatus('idle');
    }
  };"""

new_func = """  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'submitting' || status === 'success') return;
    
    if (!validate()) return;

    setStatus('submitting');
    
    const message = `Hello! I want to book an appointment at RV 2 Luxe Salon.
Name: ${formData.name}
Phone: ${formData.phone}
Service: ${formData.service}
Date: ${formData.date}
Time: ${formData.time}
Notes: ${formData.notes || 'None'}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/918000068138?text=${encodedMessage}`, '_blank');

    try {
      await addDoc(collection(db, 'bookings'), {
        customerName: formData.name,
        phone: formData.phone,
        date: formData.date,
        time: formData.time,
        serviceName: formData.service,
        notes: formData.notes,
        status: 'Pending',
        createdAt: serverTimestamp(),
        paymentMethod: 'Cash',
        amount: 'TBD'
      });

      await createAdminNotification(
        'New Appointment Request',
        `${formData.name} requested ${formData.service} on ${formData.date} at ${formData.time}`
      );

      setStatus('success');
      
      if (onSuccess) {
         setTimeout(() => onSuccess(), 1500);
      } else if (onCancel) {
         setTimeout(() => onCancel(), 1500);
      }
    } catch (error) {
      console.error('Error submitting appointment:', error);
      toast('Unable to submit your appointment right now. Please try again.');
      setStatus('idle');
    }
  };"""

content = content.replace(old_func, new_func)

with open('src/components/AppointmentForm.tsx', 'w') as f:
    f.write(content)
