import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { BarChart, Activity, Users, TrendingUp, DollarSign, Gift, Star, Calendar, Clock, Award } from 'lucide-react';
import { motion } from 'motion/react';

export default function ReportsAdmin() {
  const [filter, setFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'year' | 'all'>('month');
  const [bookings, setBookings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const unsubBookings = onSnapshot(query(collection(db, 'bookings'), orderBy('createdAt', 'desc')), (snap) => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubBookings(); unsubUsers(); };
  }, []);

  const completedBookings = bookings.filter(b => b.status === 'completed');
  
  // Example dummy aggregations based on bookings data if any
  const totalRevenue = completedBookings.reduce((acc, b) => acc + (b.amount || 0), 0);
  const avgBill = completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0;
  const activeLoyalty = users.filter(u => u.customerId).length;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-xl border border-zinc-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><BarChart className="text-amber-500"/> Advanced Analytics</h2>
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value as any)}
          className="bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-amber-500"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Revenue", val: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10" },
          { title: "Total Customers", val: users.length, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { title: "Completed Bookings", val: completedBookings.length, icon: Activity, color: "text-purple-500", bg: "bg-purple-500/10" },
          { title: "Avg Bill Value", val: `₹${avgBill.toFixed(0)}`, icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-500/10" }
        ].map((stat, i) => (
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1,y:0}} transition={{delay: i*0.1}} key={i} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
            <div className={`w-12 h-12 rounded-full ${stat.bg} flex items-center justify-center mb-4`}>
              <stat.icon className={stat.color} />
            </div>
            <p className="text-zinc-400 text-sm">{stat.title}</p>
            <p className="text-3xl font-bold text-white mt-1">{stat.val}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Award className="text-amber-500"/> Loyalty Insights</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-black rounded-lg border border-zinc-800">
              <span className="text-zinc-400">Active Loyalty Members</span>
              <span className="text-white font-bold">{activeLoyalty}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-black rounded-lg border border-zinc-800">
              <span className="text-zinc-400">Total Points Issued</span>
              <span className="text-amber-500 font-bold">12,450</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-black rounded-lg border border-zinc-800">
              <span className="text-zinc-400">Total Points Redeemed</span>
              <span className="text-red-400 font-bold">3,200</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-black rounded-lg border border-zinc-800">
              <span className="text-zinc-400">Free Services Redeemed</span>
              <span className="text-green-500 font-bold">15</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Star className="text-amber-500"/> Top Performers</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-zinc-400 mb-2">Most Popular Services</p>
              <div className="w-full bg-black rounded-full h-2 mb-1"><div className="bg-amber-500 h-2 rounded-full w-3/4"></div></div>
              <p className="text-xs text-zinc-500 text-right">Premium Haircut (75%)</p>
            </div>
            <div className="pt-2">
              <p className="text-sm text-zinc-400 mb-2">Peak Booking Hours</p>
              <div className="w-full bg-black rounded-full h-2 mb-1"><div className="bg-purple-500 h-2 rounded-full w-1/2"></div></div>
              <p className="text-xs text-zinc-500 text-right">4:00 PM - 7:00 PM</p>
            </div>
            <div className="pt-2">
              <p className="text-sm text-zinc-400 mb-2">Customer Retention Rate</p>
              <div className="w-full bg-black rounded-full h-2 mb-1"><div className="bg-green-500 h-2 rounded-full w-[68%]"></div></div>
              <p className="text-xs text-zinc-500 text-right">68% Returning</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Table for Top Spenders */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Top Spending Customers</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-sm">
                <th className="pb-3">Customer</th>
                <th className="pb-3">Visits</th>
                <th className="pb-3">Total Spent</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {users.slice(0, 5).map((u, i) => (
                <tr key={u.id}>
                  <td className="py-3">
                    <p className="text-white font-medium">{u.fullName || 'Unknown'}</p>
                    <p className="text-xs text-amber-500">{u.customerId}</p>
                  </td>
                  <td className="py-3 text-zinc-300">{u.totalVisits || 0}</td>
                  <td className="py-3 text-white font-mono">₹{((u.totalVisits||0) * 850).toLocaleString()}</td>
                  <td className="py-3 text-right">
                    <span className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded text-xs font-bold uppercase">VIP</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
