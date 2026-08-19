import React, { useState, useEffect, useRef } from 'react';
import OptimizedImage from './OptimizedImage';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Plus, Star, Upload } from 'lucide-react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';

const categories = ["All", "Haircut", "Beard", "Hair Color", "Hair Spa", "Facial", "Other"];

interface Transformation {
  id: string;
  category: string;
  serviceTitle: string;
  description: string;
  beforeImage: string;
  afterImage: string;
  customerName: string;
  review: string;
  rating: number;
  featured: boolean;
  status: string;
  order?: number;
}

export default function BeforeAfterGallery() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [visibleCount, setVisibleCount] = useState(4);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [transformations, setTransformations] = useState<Transformation[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [beforeImage, setBeforeImage] = useState<string>("");
  const [afterImage, setAfterImage] = useState<string>("");
  
  const beforeFileInputRef = useRef<HTMLInputElement>(null);
  const afterFileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        setter(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const q = query(collection(db, 'transformations'), where('status', '==', 'approved'));
    const unsub = onSnapshot(q, (snapshot) => {
      // Sorting manually because we can't easily compound query with where + orderBy on different fields without composite index
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transformation));
      data.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        
        return 0;
      });
      setTransformations(data);
    });
    return () => unsub();
  }, []);

  const filteredItems = transformations.filter(t => 
    (activeCategory === "All" || t.category === activeCategory) &&
    (t.serviceTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
     t.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
     t.customerName?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const visibleItems = filteredItems.slice(0, visibleCount);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setVisibleCount(4);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    document.body.style.overflow = 'auto';
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % filteredItems.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + filteredItems.length) % filteredItems.length);
    }
  };

  const openSubmitModal = () => {
    setShowSubmitModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeSubmitModal = () => {
    setShowSubmitModal(false);
    document.body.style.overflow = 'auto';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!beforeImage || !afterImage) {
      alert("Please upload both Before and After photos.");
      return;
    }
    const form = e.currentTarget;
    
    try {
      await addDoc(collection(db, 'transformations'), {
        category: (form.elements.namedItem('category') as HTMLSelectElement).value,
        serviceTitle: (form.elements.namedItem('serviceTaken') as HTMLInputElement).value,
        beforeImage: beforeImage,
        afterImage: afterImage,
        customerName: (form.elements.namedItem('name') as HTMLInputElement).value,
        mobileNumber: (form.elements.namedItem('mobile') as HTMLInputElement).value,
        review: (form.elements.namedItem('review') as HTMLTextAreaElement).value,
        rating: parseInt((form.elements.namedItem('rating') as HTMLSelectElement).value, 10),
        status: 'pending',
        featured: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      alert('Your transformation has been submitted and is pending approval. Thank you!');
      closeSubmitModal();
      setBeforeImage("");
      setAfterImage("");
      form.reset();
    } catch (err) {
      console.error(err);
      alert('Failed to submit. Please try again.');
    }
  };

  return (
    <section className="py-24 bg-black relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-amber-500 font-bold tracking-widest uppercase text-sm block mb-4"
          >
            Client Transformations
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl text-white font-serif mb-6 tracking-wide"
          >
            Real Results
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-zinc-400 text-lg max-w-2xl mx-auto font-light mb-8"
          >
            See the amazing transformations created by our professional stylists.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            onClick={() => openSubmitModal()}
            className="px-6 py-3 bg-amber-500 text-black font-bold uppercase tracking-widest text-sm rounded hover:bg-amber-400 transition-colors inline-flex items-center gap-2"
          >
            <Plus size={18} /> Submit Your Transformation
          </motion.button>
        </div>

        {/* Search & Categories */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center md:justify-start gap-2"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-5 py-2 rounded-full text-xs md:text-sm font-medium tracking-wide transition-all duration-300 ${
                  activeCategory === category 
                    ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                    : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                {category}
              </button>
            ))}
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full md:w-auto"
          >
            <input 
              type="text"
              placeholder="Search transformations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
          </motion.div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <AnimatePresence mode="popLayout">
            {visibleItems.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                className="group relative cursor-pointer flex flex-col"
                onClick={() => openLightbox(index)}
              >
                <div className="relative rounded-t-2xl overflow-hidden bg-zinc-900 border border-zinc-800 transition-all duration-500 group-hover:border-amber-500/50 flex h-[300px] sm:h-[400px]">
                  {/* Before */}
                  <div className="w-1/2 relative h-full">
                    <OptimizedImage 
                      src={item.beforeImage} 
                      alt="Before" 
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
                    <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded text-xs font-bold text-white tracking-widest uppercase border border-zinc-700">Before</div>
                  </div>
                  
                  {/* Divider */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-black z-10 transform -translate-x-1/2 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-amber-500 border-2 border-black flex items-center justify-center z-20 shadow-lg">
                      <div className="w-0.5 h-3 bg-black mx-px transform -rotate-12"></div>
                      <div className="w-0.5 h-3 bg-black mx-px transform rotate-12"></div>
                    </div>
                  </div>

                  {/* After */}
                  <div className="w-1/2 relative h-full">
                    <OptimizedImage 
                      src={item.afterImage} 
                      alt="After" 
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute top-4 right-4 bg-amber-500 text-black px-3 py-1 rounded text-xs font-bold tracking-widest uppercase shadow-lg">After</div>
                  </div>
                </div>
                
                {/* Review / Info Block below images */}
                <div className="bg-zinc-900 border border-t-0 border-zinc-800 rounded-b-2xl p-6 transition-all duration-500 group-hover:border-amber-500/50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-amber-500 text-xs font-bold uppercase tracking-widest block mb-1">{item.category}</span>
                      <h3 className="text-white text-xl font-serif tracking-wide">{item.serviceTitle}</h3>
                    </div>
                    {item.rating && (
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} className={i < item.rating ? 'fill-amber-500 text-amber-500' : 'text-zinc-700'} />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {item.review && (
                    <p className="text-zinc-400 text-sm italic mb-2">"{item.review}"</p>
                  )}
                  {item.customerName && (
                    <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">- {item.customerName}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-20 text-zinc-500">
            No transformations found in this category.
          </div>
        )}

        {/* Load More */}
        {visibleCount < filteredItems.length && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-16"
          >
            <button 
              onClick={() => setVisibleCount(prev => prev + 4)}
              className="px-8 py-4 bg-transparent border border-zinc-700 text-white font-bold uppercase tracking-widest text-sm rounded transition-all duration-300 hover:border-amber-500 hover:bg-zinc-900 inline-flex items-center justify-center"
            >
              Load More
            </button>
          </motion.div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8"
            onClick={closeLightbox}
          >
            <button 
              onClick={closeLightbox}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors bg-zinc-900/50 rounded-full p-2 z-50"
            >
              <X size={24} />
            </button>
            <button 
              onClick={prevImage}
              className="absolute left-2 sm:left-8 text-white/50 hover:text-amber-500 transition-colors p-2 sm:p-4 hover:scale-110 z-50 bg-black/20 rounded-full"
            >
              <ChevronLeft size={36} sm:size={48} strokeWidth={1} />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-2 sm:right-8 text-white/50 hover:text-amber-500 transition-colors p-2 sm:p-4 hover:scale-110 z-50 bg-black/20 rounded-full"
            >
              <ChevronRight size={36} sm:size={48} strokeWidth={1} />
            </button>

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-6xl w-full flex flex-col sm:flex-row bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 h-[80vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-full sm:w-1/2 relative border-b sm:border-b-0 sm:border-r border-zinc-800 h-1/2 sm:h-full">
                <OptimizedImage 
                  src={filteredItems[lightboxIndex].beforeImage} 
                  alt="Before" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-4 py-2 rounded text-sm font-bold text-white tracking-widest uppercase border border-zinc-700">Before</div>
              </div>
              
              <div className="w-full sm:w-1/2 relative h-1/2 sm:h-full">
                <OptimizedImage 
                  src={filteredItems[lightboxIndex].afterImage} 
                  alt="After" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-amber-500 text-black px-4 py-2 rounded text-sm font-bold tracking-widest uppercase shadow-lg">After</div>
              </div>
              
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 sm:p-8 pt-20">
                <div className="max-w-3xl mx-auto flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                  <div>
                    <span className="text-amber-500 text-sm font-bold uppercase tracking-widest block mb-2">{filteredItems[lightboxIndex].category}</span>
                    <h3 className="text-white text-2xl sm:text-3xl font-serif tracking-wide">{filteredItems[lightboxIndex].serviceTitle}</h3>
                  </div>
                  {filteredItems[lightboxIndex].review && (
                    <div className="text-right md:max-w-md">
                      <p className="text-zinc-300 text-sm italic mb-1">"{filteredItems[lightboxIndex].review}"</p>
                      <span className="text-amber-500 text-xs font-bold uppercase tracking-widest">- {filteredItems[lightboxIndex].customerName}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="flex min-h-full items-start justify-center p-4 py-12">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-8 max-w-2xl w-full relative my-auto"
              >
              <button 
                onClick={() => closeSubmitModal()}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              >
                <X size={24} />
              </button>
              
              <div className="text-center mb-8">
                <h3 className="text-2xl text-white font-serif tracking-wide mb-2">Submit Your Transformation</h3>
                <p className="text-zinc-400 text-sm">Share your experience and get featured on our gallery!</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Full Name *</label>
                    <input name="name" required className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-white focus:outline-none focus:border-amber-500" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Mobile Number *</label>
                    <input name="mobile" required className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-white focus:outline-none focus:border-amber-500" placeholder="+91 XXXXX XXXXX" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Service Category *</label>
                    <select name="category" required className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-white focus:outline-none focus:border-amber-500">
                      <option value="">Select Category...</option>
                      <option value="Haircut">Haircut</option>
                      <option value="Beard">Beard</option>
                      <option value="Hair Color">Hair Color</option>
                      <option value="Hair Spa">Hair Spa</option>
                      <option value="Facial">Facial</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Service Taken *</label>
                    <input name="serviceTaken" required className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-white focus:outline-none focus:border-amber-500" placeholder="e.g. Classic Fade" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Before Photo *</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      ref={beforeFileInputRef}
                      onChange={(e) => handleImageUpload(e, setBeforeImage)}
                      className="hidden" 
                    />
                    <div 
                      onClick={() => beforeFileInputRef.current?.click()}
                      className="w-full bg-zinc-950 border border-zinc-800 border-dashed rounded h-32 flex flex-col items-center justify-center text-zinc-500 cursor-pointer hover:border-amber-500 hover:text-amber-500 transition-colors overflow-hidden relative"
                    >
                      {beforeImage ? (
                        <OptimizedImage src={beforeImage} alt="Before Preview" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Upload size={24} className="mb-2" />
                          <span className="text-sm">Tap to Upload</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">After Photo *</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      ref={afterFileInputRef}
                      onChange={(e) => handleImageUpload(e, setAfterImage)}
                      className="hidden" 
                    />
                    <div 
                      onClick={() => afterFileInputRef.current?.click()}
                      className="w-full bg-zinc-950 border border-zinc-800 border-dashed rounded h-32 flex flex-col items-center justify-center text-zinc-500 cursor-pointer hover:border-amber-500 hover:text-amber-500 transition-colors overflow-hidden relative"
                    >
                      {afterImage ? (
                        <OptimizedImage src={afterImage} alt="After Preview" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Upload size={24} className="mb-2" />
                          <span className="text-sm">Tap to Upload</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Your Review *</label>
                  <textarea name="review" required rows={3} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-white focus:outline-none focus:border-amber-500" placeholder="How was your experience?"></textarea>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Rating *</label>
                  <select name="rating" required className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-white focus:outline-none focus:border-amber-500">
                    <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                    <option value="4">⭐⭐⭐⭐ (4/5)</option>
                    <option value="3">⭐⭐⭐ (3/5)</option>
                    <option value="2">⭐⭐ (2/5)</option>
                    <option value="1">⭐ (1/5)</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full py-4 bg-amber-500 text-black font-bold uppercase tracking-widest rounded hover:bg-amber-400 transition-colors">
                    Submit Transformation
                  </button>
                  <p className="text-zinc-500 text-xs text-center mt-4">Note: Your submission will be reviewed by our team before appearing on the website.</p>
                </div>
              </form>
            </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
