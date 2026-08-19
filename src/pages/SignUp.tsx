import { logActivity } from '../utils/activity';
import { createNotification } from '../utils/notifications';
import { useLanguage } from "../lib/LanguageContext";
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '../lib/toast';
import { Mail, User, ShieldCheck, CheckCircle, Phone, Calendar, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { updateProfile, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { formatPhone, getFirebaseErrorMessage, setupRecaptcha } from '../utils/phoneAuth';
import { triggerHaptic } from '../utils/haptics';
import { trackEvent } from '../utils/analytics';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.4 } }
};

export default function SignUp() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    dob: '',
    acceptTerms: false
  });
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');

  useEffect(() => {
    if (dobDay && dobMonth && dobYear) {
      setFormData(prev => ({
        ...prev,
        dob: `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`
      }));
      if (error === 'Please select your full Date of Birth.') {
         setError('');
      }
    } else {
      setFormData(prev => ({ ...prev, dob: '' }));
    }
  }, [dobDay, dobMonth, dobYear, error]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    let finalValue = type === 'checkbox' ? checked : value;
    if (name === 'phone' && typeof finalValue === 'string') {
        finalValue = finalValue.replace(/\D/g, '').substring(0, 10);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };



  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          fullName: user.displayName || 'New User',
          email: user.email,
          phone: user.phoneNumber || null,
          phoneVerified: !!user.phoneNumber,
          createdAt: new Date().toISOString(),
          role: 'user',
          rewardPoints: 10,
          rewardsTier: 'Bronze',
          totalVisits: 0,
          visits: 0,
          totalSpent: 0
        });
        
        await addDoc(collection(db, 'rewardHistory'), {
            userId: user.uid,
            adminId: 'system',
            action: `Welcome Bonus`,
            reason: `Sign up reward via Google`,
            previousPoints: 0,
            newPoints: 10,
            previousVisits: 0,
            newVisits: 0,
            date: serverTimestamp()
        });
        await logActivity(user.uid, 'Account Created', 'Successfully created new account via Google');
        await createNotification(user.uid, 'Welcome to RV 2 Luxe Salon!', 'Your account has been successfully created. Enjoy 100 Welcome Points!', 'Registration');
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code === 'auth/popup-blocked') {
          setError('Popup blocked by browser. Please allow popups for this site and try again.');
      } else if (err.code !== 'auth/popup-closed-by-user') {
          setError(err.message || 'Failed to authenticate with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName) {
      setError('Full Name is required.');
      return;
    }
    if (!formData.phone || formData.phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!formData.dob) {
      setError('Please select your full Date of Birth.');
      return;
    }
    if (!formData.acceptTerms) {
      setError('Please accept the Terms of Service and Privacy Policy.');
      return;
    }

    const selectedDate = new Date(formData.dob);
    if (selectedDate > new Date()) {
      setError('Date of birth cannot be in the future.');
      return;
    }

    setLoading(true);

    try {
      if (formData.email) {
        const emailDoc = await getDoc(doc(db, 'email_to_phone', formData.email.toLowerCase()));
        if (emailDoc.exists()) {
          throw new Error('An account with this email already exists. Please log in.');
        }
      }

      const formattedPhone = formatPhone(formData.phone);
      const phoneDoc = await getDoc(doc(db, 'phone_to_email', formattedPhone));
      if (phoneDoc.exists()) {
        throw new Error('An account with this mobile number already exists. Please log in.');
      }

      const authEmail = formData.email ? formData.email.toLowerCase() : `${formattedPhone.replace('+', '')}@tempapp.com`;
      const dobString = formData.dob;

      // Import createUserWithEmailAndPassword at top if needed, we'll assume we can use it.
      // Wait, we need to import it. Let's do it in another step.
      
      const userCredential = await createUserWithEmailAndPassword(auth, authEmail, formData.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: formData.fullName });

      await setDoc(doc(db, 'phone_to_email', formattedPhone), { 
          email: authEmail,
          uid: user.uid
      });
      if (formData.email) {
        await setDoc(doc(db, 'email_to_phone', authEmail), { 
            phone: formattedPhone,
            uid: user.uid
        });
      }

      await setDoc(doc(db, 'users', user.uid), {
        fullName: formData.fullName,
        phone: formattedPhone,
        email: formData.email || null,
        phoneVerified: true,
        dob: dobString,
        createdAt: new Date().toISOString(),
        role: 'user',
        rewardPoints: 10,
        rewardsTier: 'Bronze',
        visits: 0,
        totalSpent: 0
      });

      await logActivity(user.uid, 'Account Created', 'Successfully created new account');
      await createNotification(user.uid, 'Welcome to RV 2 Luxe Salon!', 'Your account has been successfully created. Enjoy 100 Welcome Points!', 'Registration');

      navigate('/dashboard');
    } catch (err: any) {
      const msg = getFirebaseErrorMessage(err);
      setError(msg);
      toast(msg);
    } finally {
      setLoading(false);
    }
  };



  const years = Array.from({ length: new Date().getFullYear() - 1950 + 1 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen pt-20 bg-black flex flex-col justify-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none transform -translate-y-1/2"></div>
      
      <div className="relative z-10 max-w-md w-full mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500 text-black mb-6 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <span className="font-serif font-bold text-xl">RV</span>
          </Link>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">Create Account</h1>
          <p className="text-zinc-400 font-light">Join RV 2 for exclusive access</p>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.form
              key="signup-form"
              variants={fadeUpVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              onSubmit={handleSignUp}
              className="space-y-5"
            >
              {error && <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm text-center">{error}</div>}

              <div>
                <label className="block text-sm text-zinc-400 mb-2 font-light">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="block w-full pl-11 pr-4 py-3 bg-black/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    placeholder="Full Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2 font-light">Mobile Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    required
                    maxLength={10}
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="block w-full pl-11 pr-4 py-3 bg-black/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    placeholder="Mobile Number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2 font-light">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-11 pr-4 py-3 bg-black/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    placeholder="Email Address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2 font-light">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <ShieldCheck className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-11 pr-4 py-3 bg-black/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    placeholder="Create Password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2 font-light">Date of Birth</label>
                <div className="flex gap-2">
                  <select
                    value={dobDay}
                    onChange={(e) => setDobDay(e.target.value)}
                    className="flex-1 bg-black/50 border border-zinc-800 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-amber-500 "
                  >
                    <option value="" disabled>Day</option>
                    {days.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <select
                    value={dobMonth}
                    onChange={(e) => setDobMonth(e.target.value)}
                    className="flex-1 bg-black/50 border border-zinc-800 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-amber-500 "
                  >
                    <option value="" disabled>Month</option>
                    {months.map(m => (
                      <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                  </select>
                  <select
                    value={dobYear}
                    onChange={(e) => setDobYear(e.target.value)}
                    className="flex-1 bg-black/50 border border-zinc-800 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-amber-500 "
                  >
                    <option value="" disabled>Year</option>
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2">
                <div className="flex items-center h-5">
                  <input
                    id="acceptTerms"
                    name="acceptTerms"
                    type="checkbox"
                    required
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className="w-4 h-4 bg-black border border-zinc-700 rounded text-amber-500 focus:ring-amber-500 focus:ring-offset-black transition-colors cursor-pointer"
                  />
                </div>
                <label htmlFor="acceptTerms" className="text-sm text-zinc-400 font-light cursor-pointer select-none">
                  I accept the <a href="/terms" className="text-amber-500 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-amber-500 hover:underline">Privacy Policy</a>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full relative group overflow-hidden rounded-xl bg-amber-500 text-black font-bold py-4 uppercase tracking-widest text-sm transition-all hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 shadow-[0_0_20px_rgba(245,158,11,0.2)] mt-4"
              >
                <span className="relative z-10">{loading ? 'Creating Account...' : 'Create Account'}</span>
              </button>
              
              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-800"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-zinc-900/60 text-zinc-500">Or continue with</span>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={handleGoogleSignIn}
                    type="button"
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-zinc-700 rounded-xl bg-black text-white hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 focus:ring-offset-zinc-900"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </button>
                </div>
              </div>
              
              <p className="text-center text-sm text-zinc-500 pt-4 font-light">
                Already have an account? <Link to="/login" className="text-amber-500 hover:text-amber-400 font-medium transition-colors">Log In</Link>
              </p>
            </motion.form>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
