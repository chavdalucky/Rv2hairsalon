import re

with open('src/pages/Login.tsx', 'r') as f:
    content = f.read()

# Replace LoginMethod type
content = content.replace("type LoginMethod = 'mobile-otp' | 'mobile-password' | 'email-password';", 
                          "type LoginMethod = 'mobile-password' | 'email-password';")

# Replace initial state of loginMethod
content = content.replace("const [loginMethod, setLoginMethod] = useState<LoginMethod>('mobile-otp');", 
                          "const [loginMethod, setLoginMethod] = useState<LoginMethod>('mobile-password');")

# Remove OTP states
otp_states = """  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);"""
content = content.replace(otp_states, "")

# Remove setupRecaptcha and handleVerifyOtp
content = re.sub(r'  const handleVerifyOtp = async \(e: React\.FormEvent\) => \{.*?\n  \};\n', '', content, flags=re.DOTALL)
content = re.sub(r'        setupRecaptcha\(\'recaptcha-container-login\'\);\n', '', content)
content = re.sub(r'        const result = await signInWithPhoneNumber\(auth, formattedPhone, window\.recaptchaVerifier\);\n', '', content)
content = re.sub(r'        setConfirmationResult\(result\);\n', '', content)
content = re.sub(r'        setOtpSent\(true\);\n', '', content)

# Remove the 'mobile-otp' branch inside handleLogin
mobile_otp_branch = """      if (loginMethod === 'mobile-otp') {
        if (!formData.phone || formData.phone.length < 10) {
            throw new Error('Please enter a valid 10-digit mobile number.');
        }
        const formattedPhone = formatPhone(formData.phone);
        // Verify account exists first
        const phoneDoc = await getDoc(doc(db, 'phone_to_email', formattedPhone));
        if (!phoneDoc.exists()) {
          throw new Error('Account not found. Please sign up first.');
        }

        await setPersistence(auth, formData.rememberMe ? browserLocalPersistence : browserSessionPersistence);
        console.log(`[PhoneAuth] Initiating OTP send to ${formattedPhone}`);
        console.log("[PhoneAuth] OTP request successful");
      } 
      else if"""
content = content.replace(mobile_otp_branch, "      if")

# Fix button rendering logic in UI
# <button onClick={() => setLoginMethod('mobile-otp')} ... > ... </button>
# Let's just remove the first button
button_otp = """              <button
                onClick={() => setLoginMethod('mobile-otp')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg flex flex-col items-center gap-1 transition-all ${loginMethod === 'mobile-otp' ? 'bg-zinc-800 text-amber-500 shadow-lg' : 'text-zinc-500 hover:text-white'}`}
              >
                <Smartphone size={16} />
                <span>OTP</span>
              </button>"""
content = content.replace(button_otp, "")

# Update 'mobile-otp' check in button label
content = content.replace("loginMethod === 'mobile-otp' ? 'Send OTP' : 'Log In'", "'Log In'")

# Remove OTP verification form from UI
otp_form = """          {otpSent ? (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-medium text-white mb-2">Verify OTP</h3>
                <p className="text-zinc-400 text-sm">Enter the 6-digit code sent to {formData.phone}</p>
              </div>

              {error && <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm text-center">{error}</div>}
              
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                className="block w-full px-4 py-3.5 text-center tracking-[0.5em] text-2xl bg-black/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full relative group overflow-hidden rounded-xl bg-amber-500 text-black font-bold py-4 uppercase tracking-widest text-sm transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                <span className="relative z-10">{loading ? 'Verifying...' : 'Verify OTP'}</span>
              </button>
              <button
                type="button"
                onClick={() => { setOtpSent(false); setOtp(''); }}
                className="w-full text-center text-sm text-zinc-500 hover:text-white transition-colors pt-2"
              >
                Back to Login
              </button>
            </form>
          ) : ("""
content = content.replace(otp_form, "")
content = content.replace("          )}", "") # Wait, replacing the end of the ternary
# We will use regex to properly remove {otpSent ? ... : ( ... )}
import re

with open('src/pages/Login.tsx', 'w') as f:
    f.write(content)
