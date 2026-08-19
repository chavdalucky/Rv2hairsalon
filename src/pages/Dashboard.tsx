import React, { useState, useEffect, useRef } from 'react';
import OptimizedImage from '../components/OptimizedImage';
import { logActivity } from '../utils/activity';
import { createNotification, requestNotificationPermission } from '../utils/notifications';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';
import { User, Mail, Phone, Lock, LogOut, CheckCircle, AlertCircle, Edit2, Shield, Camera, Heart, Sparkles, Calendar } from 'lucide-react';
import { auth, db, storage } from '../../firebase';
import { formatPhone, getFirebaseErrorMessage, setupRecaptcha } from '../utils/phoneAuth';
import { signOut, updatePassword, updateProfile, deleteUser, EmailAuthProvider, reauthenticateWithCredential, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { doc, getDoc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import ActivityHistory from '../components/ActivityHistory';
import MyAppointments from '../components/MyAppointments';
import AdminNotifications from '../components/AdminNotifications';
declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

export default function Dashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    dob: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  
  const years = Array.from({ length: new Date().getFullYear() - 1950 + 1 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const [verifyPhoneModal, setVerifyPhoneModal] = useState(false);
  
  const [verifyPhoneInput, setVerifyPhoneInput] = useState('');
  
  
  
  useEffect(() => {
    return () => {
      try {
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        }
      } catch (e) {}
    };
  }, []);


  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    setUploadingPhoto(true);
    setError('');

    try {
      // Create a canvas to compress the image
      const imageBitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 300;
      const MAX_HEIGHT = 300;
      let width = imageBitmap.width;
      let height = imageBitmap.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      ctx.drawImage(imageBitmap, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

      const storageRef = ref(storage, `profile_photos/${auth.currentUser.uid}/${Date.now()}.jpg`);
      await uploadString(storageRef, dataUrl, 'data_url');
      const downloadURL = await getDownloadURL(storageRef);

      await updateProfile(auth.currentUser, { photoURL: downloadURL });
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        photoURL: downloadURL
      });

      
      await logActivity(auth.currentUser.uid, 'Profile Photo Updated', 'Uploaded new profile photo');

      setUserProfile((prev: any) => ({ ...prev, photoURL: downloadURL }));
      setSuccess('Profile photo updated successfully.');
    } catch (err: any) {
      console.error('[PhoneAuth] ERROR in Dashboard:', err);
      setError('Failed to upload photo. You might not have permission or there was a network error.');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!auth.currentUser) return;
    setUploadingPhoto(true);
    try {
      await updateProfile(auth.currentUser, { photoURL: '' });
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        photoURL: null
      });

      
      await logActivity(auth.currentUser.uid, 'Profile Photo Updated', 'Removed profile photo');

      setUserProfile((prev: any) => ({ ...prev, photoURL: null }));
      setSuccess('Profile photo removed.');
    } catch (err: any) {
      setError('Failed to remove photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }
      
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserProfile(data);
          setFormData(prev => ({
            ...prev,
            fullName: data.fullName || user.displayName || '',
            phone: data.phone || '',
            dob: data.dob || ''
          }));
          if (data.dob) {
            const [y, m, d] = data.dob.split('-');
            setDobYear(y || '');
            setDobMonth(m ? String(parseInt(m)) : '');
            setDobDay(d ? String(parseInt(d)) : '');
          }
          
          if (user.emailVerified && !data.emailVerifiedLogged && user.email && !user.email.endsWith('@rv2.app')) {
            
            await logActivity(user.uid, 'Email Verified', 'Email address verified');
            await updateDoc(docRef, { emailVerifiedLogged: true });
          }
          
          // Ask for notification permission after login
          if (Notification.permission === 'default') {
            setTimeout(async () => {
              
              await requestNotificationPermission(user.uid);
            }, 2000);
          }
        } else {
          setFormData(prev => ({
            ...prev,
            fullName: user.displayName || ''
          }));
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUserData();
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      if (auth.currentUser) {
        
        await logActivity(auth.currentUser.uid, 'Logout', 'Logged out successfully');
      }
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error('[PhoneAuth] ERROR in Dashboard:', err);
    }
  };




  const handleSendVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPhoneInput || verifyPhoneInput.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formattedPhone = formatPhone(verifyPhoneInput);
      
      // Check if phone already registered to someone else
      const phoneDoc = await getDoc(doc(db, 'phone_to_email', formattedPhone));
      if (phoneDoc.exists() && phoneDoc.data().uid !== user?.uid) {
        throw new Error('This mobile number is already registered to another account.');
      }

      // Update in users collection
      if (user?.uid) {
        await updateDoc(doc(db, 'users', user.uid), {
          phone: formattedPhone,
          phoneVerified: true // Set to true directly
        });
        
        // Update mapping
        await setDoc(doc(db, 'phone_to_email', formattedPhone), {
          email: user.email || `${formattedPhone.replace('+', '')}@rv2.app`,
          uid: user.uid
        });

        await logActivity(user.uid, 'Profile Updated', `Mobile number updated to ${formattedPhone}`);
        setVerifyPhoneModal(false);
      }
    } catch (err: any) {
      console.error('Error updating phone:', err);
      setError(err.message || 'Failed to update mobile number.');
    } finally {
      setLoading(false);
    }
  };


  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!auth.currentUser) return;
    
    try {
      setLoading(true);
      
      let finalDob = '';
      if (dobDay && dobMonth && dobYear) {
         finalDob = `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`;
      }
      
      let formattedPhone = '';
      if (formData.phone) {
         formattedPhone = formatPhone(formData.phone);
         
         // Update phone_to_email optionally if it's new
         if (formattedPhone !== userProfile?.phone) {
             const phoneDoc = await getDoc(doc(db, 'phone_to_email', formattedPhone));
             if (phoneDoc.exists() && phoneDoc.data().uid !== auth.currentUser.uid) {
                 throw new Error('This phone number is already registered to another account.');
             }
             await setDoc(doc(db, 'phone_to_email', formattedPhone), {
                 email: auth.currentUser.email || `${formattedPhone.replace('+', '')}@tempapp.com`,
                 uid: auth.currentUser.uid
             });
         }
      }
      
      await updateProfile(auth.currentUser, { displayName: formData.fullName });
      
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        fullName: formData.fullName,
        dob: finalDob,
        phone: formattedPhone
      });
      
      await logActivity(auth.currentUser.uid, 'Profile Updated', 'Updated profile information');
      await createNotification(auth.currentUser.uid, 'Profile Updated', 'Your profile information has been updated.', 'Profile Updated');
      
      setUserProfile((prev: any) => ({ ...prev, fullName: formData.fullName, dob: finalDob, phone: formattedPhone }));
      setFormData((prev: any) => ({ ...prev, phone: formattedPhone, dob: finalDob }));
      
      setSuccess('Profile updated successfully.');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (!auth.currentUser) return;
    
    try {
      setLoading(true);
      await updatePassword(auth.currentUser, formData.newPassword);
      
      
      
      await logActivity(auth.currentUser.uid, 'Password Changed', 'Successfully changed password');
      await createNotification(auth.currentUser.uid, 'Password Changed', 'Your password was successfully updated.', 'Password Changed');
      
      setSuccess('Password updated successfully.');
      setIsChangingPassword(false);
      setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
    } catch (err: any) {
      setError(err.message || 'Failed to update password. You may need to log in again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!deletePassword) {
      setError('Please enter your password to confirm deletion.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Re-authenticate
      const email = auth.currentUser.email || '';
      const credential = EmailAuthProvider.credential(email, deletePassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      const uid = auth.currentUser.uid;
      const userPhone = userProfile?.phone || formData.phone || '';
      
      // Log activity one last time
      
      await logActivity(uid, 'Account Deleted', 'User deleted their account');
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'users', uid));
      if (userPhone) {
        await deleteDoc(doc(db, 'phone_to_email', userPhone));
      }
      if (email && !email.endsWith('@rv2.app')) {
        await deleteDoc(doc(db, 'email_to_phone', email));
      }
      
      // Delete Photo if exists
      if (userProfile?.photoURL) {
        try {
          // get reference from url
          const photoRef = ref(storage, userProfile.photoURL);
          await deleteObject(photoRef);
        } catch (e) {
          console.error('Failed to delete photo:', e);
        }
      }
      
      // Delete User Auth
      await deleteUser(auth.currentUser);
      
      navigate('/');
    } catch (err: any) {
      console.error('[PhoneAuth] ERROR in Dashboard:', err);
      setError(err.message || 'Failed to delete account. Please check your password.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const user = auth.currentUser;
  
  // Hide dummy email generated for phone-only signups
  const displayEmail = user?.email?.endsWith('@rv2.app') ? null : user?.email;
  const isEmailVerified = displayEmail ? user?.emailVerified : false;
  const isPhoneVerified = userProfile?.phoneVerified;

  return (
    <div className="min-h-screen pt-28 pb-20 bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-zinc-800/20 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <motion.div variants={fadeUpVariant} initial="hidden" animate="visible">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-2">{t('dashboard.title')}</h1>
            <p className="text-zinc-400 font-light text-lg">Manage your profile and settings</p>
          </motion.div>
          <motion.button
            variants={fadeUpVariant} initial="hidden" animate="visible"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/30 rounded hover:bg-red-500 hover:text-white transition-all text-sm font-bold uppercase tracking-widest w-full md:w-auto"
          >
            <LogOut size={16} /> Sign Out
          </motion.button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-500 text-sm flex items-start gap-3">
            <CheckCircle size={20} className="shrink-0 mt-0.5" />
            <p>{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Profile Summary Card */}
          <motion.div 
            variants={fadeUpVariant} initial="hidden" animate="visible"
            className="md:col-span-1"
          >
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-2xl text-center">
              <div className="relative w-32 h-32 mx-auto mb-4 group">
                {userProfile?.photoURL || user?.photoURL ? (
                  <OptimizedImage 
                    src={userProfile?.photoURL || user?.photoURL} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover border-4 border-zinc-800 shadow-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-4xl text-black font-serif font-bold shadow-xl border-4 border-zinc-800">
                    {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                
                <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="text-white hover:text-amber-500 transition-colors"
                  >
                    <Camera size={24} />
                  </button>
                  {(userProfile?.photoURL || user?.photoURL) && (
                    <button 
                      onClick={handleRemovePhoto}
                      disabled={uploadingPhoto}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              
              {uploadingPhoto && <p className="text-amber-500 text-xs mb-2">Uploading...</p>}
              
              <h2 className="text-xl font-bold text-white mb-1">{formData.fullName || 'User'}</h2>
              <p className="text-zinc-400 text-sm mb-6">{displayEmail || 'Email not provided'}</p>
              
              {displayEmail && (
                <div className="flex justify-center gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${isEmailVerified ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                    {isEmailVerified ? <CheckCircle size={14} /> : <AlertCircle size={14} />} 
                    Email {isEmailVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              )}


              <div className="mt-8 pt-6 border-t border-zinc-800/50 flex flex-col gap-3">
                <a href="/ai-studio" className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black border border-amber-400 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Sparkles size={18} />
                  <span className="font-bold">AI Stylist Studio</span>
                </a>
                <a href="/favourites" className="flex items-center justify-center gap-2 w-full py-3 bg-zinc-800/50 hover:bg-amber-500/10 text-white hover:text-amber-500 border border-zinc-800 hover:border-amber-500/30 rounded-xl transition-all">
                  <Heart size={18} />
                  <span className="font-medium">My Favourites</span>
                </a>
              </div>
            </div>
          </motion.div>


          {/* Details & Settings */}
          <motion.div 
            variants={fadeUpVariant} initial="hidden" animate="visible" transition={{ delay: 0.1 }}
            className="md:col-span-2 space-y-6"
          >
            {/* Personal Information */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  <User size={20} className="text-amber-500" /> Personal Information
                </h3>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-zinc-400 hover:text-amber-500 transition-colors flex items-center gap-1 text-sm">
                    <Edit2 size={14} /> Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">{t('contact.form.name')}</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({...prev, fullName: e.target.value}))}
                      className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Date of Birth</label>
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
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">{t('contact.form.phone')}</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').substring(0, 10);
                          setFormData(prev => ({...prev, phone: val}));
                        }}
                        className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                        placeholder="Mobile Number"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={loading} className="px-6 py-3 bg-amber-500 text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-amber-400 transition-colors">
                      {t('dashboard.saveChanges')}
                    </button>
                    <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 bg-transparent border border-zinc-700 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-zinc-800 transition-colors">
                      {t('dashboard.cancel')}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-zinc-500 text-sm mb-1">{t('contact.form.name')}</p>
                    <p className="text-white font-medium">{userProfile?.fullName || user?.displayName || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-sm mb-1 flex items-center gap-1"><Mail size={14} /> Email</p>
                    <p className="text-white font-medium">{displayEmail || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-sm mb-1 flex items-center gap-1"><Calendar size={14} /> Date of Birth</p>
                    <p className="text-white font-medium">{userProfile?.dob ? new Date(userProfile.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-sm mb-1 flex items-center gap-1"><Phone size={14} /> Phone</p>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{userProfile?.phone || 'Not provided'}</p>
                      {userProfile?.phone && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/30">
                          <CheckCircle size={12} /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* {t('dashboard.security')} */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  <Shield size={20} className="text-amber-500" /> {t('dashboard.security')}
                </h3>
              </div>

              {isChangingPassword ? (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">New Password</label>
                    <input
                      type="password"
                      required
                      value={formData.newPassword}
                      onChange={(e) => setFormData(prev => ({...prev, newPassword: e.target.value}))}
                      className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({...prev, confirmPassword: e.target.value}))}
                      className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={loading} className="px-6 py-3 bg-amber-500 text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-amber-400 transition-colors">
                      Update Password
                    </button>
                    <button type="button" onClick={() => setIsChangingPassword(false)} className="px-6 py-3 bg-transparent border border-zinc-700 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-zinc-800 transition-colors">
                      {t('dashboard.cancel')}
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <p className="text-zinc-400 font-light mb-4 text-sm">Secure your account by updating your password regularly. You can use your password to log in with your Mobile Number or Email.</p>
                  <button 
                    onClick={() => setIsChangingPassword(true)}
                    className="px-6 py-3 bg-zinc-800 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-zinc-700 transition-colors border border-zinc-700 hover:border-amber-500/50 flex items-center gap-2"
                  >
                    <Lock size={16} /> {t('dashboard.changePassword')}
                  </button>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-zinc-800/50">
                <h4 className="text-red-500 font-bold mb-2">Danger Zone</h4>
                
                {isDeletingAccount ? (
                  <form onSubmit={handleDeleteAccount} className="space-y-4 bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                    <p className="text-red-400 text-sm mb-2">Are you sure? This action is permanent and cannot be undone.</p>
                    <div>
                      <label className="block text-sm font-medium text-red-400/80 mb-2">Confirm Password</label>
                      <input
                        type="password"
                        required
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className="w-full bg-black/50 border border-red-500/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="submit" disabled={loading} className="px-6 py-3 bg-red-600 text-[#ffffff] font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-red-500 transition-colors">
                        Delete Permanently
                      </button>
                      <button type="button" onClick={() => {setIsDeletingAccount(false); setDeletePassword('');}} className="px-6 py-3 bg-transparent border border-zinc-700 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-zinc-800 transition-colors">
                        {t('dashboard.cancel')}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <p className="text-zinc-400 font-light mb-4 text-sm">Once you delete your account, there is no going back. Please be certain.</p>
                    <button 
                      onClick={() => setIsDeletingAccount(true)}
                      className="px-6 py-3 bg-transparent border border-red-500/50 text-red-500 font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-red-500/10 transition-colors"
                    >
                      {t('dashboard.deleteAccount')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <MyAppointments userId={user?.uid || ''} userPhone={userProfile?.phone || formData.phone} userEmail={user?.email || formData.email} />
            <ActivityHistory isAdmin={
              user?.email === 'chavdalucky168@gmail.com' || 
              user?.email === 'Rahulrparmar307@gmail.com'
            } />
            
            {(user?.email === 'chavdalucky168@gmail.com' || user?.email === 'Rahulrparmar307@gmail.com') && (
              <AdminNotifications />
            )}

          </motion.div>
        </div>
      </div>

      {/* Verify Phone Modal */}
      {verifyPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
          >
            <button 
              onClick={() => {
                 setVerifyPhoneModal(false);
              }}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              ✕
            </button>
            
            <h3 className="text-xl font-serif font-bold text-white mb-4">Update Mobile Number</h3>
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSendVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Mobile Number</label>
                  <input
                    type="tel"
                    value={verifyPhoneInput}
                    onChange={(e) => setVerifyPhoneInput(e.target.value.replace(/\D/g, '').substring(0, 10))} maxLength={10}
                    placeholder="Enter mobile number"
                    className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-500 text-black font-bold py-3 rounded-xl hover:bg-amber-400 disabled:opacity-50 transition-colors uppercase tracking-widest text-sm"
                >
                  {loading ? 'Updating...' : 'Update Mobile Number'}
                </button>
              </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
