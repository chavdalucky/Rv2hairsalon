import React, { useState, useEffect, useRef } from 'react';
import OptimizedImage from '../components/OptimizedImage';
import { db } from '../../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, writeBatch } from 'firebase/firestore';
import { useAuth } from '../lib/useAuth';
import { Key, Pencil, Plus, Trash2, LogOut, DatabaseBackup, Upload, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import LoyaltyAdmin from '../components/admin/LoyaltyAdmin';
import ReportsAdmin from '../components/admin/ReportsAdmin';
import BookingsAdmin from '../components/admin/BookingsAdmin';
import NotificationsAdmin from '../components/admin/NotificationsAdmin';

import SettingsAdmin from '../components/admin/SettingsAdmin';

interface Category {
  id: string;
  title: string;
  order: number;
  iconName: string;
}

interface Service {
  id: string;
  categoryId: string;
  name: string;
  desc: string;
  price: string;
  createdAt: any;
  updatedAt: any;
}

// ... rest remains same until Admin function ...

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo?: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  alert(`Error: ${errInfo.error}\nYou might not have permission to perform this action.`);
}

const defaultData = [
  {
    title: "Hair Services (Hair Care)", iconName: "Scissors", order: 1, items: [
      { name: "Haircut & Styling", desc: "Classic, Fade, Layered, Blow-Dry, Temporary Styling", price: "₹99" },
      { name: "Beard Grooming", desc: "Beard Trim, Shape-Up, Hot Towel Shave", price: "₹70" },
      { name: "Clean Shave", desc: "Precision clean shave with pre-shave oil", price: "₹50" },
      { name: "Styling Beard", desc: "Advanced beard styling and contouring", price: "₹70" },
      { name: "Hair Treatments", desc: "Hair Spa, Keratin Treatment, Smoothening, Deep Conditioning", price: "₹500" },
      { name: "Hair Mask", desc: "Deep nourishing protein hair mask", price: "₹500" },
      { name: "Hair Coloring", desc: "Global Coloring, Highlights, Balayage, Root Touch-Ups", price: "Ask for price" },
      { name: "Hair Straightening", desc: "Permanent hair straightening and rebonding", price: "₹1200 - ₹1500" }
    ]
  },
  {
    title: "Skin & Facial Services", iconName: "Sparkles", order: 2, items: [
      { name: "Premium Facials", desc: "Classic Clean-Up, Fruit Facial, Gold/Diamond Facial, Anti-Tan Treatments", price: "~₹1000" },
      { name: "De-Tan & Bleach", desc: "Face, Neck, and Body De-Tan Services", price: "₹300" },
      { name: "Face Mask", desc: "Rejuvenating and cleansing application", price: "₹150" },
      { name: "Skin Glow Treatments", desc: "Hydra Facial, Chemical Peels with Expert Guidance, Skin Brightening", price: "Ask for price" }
    ]
  },
  {
    title: "Body & Spa Services", iconName: "Droplet", order: 3, items: [
      { name: "Massage Therapy", desc: "Head Massage, Back Massage, Full Body Relaxing Massage", price: "₹500" },
      { name: "Body Scrub & Polishing", desc: "Exfoliation and deep moisturizer application", price: "Ask for price" },
      { name: "Manicure & Pedicure", desc: "Classic, Spa, Gel Manicure/Pedicure", price: "Ask for price" }
    ]
  },
  {
    title: "Grooming & Aesthetics", iconName: "UserCheck", order: 4, items: [
      { name: "Threading & Waxing", desc: "Eyebrow Shaping, Full Body Waxing – Normal, Rica, Bean Wax", price: "₹150 - ₹500" },
      { name: "Nail Art", desc: "Nail Extensions, Gel Polish, Creative Nail Designs", price: "Ask for price" }
    ]
  }
];

import { useLanguage } from '../lib/LanguageContext';

export default function Admin() {
  const { t } = useLanguage();
  const { user, loading, signIn, signOut } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [favorites, setFavorites] = useState<any[]>([]);

  const [reviews, setReviews] = useState<any[]>([]);
  const [transformations, setTransformations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'services' | 'categories' | 'reviews' | 'transformations' | 'loyalty' | 'reports' | 'bookings' | 'notifications' | 'settings'>('reports');

  // Form states
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingTransformation, setEditingTransformation] = useState<any | null>(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  
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

  // Populate images when editing
  useEffect(() => {
    if (editingTransformation) {
      setBeforeImage(editingTransformation.beforeImage || "");
      setAfterImage(editingTransformation.afterImage || "");
    } else {
      setBeforeImage("");
      setAfterImage("");
    }
  }, [editingTransformation]);

  useEffect(() => {
    if (!user) return;
    let unsub = () => {};
    let unsub2 = () => {};

    if (activeTab === 'categories') {
      unsub = onSnapshot(query(collection(db, 'categories'), orderBy('order')), (snapshot) => {
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'categories'));
    } else if (activeTab === 'services') {
      unsub = onSnapshot(query(collection(db, 'services')), (snapshot) => {
        setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'services'));
      unsub2 = onSnapshot(query(collection(db, 'categories'), orderBy('order')), (snapshot) => {
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'categories'));
    } else if (activeTab === 'reviews') {
      unsub = onSnapshot(query(collection(db, 'reviews'), orderBy('createdAt', 'desc')), (snapshot) => {
        setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'reviews'));
    } else if (activeTab === 'transformations') {
      unsub = onSnapshot(collection(db, 'transformations'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.sort((a: any, b: any) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
        });
        setTransformations(data);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'transformations'));
    }

    return () => {
      unsub();
      unsub2();
    };
  }, [user, activeTab]);

  const handleSeedDatabase = async () => {
    if (!window.confirm("This will add the default website menu to the database. Proceed?")) return;
    try {
      // Create a batch is better but for admin we can just do simple loops
      for (const cat of defaultData) {
        const catRef = await addDoc(collection(db, 'categories'), {
          title: cat.title,
          order: cat.order,
          iconName: cat.iconName
        });
        
        for (const item of cat.items) {
          try { await addDoc(collection(db, 'activity_logs'), { action: `Added service ${name}`, module: 'Content', admin: 'Admin', timestamp: serverTimestamp() }); } catch(e) {}
        await addDoc(collection(db, 'services'), {
            categoryId: catRef.id,
            name: item.name,
            desc: item.desc,
            price: item.price,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      }
      alert('Database seeded perfectly!');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'multiple');
    }
  };

  if (loading) return <div className="pt-24 text-center text-white">Loading...</div>;

  if (!user) {
    return (
      <div className="pt-32 pb-24 px-4 flex justify-center items-center">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded shadow-2xl max-w-md w-full text-center">
          <Key className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-serif text-white mb-2">Admin Access</h2>
          <p className="text-zinc-400 mb-8">Sign in with authorized Google account to manage salon pricing and services.</p>
          <button 
            onClick={signIn}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider rounded transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  const handleSaveCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
    const order = parseInt((form.elements.namedItem('order') as HTMLInputElement).value, 10);
    const iconName = (form.elements.namedItem('iconName') as HTMLInputElement).value;

    try {
      if (editingCategory?.id) {
        await updateDoc(doc(db, 'categories', editingCategory.id), {
          title, order, iconName
        });
      } else {
        try { await addDoc(collection(db, 'activity_logs'), { action: `Added category ${title}`, module: 'Content', admin: 'Admin', timestamp: serverTimestamp() }); } catch(e) {}
        await addDoc(collection(db, 'categories'), {
          title, order, iconName
        });
      }
      setEditingCategory(null);
      form.reset();
    } catch (err) {
      handleFirestoreError(err, editingCategory?.id ? OperationType.UPDATE : OperationType.CREATE, 'categories');
    }
  };

  const handleSaveService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const categoryId = (form.elements.namedItem('categoryId') as HTMLSelectElement).value;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const desc = (form.elements.namedItem('desc') as HTMLInputElement).value;
    const price = (form.elements.namedItem('price') as HTMLInputElement).value;

    try {
      if (editingService?.id) {
        await updateDoc(doc(db, 'services', editingService.id), {
          categoryId, name, desc, price,
          updatedAt: serverTimestamp()
        });
      } else {
        try { await addDoc(collection(db, 'activity_logs'), { action: `Added service ${name}`, module: 'Content', admin: 'Admin', timestamp: serverTimestamp() }); } catch(e) {}
        await addDoc(collection(db, 'services'), {
          categoryId, name, desc, price,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setEditingService(null);
      form.reset();
    } catch (err) {
      handleFirestoreError(err, editingService?.id ? OperationType.UPDATE : OperationType.CREATE, 'services');
    }
  };

  const handleDeleteSub = async (collectionName: string, id: string) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      try { await addDoc(collection(db, 'activity_logs'), { action: `Deleted item from ${collectionName}`, module: 'Content', admin: 'Admin', timestamp: serverTimestamp() }); } catch(e) {}
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, collectionName);
    }
  };

  const handleUpdateReviewStatus = async (reviewId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'reviews');
    }
  };

  const handleUpdateTransformationStatus = async (transId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'transformations', transId), {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'transformations');
    }
  };

  const handleSaveTransformation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!beforeImage || !afterImage) {
      alert("Please upload both Before and After photos.");
      return;
    }
    const form = e.currentTarget;
    const category = (form.elements.namedItem('category') as HTMLSelectElement).value;
    const serviceTitle = (form.elements.namedItem('serviceTitle') as HTMLInputElement).value;
    const description = (form.elements.namedItem('description') as HTMLInputElement).value;
    const customerName = (form.elements.namedItem('customerName') as HTMLInputElement).value;
    const review = (form.elements.namedItem('review') as HTMLTextAreaElement).value;
    const rating = parseInt((form.elements.namedItem('rating') as HTMLInputElement).value, 10);
    const featured = (form.elements.namedItem('featured') as HTMLInputElement).checked;

    try {
      if (editingTransformation?.id) {
        await updateDoc(doc(db, 'transformations', editingTransformation.id), {
          category, serviceTitle, description, beforeImage: beforeImage, afterImage: afterImage, customerName, review, rating, featured,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'transformations'), {
          category, serviceTitle, description, beforeImage: beforeImage, afterImage: afterImage, customerName, review, rating, featured,
          status: 'approved',
          order: transformations.length,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setEditingTransformation(null);
      setBeforeImage("");
      setAfterImage("");
      form.reset();
    } catch (err) {
      handleFirestoreError(err, editingTransformation?.id ? OperationType.UPDATE : OperationType.CREATE, 'transformations');
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    
    const newItems = [...transformations];
    const draggedItem = newItems[draggedItemIndex];
    newItems.splice(draggedItemIndex, 1);
    newItems.splice(index, 0, draggedItem);
    
    setTransformations(newItems);
    setDraggedItemIndex(index);
  };

  const handleDrop = async () => {
    setDraggedItemIndex(null);
    try {
      const batch = writeBatch(db);
      transformations.forEach((t, index) => {
        batch.update(doc(db, 'transformations', t.id), { order: index });
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'transformations');
    }
  };

  return (
    <div className="pt-24 pb-20 min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
          <h1 className="text-3xl font-serif text-white">Dashboard Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">{user.email}</span>
            <button onClick={signOut} className="text-red-400 hover:text-red-300 flex items-center gap-2">
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => setActiveTab('services')}
              className={`px-4 py-2 rounded font-semibold transition-colors ${activeTab === 'services' ? 'bg-amber-500 text-black' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'}`}
            >
              Manage Services
            </button>
            <button 
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 rounded font-semibold transition-colors ${activeTab === 'categories' ? 'bg-amber-500 text-black' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'}`}
            >
              Manage Categories
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2 rounded font-semibold transition-colors ${activeTab === 'reviews' ? 'bg-amber-500 text-black' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'}`}
            >
              Manage Reviews
            </button>
            <button 
              onClick={() => setActiveTab('transformations')}
              className={`px-4 py-2 rounded font-semibold transition-colors ${activeTab === 'transformations' ? 'bg-amber-500 text-black' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'}`}
            >
              Transformations
            </button>
            <button 
              onClick={() => setActiveTab('loyalty')}
              className={`px-4 py-2 rounded font-semibold transition-colors ${activeTab === 'loyalty' ? 'bg-amber-500 text-black' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'}`}
            >
              Loyalty Members
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded font-semibold transition-colors ${activeTab === 'reports' ? 'bg-amber-500 text-black' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'}`}
            >
              Reports
            </button>
            <button 
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded font-semibold transition-colors ${activeTab === 'bookings' ? 'bg-amber-500 text-black' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'}`}
            >
              Bookings
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded font-semibold transition-colors ${activeTab === 'settings' ? 'bg-amber-500 text-black' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'}`}
            >
              Settings
            </button>
          </div>

          {categories.length === 0 && services.length === 0 && activeTab !== 'reviews' && activeTab !== 'loyalty' && activeTab !== 'reports' && activeTab !== 'bookings' && activeTab !== 'settings' && (
            <button 
              onClick={handleSeedDatabase}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded transition-colors"
            >
              <DatabaseBackup size={16} /> Seed Default Menu
            </button>
          )}
        </div>

        
        {activeTab === 'favourites' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Popular Favourites</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="pb-3 pl-4">Service</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Favourites Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(favorites.reduce((acc: any, f: any) => {
                    acc[f.serviceId] = (acc[f.serviceId] || 0) + 1;
                    return acc;
                  }, {})).sort((a: any, b: any) => b[1] - a[1]).map(([serviceId, count]: any) => {
                    const svc = services.find(s => s.id === serviceId) || { name: serviceId, categoryId: 'Unknown' };
                    const cat = categories.find(c => c.id === svc.categoryId);
                    return (
                      <tr key={serviceId} className="border-b border-zinc-800/50 hover:bg-black/20">
                        <td className="py-4 pl-4 text-white font-medium">{svc.name}</td>
                        <td className="py-4 text-zinc-400">{cat?.title || 'Unknown'}</td>
                        <td className="py-4 text-amber-500 font-bold">{count}</td>
                      </tr>
                    );
                  })}
                  {favorites.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-zinc-500">No favourites recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'categories' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-zinc-900 p-6 rounded border border-zinc-800 h-fit">
              <h2 className="text-xl font-bold text-white mb-6">{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Title</label>
                  <input name="title" defaultValue={editingCategory?.title} required className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Order (Number)</label>
                  <input name="order" type="number" defaultValue={editingCategory?.order ?? 0} required className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Icon Name (e.g., Scissors, Sparkles)</label>
                  <input name="iconName" defaultValue={editingCategory?.iconName ?? 'Scissors'} required className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 rounded">
                    {editingCategory ? 'Update' : 'Add Category'}
                  </button>
                  {editingCategory && (
                    <button type="button" onClick={() => setEditingCategory(null)} className="px-4 bg-zinc-800 text-white rounded">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded p-6">
              <h2 className="text-xl font-bold text-white mb-6">Existing Categories</h2>
              <ul className="space-y-3">
                {categories.map(c => (
                  <li key={c.id} className="flex justify-between items-center bg-black p-3 rounded border border-zinc-800">
                    <div>
                      <span className="text-white font-bold">{c.title}</span>
                      <span className="text-zinc-500 text-sm ml-2">(Order: {c.order})</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingCategory(c)} className="text-amber-500 hover:text-amber-400 p-1"><Pencil size={16} /></button>
                      <button onClick={() => handleDeleteSub('categories', c.id)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={16} /></button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="grid md:grid-cols-[1fr_2fr] gap-8">
            <div className="bg-zinc-900 p-6 rounded border border-zinc-800 h-fit">
              <h2 className="text-xl font-bold text-white mb-6">{editingService ? 'Edit Service' : 'Add New Service'}</h2>
              <form onSubmit={handleSaveService} className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Category</label>
                  <select name="categoryId" defaultValue={editingService?.categoryId} required className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white">
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Service Name</label>
                  <input name="name" defaultValue={editingService?.name} required className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Description</label>
                  <textarea name="desc" defaultValue={editingService?.desc} required className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white h-20" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Price (e.g., ₹99)</label>
                  <input name="price" defaultValue={editingService?.price} required className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 rounded">
                    {editingService ? 'Update' : 'Add Service'}
                  </button>
                  {editingService && (
                    <button type="button" onClick={() => setEditingService(null)} className="px-4 bg-zinc-800 text-white rounded">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded p-6">
              <h2 className="text-xl font-bold text-white mb-6">Existing Services</h2>
              <div className="space-y-6">
                {categories.map(category => {
                  const catServices = services.filter(s => s.categoryId === category.id);
                  if (catServices.length === 0) return null;
                  
                  return (
                    <div key={category.id} className="bg-black p-4 rounded border border-zinc-800">
                      <h3 className="text-amber-500 font-bold mb-3 pb-2 border-b border-zinc-800">{category.title}</h3>
                      <ul className="space-y-2">
                        {catServices.map(s => (
                          <li key={s.id} className="flex justify-between items-center bg-zinc-900 p-3 rounded">
                            <div>
                              <p className="text-white font-bold">{s.name}</p>
                              <p className="text-zinc-500 text-sm truncate max-w-xs">{s.desc}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-amber-400 font-bold">{s.price}</span>
                              <div className="flex gap-1 border-l border-zinc-700 pl-4">
                                <button onClick={() => setEditingService(s)} className="text-zinc-400 hover:text-amber-400 p-1"><Pencil size={16} /></button>
                                <button onClick={() => handleDeleteSub('services', s.id)} className="text-zinc-400 hover:text-red-400 p-1"><Trash2 size={16} /></button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded p-6">
            <h2 className="text-xl font-bold text-white mb-6">Manage Reviews</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="p-3 font-semibold text-sm">Date</th>
                    <th className="p-3 font-semibold text-sm">Reviewer</th>
                    <th className="p-3 font-semibold text-sm">Rating</th>
                    <th className="p-3 font-semibold text-sm max-w-sm">Review</th>
                    <th className="p-3 font-semibold text-sm">Status</th>
                    <th className="p-3 font-semibold text-sm text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {reviews.map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="p-3 text-zinc-500 text-sm">
                        {r.createdAt?.toDate ? new Date(r.createdAt.toDate()).toLocaleDateString() : 'New'}
                      </td>
                      <td className="p-3 text-white font-medium">{r.name}</td>
                      <td className="p-3 text-amber-500 font-medium">{r.rating} / 5</td>
                      <td className="p-3 text-zinc-300 text-sm max-w-sm truncate" title={r.text}>{r.text}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                          r.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          r.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          {r.status !== 'approved' && (
                            <button onClick={() => handleUpdateReviewStatus(r.id, 'approved')} className="text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 px-2 py-1 rounded transition-colors">
                              Approve
                            </button>
                          )}
                          {r.status !== 'rejected' && (
                            <button onClick={() => handleUpdateReviewStatus(r.id, 'rejected')} className="text-xs bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 px-2 py-1 rounded transition-colors">
                              Reject
                            </button>
                          )}
                          <button onClick={() => handleDeleteSub('reviews', r.id)} className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-500 px-2 py-1 rounded transition-colors">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {reviews.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-500">No reviews found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'transformations' && (
          <div className="grid md:grid-cols-[1fr_2fr] gap-8">
            <div className="bg-zinc-900 p-6 rounded border border-zinc-800 h-fit">
              <h2 className="text-xl font-bold text-white mb-6">{editingTransformation ? 'Edit Transformation' : 'Add Transformation'}</h2>
              <form onSubmit={handleSaveTransformation} className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Service Category</label>
                  <select name="category" defaultValue={editingTransformation?.category} required className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white">
                    <option value="">Select Category</option>
                    <option value="Haircut">Haircut</option>
                    <option value="Beard">Beard</option>
                    <option value="Hair Color">Hair Color</option>
                    <option value="Hair Spa">Hair Spa</option>
                    <option value="Facial">Facial</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Service Title</label>
                  <input name="serviceTitle" defaultValue={editingTransformation?.serviceTitle} required className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Before Image *</label>
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
                    <label className="block text-sm text-zinc-400 mb-1">After Image *</label>
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
                  <label className="block text-sm text-zinc-400 mb-1">Customer Name (Optional)</label>
                  <input name="customerName" defaultValue={editingTransformation?.customerName} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Short Description</label>
                  <input name="description" defaultValue={editingTransformation?.description} required className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Review / Testimonial</label>
                  <textarea name="review" defaultValue={editingTransformation?.review} required className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white h-20" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Rating (1-5)</label>
                  <input name="rating" type="number" min="1" max="5" defaultValue={editingTransformation?.rating || 5} required className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <input name="featured" type="checkbox" id="featured-check" defaultChecked={editingTransformation?.featured} className="w-4 h-4 accent-amber-500" />
                  <label htmlFor="featured-check" className="text-sm text-zinc-400">Mark as Featured</label>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 rounded">
                    {editingTransformation ? 'Update' : 'Add Transformation'}
                  </button>
                  {editingTransformation && (
                    <button type="button" onClick={() => setEditingTransformation(null)} className="px-4 bg-zinc-800 text-white rounded">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded p-6">
              <h2 className="text-xl font-bold text-white mb-6">Manage Transformations</h2>
              <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
                {transformations.map((t, index) => (
                  <div 
                    key={t.id} 
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDrop}
                    className={`bg-black border border-zinc-800 rounded p-4 flex flex-col gap-3 cursor-move transition-transform ${draggedItemIndex === index ? 'opacity-50' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-bold">{t.serviceTitle}</h3>
                        <p className="text-amber-500 text-sm">{t.category}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        t.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        t.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="w-1/2 aspect-video bg-zinc-900 rounded overflow-hidden relative">
                        <OptimizedImage src={t.beforeImage} alt="Before" className="w-full h-full object-cover opacity-50" />
                        <span className="absolute top-1 left-1 text-[10px] bg-black/80 px-1 rounded">Before</span>
                      </div>
                      <div className="w-1/2 aspect-video bg-zinc-900 rounded overflow-hidden relative">
                        <OptimizedImage src={t.afterImage} alt="After" className="w-full h-full object-cover" />
                        <span className="absolute top-1 right-1 text-[10px] bg-amber-500 text-black px-1 rounded">After</span>
                      </div>
                    </div>

                    <p className="text-zinc-400 text-sm italic line-clamp-2">"{t.review}"</p>
                    {t.customerName && <p className="text-zinc-500 text-xs">- {t.customerName}</p>}

                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-800/50">
                      <div className="flex gap-2">
                        {t.status !== 'approved' && (
                          <button onClick={() => handleUpdateTransformationStatus(t.id, 'approved')} className="text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 px-2 py-1 rounded">
                            Approve
                          </button>
                        )}
                        {t.status !== 'rejected' && (
                          <button onClick={() => handleUpdateTransformationStatus(t.id, 'rejected')} className="text-xs bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                            Reject
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingTransformation(t)} className="text-zinc-400 hover:text-amber-400 p-1"><Pencil size={16} /></button>
                        <button onClick={() => handleDeleteSub('transformations', t.id)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {transformations.length === 0 && (
                  <p className="text-zinc-500 text-center py-8">No transformations found.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'loyalty' && (
          <LoyaltyAdmin />
        )}
        
        {activeTab === 'reports' && (
          <ReportsAdmin />
        )}

        {activeTab === 'bookings' && (
          <BookingsAdmin />
        )}
        {activeTab === 'notifications' && (
          <NotificationsAdmin />
        )}

        {activeTab === 'settings' && (
          <SettingsAdmin />
        )}
      </div>
    </div>
  );
}
