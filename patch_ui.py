import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

# 1. Date of Birth Edit
old_dob_edit = """                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData(prev => ({...prev, dob: e.target.value}))}
                      className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </div>"""

new_dob_edit = """                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Date of Birth</label>
                    <div className="flex gap-2">
                      <select
                        value={dobDay}
                        onChange={(e) => setDobDay(e.target.value)}
                        className="flex-1 bg-black/50 border border-zinc-800 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-amber-500 appearance-none text-center"
                      >
                        <option value="" disabled>Day</option>
                        {days.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <select
                        value={dobMonth}
                        onChange={(e) => setDobMonth(e.target.value)}
                        className="flex-1 bg-black/50 border border-zinc-800 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-amber-500 appearance-none text-center"
                      >
                        <option value="" disabled>Month</option>
                        {months.map(m => (
                          <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                      </select>
                      <select
                        value={dobYear}
                        onChange={(e) => setDobYear(e.target.value)}
                        className="flex-1 bg-black/50 border border-zinc-800 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-amber-500 appearance-none text-center"
                      >
                        <option value="" disabled>Year</option>
                        {years.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>"""

content = content.replace(old_dob_edit, new_dob_edit)

# 2. Phone Edit
old_phone_edit = """                  <div>
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
                          
                        }}
                        className="px-4 py-3 bg-zinc-800 text-white rounded-xl text-sm font-medium hover:bg-zinc-700 whitespace-nowrap"
                      >
                        Change Number
                      </button>
                    </div>
                  </div>"""

new_phone_edit = """                  <div>
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
                  </div>"""

content = content.replace(old_phone_edit, new_phone_edit)

# 3. Phone View
old_phone_view = """                  <div>
                    <p className="text-zinc-500 text-sm mb-1 flex items-center gap-1"><Phone size={14} /> Phone</p>
                    <div className="flex items-center gap-2">
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
                    </div>
                  </div>"""

new_phone_view = """                  <div>
                    <p className="text-zinc-500 text-sm mb-1 flex items-center gap-1"><Phone size={14} /> Phone</p>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{userProfile?.phone || 'Not provided'}</p>
                      {userProfile?.phone && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/30">
                          <CheckCircle size={12} /> Verified
                        </span>
                      )}
                    </div>
                  </div>"""

content = content.replace(old_phone_view, new_phone_view)

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)
