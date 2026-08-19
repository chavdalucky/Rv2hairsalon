import { triggerHaptic } from '../utils/haptics';
import { trackEvent } from '../utils/analytics';
import OptimizedImage from '../components/OptimizedImage';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';
import { Heart, Search, Filter, Calendar, Trash2 } from 'lucide-react';
import ToastNotification from '../components/ToastNotification';
import { getImageForService } from '../utils/images';
import { collection, query, onSnapshot, deleteDoc, doc, getDocs, where } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { toast } from '../lib/toast';

export default function Favourites() {
  const { t } = useLanguage();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [categories, setCategories] = useState<any[]>([]);

  const [toastConfig, setToastConfig] = useState<{message: string, visible: boolean, type: 'add' | 'remove'}>({message: '', visible: false, type: 'add'});

  const showToast = (message: string, type: 'add' | 'remove') => {
    setToastConfig({ message, visible: true, type });
    setTimeout(() => {
      setToastConfig(prev => ({ ...prev, visible: false }));
    }, 2500);
  };


  useEffect(() => {
    let unsubFav: any;
    
    const fetchServices = async (favServiceIds: Set<string>) => {
      try {
        const catSnap = await getDocs(collection(db, 'categories'));
        const cats = catSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        
        const srvSnap = await getDocs(collection(db, 'services'));
        const srvs = srvSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const catMap = new Map(cats.map(c => [c.id, c.title]));
        
        // Find default services as well if missing from Firestore
        const defaultServices: any[] = [];
        const defaultCategories: any[] = [
            { id: "hair", title: "Hair Services" },
            { id: "skin", title: "Skin & Facial" },
            { id: "body", title: "Body & Spa" },
            { id: "grooming", title: "Grooming & Aesthetics" }
        ];

        // We will just use the `favorites` to query. But wait, `defaultServiceCategories` items are hardcoded.
        // We can just rely on the stored `serviceId` which for default services was generated as `name.toLowerCase().replace(...)`.
      } catch (err) {
        console.error(err);
      }
    };

    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        unsubFav = onSnapshot(query(collection(db, 'favorites'), where('userId', '==', user.uid)), async (snap) => {
          const userFavs = snap.docs;
          
          // Fetch categories and services
          const catSnap = await getDocs(collection(db, 'categories'));
          const cats = catSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
          setCategories(cats);
          const srvSnap = await getDocs(collection(db, 'services'));
          const dbSrvs = srvSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          
          const defaultServiceCategories = [
            {
              id: "hair", title: "Hair Services (Hair Care)",
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
              id: "skin", title: "Skin & Facial Services",
              items: [
                { name: "Premium Facials", desc: "Classic Clean-Up, Fruit Facial, Gold/Diamond Facial, Anti-Tan Treatments", price: "~₹1000" },
                { name: "De-Tan & Bleach", desc: "Face, Neck, and Body De-Tan Services", price: "₹300" },
                { name: "Face Mask", desc: "Rejuvenating and cleansing application", price: "₹150" },
                { name: "Skin Glow Treatments", desc: "Hydra Facial, Chemical Peels with Expert Guidance, Skin Brightening", price: "Ask for price" },
              ]
            },
            {
              id: "body", title: "Body & Spa Services",
              items: [
                { name: "Massage Therapy", desc: "Head Massage, Back Massage, Full Body Relaxing Massage", price: "₹500" },
                { name: "Body Scrub & Polishing", desc: "Exfoliation and deep moisturizer application", price: "Ask for price" },
                { name: "Manicure & Pedicure", desc: "Classic, Spa, Gel Manicure/Pedicure", price: "Ask for price" },
              ]
            },
            {
              id: "grooming", title: "Grooming & Aesthetics",
              items: [
                { name: "Threading & Waxing", desc: "Eyebrow Shaping, Full Body Waxing – Normal, Rica, Bean Wax", price: "₹150 - ₹500" },
                { name: "Nail Art", desc: "Nail Extensions, Gel Polish, Creative Nail Designs", price: "Ask for price" },
              ]
            }
          ];

          const allServices: any[] = [...dbSrvs];
          defaultServiceCategories.forEach(cat => {
            cat.items.forEach(item => {
              allServices.push({
                id: `${cat.id}-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                name: item.name,
                desc: item.desc,
                price: item.price,
                categoryId: cat.id,
                categoryTitle: cat.title
              });
            });
          });

          const catMap = new Map(cats.map(c => [c.id, c.title]));

          const favDetails = userFavs.map(docSnap => {
            const data = docSnap.data();
            const service = allServices.find(s => s.id === data.serviceId) || {
              name: data.serviceName,
              desc: data.description,
              price: data.price,
              categoryTitle: data.category
            };
            
            const name = service.name || data.serviceName;
            const categoryId = service.categoryId || 'Other';
            
            return {
              favId: docSnap.id,
              serviceId: data.serviceId,
              ...service,
              name: name,
              desc: service.desc || data.description,
              price: service.price || data.price,
              categoryTitle: service.categoryTitle || data.category || catMap.get(categoryId) || 'Other',
              image: data.imageUrl || (name ? getImageForService(name, categoryId) : `https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80&w=800`)
            };
          }).filter(s => s.name); // only keep if found

          setFavorites(favDetails);
          setLoading(false);
        });
      } else {
        setFavorites([]);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubFav) unsubFav();
    };
  }, []);


  const removeFavorite = async (favId: string) => {
    try {
      // Optimistic UI
      setFavorites(prev => prev.filter(f => f.favId !== favId));
      showToast("Removed from Favourites", 'remove');
      await deleteDoc(doc(db, 'favorites', favId));
    } catch (error) {
      console.error(error);
      toast("Failed to remove favorite");
    }
  };


  const filteredFavorites = favorites.filter(fav => {
    const matchesSearch = fav.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          fav.desc?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || fav.categoryTitle === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const uniqueCategories = ['All', ...new Set(favorites.map(f => f.categoryTitle))];

  return (
    <div className="pt-20 min-h-screen bg-zinc-950">
      <section className="relative py-20 bg-zinc-900 border-b border-zinc-800">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif font-bold text-white mb-4"
          >
            My <span className="text-amber-500">Favourites</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 text-lg"
          >
            Your curated collection of premium services.
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-zinc-800 border-t-amber-500 rounded-full animate-spin"></div>
          </div>
        ) : !auth.currentUser ? (

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-zinc-900/40 rounded-3xl border border-zinc-800/50 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
          >
            <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-500/20 shadow-[inset_0_0_30px_rgba(245,158,11,0.1)]">
              <Heart className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-3xl font-serif font-bold text-white mb-4">Sign in to view favourites</h2>
            <p className="text-zinc-400 mb-10 max-w-md mx-auto text-lg">Please log in to save and manage your personal collection of premium services.</p>
            <a href="/signup" className="inline-flex items-center justify-center bg-amber-500 text-black font-bold py-4 px-10 rounded-full hover:bg-amber-400 transition-colors shadow-[0_10px_30px_rgba(245,158,11,0.2)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.3)]">
              Sign In to Continue
            </a>
          </motion.div>

        ) : (
          <>
            {favorites.length > 0 && (
              <div className="flex flex-col md:flex-row gap-4 mb-10">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder="Search favourites..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-3 pl-12 pr-4 text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-full py-3 pl-12 pr-10 text-white focus:outline-none focus:border-amber-500 transition-colors appearance-none md:w-64"
                  >
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}


            {filteredFavorites.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-24 bg-zinc-900/40 rounded-3xl border border-zinc-800/50 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
              >
                <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-500/20 shadow-[inset_0_0_30px_rgba(245,158,11,0.1)] relative">
                  <Heart className="w-10 h-10 text-zinc-600 absolute" />
                  <Heart className="w-10 h-10 text-amber-500 animate-pulse absolute opacity-30" />
                </div>
                <h2 className="text-3xl font-serif font-bold text-white mb-4">
                  {searchQuery ? "No matching favourites found." : "No Favourite Services Yet"}
                </h2>
                <p className="text-zinc-400 max-w-md mx-auto mb-10 text-lg">
                  {searchQuery ? "Try adjusting your filters or search term." : "Browse services and tap the heart to save your favourites."}
                </p>
                <a href="/services" className="inline-flex items-center justify-center gap-3 bg-amber-500 text-black font-bold py-4 px-10 rounded-full hover:bg-amber-400 transition-colors shadow-[0_10px_30px_rgba(245,158,11,0.2)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.3)]">
                  <Heart className="w-5 h-5 fill-black/20 text-black" />
                  Browse Services
                </a>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredFavorites.map((fav, idx) => (
                    <motion.div
                      key={fav.favId}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group hover:border-amber-500/50 transition-colors"
                    >
                      <div className="h-48 relative overflow-hidden">
                        <OptimizedImage src={fav.image} alt={fav.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent opacity-80"></div>
                        <div className="absolute bottom-4 left-4">
                          <span className="bg-black/60 backdrop-blur-sm text-amber-500 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            {fav.categoryTitle}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold text-white">{fav.name}</h3>
                          <span className="text-amber-500 font-serif font-bold text-lg whitespace-nowrap ml-4">{fav.price}</span>
                        </div>
                        <p className="text-zinc-400 text-sm mb-6 line-clamp-2 min-h-[40px]">{fav.desc}</p>
                        
                        <div className="flex items-center gap-3">
                          <button 
                            className="flex-1 bg-amber-500 text-black font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors"
                            onClick={() => { triggerHaptic('light'); trackEvent('Book Now button clicked'); window.dispatchEvent(new CustomEvent('open-booking-modal')); }}
                          >
                            <Calendar size={18} />
                            Book Now
                          </button>
                          <button 
                            onClick={() => removeFavorite(fav.favId)}
                            className="w-12 h-12 flex items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 transition-colors"
                            title="Remove from favourites"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
      <ToastNotification message={toastConfig.message} visible={toastConfig.visible} type={toastConfig.type} />
    </div>
  );
}
