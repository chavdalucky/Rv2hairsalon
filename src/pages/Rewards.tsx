import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';
import { Sparkles, Gift, Star, Clock, Trophy, ChevronRight } from 'lucide-react';
import { auth, db } from '../../firebase';
import { doc, getDoc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Rewards() {
  const { t } = useLanguage();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>({
    pointsPerHundred: 10,
    discountPerHundredPoints: 100,
    visitsForFreeService: 10,
    birthdayDiscountPercentage: 20
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'loyaltySettings', 'config'));
        if (snap.exists()) {
          setSettings(snap.data());
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    };
    fetchSettings();

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const unsubDoc = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserProfile({
              ...data,
              id: user.uid,
              rewardPoints: data.rewardPoints || 0,
              totalVisits: data.totalVisits || 0
            });
          }
          setLoading(false);
        });
        
        const historyQuery = query(
          collection(db, 'rewardHistory'), 
          where('userId', '==', user.uid),
          orderBy('date', 'desc'),
          limit(10)
        );
        const unsubHistory = onSnapshot(historyQuery, (snap) => {
          setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => {
          unsubDoc();
          unsubHistory();
        };
      } else {
        setLoading(false);
        navigate('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 bg-zinc-950 flex items-center justify-center">
        <div className="text-amber-500 font-serif text-xl tracking-widest animate-pulse flex items-center gap-3">
          <Sparkles className="animate-spin" /> Loading Rewards...
        </div>
      </div>
    );
  }

  const rewardPoints = userProfile?.rewardPoints || 0;
  const totalVisits = userProfile?.totalVisits || 0;
  const visitsForFreeSpa = settings.visitsForFreeService || 10;
  const visitsRemaining = visitsForFreeSpa - (totalVisits % visitsForFreeSpa);
  
  // Value of 1 point in Rs
  const pointValueInRs = settings.discountPerHundredPoints / 100;
  const discountValue = Math.floor(rewardPoints * pointValueInRs); 
  const pointsToNextHundred = 100 - (rewardPoints % 100);

  return (
    <div className="min-h-screen pt-24 pb-20 bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 border border-amber-500/30 mb-6 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
            <Trophy className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">{t('rewards.title')} <span className="text-amber-500">Rewards</span></h1>
          <p className="text-zinc-400 font-light text-lg mb-2">{userProfile?.fullName}</p>
          <p className="text-amber-500/70 font-mono text-sm tracking-widest">ID: {userProfile?.customerId}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Current Points Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-black border border-amber-500/30 rounded-2xl p-8 shadow-[0_10px_30px_rgba(245,158,11,0.05)] relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-amber-500/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-amber-500/20 transition-colors duration-1000"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <h3 className="text-zinc-400 font-serif tracking-widest uppercase text-sm mb-2 flex items-center gap-2">
                  <Star size={16} className="text-amber-500" /> Current Points
                </h3>
                <div className="text-6xl font-serif font-bold text-white mb-2">{rewardPoints}</div>
                <div className="text-amber-500 font-medium">Equals ₹{discountValue} Discount</div>
              </div>
              <div className="mt-8">
                <div className="flex justify-between text-sm text-zinc-400 mb-2">
                  <span>Progress to next ₹100</span>
                  <span>{rewardPoints % 100}/100</span>
                </div>
                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${rewardPoints % 100}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-2">Only {pointsToNextHundred} more points to earn another ₹100 discount.</p>
              </div>
              <button onClick={() => navigate('/services?redeem=true')} disabled={rewardPoints < 100} className="w-full mt-6 py-3 bg-amber-500 text-black font-bold uppercase tracking-widest text-sm rounded transition-all duration-300 hover:bg-amber-400 md:hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_15px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:scale-100">
                {rewardPoints >= 100 ? 'Redeem Now' : 'Keep Earning'}
              </button>
            </div>
          </motion.div>

          {/* Visits Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-black border border-zinc-800 rounded-2xl p-8 hover:border-amber-500/30 transition-colors duration-500 relative overflow-hidden"
          >
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <h3 className="text-zinc-400 font-serif tracking-widest uppercase text-sm mb-2 flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" /> Free Spa Progress
                </h3>
                <div className="text-4xl font-serif font-bold text-white mb-2">{totalVisits % visitsForFreeSpa} <span className="text-2xl text-zinc-500 font-light">/ {visitsForFreeSpa}</span></div>
                <div className="text-zinc-300 font-light">Total Visits: {totalVisits}</div>
              </div>
              <div className="mt-8">
                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden mb-2 relative flex">
                  {[...Array(visitsForFreeSpa)].map((_, i) => (
                    <div key={i} className="flex-1 h-full border-r border-black last:border-0 relative">
                      {i < (totalVisits % visitsForFreeSpa) && (
                        <motion.div 
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.4, delay: 0.5 + (i * 0.1) }}
                          className="absolute inset-0 bg-amber-500 origin-left"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-amber-500">
                  {visitsRemaining === visitsForFreeSpa ? 'You have a FREE Service available!' : `${visitsRemaining} more visit${visitsRemaining > 1 ? 's' : ''} for a FREE Hair Spa or Head Massage.`}
                </p>
              </div>
              {visitsRemaining === visitsForFreeSpa && totalVisits > 0 && (
                <button className="w-full mt-6 py-3 bg-green-500 text-black font-bold uppercase tracking-widest text-sm rounded transition-all duration-300 hover:bg-green-400 md:hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                  Redeem Free Service
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Reward History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
            <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              <Clock size={20} className="text-amber-500" /> Reward Activity Log
            </h3>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {history.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 + (index * 0.1) }}
                className="p-6 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
              >
                <div>
                  <p className="text-white font-medium mb-1">{item.action}</p>
                  <p className="text-sm text-zinc-400">{item.reason}</p>
                  {item.isBirthday && (
                     <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                        Birthday Offer Applied: 20% Discount
                     </span>
                  )}
                  <p className="text-xs text-zinc-500 mt-1">{item.date?.toDate ? new Date(item.date.toDate()).toLocaleString() : 'Just now'}</p>
                </div>
                <div className={`font-bold font-serif text-lg ${item.newPoints > item.previousPoints ? 'text-green-500' : item.newPoints < item.previousPoints ? 'text-amber-500' : 'text-zinc-300'}`}>
                  {item.newPoints !== item.previousPoints ? (item.newPoints > item.previousPoints ? `+${item.newPoints - item.previousPoints}` : `-${item.previousPoints - item.newPoints}`) : (item.newVisits > item.previousVisits ? '+1 Visit' : '')}
                </div>
              </motion.div>
            ))}
            {history.length === 0 && (
              <div className="p-8 text-center text-zinc-500">
                No activity yet. Book your first appointment to earn rewards!
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
