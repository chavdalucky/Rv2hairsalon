import { useLanguage } from '../lib/LanguageContext';
import React, { useState, useEffect } from 'react';

import { db } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Calendar, Clock, CreditCard, Scissors, Star } from 'lucide-react';


export default function ServiceHistory({ userId }: { userId: string }) {
  const { t } = useLanguage();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    
    const q = query(
      collection(db, 'bookings'), 
      where('userId', '==', userId)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
      docs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setHistory(docs);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'text-green-500 bg-green-500/10';
      case 'pending': return 'text-yellow-500 bg-yellow-500/10';
      case 'confirmed': return 'text-blue-500 bg-blue-500/10';
      case 'cancelled': return 'text-red-500 bg-red-500/10';
      default: return 'text-zinc-400 bg-zinc-800';
    }
  };

  if (loading) {
    return <div className="text-zinc-500 animate-pulse p-6">{t('common.loading')}</div>;
  }

  return (
    <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden shadow-2xl mt-8">
      <div className="p-6 border-b border-zinc-800/50 flex items-center justify-between">
        <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
          <Calendar size={20} className="text-amber-500" /> {t('history.title')}
        </h3>
        <span className="text-xs font-bold text-zinc-500 bg-zinc-800 px-3 py-1 rounded-full uppercase tracking-wider">
          {history.length} {t('history.bookings')}
        </span>
      </div>
      
      <div className="divide-y divide-zinc-800/50">
        {history.map((booking) => (
          <div key={booking.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-black/20 transition-colors">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${getStatusColor(booking.status)}`}>
                  {booking.status || 'Pending'}
                </span>
                <span className="text-zinc-400 text-sm font-medium flex items-center gap-1">
                  <Clock size={14} /> {booking.date} at {booking.time}
                </span>
              </div>
              <h4 className="text-white font-bold text-lg flex items-center gap-2">
                <Scissors size={18} className="text-amber-500" /> {booking.serviceName || 'Salon Service'}
              </h4>
            </div>
            
            <div className="flex items-center gap-6 md:justify-end">
              <div className="text-right">
                <p className="text-xs text-zinc-500 mb-1 flex items-center justify-end gap-1"><CreditCard size={12}/> {booking.paymentMethod || 'Cash'}</p>
                <p className="text-xl font-mono text-white font-bold">₹{booking.amount || '0'}</p>
              </div>
              {booking.status === 'completed' && (
                <div className="text-right bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                  <p className="text-[10px] text-amber-500/70 uppercase tracking-widest mb-1 flex items-center justify-end gap-1"><Star size={10}/> Earned</p>
                  <p className="text-amber-500 font-bold">+{Math.floor((booking.amount || 0) / 100) * 10} pts</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {history.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
              <Calendar className="text-zinc-500 w-8 h-8" />
            </div>
            <p className="text-zinc-400 font-medium">{t('history.noHistory')}</p>
            <p className="text-zinc-600 text-sm mt-1">Your past and upcoming bookings will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
