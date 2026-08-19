import { triggerHaptic } from '../utils/haptics';
import { trackEvent } from '../utils/analytics';
import { motion } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';
import { MapPin, Phone, Clock, MessageCircle, Send, Mail } from 'lucide-react';
import LocationMap from '../components/LocationMap';
import AppointmentForm from '../components/AppointmentForm';

// Reusable animation variants
const fadeUpVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

export default function Contact() {
  const { t } = useLanguage();
  return (
    <div className="pt-20">
      <section className="relative py-32 bg-zinc-900 overflow-hidden border-b border-zinc-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-10">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 drop-shadow-lg"
          >
            Get In Touch
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-24 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 mx-auto mb-8"
          ></motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed"
          >
            Book an appointment, ask a question, or simply say hello. We are here for you.
          </motion.p>
        </div>
      </section>

      <section className="py-32 bg-zinc-950 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            
            {/* Contact Information */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="space-y-12"
            >
              <div>
                <motion.h2 variants={fadeUpVariant} className="text-4xl font-serif font-bold text-white mb-10 tracking-wide">Salon Information</motion.h2>
                <div className="space-y-10">
                  <motion.div variants={fadeUpVariant} className="flex items-start gap-6 group">
                    <div className="mt-1 w-14 h-14 bg-amber-500/10 rounded-xl border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:border-amber-500 transition-all duration-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                      <MapPin className="text-amber-500 group-hover:text-black transition-colors duration-500 w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-white text-xl font-bold mb-3 tracking-wide">Visit Us</h4>
                      <p className="text-zinc-400 leading-relaxed font-light">
                        NH 51, Prachi, <br />
                        Gujarat 362268 <br />
                        RV 2 hair saloon (Rv2 હેર સલુન)
                      </p>
                    </div>
                  </motion.div>

                  <motion.div variants={fadeUpVariant} className="flex items-start gap-6 group">
                    <div className="mt-1 w-14 h-14 bg-amber-500/10 rounded-xl border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:border-amber-500 transition-all duration-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                      <Phone className="text-amber-500 group-hover:text-black transition-colors duration-500 w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-white text-xl font-bold mb-3 tracking-wide">Call Us</h4>
                      <p className="text-zinc-400 mb-4 font-light leading-relaxed">Feel free to call us directly to book or modify your appointment.</p>
                      <a href="tel:08000068138" onClick={(e) => {     triggerHaptic('light');     trackEvent('Call button clicked');   }} className="inline-block text-2xl font-serif text-amber-500 hover:text-amber-400 transition-colors duration-300">
                        080000 68138
                      </a>
                    </div>
                  </motion.div>

                  <motion.div variants={fadeUpVariant} className="flex items-start gap-6 group">
                    <div className="mt-1 w-14 h-14 bg-amber-500/10 rounded-xl border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:border-amber-500 transition-all duration-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                      <Mail className="text-amber-500 group-hover:text-black transition-colors duration-500 w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-white text-xl font-bold mb-3 tracking-wide">Email Us</h4>
                      <p className="text-zinc-400 mb-4 font-light leading-relaxed">Drop us an email for any queries or business associations.</p>
                      <a href="mailto:Rahulrparmar307@gmail.com" className="inline-block text-xl font-serif text-amber-500 hover:text-amber-400 transition-colors duration-300">
                        Rahulrparmar307@gmail.com
                      </a>
                    </div>
                  </motion.div>

                  <motion.div variants={fadeUpVariant} className="flex items-start gap-6 group">
                    <div className="mt-1 w-14 h-14 bg-amber-500/10 rounded-xl border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:border-amber-500 transition-all duration-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                      <Clock className="text-amber-500 group-hover:text-black transition-colors duration-500 w-6 h-6" />
                    </div>
                    <div className="w-full">
                      <h4 className="text-white text-xl font-bold mb-5 tracking-wide">Opening Hours</h4>
                      <ul className="space-y-3 text-zinc-400 w-full max-w-sm font-light">
                        <li className="flex justify-between border-b border-zinc-800/50 pb-3 hover:text-amber-500 transition-colors">
                          <span>Sunday</span> <span>9:00 am - 9:00 pm</span>
                        </li>
                        <li className="flex justify-between border-b border-zinc-800/50 pb-3 hover:text-amber-500 transition-colors">
                          <span>Monday</span> <span>9:00 am - 9:00 pm</span>
                        </li>
                        <li className="flex justify-between border-b border-zinc-800/50 pb-3 hover:text-amber-500 transition-colors">
                          <span>Tuesday</span> <span>9:00 am - 9:00 pm</span>
                        </li>
                        <li className="flex justify-between border-b border-zinc-800/50 pb-3 hover:text-amber-500 transition-colors">
                          <span>Wednesday</span> <span>9:00 am - 9:00 pm</span>
                        </li>
                        <li className="flex justify-between border-b border-zinc-800/50 pb-3 hover:text-amber-500 transition-colors">
                          <span>Thursday</span> <span>9:00 am - 9:00 pm</span>
                        </li>
                        <li className="flex justify-between border-b border-zinc-800/50 pb-3 hover:text-amber-500 transition-colors">
                          <span>Friday</span> <span>9:00 am - 9:00 pm</span>
                        </li>
                        <li className="flex justify-between pb-2 text-amber-500 font-medium">
                          <span>Saturday</span> <span>Closed</span>
                        </li>
                      </ul>
                    </div>
                  </motion.div>
                </div>
              </div>

              <motion.div variants={fadeUpVariant} className="flex flex-col sm:flex-row gap-6 pt-10 border-t border-zinc-800/50">
                <a 
                  href="#" onClick={(e) => { e.preventDefault(); triggerHaptic('light'); trackEvent('Book Now button clicked'); window.dispatchEvent(new CustomEvent('open-booking-modal')); }} 
                   
                  
                  className="group relative flex-1 px-8 py-5 bg-amber-500 text-black font-bold uppercase tracking-widest text-sm rounded transition-all duration-300 md:hover:scale-[1.02] active:scale-[0.98] md:hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] flex items-center justify-center gap-3 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">{t("home.cta.whatsapp")} <MessageCircle size={18} /></span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                </a>
                 <a 
                  href="tel:08000068138" onClick={(e) => {     triggerHaptic('light');     trackEvent('Call button clicked');   }} 
                  className="group relative flex-1 px-8 py-5 bg-transparent border border-zinc-700 text-white font-bold uppercase tracking-widest text-sm rounded transition-all duration-300 md:hover:border-amber-500 md:hover:bg-zinc-900 active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2 group-hover:text-amber-500 transition-colors duration-300">{t("home.cta.call")} <Phone size={18} /></span>
                </a>
              </motion.div>
            </motion.div>

            {/* Appointment Form */}
            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 md:p-14 relative shadow-2xl"
            >
              <h3 className="text-3xl font-serif font-bold text-white mb-6 tracking-wide">{t("contact.appointment.title")}</h3>
              <p className="text-zinc-400 mb-10 font-light leading-relaxed">{t("contact.appointment.desc")}</p>
              
              <AppointmentForm />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <LocationMap />
    </div>
  );
}
