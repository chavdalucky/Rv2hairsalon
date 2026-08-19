import re

with open("src/components/AppointmentForm.tsx", "r") as f:
    content = f.read()

# Add step state
state_insertion = """  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward
  
  const steps = [
    { id: 1, label: 'Service' },
    { id: 2, label: 'Date & Time' },
    { id: 3, label: 'Stylist' },
    { id: 4, label: 'Confirmation' }
  ];

  const stylists = ["Any Available", "Alex", "Sam", "Jordan", "Taylor"];

  const handleNext = () => {
    // Validate current step
    const newErrors: Record<string, string> = {};
    if (step === 1 && !formData.service) newErrors.service = 'Please select a service';
    if (step === 2) {
      if (!formData.date) newErrors.date = 'Date is required';
      else {
        const selectedDate = new Date(formData.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) newErrors.date = 'Past dates are not allowed';
      }
      if (!formData.time) newErrors.time = 'Time is required';
    }
    if (step === 3) {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
      else if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) newErrors.phone = 'Valid 10-digit number required';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setDirection(1);
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setDirection(-1);
    setStep(prev => prev - 1);
  };
"""

content = content.replace("const [formData, setFormData] = useState({\n    name: '',\n    phone: '',\n    date: '',\n    time: '',\n    service: initialService || '',\n    notes: ''\n  });", "const [formData, setFormData] = useState({\n    name: '',\n    phone: '',\n    date: '',\n    time: '',\n    service: initialService || '',\n    stylist: 'Any Available',\n    notes: ''\n  });\n" + state_insertion)

# Replace the validate function so it validates everything if we jump, or we can just leave it for the final submit
validate_replacement = """  const validate = () => {
    // validation is handled per-step in handleNext, but for final submit we check all
    return true; 
  };"""

content = re.sub(r"const validate = \(\) => \{.*?return true;\n  \};", validate_replacement, content, flags=re.DOTALL)

# Add Stylist to booking message
content = content.replace("Service: ${formData.service}", "Service: ${formData.service}\\nStylist: ${formData.stylist}")
content = content.replace("serviceName: formData.service,", "serviceName: formData.service,\n        stylist: formData.stylist,")

# Replace form rendering
form_render = """
    <div className="relative">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-zinc-800 rounded-full z-0"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-amber-500 rounded-full z-0 transition-all duration-500"
            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
          ></div>
          
          {steps.map((s, i) => (
            <div key={s.id} className="relative z-10 flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                step > s.id 
                  ? 'bg-amber-500 border-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]' 
                  : step === s.id 
                    ? 'bg-zinc-900 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                    : 'bg-zinc-900 border-zinc-700 text-zinc-500'
              }`}>
                {step > s.id ? <Check size={14} /> : s.id}
              </div>
              <span className={`absolute top-10 whitespace-nowrap text-[10px] sm:text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                step >= s.id ? 'text-amber-500' : 'text-zinc-600'
              }`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 overflow-hidden relative" style={{ minHeight: '350px' }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full"
          >
            {step === 1 && (
              <div className="space-y-4">
                <div className="group relative">
                  <label id="service-label" className="block text-sm font-medium text-zinc-400 mb-2">{t("contact.form.service")}</label>
                  <button
                    type="button"
                    id="service"
                    aria-labelledby="service-label"
                    onClick={() => setIsServiceSelectorOpen(true)}
                    className={`w-full bg-black/50 border ${errors.service ? 'border-red-500' : 'border-zinc-800'} rounded-lg px-5 py-4 text-left focus:outline-none focus:border-amber-500 transition-all flex justify-between items-center hover:bg-black/70`}
                  >
                    <span className={formData.service ? 'text-white font-medium' : 'text-zinc-500'}>
                        {formData.service || t("contact.form.selectService")}
                    </span>
                    <ChevronDown size={18} className="text-zinc-500" />
                  </button>
                  {errors.service && <p className="text-red-500 text-xs mt-1">{errors.service}</p>}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="group">
                  <label htmlFor="date" className="block text-sm font-medium text-zinc-400 mb-2">{t("contact.form.date")}</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      id="date" 
                      value={formData.date}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full bg-black/50 border ${errors.date ? 'border-red-500' : 'border-zinc-800'} rounded-lg px-4 py-4 text-white focus:outline-none focus:border-amber-500 transition-all [color-scheme:dark]`}
                    />
                  </div>
                  {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                </div>
                <div className="group">
                  <label htmlFor="time" className="block text-sm font-medium text-zinc-400 mb-2">{t("contact.form.time")}</label>
                  <div className="relative">
                    <input 
                      type="time" 
                      id="time" 
                      value={formData.time}
                      onChange={handleChange}
                      className={`w-full bg-black/50 border ${errors.time ? 'border-red-500' : 'border-zinc-800'} rounded-lg px-4 py-4 text-white focus:outline-none focus:border-amber-500 transition-all [color-scheme:dark]`}
                    />
                  </div>
                  {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="group">
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Select Stylist</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {stylists.map(stylist => (
                      <button
                        key={stylist}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, stylist }))}
                        className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                          formData.stylist === stylist
                            ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                            : 'bg-black/30 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                        }`}
                      >
                        {stylist}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="group">
                    <label htmlFor="name" className="block text-sm font-medium text-zinc-400 mb-2">{t('contact.form.name')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                          <User size={18} />
                      </div>
                      <input 
                        type="text" 
                        id="name" 
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full bg-black/50 border ${errors.name ? 'border-red-500' : 'border-zinc-800'} rounded-lg pl-11 pr-5 py-4 text-white focus:outline-none focus:border-amber-500 transition-all`}
                        placeholder={t("contact.form.namePlaceholder")}
                      />
                    </div>
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  
                  <div className="group">
                    <label htmlFor="phone" className="block text-sm font-medium text-zinc-400 mb-2">{t('contact.info.phone')}</label>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                          <Phone size={18} />
                      </div>
                      <input 
                        type="tel" 
                        id="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`w-full bg-black/50 border ${errors.phone ? 'border-red-500' : 'border-zinc-800'} rounded-lg pl-11 pr-5 py-4 text-white focus:outline-none focus:border-amber-500 transition-all`}
                        placeholder={t("contact.form.phonePlaceholder")}
                      />
                    </div>
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="bg-black/30 border border-zinc-800 rounded-xl p-6 space-y-4">
                  <h4 className="text-amber-500 font-serif font-bold text-lg mb-2">Review Details</h4>
                  <div className="flex justify-between items-center border-b border-zinc-800/50 pb-3">
                    <span className="text-zinc-500 text-sm">Service</span>
                    <span className="text-white font-medium text-sm">{formData.service}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-zinc-800/50 pb-3">
                    <span className="text-zinc-500 text-sm">Date & Time</span>
                    <span className="text-white font-medium text-sm">{formData.date} at {formData.time}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-zinc-800/50 pb-3">
                    <span className="text-zinc-500 text-sm">Stylist</span>
                    <span className="text-white font-medium text-sm">{formData.stylist}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 text-sm">Client</span>
                    <span className="text-white font-medium text-sm">{formData.name} ({formData.phone})</span>
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="notes" className="block text-sm font-medium text-zinc-400 mb-2">Additional Notes (Optional)</label>
                  <textarea 
                    id="notes" 
                    value={formData.notes}
                    onChange={handleChange}
                    rows={2}
                    className="w-full bg-black/50 border border-zinc-800 rounded-lg px-5 py-4 text-white focus:outline-none focus:border-amber-500 transition-all resize-none"
                    placeholder="Any special requests?"
                  />
                </div>

                {userPoints >= 100 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-center justify-between">
                    <div>
                       <p className="text-white font-medium text-sm">Use 100 Points for ₹100 Discount</p>
                       <p className="text-amber-500 text-xs">You have {userPoints} points available.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} />
                      <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex gap-4 mt-8">
        {step > 1 && (
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-4 rounded-lg border border-zinc-700 bg-zinc-900 text-white font-bold uppercase tracking-widest text-sm hover:bg-zinc-800 transition-colors"
          >
            Back
          </button>
        )}
        
        {step < 4 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-4 bg-amber-500 text-black font-bold uppercase tracking-widest text-sm rounded-lg hover:bg-amber-400 transition-colors"
          >
            Next Step
          </button>
        ) : (
          <button 
            type="button" 
            onClick={handleSubmit}
            disabled={status === 'submitting'}
            className="group relative flex-1 py-4 bg-white text-black font-bold uppercase tracking-widest text-sm rounded-lg flex items-center justify-center gap-3 transition-all duration-300 md:hover:scale-[1.02] active:scale-[0.98] overflow-hidden disabled:opacity-70 disabled:hover:scale-100 disabled:active:scale-100 disabled:cursor-not-allowed"
          >
            <span className="relative z-10 flex items-center gap-2">
              {status === 'submitting' ? 'SUBMITTING...' : 'CONFIRM BOOKING'} 
              {status !== 'submitting' && <Send size={18} className="transform group-hover:translate-x-1 transition-transform duration-500" />}
            </span>
            {status !== 'submitting' && <div className="absolute inset-0 bg-zinc-200 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>}
          </button>
        )}
      </div>
"""

old_render_regex = r'<form className="space-y-6" onSubmit=\{handleSubmit\}>.*?</form>'
content = re.sub(old_render_regex, form_render, content, flags=re.DOTALL)

with open("src/components/AppointmentForm.tsx", "w") as f:
    f.write(content)
