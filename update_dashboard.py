import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

# 1. Imports
imports_search = "import { signOut, updatePassword, updateProfile, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';"
imports_replace = "import { signOut, updatePassword, updateProfile, deleteUser, EmailAuthProvider, reauthenticateWithCredential, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';"
content = content.replace(imports_search, imports_replace)

# 2. Add DOB to formData and state
state_search = """  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    newPassword: '',
    confirmPassword: ''
  });"""
state_replace = """  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    dob: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [verifyPhoneModal, setVerifyPhoneModal] = useState(false);
  const [verifyPhoneStep, setVerifyPhoneStep] = useState(1);
  const [verifyPhoneInput, setVerifyPhoneInput] = useState('');
  const [verifyOtpInput, setVerifyOtpInput] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  
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
"""
content = content.replace(state_search, state_replace)

# 3. fetchUserData update dob
fetch_search = """          setFormData(prev => ({
            ...prev,
            fullName: data.fullName || user.displayName || '',
            phone: data.phone || ''
          }));"""
fetch_replace = """          setFormData(prev => ({
            ...prev,
            fullName: data.fullName || user.displayName || '',
            phone: data.phone || '',
            dob: data.dob || ''
          }));"""
content = content.replace(fetch_search, fetch_replace)

# 4. handleUpdateProfile update dob
update_search = """      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        fullName: formData.fullName,
        phone: formData.phone
      });"""
update_replace = """      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        fullName: formData.fullName,
        dob: formData.dob
      });"""
content = content.replace(update_search, update_replace)

# 5. The OTP Functions
functions_insert = """
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container-dashboard', {
          size: 'invisible'
        });
      } catch (e) {
        console.warn("Recaptcha init error:", e);
      }
    }
  };

  const formatPhone = (p: string) => {
    let formatted = p.trim();
    if (!formatted.startsWith('+')) {
      formatted = '+91' + formatted;
    }
    return formatted;
  };

  const handleSendVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (verifyPhoneInput.length < 10) {
      setError('Please enter a valid mobile number.');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhone(verifyPhoneInput);
      
      const phoneDoc = await getDoc(doc(db, 'phone_to_email', formattedPhone));
      if (phoneDoc.exists() && phoneDoc.data().email !== auth.currentUser?.email) {
        throw new Error('This mobile number is already registered to another account.');
      }

      setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(result);
      setVerifyPhoneStep(2);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('operation-not-allowed')) {
          setError('Phone verification is currently unavailable. Please try again.');
      } else {
          setError(err.message || 'Failed to send OTP. Please try again.');
      }
      try {
          if (window.recaptchaVerifier) { 
             window.recaptchaVerifier.clear();
             window.recaptchaVerifier = null;
          }
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (verifyOtpInput.length < 6) return;

    setLoading(true);
    try {
      if (!auth.currentUser) throw new Error('Not authenticated');
      
      const result = await confirmationResult.confirm(verifyOtpInput);
      const formattedPhone = formatPhone(verifyPhoneInput);
      
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        phone: formattedPhone,
        phoneVerified: true
      });
      
      if (auth.currentUser.email) {
        await setDoc(doc(db, 'phone_to_email', formattedPhone), { email: auth.currentUser.email });
      }

      setUserProfile((prev: any) => ({ ...prev, phone: formattedPhone, phoneVerified: true }));
      setFormData((prev: any) => ({ ...prev, phone: formattedPhone }));
      setSuccess('Phone number verified successfully.');
      setVerifyPhoneModal(false);
      setVerifyPhoneStep(1);
      setVerifyOtpInput('');
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('code-expired')) {
        setError('This OTP has expired. Please request a new one.');
      } else {
        setError('Incorrect OTP. Please check the code and try again.');
      }
    } finally {
      setLoading(false);
    }
  };
"""
# insert right before const handleUpdateProfile
content = content.replace("  const handleUpdateProfile = async", functions_insert + "\n  const handleUpdateProfile = async")

# 6. UI changes in Personal Information
edit_form_search = """                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">{t('contact.form.phone')}</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                      className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </div>"""

edit_form_replace = """                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData(prev => ({...prev, dob: e.target.value}))}
                      className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">{t('contact.form.phone')}</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="tel"
                        value={formData.phone}
                        readOnly
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-500 focus:outline-none cursor-not-allowed"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          setVerifyPhoneInput(formData.phone || '');
                          setVerifyPhoneModal(true);
                          setVerifyPhoneStep(1);
                        }}
                        className="px-4 py-3 bg-zinc-800 text-white rounded-xl text-sm font-medium hover:bg-zinc-700 whitespace-nowrap"
                      >
                        Change Number
                      </button>
                    </div>
                  </div>"""
content = content.replace(edit_form_search, edit_form_replace)

# 7. Display Form Profile fields
display_fields_search = """                  <div>
                    <p className="text-zinc-500 text-sm mb-1 flex items-center gap-1"><Phone size={14} /> Phone</p>
                    <p className="text-white font-medium">{userProfile?.phone || 'Not provided'}</p>
                  </div>"""
display_fields_replace = """                  <div>
                    <p className="text-zinc-500 text-sm mb-1 flex items-center gap-1"><Calendar size={14} /> Date of Birth</p>
                    <p className="text-white font-medium">{userProfile?.dob ? new Date(userProfile.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-sm mb-1 flex items-center gap-1"><Phone size={14} /> Phone</p>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{userProfile?.phone || 'Not provided'}</p>
                      {!isPhoneVerified && (
                         <button 
                            onClick={() => {
                              setVerifyPhoneInput(userProfile?.phone || '');
                              setVerifyPhoneModal(true);
                              setVerifyPhoneStep(1);
                            }}
                            className="text-xs bg-amber-500 text-black px-2 py-1 rounded font-bold"
                         >
                           {userProfile?.phone ? 'Verify Mobile Number' : 'Add Mobile Number'}
                         </button>
                      )}
                      {isPhoneVerified && <CheckCircle size={14} className="text-green-500" />}
                    </div>
                  </div>"""
content = content.replace(display_fields_search, display_fields_replace)

# 8. Add modal JSX to end of page, before last </div>
modal_jsx = """
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
                 if (window.recaptchaVerifier) {
                   window.recaptchaVerifier.clear();
                   window.recaptchaVerifier = null;
                 }
              }}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              ✕
            </button>
            
            <h3 className="text-xl font-serif font-bold text-white mb-4">Verify Mobile Number</h3>
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm mb-4">
                {error}
              </div>
            )}
            
            {verifyPhoneStep === 1 ? (
              <form onSubmit={handleSendVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Mobile Number</label>
                  <input
                    type="tel"
                    value={verifyPhoneInput}
                    onChange={(e) => setVerifyPhoneInput(e.target.value)}
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
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
                <div id="recaptcha-container-dashboard"></div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                <p className="text-sm text-zinc-400 mb-4">OTP sent to {formatPhone(verifyPhoneInput)}</p>
                <div>
                  <input
                    type="text"
                    maxLength={6}
                    value={verifyOtpInput}
                    onChange={(e) => setVerifyOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 text-center tracking-[0.5em] text-xl"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || verifyOtpInput.length < 6}
                  className="w-full bg-amber-500 text-black font-bold py-3 rounded-xl hover:bg-amber-400 disabled:opacity-50 transition-colors uppercase tracking-widest text-sm"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <div className="flex justify-between mt-4">
                  <button
                    type="button"
                    onClick={handleSendVerifyOtp}
                    disabled={loading}
                    className="text-sm text-amber-500 hover:text-amber-400"
                  >
                    Resend OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVerifyPhoneStep(1);
                      if (window.recaptchaVerifier) {
                         window.recaptchaVerifier.clear();
                         window.recaptchaVerifier = null;
                      }
                    }}
                    className="text-sm text-zinc-500 hover:text-white"
                  >
                    Change Number
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
"""
content = content.replace("    </div>\n  );\n}", modal_jsx + "    </div>\n  );\n}")

# 9. also Calendar import
calendar_search = "import { User, Mail, Phone, Lock, LogOut, CheckCircle, AlertCircle, Edit2, Shield, Camera, Heart, Sparkles } from 'lucide-react';"
calendar_replace = "import { User, Mail, Phone, Lock, LogOut, CheckCircle, AlertCircle, Edit2, Shield, Camera, Heart, Sparkles, Calendar } from 'lucide-react';"
content = content.replace(calendar_search, calendar_replace)

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)

