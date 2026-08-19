import re

with open('src/components/AppointmentForm.tsx', 'r') as f:
    content = f.read()

# 1. Update handleSubmit to not auto-close
old_submit = """      setStatus('success');
      
      if (onSuccess) {
         setTimeout(() => onSuccess(), 1500);
      } else if (onCancel) {
         setTimeout(() => onCancel(), 1500);
      }
    } catch (error) {"""
new_submit = """      setStatus('success');
    } catch (error) {"""
content = content.replace(old_submit, new_submit)

# 2. Update the success screen
old_success = """  if (status === 'success') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center text-center p-8 space-y-6"
      >
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
          <Check className="w-10 h-10 text-green-500" />
        </div>
        <h3 className="text-3xl font-serif font-bold text-white mb-2">Appointment Request Submitted</h3>
        <p className="text-zinc-400 mb-6 font-light">Thank you, {formData.name}. Your appointment request has been received.</p>
        
        <div className="w-full bg-black/40 rounded-xl p-6 text-left border border-zinc-800 mb-8 space-y-3">
            <div className="flex justify-between"><span className="text-zinc-500">Service:</span> <span className="text-white font-medium text-right">{formData.service}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Date:</span> <span className="text-white font-medium text-right">{formData.date}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Time:</span> <span className="text-white font-medium text-right">{formData.time}</span></div>
        </div>

        <div className="flex flex-col sm:flex-row w-full gap-4">
            <button
              onClick={openWhatsApp}
              className="flex-1 py-4 bg-amber-500 text-black font-bold uppercase tracking-widest text-sm rounded-lg flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors"
            >
              Continue to WhatsApp <MessageCircle size={18} />
            </button>
            {(isModal || onSuccess) && (
              <button
                onClick={onSuccess || onCancel}
                className="flex-1 py-4 bg-transparent border border-zinc-700 text-white font-bold uppercase tracking-widest text-sm rounded-lg flex items-center justify-center hover:border-amber-500 transition-colors"
              >
                Done
              </button>
            )}
        </div>
      </motion.div>
    );
  }"""

new_success = """  if (status === 'success') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center text-center p-8 space-y-6"
      >
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
          <Check className="w-10 h-10 text-green-500" />
        </div>
        <h3 className="text-3xl font-serif font-bold text-white mb-2">Booking Request Sent!</h3>
        <p className="text-zinc-400 mb-6 font-light">Thank you, {formData.name}. We have opened WhatsApp to complete your booking. Click Done to return.</p>
        
        <div className="w-full bg-black/40 rounded-xl p-6 text-left border border-zinc-800 mb-8 space-y-3">
            <div className="flex justify-between"><span className="text-zinc-500">Service:</span> <span className="text-white font-medium text-right">{formData.service}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Date:</span> <span className="text-white font-medium text-right">{formData.date}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Time:</span> <span className="text-white font-medium text-right">{formData.time}</span></div>
        </div>

        <div className="flex flex-col w-full gap-4">
            <button
              onClick={() => {
                setFormData({ name: '', phone: '', date: '', time: '', service: initialService || '', notes: '' });
                setStatus('idle');
                if (onCancel) onCancel();
                else if (onSuccess) onSuccess();
              }}
              className="w-full py-4 bg-amber-500 text-black font-bold uppercase tracking-widest text-sm rounded-lg flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors"
            >
              Done
            </button>
        </div>
      </motion.div>
    );
  }"""
content = content.replace(old_success, new_success)

# Also remove openWhatsApp since it's no longer used outside handleSubmit
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

Thank you.`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/918000068138?text=${encodedMessage}`, '_blank');
  };"""

content = content.replace(old_wa, "")

with open('src/components/AppointmentForm.tsx', 'w') as f:
    f.write(content)
