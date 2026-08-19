import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Mail, MessageSquare, Phone, Save, History, RefreshCw, CheckCircle, XCircle, Trash2, Check, CheckSquare, Bell } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

export default function NotificationsAdmin() {
  const [settings, setSettings] = useState<any>({
    emailEnabled: true,
    smsEnabled: true,
    whatsappEnabled: true,
    emailTemplate: '',
    smsTemplate: '',
    whatsappTemplate: '',
    reminder24hEnabled: true,
    reminder2hEnabled: true,
    reminder30mEnabled: true,
    reminderEmail: '',
    reminderSms: '',
    reminderWhatsapp: ''
  });
  const [logs, setLogs] = useState<any[]>([]);
  const [internalNotifs, setInternalNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'center' | 'settings' | 'history'>('center');
  
  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      // Filter for admin notifications (where userId === 'admin')
      const adminNotifs = snap.docs.map(d => ({id: d.id, ...d.data()})).filter((n: any) => n.userId === 'admin' || n.userId === 'all');
      setInternalNotifs(adminNotifs);
    });
    return () => unsub();
  }, []);

  const unreadCount = internalNotifs.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try { await updateDoc(doc(db, 'notifications', id), { read: true }); } catch (e) {}
  };
  
  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      internalNotifs.filter(n => !n.read).forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    } catch(e) {}
  };

  const deleteNotification = async (id: string) => {
    try { await deleteDoc(doc(db, 'notifications', id)); } catch(e) {}
  };


  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/notifications/settings');
      if (res.ok) {
        const data = await res.json();
        if (data) setSettings(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/notifications/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSettings().then(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchLogs();
    }
  }, [activeTab]);

  const handleSave = async () => {
    setSaving(true);
    triggerHaptic('light');
    try {
      await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      alert('Settings saved successfully');
    } catch (e) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-zinc-500 p-8">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Mail className="text-amber-500" /> Notifications System
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('center')}
            className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 ${activeTab === 'center' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
          >
            <Bell size={16} /> Inbox {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-sm font-bold rounded-lg ${activeTab === 'settings' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
          >
            Settings & Templates
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 ${activeTab === 'history' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
          >
            <History size={16} /> Delivery Logs
          </button>
        </div>
      </div>

            {activeTab === 'center' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
            <h3 className="font-bold text-white">Admin Notification Center</h3>
            <div className="flex gap-3">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-zinc-400 hover:text-white flex items-center gap-1 text-sm">
                  <CheckSquare size={14} /> Mark all as read
                </button>
              )}
            </div>
          </div>
          <div className="divide-y divide-zinc-800/50 max-h-[600px] overflow-y-auto">
            {internalNotifs.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">No notifications found.</div>
            ) : (
              internalNotifs.map(notif => (
                <div key={notif.id} className={`p-4 flex gap-4 transition-colors ${notif.read ? 'bg-zinc-900/50' : 'bg-zinc-800/50 border-l-2 border-l-amber-500'}`}>
                  <div className="mt-1">
                    <Bell className={notif.read ? 'text-zinc-500' : 'text-amber-500'} size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className={`font-medium ${notif.read ? 'text-zinc-300' : 'text-white'}`}>{notif.title}</h4>
                      <span className="text-xs text-zinc-500">{notif.timestamp?.seconds ? new Date(notif.timestamp.seconds * 1000).toLocaleString() : 'Just now'}</span>
                    </div>
                    <p className="text-sm text-zinc-400 mt-1">{notif.message}</p>
                    <div className="flex gap-4 mt-3">
                      {!notif.read && (
                        <button onClick={() => markAsRead(notif.id)} className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1">
                          <Check size={14} /> Mark Read
                        </button>
                      )}
                      <button onClick={() => deleteNotification(notif.id)} className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1">
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex flex-col gap-6">
            <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">Channels</h3>
            
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={settings.emailEnabled} onChange={(e) => setSettings({...settings, emailEnabled: e.target.checked})} className="w-5 h-5 rounded border-zinc-700 text-amber-500 focus:ring-amber-500 bg-black" />
                <span className="text-white flex items-center gap-2"><Mail size={16} className="text-zinc-400" /> Email Enabled</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={settings.smsEnabled} onChange={(e) => setSettings({...settings, smsEnabled: e.target.checked})} className="w-5 h-5 rounded border-zinc-700 text-amber-500 focus:ring-amber-500 bg-black" />
                <span className="text-white flex items-center gap-2"><Phone size={16} className="text-zinc-400" /> SMS Enabled</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={settings.whatsappEnabled} onChange={(e) => setSettings({...settings, whatsappEnabled: e.target.checked})} className="w-5 h-5 rounded border-zinc-700 text-amber-500 focus:ring-amber-500 bg-black" />
                <span className="text-white flex items-center gap-2"><MessageSquare size={16} className="text-green-500" /> WhatsApp Enabled</span>
              </label>
            </div>

            <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2 mt-4">Confirmation Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Email Template</label>
                <textarea rows={5} value={settings.emailTemplate} onChange={(e) => setSettings({...settings, emailTemplate: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">SMS Template</label>
                <textarea rows={5} value={settings.smsTemplate} onChange={(e) => setSettings({...settings, smsTemplate: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-amber-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-400 mb-1">WhatsApp Template</label>
                <textarea rows={4} value={settings.whatsappTemplate} onChange={(e) => setSettings({...settings, whatsappTemplate: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-amber-500" />
              </div>
            </div>

            <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2 mt-4">Appointment Reminders</h3>
            
            <div className="flex flex-wrap gap-6 mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={settings.reminder24hEnabled ?? true} onChange={(e) => setSettings({...settings, reminder24hEnabled: e.target.checked})} className="w-5 h-5 rounded border-zinc-700 text-amber-500 focus:ring-amber-500 bg-black" />
                <span className="text-white text-sm">24 hours before</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={settings.reminder2hEnabled ?? true} onChange={(e) => setSettings({...settings, reminder2hEnabled: e.target.checked})} className="w-5 h-5 rounded border-zinc-700 text-amber-500 focus:ring-amber-500 bg-black" />
                <span className="text-white text-sm">2 hours before</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={settings.reminder30mEnabled ?? true} onChange={(e) => setSettings({...settings, reminder30mEnabled: e.target.checked})} className="w-5 h-5 rounded border-zinc-700 text-amber-500 focus:ring-amber-500 bg-black" />
                <span className="text-white text-sm">30 minutes before</span>
              </label>
            </div>
            <h3 className="text-sm font-bold text-zinc-400 mb-2 mt-4">Reminder Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Email Reminder</label>
                <textarea rows={5} value={settings.reminderEmail} onChange={(e) => setSettings({...settings, reminderEmail: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">SMS Reminder</label>
                <textarea rows={5} value={settings.reminderSms} onChange={(e) => setSettings({...settings, reminderSms: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-amber-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-400 mb-1">WhatsApp Reminder</label>
                <textarea rows={4} value={settings.reminderWhatsapp} onChange={(e) => setSettings({...settings, reminderWhatsapp: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-amber-500" />
              </div>
            </div>
            
            <p className="text-xs text-zinc-500">Available variables: {`{name}, {service}, {date}, {time}, {id}, {barber}`}</p>
            
            <div className="pt-4">
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-amber-500 text-black font-bold px-6 py-3 rounded-lg hover:bg-amber-400 flex items-center gap-2"
              >
                <Save size={18} /> {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
            <h3 className="font-bold text-white">Delivery Logs</h3>
            <button onClick={fetchLogs} className="text-amber-500 hover:text-amber-400 flex items-center gap-1 text-sm"><RefreshCw size={14}/> Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-800/50 text-zinc-400 text-sm">
                  <th className="p-4">Time</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Channel</th>
                  <th className="p-4">Booking ID</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-sm">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-zinc-800/30">
                    <td className="p-4 text-zinc-300">{log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'N/A'}</td>
                    <td className="p-4 text-white capitalize">{log.type?.replace('_', ' ')}</td>
                    <td className="p-4 text-zinc-300 capitalize">{log.channel}</td>
                    <td className="p-4 text-zinc-500 font-mono text-xs">{log.bookingId?.slice(0,8)}</td>
                    <td className="p-4">
                      {log.status === 'sent' || log.status === 'sent (simulated)' ? (
                        <span className="flex items-center gap-1 text-green-500"><CheckCircle size={14}/> Sent</span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-500"><XCircle size={14}/> Failed</span>
                      )}
                    </td>
                    <td className="p-4 text-zinc-400 max-w-[200px] truncate">{log.error || log.status}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-500">No notification logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
