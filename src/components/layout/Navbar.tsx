import OptimizedImage from '../OptimizedImage';
import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X, Scissors, User, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../../../firebase';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import NotificationsPanel from '../NotificationsPanel';
import ThemeToggle from '../ThemeToggle';
import LanguageSwitcher from '../LanguageSwitcher';
import { useLanguage } from '../../lib/LanguageContext';
import GlobalSearch from '../GlobalSearch';
import { triggerHaptic } from '../../utils/haptics';
import { trackEvent } from '../../utils/analytics';


  








export default function Navbar() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => {
    triggerHaptic('light');
    setIsOpen(!isOpen);
    if (!isOpen) trackEvent('Menu open');
    else trackEvent('Menu close');
  };
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const toggleNotifications = () => {
    triggerHaptic('light');
    setShowNotifications(!showNotifications);
    if (!showNotifications) trackEvent('Notification opened');
  };

  const navLinks = [
    { name: t("nav.home"), path: "/" },
    { name: t("nav.about"), path: "/about" },
    { name: t("nav.services"), path: "/services" },
    { name: t("nav.gallery"), path: "/gallery" },
    { name: t("nav.contact"), path: "/contact" },
    { name: t("nav.rewards"), path: "/rewards" },
    { name: t("nav.favourites") || "Favourites", path: "/favourites" },
    { name: "AI Studio", path: "/ai-studio" }
  ];


  

  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | undefined;
    let unsubscribeNotifications: (() => void) | undefined;
    
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        unsubscribeDoc = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          }
        });
        
        const userQ = query(
          collection(db, 'notifications'), 
          where('userId', '==', user.uid),
          where('read', '==', false)
        );
        unsubscribeNotifications = onSnapshot(userQ, (snapshot) => {
          let count = 0;
          const now = Date.now();
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (!data.timestamp || data.timestamp.toMillis() <= now) {
              count++;
            }
          });
          setUnreadCount(count);
        });

      } else {
        setUserProfile(null);
        setUnreadCount(0);
        if (unsubscribeDoc) unsubscribeDoc();
        if (unsubscribeNotifications) unsubscribeNotifications();
      }
    });
    
    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
      if (unsubscribeNotifications) unsubscribeNotifications();
    };
  }, []);

  const fetchUnreadCount = async (userId: string) => {
    // Deprecated, handled by onSnapshot now
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-in-out ${isScrolled ? 'bg-black/70 backdrop-blur-xl border-b border-zinc-800/50 py-2 shadow-2xl shadow-black/50' : 'bg-transparent border-b border-transparent py-4'}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500 text-black group-hover:bg-amber-400 transition-colors">
                <Scissors size={20} />
              </div>
              <span className="font-serif text-2xl font-bold tracking-wider text-white">RV 2</span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-6">
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className={({ isActive }) =>
                    `relative px-3 py-2 text-sm font-serif tracking-widest uppercase transition-all duration-300 group ${
                      isActive
                        ? 'luxury-gold-gradient animate-luxury-shimmer text-luxury-gold drop-shadow-md'
                        : 'text-zinc-300 hover:text-amber-200'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="relative z-10">{link.name}</span>
                      <span className={`absolute bottom-0 left-0 w-full h-px transition-all duration-300 ${isActive ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]' : 'bg-transparent group-hover:bg-amber-500/50 scale-x-0 group-hover:scale-x-100'}`}></span>
                    </>
                  )}
                </NavLink>
              ))}
              
              <GlobalSearch />
              <LanguageSwitcher />
              <ThemeToggle />
              
              {currentUser && (
                <div className="relative">
                  <button
                    onClick={toggleNotifications}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800 text-amber-500 hover:bg-zinc-700 transition-colors border border-zinc-700 hover:border-amber-500/50 ml-2"
                    title="Notifications"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border border-black">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <NotificationsPanel onClose={() => { setShowNotifications(false); triggerHaptic('light'); }} />
                  )}
                </div>
              )}
              
              {currentUser ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800 text-amber-500 hover:bg-zinc-700 transition-colors border border-zinc-700 hover:border-amber-500/50 ml-4 overflow-hidden shadow-lg"
                  title={t('nav.dashboard')}
                >
                  {userProfile?.photoURL || currentUser?.photoURL ? (
                    <OptimizedImage 
                      src={userProfile?.photoURL || currentUser?.photoURL} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={18} />
                  )}
                </button>
              ) : (
                <button
                  onClick={() => navigate('/signup')}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors border border-zinc-700 ml-4"
                  title="Sign Up"
                >
                  <User size={18} />
                </button>
              )}

              <a
                href="#" onClick={(e) => { e.preventDefault(); triggerHaptic('light'); trackEvent('Book Now button clicked'); window.dispatchEvent(new CustomEvent('open-booking-modal')); }}
                
                
                className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-serif tracking-widest uppercase font-bold text-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-luxury-shimmer transition-all relative overflow-hidden group ml-2"
              >
                <span className="relative z-10">{t('nav.bookNow')}</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </a>
            </div>
          </div>
          <div className="flex items-center justify-end md:hidden gap-1 sm:gap-2 flex-shrink-0 ml-auto pr-1 overflow-visible">
            <GlobalSearch />
            <LanguageSwitcher />
            <ThemeToggle />
            {currentUser && (
              <div className="relative">
                <button
                  onClick={toggleNotifications}
                  className="flex items-center justify-center p-2 rounded-md text-amber-500 hover:bg-zinc-800 transition-colors"
                >
                  <Bell size={24} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border border-black">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <NotificationsPanel onClose={() => { setShowNotifications(false); triggerHaptic('light'); }} />
                )}
              </div>
            )}
            <button
              onClick={toggleMenu}
              type="button"
              className="inline-flex items-center justify-center p-1 sm:p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 focus:outline-none flex-shrink-0 z-50 relative"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-6 w-6 flex-shrink-0" /> : <Menu className="block h-6 w-6 flex-shrink-0" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-zinc-950 border-b border-amber-900/30 shadow-[0_10px_40px_rgba(245,158,11,0.1)] relative"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/10 via-zinc-950 to-zinc-950 pointer-events-none"></div>

            <div className="relative z-10 max-h-[calc(100dvh-4rem)] flex flex-col">
              <div className="px-4 pt-4 pb-4 space-y-2 overflow-y-auto overscroll-contain">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <NavLink
                    to={link.path}
                    onClick={() => { setIsOpen(false); triggerHaptic('light'); }}
                    className={({ isActive }) =>
                      `group relative block px-4 py-4 overflow-hidden rounded-lg transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-900/30 to-transparent shadow-[inset_4px_0_10px_rgba(245,158,11,0.05)]'
                          : 'hover:bg-zinc-900/50'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <div className="flex items-center gap-4">
                        <span className={`w-1 h-6 rounded-full transition-all duration-300 ${isActive ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.8)]' : 'bg-transparent group-hover:bg-amber-500/30'}`}></span>
                        <span className={`text-xl font-serif tracking-widest transition-all duration-300 ${isActive ? 'luxury-gold-gradient animate-luxury-shimmer text-luxury-gold drop-shadow-md scale-105 origin-left' : 'text-zinc-400 group-hover:text-amber-200 group-hover:translate-x-1'}`}>
                          {link.name}
                        </span>
                      </div>
                    )}
                  </NavLink>
                </motion.div>
              ))}
              
              </div>
              <div className="p-4 mt-auto border-t border-zinc-900/50 bg-zinc-950 sticky bottom-0 z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.8)]">
                <div className="grid grid-cols-2 gap-4">
                {currentUser ? (
                  <button
                    onClick={() => { setIsOpen(false); navigate('/dashboard'); }}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-zinc-900/80 border border-amber-500/30 text-amber-500 hover:bg-zinc-800 transition-colors"
                  >
                    {userProfile?.photoURL || currentUser?.photoURL ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-500/50">
                        <OptimizedImage 
                          src={userProfile?.photoURL || currentUser?.photoURL} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <User size={24} />
                    )}
                    <span className="text-sm font-serif tracking-widest uppercase">Account</span>
                  </button>
                ) : (
                  <button
                    onClick={() => { setIsOpen(false); navigate('/signup'); }}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    <User size={24} />
                    <span className="text-sm font-serif tracking-widest uppercase">Sign Up</span>
                  </button>
                )}

                <a
                  href="#" onClick={(e) => { e.preventDefault(); triggerHaptic('light'); trackEvent('Book Now button clicked'); window.dispatchEvent(new CustomEvent('open-booking-modal')); }}
                  
                  
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all"
                >
                  <Scissors size={24} />
                  <span className="text-sm font-serif tracking-widest uppercase font-bold">{t('nav.bookNow')}</span>
                </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
