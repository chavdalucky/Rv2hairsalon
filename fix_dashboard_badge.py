import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

# Remove the badge
badge = """              <div className="flex justify-center gap-2 mb-6">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${isPhoneVerified ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                  {isPhoneVerified ? <CheckCircle size={14} /> : <AlertCircle size={14} />} 
                  Phone {isPhoneVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>"""
content = content.replace(badge, "")

# Update the phone edit button
old_phone = """                    <div className="flex items-center gap-2">
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
                    </div>"""

new_phone = """                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{userProfile?.phone || 'Not provided'}</p>
                      <button 
                        onClick={() => {
                          setVerifyPhoneInput(userProfile?.phone || '');
                          setVerifyPhoneModal(true);
                        }}
                        className="text-xs bg-zinc-800 text-amber-500 hover:text-amber-400 px-2 py-1 rounded border border-zinc-700 hover:border-amber-500/50 transition-colors"
                      >
                        Edit Number
                      </button>
                    </div>"""
content = content.replace(old_phone, new_phone)

# One more thing: setVerifyPhoneStep is removed, so I just replace it completely if it remains.
content = content.replace("setVerifyPhoneStep(1);", "")

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)
