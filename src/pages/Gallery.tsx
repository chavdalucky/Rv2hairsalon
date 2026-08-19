import React, { useState, useEffect, useRef } from 'react';
import OptimizedImage from '../components/OptimizedImage';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';
import { triggerHaptic } from '../utils/haptics';
import { trackEvent } from '../utils/analytics';
import BeforeAfterGallery from '../components/BeforeAfterGallery';
import { useAuth } from '../lib/useAuth';
import { db } from '../../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, writeBatch } from 'firebase/firestore';
import { Pencil, Plus, Trash2, Upload, X, Save, Settings } from 'lucide-react';

import loungeImg from '../assets/images/luxury_waiting_lounge_1786785461271.jpg';
import threadingImg from '../assets/images/threading_and_waxing_1786785477051.jpg';
import beardImg from '../assets/images/styling_beard_1786785491990.jpg';
import facialImg from '../assets/images/premium_facials_1786785504252.jpg';


const defaultImages = [
  { url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=1000", title: "Haircut", category: "Hair", order: 1 },
  { url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=1000", title: "Beard Grooming", category: "Grooming", order: 2 },
  { url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1000", title: "Clean Shave", category: "Grooming", order: 3 },
  { url: beardImg, title: "Styling Beard", category: "Grooming", order: 4 },
  { url: facialImg, title: "Premium Facials", category: "Skin", order: 5 },
  { url: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&q=80&w=1000", title: "De-Tan & Bleach", category: "Skin", order: 6 },
  { url: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=1000", title: "Face Mask", category: "Skin", order: 7 },
  { url: "https://images.unsplash.com/photo-1500336624523-d727130c3328?auto=format&fit=crop&q=80&w=1000", title: "Skin Glow Treatments", category: "Skin", order: 8 },
  { url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1000", title: "Massage Therapy", category: "Body", order: 9 },
  { url: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&q=80&w=1000", title: "Body Scrub & Polishing", category: "Body", order: 10 },
  { url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=1000", title: "Manicure & Pedicure", category: "Nails", order: 11 },
  { url: threadingImg, title: "Threading & Waxing", category: "Treatment", order: 12 },
  { url: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80&w=1000", title: "Nail Art", category: "Nails", order: 13 },
  { url: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=1000", title: "Hair Wash & Spa", category: "Treatment", order: 14 },
  { url: loungeImg, title: "Luxury Waiting Lounge", category: "Interior", order: 15 },
  { url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1000", title: "Premium Tools", category: "Setup", order: 16 },
  { url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1000", title: "Salon Interior", category: "Interior", order: 17 }
];

const defaultCategories = ["Hair", "Grooming", "Skin", "Body", "Nails", "Treatment", "Interior", "Setup"];

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

export default function Gallery() {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const isAdmin = user?.email === 'chavdalucky168@gmail.com' || user?.email === 'Rahulrparmar307@gmail.com' || user?.email === 'admin@example.com';
  
  const [images, setImages] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Active Filter
  const [activeFilter, setActiveFilter] = useState<string>('All');
  
  // Admin Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [uploadDataUrl, setUploadDataUrl] = useState<string>('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  
  // Admin Category State
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [categoryMode, setCategoryMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formCatName, setFormCatName] = useState('');
  const [formCatUrl, setFormCatUrl] = useState('');
  
  const catFileInputRef = useRef<HTMLInputElement>(null);

  const [deletingCategory, setDeletingCategory] = useState<any>(null);
  const [deleteOption, setDeleteOption] = useState<'keep' | 'delete'>('keep');

  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch Images
    const qImages = query(collection(db, 'gallery'), orderBy('order', 'asc'));
    const unsubImages = onSnapshot(qImages, (snapshot) => {
      if (snapshot.empty) {
        setImages(defaultImages);
      } else {
        const fetched = snapshot.docs.map(doc => {
          const data = doc.data();
          let finalUrl = data.url;
          // Only replace if it's still using the old default Unsplash URL (or empty)
          if (data.title === "Luxury Waiting Lounge" && (!data.url || data.url.includes('1497366216548-37526070297c'))) finalUrl = loungeImg;
          if (data.title === "Threading & Waxing" && (!data.url || data.url.includes('1515377905703-c4788e51af15'))) finalUrl = threadingImg;
          if (data.title === "Styling Beard" && (!data.url || data.url.includes('1599305090598-fe179d501227'))) finalUrl = beardImg;
          if (data.title === "Premium Facials" && (!data.url || data.url.includes('1522337360788-8b13dee7a37e'))) finalUrl = facialImg;
          return { id: doc.id, ...data, url: finalUrl };
        });
        setImages(fetched);
      }
      setLoading(false);
    });

    // Fetch Categories
    const qCategories = query(collection(db, 'galleryCategories'), orderBy('createdAt', 'asc'));
    const unsubCategories = onSnapshot(qCategories, (snapshot) => {
      if (snapshot.empty) {
        setCategories(defaultCategories.map(name => ({ name })));
      } else {
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Deduplicate Categories
        const unique = [];
        const seen = new Set();
        fetched.forEach((cat: any) => {
          const lower = cat.name.toLowerCase().trim();
          if (!seen.has(lower)) {
             seen.add(lower);
             unique.push(cat);
          } else {
             // Delete duplicate
             if (cat.id) {
               deleteDoc(doc(db, 'galleryCategories', cat.id)).catch(console.error);
             }
          }
        });
        setCategories(unique);
      }
    });

    return () => {
      unsubImages();
      unsubCategories();
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
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
        
        // Base64 compression
        setUploadDataUrl(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const seedDatabaseIfEmpty = async () => {
    if (images.length === defaultImages.length && !images[0].id) {
       for (const img of defaultImages) {
         await addDoc(collection(db, 'gallery'), {
           url: img.url,
           title: img.title,
           category: img.category,
           order: img.order,
           createdAt: serverTimestamp()
         });
       }
    }
  };
  
  const seedCategoriesIfEmpty = async () => {
    if (categories.length === defaultCategories.length && !categories[0].id) {
       for (const cat of defaultCategories) {
         await addDoc(collection(db, 'galleryCategories'), {
           name: cat,
           createdAt: serverTimestamp()
         });
       }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formCategory || (!uploadDataUrl && !editItem?.url)) return;
    
    // Auto-seed on first write
    if (images.length > 0 && !images[0].id) {
       await seedDatabaseIfEmpty();
    }
    if (categories.length > 0 && !categories[0].id) {
       await seedCategoriesIfEmpty();
    }

    const payload = {
      title: formTitle,
      category: formCategory,
      updatedAt: serverTimestamp()
    } as any;
    
    if (uploadDataUrl) {
      payload.url = uploadDataUrl;
    } else if (editItem) {
      payload.url = editItem.url;
    }

    try {
      if (editItem && editItem.id) {
        await updateDoc(doc(db, 'gallery', editItem.id), payload);
      } else {
        payload.createdAt = serverTimestamp();
        payload.order = images.length + 1;
        await addDoc(collection(db, 'gallery'), payload);
      }
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Failed to save image.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this photo?")) {
      try {
        await deleteDoc(doc(db, 'gallery', id));
      } catch (err) {
        console.error(err);
        alert("Failed to delete.");
      }
    }
  };

  const handleQuickCategoryChange = async (id: string, newCategory: string) => {
    if (!id) return;
    try {
      await updateDoc(doc(db, 'gallery', id), {
        category: newCategory,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
      alert("Failed to update category");
    }
  };
  
  // Category Handlers
const handleCatImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        setFormCatUrl(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCatName.trim()) return;

    const newNameLower = formCatName.trim().toLowerCase();
    const isDuplicate = categories.some(c => c.name.toLowerCase() === newNameLower && c.id !== editingCategory?.id);
    if (isDuplicate) {
       alert("Category name already exists.");
       return;
    }


    if (categories.length > 0 && !categories[0].id) {
       await seedCategoriesIfEmpty();
    }

    const payload: any = {
      name: formCatName.trim(),
      updatedAt: serverTimestamp()
    };
    
    if (formCatUrl) {
      payload.url = formCatUrl;
    }

    try {
      if (categoryMode === 'edit' && editingCategory?.id) {
         const oldName = editingCategory.name;
         await updateDoc(doc(db, 'galleryCategories', editingCategory.id), payload);

         if (oldName !== payload.name) {
           const batch = writeBatch(db);
           const imagesToUpdate = images.filter(img => img.category === oldName && img.id);
           imagesToUpdate.forEach(img => {
             batch.update(doc(db, 'gallery', img.id), { category: payload.name });
           });
           if (imagesToUpdate.length > 0) await batch.commit();
           
           if (activeFilter === oldName) setActiveFilter(payload.name);
         }
         alert("Category updated successfully!");
      } else {
         payload.createdAt = serverTimestamp();
         await addDoc(collection(db, 'galleryCategories'), payload);
         alert("Category added successfully!");
      }
      setCategoryMode('list');
    } catch (error) {
      console.error(error);
      alert("Failed to save category");
    }
  };
  
  const handleDeleteCategory = (cat: any) => {
    setDeletingCategory(cat);
    setDeleteOption('keep');
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    
    try {
      await deleteDoc(doc(db, 'galleryCategories', deletingCategory.id));
      
      // Handle associated photos
      if (deleteOption === 'delete') {
        const batch = writeBatch(db);
        const imagesToDelete = images.filter(img => img.category === deletingCategory.name && img.id);
        imagesToDelete.forEach(img => {
          const imgRef = doc(db, 'gallery', img.id);
          batch.delete(imgRef);
        });
        if (imagesToDelete.length > 0) {
          await batch.commit();
        }
      }
      
      if (activeFilter === deletingCategory.name) {
        setActiveFilter('All');
      }
      
      setDeletingCategory(null);
    } catch (error) {
      console.error(error);
      alert("Failed to delete category");
    }
  };


  const openForm = (item?: any) => {
    if (item) {
      setEditItem(item);
      setFormTitle(item.title);
      setFormCategory(item.category);
      setUploadDataUrl(item.url); // Use existing URL as preview
    } else {
      setEditItem(null);
      setFormTitle('');
      setFormCategory(categories.length > 0 ? categories[0].name : '');
      setUploadDataUrl('');
    }
    setIsEditing(true);
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditItem(null);
    setFormTitle('');
    setFormCategory('');
    setUploadDataUrl('');
  };
  
  const filteredImages = activeFilter === 'All' ? images : images.filter(img => img.category === activeFilter);

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative py-32 bg-zinc-950 overflow-hidden border-b border-zinc-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-10">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 drop-shadow-lg"
          >
            {t("gallery.story.title")}
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
            {t("gallery.story.desc")}
          </motion.p>
          
          {isAdmin && (
             <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
               <button 
                 onClick={() => openForm()}
                 className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:scale-105"
               >
                 <Plus size={20} />
                 Add New Photo
               </button>
               <button 
                 onClick={() => setIsManagingCategories(true)}
                 className="flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-700 hover:border-amber-500 hover:text-amber-500 text-white px-6 py-3 rounded-full font-bold transition-all hover:scale-105"
               >
                 <Settings size={20} />
                 Manage Categories
               </button>
             </div>
          )}
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-20 bg-black relative overflow-hidden min-h-screen">
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Category Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            <button
              onClick={() => setActiveFilter('All')}
              className={`px-5 py-2 rounded-full font-semibold text-sm transition-all active:scale-95 ${
                activeFilter === 'All' 
                ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-amber-500 hover:text-white'
              }`}
            >
              All
            </button>
            {categories.map((cat, i) => (
              <button
                key={cat.id || i}
                onClick={() => setActiveFilter(cat.name)}
                className={`px-5 py-2 rounded-full font-semibold text-sm transition-all active:scale-95 ${
                  activeFilter === cat.name 
                  ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-amber-500 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          
          {loading ? (
             <div className="text-center text-zinc-500 py-20">Loading gallery...</div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeFilter}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {filteredImages.length === 0 ? (
                  <div className="col-span-full text-center py-20 text-zinc-500">
                    No images found in this category.
                  </div>
                ) : (
                  filteredImages.map((img, i) => (
                    <motion.div 
                      key={img.id || i}
                      variants={fadeUpVariant}
                      initial="hidden"
                      animate="visible"
                      custom={i}
                      className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-zinc-900 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-500 hover:-translate-y-2 md:hover:shadow-[0_20px_40px_rgba(245,158,11,0.15)] border border-zinc-800/50 hover:border-amber-500/50 active:scale-[0.98] active:shadow-inner"
                      onClick={() => {
                        triggerHaptic('light');
                        trackEvent('Gallery image viewed', { title: img.title, category: img.category });
                      }}
                    >
                      <OptimizedImage 
                        src={img.url} 
                        alt={img.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                      
                      {/* Always visible Top-Left Elegant Overlay */}
                      <div className="absolute top-4 left-4 z-20">
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                          className="backdrop-blur-md bg-black/60 border border-amber-500/30 px-4 py-2 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                        >
                          <h3 className="text-white text-sm font-serif tracking-wide drop-shadow-md">
                            <span className="text-amber-500 mr-2">✦</span>
                            {img.title}
                          </h3>
                        </motion.div>
                      </div>

                      
                      {/* Admin Controls Overlay */}
                      {isAdmin && (
                        <div className="absolute top-4 right-4 z-40 flex flex-col items-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="flex items-center gap-2">
                            <select 
                              value={img.category}
                              onChange={(e) => { e.stopPropagation(); handleQuickCategoryChange(img.id, e.target.value); }}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-black/80 text-amber-500 text-xs font-bold rounded px-2 py-1.5 backdrop-blur-sm border border-zinc-700 focus:outline-none focus:border-amber-500 cursor-pointer"
                            >
                              {categories.map((c, idx) => (
                                <option key={c.id || idx} value={c.name}>{c.name}</option>
                              ))}
                            </select>
                            <button 
                              onClick={(e) => { e.stopPropagation(); openForm(img); }}
                              className="bg-black/80 p-1.5 rounded text-zinc-300 hover:text-white hover:bg-zinc-800 backdrop-blur-sm border border-zinc-700 transition-colors"
                              title="Edit Details"
                            >
                              <Pencil size={16} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); if(img.id) handleDelete(img.id); else alert("Cannot delete demo image."); }}
                              className="bg-black/80 p-1.5 rounded text-red-400 hover:text-red-300 hover:bg-zinc-800 backdrop-blur-sm border border-red-900/50 transition-colors"
                              title="Delete Photo"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
{/* Bottom Overlay on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8 z-10 pointer-events-none">
                        <span className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">{img.category}</span>
                        <h3 className="text-white text-2xl font-serif tracking-wide transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">{img.title}</h3>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>

      <BeforeAfterGallery />

      {/* Admin Edit/Upload Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative"
            >
              <button onClick={resetForm} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
                <X size={24} />
              </button>
              
              <h2 className="text-2xl font-serif text-white mb-6">
                {editItem ? "Edit Photo" : "Upload New Photo"}
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Image Source</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      className="hidden" 
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-[4/3] bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-500 cursor-pointer hover:border-amber-500 hover:text-amber-500 transition-colors overflow-hidden relative"
                    >
                      {uploadDataUrl && uploadDataUrl.startsWith('data:') ? (
                        <OptimizedImage src={uploadDataUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Upload size={24} className="mb-2" />
                          <span className="font-medium text-sm">Upload File</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4 flex flex-col justify-end">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Or Image URL</label>
                      <input 
                        type="url"
                        value={uploadDataUrl.startsWith('data:') ? '' : uploadDataUrl}
                        onChange={e => setUploadDataUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm" 
                      />
                    </div>
                    {uploadDataUrl && !uploadDataUrl.startsWith('data:') && (
                      <div className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
                         <OptimizedImage src={uploadDataUrl} alt="Preview" className="w-full h-full object-cover opacity-80" />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Title</label>
                  <input 
                    type="text"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    required 
                    placeholder="e.g., Premium Fade"
                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500" 
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    required
                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 appearance-none"
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.map((cat, i) => (
                      <option key={cat.id || i} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex gap-3">
                  <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]">
                    <Save size={18} />
                    {editItem ? "Save Changes" : "Upload Photo"}
                  </button>
                  <button type="button" onClick={resetForm} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 rounded-lg transition-transform hover:scale-[1.02]">
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      
      {/* Admin Category Management Modal */}
      <AnimatePresence>
        {isManagingCategories && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              {categoryMode === 'list' && (
                <>
                  <button onClick={() => setIsManagingCategories(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
                    <X size={24} />
                  </button>
                  
                  <div className="flex justify-between items-center mb-6 pr-8">
                    <h2 className="text-2xl font-serif text-white">Manage Categories</h2>
                  </div>
                  
                  <button 
                    onClick={() => { setCategoryMode('add'); setFormCatName(''); setFormCatUrl(''); }}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 mb-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors border border-zinc-700 hover:border-amber-500"
                  >
                    <Plus size={18} /> Add New Category
                  </button>
                  
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Existing Categories</h3>
                    {categories.map((cat, i) => (
                      <div 
  key={cat.id || i} 
  onClick={() => {
    if (cat.id) {
      setEditingCategory(cat);
      setFormCatName(cat.name);
      setFormCatUrl(cat.url || '');
      setCategoryMode('edit');
    }
  }}
  className="flex items-center justify-between bg-black border border-zinc-800 p-3 rounded-lg cursor-pointer hover:border-amber-500/50 transition-colors group"
>
                        <div className="flex items-center gap-3">
                          {cat.url ? (
                            <div className="w-10 h-10 rounded-md overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0">
                               <OptimizedImage src={cat.url} alt={cat.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                               <span className="text-zinc-600 text-[10px] uppercase font-bold text-center leading-tight">No<br/>Img</span>
                            </div>
                          )}
                          <span className="text-white font-medium">{cat.name}</span>
                        </div>
                        {cat.id ? (
                          <div className="flex gap-2">
                            
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }} 
                              className="text-red-500/70 hover:text-red-400 p-2 bg-zinc-900 rounded-lg border border-zinc-800 transition-colors"
                              title="Delete Category"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-600 italic px-2">Default</span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {categoryMode !== 'list' && (
                <form onSubmit={handleSaveCategory} className="space-y-4">
                  <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-4">
                     <h3 className="text-xl font-serif text-white">{categoryMode === 'add' ? 'Add New Category' : 'Edit Category'}</h3>
                     <button type="button" onClick={() => setCategoryMode('list')} className="text-zinc-400 hover:text-white p-1">
                       <X size={20} />
                     </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Category Name</label>
                    <input 
                      type="text"
                      value={formCatName}
                      onChange={e => setFormCatName(e.target.value)}
                      required 
                      placeholder="e.g., Styling"
                      className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500" 
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Category Photo</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        ref={catFileInputRef}
                        onChange={handleCatImageUpload}
                        className="hidden" 
                      />
                      <div 
                        onClick={() => catFileInputRef.current?.click()}
                        className="w-full aspect-[4/3] bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-500 cursor-pointer hover:border-amber-500 hover:text-amber-500 transition-colors overflow-hidden relative"
                      >
                        {formCatUrl && formCatUrl.startsWith('data:') ? (
                          <OptimizedImage src={formCatUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : formCatUrl ? (
                          <OptimizedImage src={formCatUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <Upload size={24} className="mb-2" />
                            <span className="font-medium text-sm">Upload File</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4 flex flex-col justify-end">
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Or Image URL</label>
                        <input 
                          type="url"
                          value={formCatUrl.startsWith('data:') ? '' : formCatUrl}
                          onChange={e => setFormCatUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3 mt-6">
                    <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]">
                      <Save size={18} />
                      {categoryMode === 'edit' ? "Save Changes" : "Create Category"}
                    </button>
                    <button type="button" onClick={() => setCategoryMode('list')} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg transition-transform hover:scale-[1.02]">
                      Cancel
                    </button>
                    {categoryMode === 'edit' && editingCategory?.id && (
                      <button 
                        type="button" 
                        onClick={() => handleDeleteCategory(editingCategory)} 
                        className="flex-1 bg-red-900/40 hover:bg-red-800/60 text-red-500 hover:text-red-300 font-bold py-3 rounded-lg transition-transform hover:scale-[1.02] border border-red-900/50"
                      >
                        Delete
                      </button>
                    )}

                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
{/* Category Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingCategory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <h2 className="text-xl font-serif text-white mb-4 text-red-500 flex items-center gap-2">
                <Trash2 size={20} />
                Delete Category
              </h2>
              <p className="text-zinc-400 mb-6">
                Are you sure you want to delete the category <strong className="text-white">"{deletingCategory.name}"</strong>?
              </p>
              
              <div className="space-y-4 mb-8">
                <label className="flex items-start gap-3 cursor-pointer p-3 border border-zinc-800 rounded-lg hover:border-amber-500/50 transition-colors">
                  <input 
                    type="radio" 
                    name="deleteOption" 
                    value="keep" 
                    checked={deleteOption === 'keep'} 
                    onChange={() => setDeleteOption('keep')}
                    className="mt-1 accent-amber-500"
                  />
                  <div>
                    <div className="text-white font-medium">Keep Photos</div>
                    <div className="text-sm text-zinc-500">Photos will remain in the gallery but will lose this category grouping.</div>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 cursor-pointer p-3 border border-red-900/30 bg-red-950/10 rounded-lg hover:border-red-500/50 transition-colors">
                  <input 
                    type="radio" 
                    name="deleteOption" 
                    value="delete" 
                    checked={deleteOption === 'delete'} 
                    onChange={() => setDeleteOption('delete')}
                    className="mt-1 accent-red-500"
                  />
                  <div>
                    <div className="text-red-400 font-medium">Delete Associated Photos</div>
                    <div className="text-sm text-red-400/70">Permanently delete all photos that belong to this category. This action cannot be undone.</div>
                  </div>
                </label>
              </div>
              
              <div className="flex gap-3">
                <button onClick={confirmDeleteCategory} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg">
                  Confirm Delete
                </button>
                <button onClick={() => setDeletingCategory(null)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 rounded-lg">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="py-24 bg-black relative overflow-hidden border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-32 text-center"
          >
            <h3 className="text-3xl text-white font-serif mb-10 tracking-wide">{t("gallery.insta.text")}</h3>
            <a 
              href="https://www.instagram.com/rv2_prachi?igsh=MTJ6cWFoN2xiOGdqcQ==" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 bg-transparent border border-amber-500 text-amber-500 font-bold uppercase tracking-widest text-sm rounded transition-all duration-500 hover:text-black overflow-hidden hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]"
            >
              <span className="relative z-10">@rv2_prachi</span>
              <div className="absolute inset-0 bg-amber-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
