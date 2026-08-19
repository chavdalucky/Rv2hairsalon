import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { serverTimestamp } from 'firebase/firestore';
import { triggerHaptic } from '../utils/haptics';
import { trackEvent } from '../utils/analytics';

export default function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    if (!auth.currentUser) return;
    try {
      // Fetch personal and global notifications
      const userQ = query(
        collection(db, 'notifications'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('timestamp', 'desc')
      );
      const allQ = query(
        collection(db, 'notifications'),
        where('userId', '==', 'all'),
        orderBy('timestamp', 'desc')
      );

      const [userSnap, allSnap] = await Promise.all([getDocs(userQ), getDocs(allQ)]);
      
      const now = Date.now();
      const logs = [
        ...userSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ...allSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      ].filter((n: any) => {
        if (!n.timestamp) return true; // optimistic UI / pending
        const time = n.timestamp.toMillis();
        return time <= now;
      }).sort((a: any, b: any) => {
        const timeA = a.timestamp ? a.timestamp.toMillis() : 0;
        const timeB = b.timestamp ? b.timestamp.toMillis() : 0;
        return timeB - timeA;
      });

      setNotifications(logs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    triggerHaptic('light');
    trackEvent('Notification click');
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleAcceptNewTime = async (n: any) => {
    triggerHaptic('medium');
    try {
      await markAsRead(n.id);
      
      if (n.bookingId) {
        await updateDoc(doc(db, 'bookings', n.bookingId), { 
          status: 'confirmed',
          updatedAt: serverTimestamp() 
        });
      }
      
      onClose();
      navigate('/dashboard');
    } catch (e) {
      console.error('Failed to accept new time', e);
    }
  };

  const handleNotificationClick = (n: any) => {
    if (n.title === 'Appointment Confirmed') {
       markAsRead(n.id);
       onClose();
       navigate('/dashboard');
    }
  };

  const clearAll = async () => {
    triggerHaptic('medium');
    if (!auth.currentUser || notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        // Only delete personal notifications, not global ones, or maybe mark global as read instead
        if (n.userId === auth.currentUser?.uid) {
           batch.delete(doc(db, 'notifications', n.id));
        } else {
           // For global ones, since we can't easily track per-user read state on a single doc,
           // we'll just ignore for now or we could store read receipts in a subcollection
        }
      });
      await batch.commit();
      setNotifications(prev => prev.filter(n => n.userId === 'all')); // Keep global
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <h3 className="text-white font-serif font-bold flex items-center gap-2">
          <Bell size={18} className="text-amber-500" /> Notifications
        </h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={clearAll} 
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
            title="Clear personal notifications"
          >
            <Trash2 size={14} /> Clear
          </button>
          <button onClick={onClose} className="text-zinc-400 hover:text-white ml-2">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-zinc-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">No new notifications</div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {notifications.map(n => (
              <div 
                key={n.id} 
                className={`p-4 transition-colors ${n.read ? 'opacity-75' : 'bg-amber-900/10'} ${n.title === 'Appointment Confirmed' ? 'cursor-pointer hover:bg-zinc-800' : ''}`}
                onClick={() => handleNotificationClick(n)}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-sm font-medium ${n.read ? 'text-zinc-300' : 'text-amber-500'}`}>
                    {n.title}
                  </h4>
                  {!n.read && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                      className="text-amber-500 hover:text-amber-400 p-1"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mb-3">{n.body}</p>
                
                {n.title === 'Reschedule Proposed' && !n.read && (
                  <div className="flex gap-2 mb-3 mt-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleAcceptNewTime(n); }}
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold py-1.5 px-3 rounded"
                    >
                      Accept New Time
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onClose(); navigate('/dashboard'); }}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-1.5 px-3 rounded border border-zinc-700"
                    >
                      Request Another
                    </button>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-[10px] text-zinc-500">
                  <span className="bg-zinc-800 px-2 py-0.5 rounded-full">{n.type}</span>
                  <span>
                    {n.timestamp ? n.timestamp.toDate().toLocaleString() : 'Just now'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
