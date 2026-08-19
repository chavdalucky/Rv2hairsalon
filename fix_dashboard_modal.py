import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

# I will replace from {verifyPhoneStep === 1 ? ( down to the end of the form ternary.
modal_bad_pattern = r'\{verifyPhoneStep === 1 \? \(\s*<form onSubmit=\{handleSendVerifyOtp\}.*?Change Number\s*</button>\s*</div>\s*</form>\s*\)\}'

modal_good = """<form onSubmit={handleSendVerifyOtp} className="space-y-4">
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

content = re.sub(modal_bad_pattern, modal_good, content, flags=re.DOTALL)

# Also fix the '"Phone Updated"' activity type to '"Profile Updated"'
content = content.replace("'Phone Updated'", "'Profile Updated'")

# Change "Verify Mobile Number" modal title to "Update Mobile Number"
content = content.replace("Verify Mobile Number", "Update Mobile Number")

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)
