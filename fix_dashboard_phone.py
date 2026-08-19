import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

# Replace Verify Phone logic
# There is a verifyPhoneStep, verifyOtpInput, verifyPhoneInput.
# We will just make it a single step that updates the phone number in firestore directly.
content = content.replace("const [verifyPhoneStep, setVerifyPhoneStep] = useState(1);", "")
content = content.replace("const [verifyOtpInput, setVerifyOtpInput] = useState('');", "")
content = content.replace("const [confirmationResult, setConfirmationResult] = useState<any>(null);", "")

# Remove setupRecaptcha, signInWithPhoneNumber etc.
# Instead of dealing with all the imports, I will just rewrite handleSendVerifyOtp and handleVerifyOtpSubmit
handle_send = """  const handleSendVerifyOtp = async (e: React.FormEvent) => {
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

        await logActivity(user.uid, 'Phone Updated', `Mobile number updated to ${formattedPhone}`);
        setVerifyPhoneModal(false);
      }
    } catch (err: any) {
      console.error('Error updating phone:', err);
      setError(err.message || 'Failed to update mobile number.');
    } finally {
      setLoading(false);
    }
  };"""

# I need to find handleSendVerifyOtp and replace it and handleVerifyOtpSubmit
import ast

def replace_between(start_str, end_str, replace_str, text):
    start_idx = text.find(start_str)
    if start_idx == -1: return text
    end_idx = text.find(end_str, start_idx)
    if end_idx == -1: return text
    return text[:start_idx] + replace_str + text[end_idx:]

content = re.sub(r'  const handleSendVerifyOtp = async \(e: React\.FormEvent\) => \{.*?\n  \};\n', handle_send + '\n', content, flags=re.DOTALL)
content = re.sub(r'  const handleVerifyOtpSubmit = async \(e: React\.FormEvent\) => \{.*?\n  \};\n', '', content, flags=re.DOTALL)

# Now update the UI for Verify Phone Modal
ui_bad = """            {verifyPhoneStep === 1 ? (
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
                      setVerifyOtpInput('');
                    }}
                    className="text-sm text-zinc-400 hover:text-white"
                  >
                    Change Number
                  </button>
                </div>
              </form>
            )}"""

ui_good = """            <form onSubmit={handleSendVerifyOtp} className="space-y-4">
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
              </form>"""

content = content.replace(ui_bad, ui_good)

# Remove recaptcha window references
content = re.sub(r'                 if \(window\.recaptchaVerifier\) \{.*?\n                 \}\n', '', content, flags=re.DOTALL)

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)
