import OptimizedImage from '../components/OptimizedImage';

import { triggerHaptic } from '../utils/haptics';
import { trackEvent } from '../utils/analytics';
import { useLanguage } from "../lib/LanguageContext";
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useVelocity, useTransform, useSpring, useReducedMotion } from 'motion/react';
import PremiumHeart from '../components/PremiumHeart';
import { Scissors, Star, CheckCircle, ArrowRight, Phone, MessageCircle , Heart} from 'lucide-react';
import Reviews from '../components/Reviews';
import LuxuryHeading from '../components/LuxuryHeading';
import LuxuryCTA from '../components/LuxuryCTA';
import LuxuryExploreCTA from '../components/LuxuryExploreCTA';
import HomeGallery from '../components/HomeGallery';
import UpcomingAppointment from '../components/UpcomingAppointment';



// Reusable animation variants
const fadeUpVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

export default function Home() {
  const [favourites, setFavourites] = useState<Record<string, boolean>>({});

  const toggleFavourite = (itemName: string) => {
    setFavourites(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  const { t } = useLanguage();

  const { scrollY, scrollYProgress } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400
  });

  const prefersReducedMotion = useReducedMotion();

  // Cinematic parallax and soft zoom/blur for hero image
  const heroY = useTransform(scrollY, [0, 1000], [0, 150]); 
  const heroScale = useTransform(scrollY, [0, 1000], [1.0, 1.05]);
  const heroBlurRaw = useTransform(scrollY, [0, 800], [0, 0]); // Remove blur to keep it sharp as requested
  const heroImageBlur = useTransform(heroBlurRaw, (v) => prefersReducedMotion ? 'none' : `blur(${v}px)`);

  // Map absolute velocity to blur amount
  const velocityBlur = useTransform(smoothVelocity, [-1500, 0, 1500], [5, 0, 5]);
  const backdropFilterStr = useTransform(velocityBlur, (v) => 
    prefersReducedMotion ? 'none' : `blur(${v}px)`
  );

  // Dark overlay opacity increases slightly as the user scrolls
  const darkOverlayOpacity = useTransform(scrollY, [0, 800], [0, 0.8]);

  // Subtle luxury golden glow mapping
  const goldenGlowOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 0.1, 0.3]);
  const goldenGlowY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

const services = [
  {
    title: t("home.services.1.title"),
    description: t("home.services.1.desc"),
    imageUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: t("home.services.2.title"),
    description: t("home.services.2.desc"),
    imageUrl: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: t("home.services.3.title"),
    description: t("home.services.3.desc"),
    imageUrl: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&q=80&w=800",
  }
];

  return (
    <div className="pt-0">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-transparent">
        <motion.div 
          className="absolute left-0 right-0 w-full z-[-1]" 
          style={{ 
            top: '-10%', 
            height: '120%', 
            y: heroY, 
            scale: heroScale, 
            willChange: 'transform',
            transition: 'transform 0.4s ease-out'
          }}
        >
          {/* Base Image */}
          <OptimizedImage priority={true} 
            src="/Home salon photo.png" 
            alt="Luxury Salon Interior" 
            className="w-full h-full object-cover object-center md:object-[center_70%]"
          />



          {/* Luxury Golden Light/Glow Effect */}
          <motion.div 
            className="absolute inset-0 z-20 pointer-events-none mix-blend-screen"
            style={{
              opacity: goldenGlowOpacity,
              y: goldenGlowY,
              z: 0,
              willChange: 'transform, opacity',
              background: 'radial-gradient(circle at 50% 40%, rgba(245, 158, 11, 0.12) 0%, transparent 60%)'
            }}
          />

          {/* Clean subtle overlay (25% opacity) */}
          <div className="absolute inset-0 bg-black/25 z-30 pointer-events-none"></div>


        </motion.div>
        

        
        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto pt-20 flex flex-col items-center">
          <UpcomingAppointment />
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center"
          >
            <motion.div variants={fadeUpVariant} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-amber-500/30 bg-black/40 backdrop-blur-md mb-8 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <Star className="text-amber-500 fill-amber-500 w-4 h-4" />
              <span className="text-amber-500 uppercase tracking-widest text-xs font-semibold">Premium Salon Experience</span>
              <Star className="text-amber-500 fill-amber-500 w-4 h-4" />
            </motion.div>
            
            <LuxuryHeading 
              variants={fadeUpVariant} 
              className="text-5xl md:text-7xl lg:text-8xl text-white"
            />
            
            <motion.p variants={fadeUpVariant} className="mt-4 sm:mt-6 text-lg sm:text-xl md:text-2xl text-zinc-300 max-w-3xl mx-auto font-light mb-8 sm:mb-12 leading-relaxed">
              Elevate your style at RV 2 Hair Salon. Professional care, trendsetting styles, and a truly relaxing atmosphere in Prachi.
            </motion.p>
            
            <motion.div variants={fadeUpVariant} className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 relative z-30 w-full px-2 sm:px-0">
              <LuxuryCTA />
              <LuxuryExploreCTA />
            </motion.div>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="hidden md:flex absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex-col items-center gap-2"
        >
          <span className="text-zinc-500 text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-amber-500 to-transparent"></div>
        </motion.div>
      </section>

      {/* Special Offer Banner */}
      <section className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-black py-4 border-b border-amber-400">

        <div className="max-w-7xl mx-auto px-4 overflow-hidden">
          <div className="flex items-center justify-center gap-4 text-sm md:text-base font-medium">
            <span className="inline-block px-2 py-1 bg-black text-white text-xs uppercase font-bold rounded">New</span>
            <p>Experience our Premium Hair Spa & Keratin Treatment at Special Prices. <Link to="/services" className="underline font-bold">View Offers</Link></p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-32 bg-zinc-950 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-20"
          >
            <motion.h2 variants={fadeUpVariant} className="text-4xl md:text-6xl font-serif font-bold text-white mb-6">Our Signature Services</motion.h2>
            <motion.div variants={fadeUpVariant} className="w-24 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 mx-auto mb-8"></motion.div>
            <motion.p variants={fadeUpVariant} className="text-zinc-400 max-w-2xl mx-auto text-lg md:text-xl font-light">
              We offer a wide range of premium services to help you look and feel your absolute best.
            </motion.p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12"
          >
            {services.map((service, index) => (
              <motion.div 
                key={index}
                variants={fadeUpVariant}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden aspect-[4/5] rounded-xl bg-zinc-900 mb-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transform transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(245,158,11,0.2)] hover:border-amber-500/50 border border-zinc-800/50 active:scale-[0.98] active:shadow-inner active:brightness-90">
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors duration-700 z-10" />
                  <div className="absolute top-4 right-4 z-30 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-zinc-700/50 hover:bg-black/80 hover:border-red-500/50 transition-all focus:outline-none">
                    <PremiumHeart isFavorite={!!favourites[service.title]} onClick={(e) => { toggleFavourite(service.title); }} />
                  </div>
                  <OptimizedImage 
                    src={service.imageUrl} 
                    alt={service.title} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 bg-gradient-to-t from-black/95 via-black/60 to-transparent">
                    <h3 className="text-2xl font-serif text-white mb-3 tracking-wide">{service.title}</h3>
                    <div className="overflow-hidden">
                      <p className="text-zinc-300 transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 font-light leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-center mt-16"
          >
            <Link to="/services" className="group inline-flex items-center gap-3 text-amber-500 hover:text-amber-400 font-bold text-sm uppercase tracking-widest transition-colors">
              {t("home.explore.categories")} <ArrowRight size={18} className="transform group-hover:translate-x-2 transition-transform duration-500" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Gallery Section */}
      <HomeGallery />

      {/* Why Choose Us */}
      <section className="py-32 bg-zinc-900 border-y border-zinc-800 relative overflow-hidden">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.h2 variants={fadeUpVariant} className="text-4xl md:text-6xl font-serif font-bold text-white mb-8">{t("home.why.title")}</motion.h2>
              <motion.p variants={fadeUpVariant} className="text-zinc-400 text-lg md:text-xl mb-10 font-light leading-relaxed">
                {t("home.why.desc")}
              </motion.p>
              
              <div className="space-y-6">
                {[
                  t("home.why.list.1"),
                  t("home.why.list.2"),
                  t("home.why.list.3"),
                  t("home.why.list.4"),
                  t("home.why.list.5")
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeUpVariant} className="flex items-center gap-5 group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-500 group-hover:border-amber-500 transition-all duration-500">
                      <CheckCircle className="text-amber-500 group-hover:text-black transition-colors duration-500" size={20} />
                    </div>
                    <span className="text-zinc-200 text-lg font-light tracking-wide">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-xl transform translate-x-6 translate-y-6 -z-10 group-hover:translate-x-8 group-hover:translate-y-8 transition-transform duration-700"></div>
              <div className="overflow-hidden rounded-xl shadow-2xl relative border border-zinc-700/50">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-700 z-10"></div>
                <OptimizedImage 
                  src="https://images.unsplash.com/photo-1521590832167-7bfc17484d20?auto=format&fit=crop&q=80&w=1000" 
                  alt="Salon Professional tools" 
                  className="w-full h-auto object-cover transform transition-transform duration-1000 group-hover:scale-105"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Reviews Component */}
      <Reviews />

      {/* CTA Section */}
      <section className="relative py-32 bg-black overflow-hidden border-t border-zinc-800">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1622288371302-5407dcbf4dbf?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90"></div>
        
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="relative z-10 max-w-4xl mx-auto px-4 text-center"
        >
          <motion.h2 variants={fadeUpVariant} className="text-4xl md:text-6xl font-serif font-bold text-white mb-6">{t("home.cta.title")}</motion.h2>
          <motion.div variants={fadeUpVariant} className="w-24 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 mx-auto mb-8"></motion.div>
          <motion.p variants={fadeUpVariant} className="text-xl text-zinc-300 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            {t("home.cta.desc")}
          </motion.p>
          <motion.div variants={fadeUpVariant} className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full px-2 sm:px-0">
               <a 
                href="#" onClick={(e) => { e.preventDefault(); triggerHaptic('light'); trackEvent('Book Now button clicked'); window.dispatchEvent(new CustomEvent('open-booking-modal')); }} 
                 
                
                className="group relative w-[90vw] max-w-[320px] sm:max-w-none sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-amber-500 text-black font-bold uppercase tracking-widest text-xs sm:text-sm rounded transition-all duration-300 md:hover:scale-[1.03] active:scale-95 md:hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-center justify-center gap-3 overflow-hidden mx-auto"
              >
                <span className="relative z-10 flex items-center justify-center gap-2 w-full text-center whitespace-nowrap flex-nowrap">{t("home.cta.whatsapp")} <MessageCircle size={18} /></span>
                <div className="absolute inset-0 bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              </a>
              <a 
                href="tel:08000068138" onClick={(e) => {     triggerHaptic('light');     trackEvent('Call button clicked');   }} 
                className="group relative w-[90vw] max-w-[320px] sm:max-w-none sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-white text-black font-bold uppercase tracking-widest text-xs sm:text-sm rounded transition-all duration-300 md:hover:scale-[1.03] active:scale-95 md:hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] flex items-center justify-center gap-3 overflow-hidden mx-auto"
              >
                <span className="relative z-10 flex items-center justify-center gap-2 w-full text-center whitespace-nowrap flex-nowrap">{t("home.cta.call")} <Phone size={18} /></span>
                <div className="absolute inset-0 bg-zinc-200 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
              </a>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
