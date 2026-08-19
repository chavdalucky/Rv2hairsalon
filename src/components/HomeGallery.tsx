import { useLanguage } from '../lib/LanguageContext';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

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

export default function HomeGallery() {
  const { t } = useLanguage();
  return (
    <section className="py-32 bg-black relative overflow-hidden border-t border-zinc-800">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8"
        >
          <div className="max-w-2xl">
            <motion.h2 variants={fadeUpVariant} className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">{t("home.gallery.title")}</motion.h2>
            <motion.div variants={fadeUpVariant} className="w-24 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 mb-6"></motion.div>
            <motion.p variants={fadeUpVariant} className="text-zinc-400 text-lg font-light">
              {t("home.gallery.desc")}
            </motion.p>
          </div>
          
          <motion.div variants={fadeUpVariant}>
            <Link to="/gallery" className="group inline-flex items-center gap-3 text-amber-500 hover:text-amber-400 font-bold text-sm uppercase tracking-widest transition-all duration-300 active:scale-95 whitespace-nowrap">
              {t("gallery.viewFull")} <ArrowRight size={18} className="transform group-hover:translate-x-2 transition-transform duration-500" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
