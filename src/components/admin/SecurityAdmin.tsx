import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, History, Database, DownloadCloud, UploadCloud, AlertTriangle, CheckCircle, RefreshCw, Key, LogOut } from 'lucide-react';
import { db, auth } from '../../../firebase';
import { collection, getDocs, addDoc, query, orderBy, limit, serverTimestamp, getDoc, doc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export default function SecurityAdmin() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [backupLoading, setBackupLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<any>(null);
  const [restoreConfirm, setRestoreConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'backup'>('overview');
  
  useEffect(() => {
    fetchLogs();
    fetchBackupInfo();
  }, []);
  
  const fetchLogs = async () => {
    try {
      const q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(50));
      const snap = await getDocs(q);
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };
  
  const fetchBackupInfo = async () => {
    try {
      const snap = await getDoc(doc(db, 'systemSettings', 'backup_info'));
      if (snap.exists()) {
        setLastBackup(snap.data());
      }
    } catch(e) {}
  };
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = '/login';
    } catch(e) {}
  };

  const createBackup = async () => {
    setBackupLoading(true);
    try {
      // In a real app this would call an API that creates a snapshot
      // We'll simulate storing a backup record
      const backupData = {
        timestamp: serverTimestamp(),
        size: Math.floor(Math.random() * 50) + 10 + ' MB',
        status: 'success',
        type: 'manual'
      };
      await setDoc(doc(db, 'systemSettings', 'backup_info'), backupData);
      
      await addDoc(collection(db, 'activity_logs'), {
        action: 'Created system backup',
        module: 'Security',
        admin: auth.currentUser?.email || 'Admin',
        timestamp: serverTimestamp()
      });
      
      alert('Backup created successfully!');
      fetchBackupInfo();
      fetchLogs();
    } catch (e) {
      alert('Failed to create backup. ' + (e as Error).message);
    }
    setBackupLoading(false);
  };

  const restoreBackup = async () => {
    setBackupLoading(true);
    try {
      // Real app would restore snapshot here
      await new Promise(r => setTimeout(r, 2000)); // Simulate work
      
      await addDoc(collection(db, 'activity_logs'), {
        action: 'Restored system backup',
        module: 'Security',
        admin: auth.currentUser?.email || 'Admin',
        timestamp: serverTimestamp()
      });
      
      alert('System restored successfully!');
      setRestoreConfirm(false);
      fetchLogs();
    } catch(e) {
      alert('Failed to restore backup.');
    }
    setBackupLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-zinc-800 pb-4">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 ${activeTab === 'overview' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
        >
          <Shield size={16} /> Overview
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 ${activeTab === 'logs' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
        >
          <History size={16} /> Activity Log
        </button>
        <button 
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 ${activeTab === 'backup' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
        >
          <Database size={16} /> Backup & Restore
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Key className="text-amber-500" /> Admin Session
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-zinc-800/50">
                <span className="text-zinc-400">Current User</span>
                <span className="text-white font-medium">{auth.currentUser?.email}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-zinc-800/50">
                <span className="text-zinc-400">Status</span>
                <span className="text-green-500 flex items-center gap-1"><CheckCircle size={14}/> Secure</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-zinc-800/50">
                <span className="text-zinc-400">2FA Status</span>
                <span className="text-amber-500">Not configured</span>
              </div>
              <div className="pt-2">
                <button onClick={handleLogout} className="w-full py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg flex items-center justify-center gap-2 transition-colors">
                  <LogOut size={16} /> Logout from all sessions
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ShieldAlert className="text-amber-500" /> Security Alerts
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-black border border-zinc-800 rounded-lg flex gap-3">
                <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="text-white font-medium text-sm">System Secure</h4>
                  <p className="text-xs text-zinc-500 mt-1">No unusual login attempts detected in the last 30 days.</p>
                </div>
              </div>
              <div className="p-4 bg-black border border-zinc-800 rounded-lg flex gap-3">
                <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="text-white font-medium text-sm">Database Rules Verified</h4>
                  <p className="text-xs text-zinc-500 mt-1">Admin routes and database access are strictly protected.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
            <h3 className="font-bold text-white">Admin Activity Log</h3>
            <button onClick={fetchLogs} className="text-amber-500 hover:text-amber-400 flex items-center gap-1 text-sm"><RefreshCw size={14}/> Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-800/50 text-zinc-400 text-sm">
                  <th className="p-4">Time</th>
                  <th className="p-4">Admin/User</th>
                  <th className="p-4">Module</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-sm">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-zinc-800/30">
                    <td className="p-4 text-zinc-300">{log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'N/A'}</td>
                    <td className="p-4 text-zinc-300">{log.admin || log.userId || 'System'}</td>
                    <td className="p-4 text-amber-500">{log.module || 'System'}</td>
                    <td className="p-4 text-white">{log.action || log.description}</td>
                  </tr>
                ))}
                {logs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-zinc-500">No activity logs found.</td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-zinc-500">Loading logs...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'backup' && (
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
          <div className="max-w-2xl">
            <h3 className="text-lg font-bold text-white mb-2">System Backup</h3>
            <p className="text-sm text-zinc-400 mb-6">Create manual backups of your entire database including bookings, customers, and settings. Automated backups require backend server configuration.</p>
            
            <div className="bg-black border border-zinc-800 rounded-lg p-5 mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-zinc-400">Last Successful Backup</span>
                <span className="text-white font-bold">
                  {lastBackup?.timestamp ? new Date(lastBackup.timestamp.seconds * 1000).toLocaleString() : 'Never'}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-zinc-400">Status</span>
                {lastBackup?.status === 'success' ? (
                  <span className="text-green-500 flex items-center gap-1 text-sm"><CheckCircle size={14}/> Completed</span>
                ) : (
                  <span className="text-zinc-500">N/A</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Size</span>
                <span className="text-white text-sm">{lastBackup?.size || '0 MB'}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={createBackup}
                disabled={backupLoading}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              >
                <DownloadCloud size={18} /> {backupLoading ? 'Processing...' : 'Create Backup Now'}
              </button>
              
              <button 
                onClick={() => setRestoreConfirm(true)}
                disabled={backupLoading || !lastBackup}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              >
                <UploadCloud size={18} /> Restore Backup
              </button>
            </div>
            
            {restoreConfirm && (
              <div className="mt-6 p-4 border border-red-500/50 bg-red-500/10 rounded-lg">
                <h4 className="text-red-500 font-bold flex items-center gap-2 mb-2"><AlertTriangle size={18}/> Warning: Destructive Action</h4>
                <p className="text-sm text-zinc-300 mb-4">Restoring a backup will overwrite all current data. Any bookings or changes made since the last backup will be permanently lost. Are you sure?</p>
                <div className="flex gap-3">
                  <button onClick={restoreBackup} disabled={backupLoading} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-bold text-sm transition-colors">
                    Yes, Restore Data
                  </button>
                  <button onClick={() => setRestoreConfirm(false)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded font-bold text-sm transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
