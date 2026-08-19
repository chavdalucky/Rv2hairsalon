import OptimizedImage from '../components/OptimizedImage';
import barbershopImg from '../assets/images/barbershop_interior_1786535355403.jpg';
import { motion } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';
import { Award, ShieldCheck, Heart, Sparkles, CheckCircle, ExternalLink } from 'lucide-react';

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

export default function About() {
  const { t } = useLanguage();
  return (
    <div className="pt-20">
      {/* Header */}
      <section className="relative py-32 bg-zinc-900 overflow-hidden border-b border-zinc-800">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute inset-0 opacity-30 bg-[url('/rv2_logo.png')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/80 to-transparent"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-10">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 drop-shadow-lg"
          >
            About RV 2
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
            className="text-xl md:text-2xl text-amber-500 font-medium tracking-wide"
          >
            Redefining Beauty & Grooming in Prachi
          </motion.p>
        </div>
      </section>

      {/* The Story & Mission */}
      <section className="py-32 bg-zinc-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.h2 variants={fadeUpVariant} className="text-4xl md:text-6xl font-serif font-bold text-white mb-8">Our Story</motion.h2>
              <motion.p variants={fadeUpVariant} className="text-zinc-400 text-lg md:text-xl mb-6 font-light leading-relaxed">
                Founded by <strong className="text-amber-500 font-normal">Rahul Bhai</strong>, RV 2 Hair Salon was established with a singular vision: to bring metropolitan luxury grooming and beauty therapies to Prachi. We realized there was a gap for a truly premium, hygienic, and relaxing salon experience locally, and RV 2 was born to bridge that gap.
              </motion.p>
              <motion.p variants={fadeUpVariant} className="text-zinc-400 text-lg md:text-xl mb-12 font-light leading-relaxed">
                Today, RV 2 stands as a beacon of style and sophistication, where every cut, color, and service is executed with precision and passion.
              </motion.p>
              
              <motion.h3 variants={fadeUpVariant} className="text-3xl font-serif font-bold text-white mb-6">{t('about.mission')}</motion.h3>
              <motion.p variants={fadeUpVariant} className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed">
                To empower our clients to feel their absolute best through trendsetting styles, healthy beauty approaches, and a transformative, affordable modern salon experience.
              </motion.p>
            </motion.div>
            
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-6">
                <motion.div variants={fadeUpVariant} className="overflow-hidden rounded-xl shadow-2xl relative group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10"></div>
                  <OptimizedImage 
                    src="https://images.unsplash.com/photo-1520338661084-68039505870b?auto=format&fit=crop&q=80&w=800" 
                    alt="Stylist working" 
                    className="w-full aspect-[4/5] object-cover transform transition-transform duration-1000 group-hover:scale-110"
                  />
                </motion.div>
                <motion.div variants={fadeUpVariant} className="overflow-hidden rounded-xl shadow-2xl relative group mt-12">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10"></div>
                  <OptimizedImage 
                    src={barbershopImg} 
                    alt="Barbershop interior" 
                    className="w-full aspect-[4/5] object-cover transform transition-transform duration-1000 group-hover:scale-110"
                  />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Customers Choose Us */}
      <section className="py-32 bg-zinc-900 border-y border-zinc-800 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-20"
          >
            <motion.h2 variants={fadeUpVariant} className="text-4xl md:text-6xl font-serif font-bold text-white mb-6">{t("about.why")}</motion.h2>
            <motion.div variants={fadeUpVariant} className="w-24 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 mx-auto"></motion.div>
          </motion.div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              {
                icon: <Award size={36} />,
                title: t("about.why.1.title"),
                desc: t("about.why.1.desc")
              },
              {
                icon: <ShieldCheck size={36} />,
                title: t("about.why.2.title"),
                desc: t("about.why.2.desc")
              },
              {
                icon: <Sparkles size={36} />,
                title: t("about.why.3.title"),
                desc: t("about.why.3.desc")
              },
              {
                icon: <Heart size={36} />,
                title: t("about.why.4.title"),
                desc: t("about.why.4.desc")
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                variants={fadeUpVariant}
                className="bg-zinc-950 p-10 rounded-xl border border-zinc-800/50 text-center hover:border-amber-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(245,158,11,0.05)] group"
              >
                <div className="text-amber-500 flex justify-center mb-8 transform group-hover:scale-110 transition-transform duration-500">{feature.icon}</div>
                <h3 className="text-2xl font-serif font-bold text-white mb-4 tracking-wide">{feature.title}</h3>
                <p className="text-zinc-400 font-light leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="mt-20 bg-black p-10 md:p-16 rounded-2xl border border-zinc-800 grid md:grid-cols-2 gap-12 items-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none"></div>
            <motion.div variants={fadeUpVariant} className="relative z-10">
              <h3 className="text-3xl font-serif font-bold text-white mb-6">{t("about.trend.title")}</h3>
              <p className="text-zinc-400 text-lg mb-8 font-light leading-relaxed">
                {t("about.trend.desc")}
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-4 text-zinc-300 font-light">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <CheckCircle className="text-amber-500 w-4 h-4" />
                  </div>
                  {t("about.trend.1")}
                </li>
                <li className="flex items-center gap-4 text-zinc-300 font-light">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <CheckCircle className="text-amber-500 w-4 h-4" />
                  </div>
                  {t("about.trend.2")}
                </li>
              </ul>
            </motion.div>
            <motion.div variants={fadeUpVariant} className="relative z-10">
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-[1px] shadow-2xl transform transition-transform duration-500 hover:scale-[1.02]">
                <div className="bg-zinc-900 rounded-xl p-10 text-center h-full flex flex-col justify-center border border-zinc-800/50">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-3xl p-[2px] mb-6 shadow-lg transform transition-transform duration-500 hover:scale-110">
                    <div className="bg-zinc-900 w-full h-full rounded-[22px] flex items-center justify-center">
                       <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                    </div>
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-3 tracking-wide">{t("about.insta.title")}</h4>
                  <p className="text-amber-500 mb-8 font-light tracking-widest">@rv2_prachi</p>
                  <a 
                    href="https://www.instagram.com/rv2_prachi?igsh=MTJ6cWFoN2xiOGdqcQ==" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-bold uppercase tracking-widest text-sm rounded transition-all duration-500 hover:scale-[1.02] overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">{t("about.insta.btn")} <ExternalLink size={18} className="transform group-hover:translate-x-1 transition-transform duration-500" /></span>
                    <div className="absolute inset-0 bg-zinc-200 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
