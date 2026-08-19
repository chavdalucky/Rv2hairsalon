import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Send, ChevronDown, Calendar, Clock, User, Phone, X, MessageCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, onSnapshot, getDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { createAdminNotification } from '../utils/notifications';
import { useLanguage } from '../lib/LanguageContext';
import { toast } from '../lib/toast';

interface AppointmentFormProps {
  initialService?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

const defaultServiceCategories = [
  {
    id: "hair",
    title: "Hair Services",
    items: [
      { name: "Haircut & Styling", desc: "Classic, Fade, Layered, Blow-Dry", price: "₹99" },
      { name: "Beard Grooming", desc: "Beard Trim, Shape-Up", price: "₹70" },
      { name: "Clean Shave", desc: "Precision clean shave", price: "₹50" },
      { name: "Hair Treatments", desc: "Hair Spa, Keratin Treatment", price: "₹500" },
      { name: "Hair Coloring", desc: "Global Coloring, Highlights", price: "Ask" },
      { name: "Hair Straightening", desc: "Permanent hair straightening", price: "₹1200" },
    ]
  },
  {
    id: "facial",
    title: "Skin & Facial",
    items: [
      { name: "Classic Facial", desc: "Deep cleansing and exfoliation", price: "₹299" },
      { name: "Premium HydraFacial", desc: "Advanced hydration and glow", price: "₹899" },
      { name: "De-Tan Treatment", desc: "Sun tan removal", price: "₹199" },
    ]
  },
  {
    id: "spa",
    title: "Body Spa",
    items: [
      { name: "Swedish Massage", desc: "Full body relaxation", price: "₹999" },
      { name: "Deep Tissue", desc: "Intense muscle relief", price: "₹1299" }
    ]
  }
];

export default function AppointmentForm({ initialService, onSuccess, onCancel, isModal = false }: AppointmentFormProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    time: '',
    service: initialService || '',
    stylist: t('book.anyAvailable'),
    notes: ''
  });
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward
  
  const steps = [
    { id: 1, label: t('book.serviceLabel') },
    { id: 2, label: t('book.dateTime') },
    { id: 3, label: t('book.stylist') },
    { id: 4, label: t('book.confirmation') }
  ];

  const stylists = [t('book.anyAvailable'), 'Rahul Bhai (Owner & Senior Stylist)', 'Sagar', 'Jaymit'];

  const handleNext = () => {
    // Validate current step
    const newErrors: Record<string, string> = {};
    if (step === 1 && !formData.service) newErrors.service = t('book.serviceRequired');
    if (step === 2) {
      if (!formData.date) newErrors.date = t('book.dateRequired');
      else {
        const selectedDate = new Date(formData.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) newErrors.date = t('book.pastDateError');
      }
      if (!formData.time) newErrors.time = t('book.timeRequired');
    }
    if (step === 3) {
      if (!formData.name.trim()) newErrors.name = t('book.nameRequired');
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!formData.phone.trim()) newErrors.phone = t('book.phoneRequired');
      else if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) newErrors.phone = t('book.phoneInvalid');
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


    const [usePoints, setUsePoints] = useState(false);
  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    const fetchPoints = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserPoints(userDoc.data().rewardPoints || 0);
        }
      }
    };
    fetchPoints();
  }, []);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [isServiceSelectorOpen, setIsServiceSelectorOpen] = useState(false);
  
  const [servicesData, setServicesData] = useState(defaultServiceCategories);

  useEffect(() => {
    // Try fetching from firestore
    let unsubCat: any;
    let unsubSrv: any;
    try {
        unsubCat = onSnapshot(query(collection(db, 'categories'), orderBy('order')), (catSnap) => {
          unsubSrv = onSnapshot(collection(db, 'services'), (srvSnap) => {
             const categories = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
             const services = srvSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
             
             if (categories.length > 0) {
                 const formatted = categories.map((cat: any) => ({
                    id: cat.id,
                    title: cat.title,
                    items: services.filter((s: any) => s.categoryId === cat.id).map((s: any) => ({
                        name: s.name, desc: s.desc, price: s.price
                    }))
                 })).filter(c => c.items.length > 0);
                 if (formatted.length > 0) setServicesData(formatted);
             }
          });
        });
    } catch (e) {
        console.error("Error loading services for form", e);
    }
    
    return () => {
        if (unsubCat) unsubCat();
        if (unsubSrv) unsubSrv();
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    if (errors[e.target.id]) {
      setErrors(prev => ({ ...prev, [e.target.id]: '' }));
    }
  };

    const validate = () => {
    // validation is handled per-step in handleNext, but for final submit we check all
    return true; 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'submitting' || status === 'success') return;
    
    if (!validate()) return;

    setStatus('submitting');
    
    const message = `Hello! I want to book an appointment at RV 2 Luxe Salon.
Name: ${formData.name}
Phone: ${formData.phone}
Service: ${formData.service}\nStylist: ${formData.stylist}
Date: ${formData.date}
Time: ${formData.time}
Notes: ${formData.notes || 'None'}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/918000068138?text=${encodedMessage}`, '_blank');

    try {
      const discountApplied = usePoints && userPoints >= 100;
      await addDoc(collection(db, 'bookings'), {
        customerName: formData.name,
        phone: formData.phone,
        date: formData.date,
        time: formData.time,
        serviceName: formData.service,
        stylist: formData.stylist,
        notes: formData.notes,
        status: 'Pending',
        createdAt: serverTimestamp(),
        paymentMethod: 'Cash',
        amount: 'TBD',
        discountApplied: discountApplied ? 100 : 0,
        pointsUsed: discountApplied ? 100 : 0,

        userId: auth.currentUser ? auth.currentUser.uid : null,
        email: auth.currentUser ? auth.currentUser.email : null,
        activityHistory: [{
           action: 'Booking Created',
           date: new Date().toISOString(),
           note: 'Submitted via web form'
        }]
      });


      if (discountApplied && auth.currentUser) {
         await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            rewardPoints: increment(-100),
            lockedPoints: increment(100)
         });
      }

      await createAdminNotification(
        'New Appointment Request',
        `${formData.name} requested ${formData.service} on ${formData.date} at ${formData.time}`
      );

      setStatus('success');
    } catch (error) {
      console.error('Error submitting appointment:', error);
      toast('Unable to submit your appointment right now. Please try again.');
      setStatus('idle');
    }
  };

  const openWhatsApp = () => {
    const message = `Hello RV 2 Luxe Salon,

I would like to request an appointment.

Name: ${formData.name}
Phone: ${formData.phone}
Service: ${formData.service}\nStylist: ${formData.stylist}
Date: ${formData.date}
Time: ${formData.time}
Notes: ${formData.notes || 'None'}

Booking Status: Appointment Request Submitted

Please confirm my appointment.

Thank you.`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/918000068138?text=${encodedMessage}`, '_blank');
    if (onSuccess) onSuccess();
  };

  if (status === 'success') {
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
  }

  return (
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
                  <label className="block text-sm font-medium text-zinc-400 mb-2">{t('book.selectStylist')}</label>
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
                  <h4 className="text-amber-500 font-serif font-bold text-lg mb-2">{t('book.reviewDetails')}</h4>
                  <div className="flex justify-between items-center border-b border-zinc-800/50 pb-3">
                    <span className="text-zinc-500 text-sm">{t('book.serviceLabel')}</span>
                    <span className="text-white font-medium text-sm">{formData.service}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-zinc-800/50 pb-3">
                    <span className="text-zinc-500 text-sm">{t('book.dateTime')}</span>
                    <span className="text-white font-medium text-sm">{formData.date} at {formData.time}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-zinc-800/50 pb-3">
                    <span className="text-zinc-500 text-sm">{t('book.stylist')}</span>
                    <span className="text-white font-medium text-sm">{formData.stylist}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 text-sm">{t('book.client')}</span>
                    <span className="text-white font-medium text-sm">{formData.name} ({formData.phone})</span>
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="notes" className="block text-sm font-medium text-zinc-400 mb-2">{t('book.notes')}</label>
                  <textarea 
                    id="notes" 
                    value={formData.notes}
                    onChange={handleChange}
                    rows={2}
                    className="w-full bg-black/50 border border-zinc-800 rounded-lg px-5 py-4 text-white focus:outline-none focus:border-amber-500 transition-all resize-none"
                    placeholder={t('book.notesPlaceholder')}
                  />
                </div>

                {userPoints >= 100 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-center justify-between">
                    <div>
                       <p className="text-white font-medium text-sm">{t('book.usePointsTitle')}</p>
                       <p className="text-amber-500 text-xs">{t('book.usePointsDesc').replace('{points}', userPoints.toString())}</p>
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
              {status === 'submitting' ? t('book.submitting') : t('book.confirmBooking')} 
              {status !== 'submitting' && <Send size={18} className="transform group-hover:translate-x-1 transition-transform duration-500" />}
            </span>
            {status !== 'submitting' && <div className="absolute inset-0 bg-zinc-200 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>}
          </button>
        )}
      </div>


      {/* Service Selector Bottom Sheet / Modal */}
      <AnimatePresence>
        {isServiceSelectorOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsServiceSelectorOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full sm:w-[500px] max-h-[85vh] bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl relative z-10 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                <h3 className="text-xl font-serif font-bold text-white">{t('book.selectAService')}</h3>
                <button 
                  onClick={() => setIsServiceSelectorOpen(false)}
                  className="p-2 bg-black/50 rounded-full text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="overflow-y-auto p-4 space-y-6 custom-scrollbar flex-1 pb-10">
                {servicesData.map((category) => (
                  <div key={category.id}>
                    <h4 className="text-amber-500 font-bold tracking-widest text-xs uppercase mb-3 px-2">{category.title}</h4>
                    <div className="space-y-2">
                        {category.items.map((item: any, idx: number) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                                setFormData(prev => ({ ...prev, service: item.name }));
                                setErrors(prev => ({ ...prev, service: '' }));
                                setIsServiceSelectorOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 text-left active:scale-[0.98] ${
                                formData.service === item.name 
                                ? 'bg-amber-500/10 border-amber-500/50' 
                                : 'bg-black/30 border-zinc-800 hover:border-zinc-600 hover:bg-black/50'
                            }`}
                          >
                             <div>
                               <div className={`font-medium ${formData.service === item.name ? 'text-amber-500' : 'text-white'}`}>{item.name}</div>
                               {item.desc && <div className="text-xs text-zinc-500 mt-1 line-clamp-1">{item.desc}</div>}
                             </div>
                             {formData.service === item.name && <Check size={18} className="text-amber-500" />}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
