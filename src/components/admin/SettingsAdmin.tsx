import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Settings, CreditCard, Clock, Bell, Gift, Percent, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import NotificationsAdmin from './NotificationsAdmin';
import SecurityAdmin from './SecurityAdmin';


export default function SettingsAdmin() {
  const [activeTab, setActiveTab] = useState('loyalty');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<any>({
    loyalty: {
      pointsPerHundred: 10,
      discountPerHundredPoints: 100,
      visitsForFreeService: 10,
      birthdayDiscountPercentage: 20
    },
    business: {
      salonName: 'RV 2 Luxe Salon',
      contactNumber: '+91 98765 43210',
      whatsappNumber: '+91 98765 43210',
      email: 'contact@rv2luxe.com',
      address: '123 Elite Avenue, Mumbai',
      businessHours: '10:00 AM - 8:00 PM',
      taxPercentage: 18,
      currency: '₹',
      allowOnlineBooking: true
    },
    payments: {
      cash: true,
      upi: true,
      cards: true,
      razorpayEnabled: false
    }
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'systemSettings', 'global'));
        if (snap.exists()) {
          
          const data = snap.data();
          setSettings(prev => ({
            loyalty: { ...prev.loyalty, ...(data.loyalty || {}) },
            business: { ...prev.business, ...(data.business || {}) },
            payments: { ...prev.payments, ...(data.payments || {}) }
          }));

        }
      } catch (e) {
        console.error(e);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'systemSettings', 'global'), settings);
      // Also update loyaltySettings for backward compatibility
      await setDoc(doc(db, 'loyaltySettings', 'config'), settings.loyalty);
      try { await addDoc(collection(db, 'activity_logs'), { action: `Updated system settings`, module: 'Settings', admin: 'Admin', timestamp: serverTimestamp() }); } catch(e) {}
      alert('Settings saved successfully');
    } catch (e) {
      console.error(e);
      alert('Error saving settings');
    }
    setLoading(false);
  };

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar */}
      <div className="w-full md:w-64 flex flex-col gap-2">
        <button onClick={() => setActiveTab('loyalty')} className={`p-3 flex items-center gap-3 rounded-lg font-medium transition-colors ${activeTab === 'loyalty' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}>
          <Gift size={18}/> Loyalty & Rewards
        </button>
        <button onClick={() => setActiveTab('business')} className={`p-3 flex items-center gap-3 rounded-lg font-medium transition-colors ${activeTab === 'business' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}>
          <Clock size={18}/> Business Profile
        </button>
        <button onClick={() => setActiveTab('payments')} className={`p-3 flex items-center gap-3 rounded-lg font-medium transition-colors ${activeTab === 'payments' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}>
          <CreditCard size={18}/> Payment Methods
        </button>
        <button onClick={() => setActiveTab('notifications')} className={`p-3 flex items-center gap-3 rounded-lg font-medium transition-colors ${activeTab === 'notifications' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}>
          <Bell size={18}/> Smart Notifications
        </button>
        <button onClick={() => setActiveTab('security')} className={`p-3 flex items-center gap-3 rounded-lg font-medium transition-colors ${activeTab === 'security' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}>
          <Shield size={18}/> Security & Backup
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="text-amber-500"/> System Configuration
          </h2>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {activeTab === 'loyalty' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Points Earned Per ₹100 Spent</label>
                <input type="number" value={settings.loyalty.pointsPerHundred} onChange={(e) => updateSetting('loyalty', 'pointsPerHundred', Number(e.target.value))} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-white" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Discount Value per 100 Points (₹)</label>
                <input type="number" value={settings.loyalty.discountPerHundredPoints} onChange={(e) => updateSetting('loyalty', 'discountPerHundredPoints', Number(e.target.value))} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-white" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Visits Required for Free Service</label>
                <input type="number" value={settings.loyalty.visitsForFreeService} onChange={(e) => updateSetting('loyalty', 'visitsForFreeService', Number(e.target.value))} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-white" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Birthday Month Discount (%)</label>
                <input type="number" value={settings.loyalty.birthdayDiscountPercentage} onChange={(e) => updateSetting('loyalty', 'birthdayDiscountPercentage', Number(e.target.value))} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-white" />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'business' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Salon Name</label>
                <input type="text" value={settings.business.salonName || ''} onChange={(e) => updateSetting('business', 'salonName', e.target.value)} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-white focus:border-amber-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Contact Number</label>
                <input type="text" value={settings.business.contactNumber || ''} onChange={(e) => updateSetting('business', 'contactNumber', e.target.value)} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-white focus:border-amber-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">WhatsApp Number</label>
                <input type="text" value={settings.business.whatsappNumber || ''} onChange={(e) => updateSetting('business', 'whatsappNumber', e.target.value)} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-white focus:border-amber-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Email Address</label>
                <input type="email" value={settings.business.email || ''} onChange={(e) => updateSetting('business', 'email', e.target.value)} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-white focus:border-amber-500 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-400 mb-2">Salon Address</label>
                <input type="text" value={settings.business.address || ''} onChange={(e) => updateSetting('business', 'address', e.target.value)} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-white focus:border-amber-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Business Hours</label>
                <input type="text" value={settings.business.businessHours || ''} onChange={(e) => updateSetting('business', 'businessHours', e.target.value)} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-white focus:border-amber-500 outline-none" placeholder="e.g. 10:00 AM - 8:00 PM" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Tax Percentage (GST %)</label>
                <input type="number" value={settings.business.taxPercentage} onChange={(e) => updateSetting('business', 'taxPercentage', Number(e.target.value))} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-white focus:border-amber-500 outline-none" />
              </div>
              <div className="flex items-center gap-3 pt-8 md:col-span-2">
                <input type="checkbox" id="allowOnline" checked={settings.business.allowOnlineBooking} onChange={(e) => updateSetting('business', 'allowOnlineBooking', e.target.checked)} className="w-5 h-5 accent-amber-500 bg-black border-zinc-700 rounded" />
                <label htmlFor="allowOnline" className="text-white font-medium">Enable Online Booking System</label>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'payments' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-black border border-zinc-800 rounded-lg">
                <div>
                  <h4 className="text-white font-bold">Cash Payments</h4>
                  <p className="text-xs text-zinc-500">Allow customers to pay via cash at counter</p>
                </div>
                <input type="checkbox" checked={settings.payments.cash} onChange={(e) => updateSetting('payments', 'cash', e.target.checked)} className="w-5 h-5 accent-amber-500" />
              </div>
              <div className="flex items-center justify-between p-4 bg-black border border-zinc-800 rounded-lg">
                <div>
                  <h4 className="text-white font-bold">UPI / QR Code</h4>
                  <p className="text-xs text-zinc-500">Google Pay, PhonePe, Paytm</p>
                </div>
                <input type="checkbox" checked={settings.payments.upi} onChange={(e) => updateSetting('payments', 'upi', e.target.checked)} className="w-5 h-5 accent-amber-500" />
              </div>
              <div className="flex items-center justify-between p-4 bg-black border border-zinc-800 rounded-lg">
                <div>
                  <h4 className="text-white font-bold">Debit / Credit Cards</h4>
                  <p className="text-xs text-zinc-500">POS machine payments</p>
                </div>
                <input type="checkbox" checked={settings.payments.cards} onChange={(e) => updateSetting('payments', 'cards', e.target.checked)} className="w-5 h-5 accent-amber-500" />
              </div>
              <div className="flex items-center justify-between p-4 bg-black border border-amber-500/30 rounded-lg relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="text-amber-500 font-bold">Razorpay Integration (Coming Soon)</h4>
                  <p className="text-xs text-zinc-400">Accept online payments directly on the website</p>
                </div>
                <input type="checkbox" disabled checked={settings.payments.razorpayEnabled} className="w-5 h-5 accent-amber-500 relative z-10 opacity-50" />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'notifications' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}>
            <NotificationsAdmin />
          </motion.div>
        )}
        {activeTab === 'security' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}>
            <SecurityAdmin />
          </motion.div>
        )}

      </div>
    </div>
  );
}
