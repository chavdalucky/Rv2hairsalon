import { triggerHaptic } from '../../utils/haptics';
import { trackEvent } from '../../utils/analytics';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../lib/LanguageContext';
import { Scissors, MapPin, Phone, Instagram, Clock, Mail } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-black border-t border-zinc-800 text-zinc-400 py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2 group inline-flex">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500 text-black">
                <Scissors size={20} />
              </div>
              <span className="font-serif text-2xl font-bold tracking-wider text-white">RV 2</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              {t('footer.description')}
            </p>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/rv2_prachi?igsh=MTJ6cWFoN2xiOGdqcQ==" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all">
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-white text-lg font-semibold mb-6">{t('footer.explore')}</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/" className="hover:text-amber-500 transition-colors">{t('nav.home')}</Link></li>
              <li><Link to="/about" className="hover:text-amber-500 transition-colors">{t('nav.about')}</Link></li>
              <li><Link to="/services" className="hover:text-amber-500 transition-colors">{t('nav.services')}</Link></li>
              <li><Link to="/gallery" className="hover:text-amber-500 transition-colors">{t('nav.gallery')}</Link></li>
              <li><Link to="/contact" className="hover:text-amber-500 transition-colors">{t('nav.contact')}</Link></li>
              <li><Link to="/admin" className="hover:text-amber-500 transition-colors">{t('nav.admin')}</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="font-serif text-white text-lg font-semibold mb-6">{t('footer.contact')}</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="text-amber-500 shrink-0 mt-0.5" size={18} />
                <span>{t('footer.address')}<br/>RV 2 hair saloon<br/>Rv2 હેર સલુન</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-amber-500 shrink-0" size={18} />
                <a href="tel:08000068138" onClick={(e) => {     triggerHaptic('light');     trackEvent('Call button clicked');   }} className="hover:text-white transition-colors">080000 68138</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-amber-500 shrink-0" size={18} />
                <a href="mailto:Rahulrparmar307@gmail.com" className="hover:text-white transition-colors">Rahulrparmar307@gmail.com</a>
              </li>
            </ul>
          </div>

          {/* Working Hours */}
          <div>
            <h4 className="font-serif text-white text-lg font-semibold mb-6">{t('footer.hours')}</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between items-center pb-2 border-b border-zinc-800/50">
                <span>{t('footer.sundayFriday')}</span>
                <span className="text-white">9:00 am – 9:00 pm</span>
              </li>
              <li className="flex justify-between items-center pb-2 border-b border-zinc-800/50">
                <span>{t('footer.saturday')}</span>
                <span className="text-red-400">{t('footer.closed')}</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-zinc-800 text-center text-sm text-zinc-500">
          <p>&copy; {new Date().getFullYear()} {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
}
