import { triggerHaptic } from '../utils/haptics';
import { trackEvent } from '../utils/analytics';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';
import { Scissors, Sparkles, Droplet, UserCheck, MessageCircle } from 'lucide-react';
import PremiumHeart from '../components/PremiumHeart';
import ToastNotification from '../components/ToastNotification';
import LoginPopup from '../components/LoginPopup';
import { getImageForService } from '../utils/images';
import { collection, query, orderBy, onSnapshot, setDoc, deleteDoc, doc, where } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { createAdminNotification } from '../utils/notifications';
import { toast } from '../lib/toast';
import BookingModal from '../components/BookingModal';

const defaultServiceCategories = [
  {
    id: "hair",
    title: "Hair Services (Hair Care)",
    icon: <Scissors className="w-8 h-8 text-amber-500" />,
    items: [
      { name: "Haircut & Styling", desc: "Classic, Fade, Layered, Blow-Dry, Temporary Styling", price: "₹99" },
      { name: "Beard Grooming", desc: "Beard Trim, Shape-Up, Hot Towel Shave", price: "₹70" },
      { name: "Clean Shave", desc: "Precision clean shave with pre-shave oil", price: "₹50" },
      { name: "Styling Beard", desc: "Advanced beard styling and contouring", price: "₹70" },
      { name: "Hair Treatments", desc: "Hair Spa, Keratin Treatment, Smoothening, Deep Conditioning", price: "₹500" },
      { name: "Hair Mask", desc: "Deep nourishing protein hair mask", price: "₹500" },
      { name: "Hair Coloring", desc: "Global Coloring, Highlights, Balayage, Root Touch-Ups", price: "Ask for price" },
      { name: "Hair Straightening", desc: "Permanent hair straightening and rebonding", price: "₹1200 - ₹1500" },
    ]
  },
  {
    id: "skin",
    title: "Skin & Facial Services",
    icon: <Sparkles className="w-8 h-8 text-amber-500" />,
    items: [
      { name: "Premium Facials", desc: "Classic Clean-Up, Fruit Facial, Gold/Diamond Facial, Anti-Tan Treatments", price: "~₹1000" },
      { name: "De-Tan & Bleach", desc: "Face, Neck, and Body De-Tan Services", price: "₹300" },
      { name: "Face Mask", desc: "Rejuvenating and cleansing application", price: "₹150" },
      { name: "Skin Glow Treatments", desc: "Hydra Facial, Chemical Peels with Expert Guidance, Skin Brightening", price: "Ask for price" },
    ]
  },
  {
    id: "body",
    title: "Body & Spa Services",
    icon: <Droplet className="w-8 h-8 text-amber-500" />,
    items: [
      { name: "Massage Therapy", desc: "Head Massage, Back Massage, Full Body Relaxing Massage", price: "₹500" },
      { name: "Body Scrub & Polishing", desc: "Exfoliation and deep moisturizer application", price: "Ask for price" },
      { name: "Manicure & Pedicure", desc: "Classic, Spa, Gel Manicure/Pedicure", price: "Ask for price" },
    ]
  },
  {
    id: "grooming",
    title: "Grooming & Aesthetics",
    icon: <UserCheck className="w-8 h-8 text-amber-500" />,
    items: [
      { name: "Threading & Waxing", desc: "Eyebrow Shaping, Full Body Waxing – Normal, Rica, Bean Wax", price: "₹150 - ₹500" },
      { name: "Nail Art", desc: "Nail Extensions, Gel Polish, Creative Nail Designs", price: "Ask for price" },
    ]
  }
];

const iconMap: Record<string, any> = {
  'Scissors': <Scissors className="w-8 h-8 text-amber-500" />,
  'Sparkles': <Sparkles className="w-8 h-8 text-amber-500" />,
  'Droplet': <Droplet className="w-8 h-8 text-amber-500" />,
  'UserCheck': <UserCheck className="w-8 h-8 text-amber-500" />,
  'default': <Scissors className="w-8 h-8 text-amber-500" />
};

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

export default function Services() {
  const { t } = useLanguage();
  const location = useLocation();
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [toastConfig, setToastConfig] = useState<{message: string, visible: boolean, type: 'add' | 'remove'}>({message: '', visible: false, type: 'add'});
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const showToast = (message: string, type: 'add' | 'remove') => {
    setToastConfig({ message, visible: true, type });
    setTimeout(() => {
      setToastConfig(prev => ({ ...prev, visible: false }));
    }, 2500);
  };

    useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('redeem') === 'true') {
      setBookingModalOpen(true);
      toast('Your ₹100 discount coupon is active and ready for your next booking!');
      // clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location]);

  useEffect(() => {
    let unsubFav: any;
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        unsubFav = onSnapshot(query(collection(db, 'favorites'), where('userId', '==', user.uid)), (snap) => {
          const userFavs = snap.docs.map(d => d.data().serviceId);
          setFavorites(new Set(userFavs));
        });
      } else {
        setFavorites(new Set());
      }
    });

    return () => {
      unsubAuth();
      if (unsubFav) unsubFav();
    };
  }, []);

  const toggleFavorite = async (item: any, category: any, e: any) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setShowLoginPopup(true);
      return;
    }

    const serviceId = item.id;
    try {
      const favId = `${auth.currentUser.uid}_${serviceId}`;
      if (favorites.has(serviceId)) {
        // Optimistic UI update
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(serviceId);
          return newSet;
        });
        showToast("Removed from Favourites", 'remove');
        await deleteDoc(doc(db, 'favorites', favId));
        createAdminNotification('Customer Activity', `A customer removed a service from their favourites.`);
      } else {
        // Optimistic UI update
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.add(serviceId);
          return newSet;
        });
        showToast("Added to Favourites", 'add');
        await setDoc(doc(db, 'favorites', favId), {
          userId: auth.currentUser.uid,
          serviceId: serviceId,
          serviceName: item.name,
          category: category.title,
          description: item.desc,
          price: item.price,
          imageUrl: getImageForService(item.name, category.id),
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error(err);
      toast("An error occurred.");
    }
  };


  useEffect(() => {
    const unsubCat = onSnapshot(query(collection(db, 'categories'), orderBy('order')), (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    const unsubSrv = onSnapshot(collection(db, 'services'), (snap) => {
      setServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error(error));

    return () => {
      unsubCat();
      unsubSrv();
    };
  }, []);

  const displayCategories = categories.length > 0 ? categories.map(cat => ({
    id: cat.id,
    title: cat.title,
    icon: iconMap[cat.iconName] || iconMap.default,
    items: services.filter(s => s.categoryId === cat.id).map(s => ({
      id: s.id,
      name: s.name,
      desc: s.desc,
      price: s.price
    }))
  })).filter(cat => cat.items.length > 0) : defaultServiceCategories.map(cat => ({
    ...cat,
    items: cat.items.map(item => ({
      ...item,
      id: `${cat.id}-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    }))
  }));


  return (
    <div className="pt-20">
      {/* Header */}
      <section className="relative py-32 bg-zinc-950 overflow-hidden border-b border-zinc-800">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/80 z-10"></div>
          <motion.img 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            src="https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80&w=2000" 
            alt="Salon Services" 
            className="w-full h-full object-cover grayscale opacity-40"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-10">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 drop-shadow-lg"
          >
            {t("services.menu.title")}
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
            className="text-xl md:text-2xl text-zinc-300 max-w-2xl mx-auto font-light leading-relaxed"
          >
            Explore our comprehensive range of premium hair, skin, and grooming services.
          </motion.p>
        </div>
      </section>

      {/* Services List */}
      <section className="py-32 bg-zinc-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {loading ? (
             <div className="text-center text-amber-500 py-12 animate-pulse font-serif text-xl tracking-widest">Loading latest services...</div>
          ) : (
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 lg:grid-cols-2 gap-16"
            >
              {displayCategories.map((category, catIdx) => (
                <motion.div 
                  key={category.id}
                  variants={fadeUpVariant}
                  className="bg-zinc-900 border border-zinc-800/50 rounded-xl p-8 md:p-12 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(245,158,11,0.15)] hover:border-amber-500/30 active:scale-[0.98] active:shadow-inner group"
                >
                  <div className="flex items-center gap-6 mb-10 pb-8 border-b border-zinc-800/50 group-hover:border-amber-500/20 transition-colors duration-500">
                    <div className="bg-black p-5 rounded-full border border-zinc-800 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)] group-hover:border-amber-500/50 group-hover:shadow-[inset_0_0_20px_rgba(245,158,11,0.2)] transition-all duration-500">
                      {category.icon}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-wide">{category.title}</h2>
                  </div>
                  
                  <ul className="space-y-8">
                    {category.items.map((item: any, itemIdx: number) => (
                      <li key={itemIdx} className="group/item">
                        <div className="flex justify-between items-baseline mb-2">
                          <div className="flex items-center gap-3 z-10">
                            <h3 className="text-xl font-bold text-white group-hover/item:text-amber-400 transition-colors duration-300">{item.name}</h3>

                            <PremiumHeart 
                              isFavorite={favorites.has(item.id)} 
                              onClick={(e) => toggleFavorite(item, category, e)} 
                            />

                          </div>
                          <div className="flex-1 mx-4 border-b border-dashed border-zinc-700/50 group-hover/item:border-amber-500/30 transition-colors relative top-[-6px]"></div>
                          <span className="text-amber-500 font-serif font-bold text-xl whitespace-nowrap">{item.price}</span>
                        </div>
                        <p className="text-zinc-400 max-w-[85%] leading-relaxed font-light">{item.desc}</p>
                        <button onClick={(e) => { e.preventDefault(); setSelectedServiceForBooking(item.name); setBookingModalOpen(true); }} className="text-xs text-amber-500 font-bold uppercase tracking-widest transition-all duration-300 hover:text-white active:scale-95 mt-3 inline-block">Book Now</button>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-12 pt-8 border-t border-zinc-800/50 group-hover:border-amber-500/20 transition-colors duration-500">
                    <button 
                      onClick={(e) => {
                          e.preventDefault();
                          setSelectedServiceForBooking('');
                          setBookingModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-3 w-full py-5 bg-transparent border border-zinc-700 text-white font-bold uppercase tracking-widest text-sm rounded transition-all duration-300 hover:border-amber-500 hover:bg-amber-500 hover:text-black md:hover:scale-[1.02] active:scale-[0.98] overflow-hidden relative group/btn"
                    >
                       <span className="relative z-10 flex items-center gap-2">{t("services.book")} {category.title.split(' ')[0]}</span>
                       <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-out"></div>
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
      
      {/* Loyalty Rewards */}
      <section className="pb-24 bg-zinc-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="bg-black border border-amber-500/30 rounded-2xl p-10 md:p-16 shadow-[0_20px_40px_rgba(245,158,11,0.05)] relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-amber-500/15 transition-colors duration-1000"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-amber-500/10 transition-colors duration-1000"></div>
            
            <div className="relative z-10 flex flex-col xl:flex-row gap-12 items-center">
              <div className="xl:w-1/3 text-center xl:text-left">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 border border-amber-500/30 mb-6">
                  <Sparkles className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">Loyalty <span className="text-amber-500">Rewards</span></h2>
                <div className="w-20 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 mx-auto xl:mx-0 mb-6"></div>
                <p className="text-zinc-400 text-lg font-light leading-relaxed">
                  Elevate your grooming experience. Join our exclusive rewards program and unlock premium privileges reserved for our most distinguished clientele.
                </p>
                <div className="mt-8 flex justify-center xl:justify-start">
                  <a href="/rewards" className="inline-flex items-center gap-3 px-8 py-4 bg-amber-500 text-black font-bold uppercase tracking-widest text-sm rounded transition-all duration-300 hover:bg-amber-400 md:hover:scale-[1.03] active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                    View My Rewards <Sparkles size={18} />
                  </a>
                </div>
              </div>

              <div className="xl:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {[
                  { title: "Earn & Redeem", desc: "Earn 10 Reward Points for every ₹100 spent. 100 Points = ₹100 Discount on any service." },
                  { title: "10th Visit Free", desc: "After every 10 completed visits, enjoy one FREE Hair Spa or Head Massage." },
                  { title: "Birthday Special", desc: "Celebrate with 20% OFF on one premium service during your birthday month." },
                  { title: "VIP Privileges", desc: "Priority Booking, exclusive product discounts, and Festival Special Offers." }
                ].map((perk, idx) => (
                  <div key={idx} className="bg-zinc-900/80 p-6 rounded-xl border border-zinc-800 transition-all duration-300 hover:border-amber-500/50 hover:-translate-y-1 active:scale-[0.98] active:bg-zinc-800">
                    <h4 className="text-xl font-serif font-bold text-amber-500 mb-2">{perk.title}</h4>
                    <p className="text-zinc-300 font-light leading-relaxed">{perk.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="pb-32 bg-zinc-950">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="max-w-3xl mx-auto px-4 text-center text-zinc-500 text-sm font-light tracking-wide"
        >
          <p>* Prices are subject to change depending on hair length, density, and specific service requirements.</p>
          <p>Please consult with our experts for exact pricing on customized therapies.</p>
        </motion.div>
      </section>
      <LoginPopup isOpen={showLoginPopup} onClose={() => setShowLoginPopup(false)} />
      <ToastNotification message={toastConfig.message} visible={toastConfig.visible} type={toastConfig.type} />
    
      <BookingModal 
        isOpen={bookingModalOpen} 
        onClose={() => setBookingModalOpen(false)} 
        initialService={selectedServiceForBooking} 
      />
</div>
  );
}
