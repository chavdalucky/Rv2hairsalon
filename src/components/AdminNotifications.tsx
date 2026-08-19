import React, { useState } from 'react';
import { Send, Bell, Users, Clock } from 'lucide-react';
import { createNotification, NotificationType } from '../utils/notifications';

export default function AdminNotifications() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<NotificationType>('Announcement');
  const [targetUser, setTargetUser] = useState('all');
  const [specificUserId, setSpecificUserId] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) {
      setError('Title and body are required');
      return;
    }
    
    if (targetUser === 'specific' && !specificUserId) {
      setError('User ID is required for specific user target');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const target = targetUser === 'all' ? 'all' : specificUserId;
      const scheduledDate = scheduledFor ? new Date(scheduledFor) : undefined;
      
      await createNotification(target, title, body, type, scheduledDate);
      setSuccess(scheduledDate ? 'Notification scheduled successfully!' : 'Notification sent successfully!');
      setTitle('');
      setBody('');
      setScheduledFor('');
    } catch (err: any) {
      setError(err.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-2xl mt-6">
      <div className="flex items-center gap-2 mb-6">
        <Send size={20} className="text-amber-500" />
        <h3 className="text-lg font-serif font-bold text-white">Send Push Notifications (Admin)</h3>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-500">
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/50 rounded-xl flex items-center gap-3 text-green-500">
          <p className="text-sm">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">Target Audience</label>
          <select 
            value={targetUser}
            onChange={(e) => setTargetUser(e.target.value)}
            className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all appearance-none"
          >
            <option value="all">All Users (Broadcast)</option>
            <option value="specific">Specific User (Requires User ID)</option>
          </select>
        </div>
        
        {targetUser === 'specific' && (
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">User ID</label>
            <input 
              type="text" 
              value={specificUserId}
              onChange={(e) => setSpecificUserId(e.target.value)}
              placeholder="Enter User ID"
              className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Schedule For (Optional)</label>
            <input 
              type="datetime-local" 
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Notification Type</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value as NotificationType)}
              className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all appearance-none"
            >
              <option value="Announcement">Announcement</option>
              <option value="Security Alert">Security Alert</option>
              <option value="Admin Message">Admin Message</option>
              <option value="Promotion">Promotion</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">Title</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="E.g., New Feature Alert!"
            className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">Message Body</label>
          <textarea 
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Type your message here..."
            className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all resize-none"
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black font-bold uppercase tracking-widest text-sm rounded-xl hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2"
        >
          <Bell size={18} />
          {loading ? 'Sending...' : 'Send Notification'}
        </button>
      </form>
    </div>
  );
}
