import { logActivity } from '../utils/activity';
import { createNotification } from '../utils/notifications';
import { useLanguage } from "../lib/LanguageContext";
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, Phone, Key } from 'lucide-react';
import { motion } from 'motion/react';
import { signInWithEmailAndPassword, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { formatPhone, getFirebaseErrorMessage } from '../utils/phoneAuth';

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

type LoginMethod = 'mobile-password' | 'email-password';

export default function Login() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('mobile-password');
  
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
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
          visits: 0,
          totalSpent: 0
        });
        await logActivity(user.uid, 'Account Created', 'Successfully created new account via Google');
        await createNotification(user.uid, 'Welcome to RV 2 Luxe Salon!', 'Your account has been successfully created. Enjoy 100 Welcome Points!', 'Registration');
      } else {
        await logActivity(user.uid, 'Login', 'Logged in via Google');
        await createNotification(user.uid, 'Login Successful', 'You have successfully logged in.', 'Login');
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (isResetMode) {
      if (!formData.email) {
        setError('Please enter your email address to reset password.');
        return;
      }
      setLoading(true);
      try {
        await sendPasswordResetEmail(auth, formData.email);
        setMessage('Password reset link sent to your email.');
        setIsResetMode(false);
      } catch (err: any) {
        setError(err.message || 'Error sending reset link.');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);

    try {
      if (loginMethod === 'mobile-password') {
        if (!formData.phone || !formData.password) {
          throw new Error('Please fill in all fields.');
        }
        if (formData.phone.length < 10) {
            throw new Error('Please enter a valid 10-digit mobile number.');
        }
        await setPersistence(auth, formData.rememberMe ? browserLocalPersistence : browserSessionPersistence);
        const formattedPhone = formatPhone(formData.phone);
        // Lookup auth email
        const phoneDoc = await getDoc(doc(db, 'phone_to_email', formattedPhone));
        if (!phoneDoc.exists()) {
          throw new Error('Account not found. Please sign up first.');
        }
        
        const authEmail = phoneDoc.data().email;
        const credential = await signInWithEmailAndPassword(auth, authEmail, formData.password);
        
        await logActivity(credential.user.uid, 'Login', 'Logged in with Phone and Password');
        await createNotification(credential.user.uid, 'Login Successful', 'You have successfully logged in.', 'Login');
        
        navigate('/dashboard');
      }
      else if (loginMethod === 'email-password') {
        if (!formData.email || !formData.password) {
          throw new Error('Please fill in all fields.');
        }
        await setPersistence(auth, formData.rememberMe ? browserLocalPersistence : browserSessionPersistence);
        const credential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        
        await logActivity(credential.user.uid, 'Login', 'Logged in with Email and Password');
        await createNotification(credential.user.uid, 'Login Successful', 'You have successfully logged in.', 'Login');
        
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-black flex flex-col justify-center relative overflow-hidden">
      <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none transform -translate-y-1/2"></div>
      
      <div className="relative z-10 max-w-md w-full mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500 text-black mb-6 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <span className="font-serif font-bold text-xl">RV</span>
          </Link>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-zinc-400 font-light">Sign in to your account</p>
        </div>

        <motion.div 
          variants={fadeUpVariant}
          initial="hidden"
          animate="visible"
          className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-8 shadow-2xl"
        >
          {!isResetMode && (
            <div className="flex bg-black/50 p-1 rounded-xl mb-6">
              <button
                onClick={() => setLoginMethod('mobile-password')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg flex flex-col items-center gap-1 transition-all ${loginMethod === 'mobile-password' ? 'bg-zinc-800 text-amber-500 shadow-lg' : 'text-zinc-500 hover:text-white'}`}
              >
                <Key size={16} />
                <span>Phone + Pass</span>
              </button>
              <button
                onClick={() => setLoginMethod('email-password')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg flex flex-col items-center gap-1 transition-all ${loginMethod === 'email-password' ? 'bg-zinc-800 text-amber-500 shadow-lg' : 'text-zinc-500 hover:text-white'}`}
              >
                <Mail size={16} />
                <span>Email + Pass</span>
              </button>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm text-center flex flex-col gap-2">
                <span>{error}</span>
                {error.includes('Account not found') && (
                  <Link to="/signup" className="bg-amber-500 text-black px-4 py-2 rounded font-bold text-xs uppercase tracking-widest hover:bg-amber-400 transition-colors mx-auto w-fit">
                    Create Account
                  </Link>
                )}
              </div>
            )}
            
            {message && (
              <div className="p-3 bg-green-500/10 border border-green-500/50 rounded text-green-500 text-sm text-center">
                {message}
              </div>
            )}
            
            {!isResetMode && loginMethod === 'mobile-password' && (
              <div className="group">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
                  </div>
                  <input
                    type="tel"
                    name="phone" maxLength={10}
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="block w-full pl-11 pr-4 py-3.5 bg-black/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    placeholder={t("auth.phone")}
                  />
                </div>
              </div>
            )}

            {(isResetMode || loginMethod === 'email-password') && (
              <div className="group">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-11 pr-4 py-3.5 bg-black/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    placeholder={t('auth.email')}
                  />
                </div>
              </div>
            )}

            {!isResetMode && (
              <div className="group">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-11 pr-12 py-3.5 bg-black/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    placeholder={t('auth.password')}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}

            {!isResetMode && (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="w-4 h-4 bg-black border border-zinc-700 rounded text-amber-500 focus:ring-amber-500 focus:ring-offset-black transition-colors cursor-pointer"
                  />
                  <label htmlFor="rememberMe" className="text-sm text-zinc-400 font-light cursor-pointer select-none">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setIsResetMode(true)}
                  className="text-sm text-amber-500 hover:text-amber-400 transition-colors font-medium"
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden rounded-xl bg-amber-500 text-black font-bold py-4 uppercase tracking-widest text-sm transition-all hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2"
            >
              <span className="relative z-10 flex items-center gap-2">
                {loading ? 'Processing...' : (isResetMode ? 'Send Reset Link' : 'Log In')}
                {!loading && !isResetMode && <LogIn size={18} className="transform group-hover:translate-x-1 transition-transform" />}
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
            </button>

            {isResetMode && (
              <div className="text-center space-y-4 mt-4">
                <p className="text-sm text-zinc-400 font-light">
                  To reset via Mobile Number, please log in with your email or contact support if you do not have an email attached.
                </p>
                <button
                  type="button"
                  onClick={() => setIsResetMode(false)}
                  className="w-full text-center text-sm text-zinc-500 hover:text-white transition-colors"
                >
                  Back to Login
                </button>
              </div>
            )}

            {!isResetMode && (
              <p className="text-center text-sm text-zinc-500 pt-4 font-light">
                {t('auth.noAccount')} <Link to="/signup" className="text-amber-500 hover:text-amber-400 font-medium transition-colors">{t('auth.signupBtn')}</Link>
              </p>
            )}
          </form>
                  <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-zinc-900/60 text-zinc-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
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
          
          <p className="text-center text-sm text-zinc-500 pt-6 font-light">
            Don't have an account? <Link to="/signup" className="text-amber-500 hover:text-amber-400 font-medium transition-colors">Create Account</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
