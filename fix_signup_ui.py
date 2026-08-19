import re

with open('src/pages/SignUp.tsx', 'r') as f:
    content = f.read()

# I will replace the <AnimatePresence mode="wait"> block.
# Finding where it starts.
start_str = "<AnimatePresence mode=\"wait\">"
# We need to find the matching closing tag </AnimatePresence>
# Let's just replace from <AnimatePresence mode="wait"> to </AnimatePresence>

new_ui = """<AnimatePresence mode="wait">
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
                    placeholder="Email Address (Optional)"
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
                    name="dobDay"
                    value={formData.dobDay}
                    onChange={handleInputChange}
                    className="flex-1 bg-black/50 border border-zinc-800 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-amber-500 appearance-none"
                  >
                    <option value="" disabled>Day</option>
                    {days.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <select
                    name="dobMonth"
                    value={formData.dobMonth}
                    onChange={handleInputChange}
                    className="flex-1 bg-black/50 border border-zinc-800 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-amber-500 appearance-none"
                  >
                    <option value="" disabled>Month</option>
                    {months.map(m => (
                      <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'short' })}</option>
                    ))}
                  </select>
                  <select
                    name="dobYear"
                    value={formData.dobYear}
                    onChange={handleInputChange}
                    className="flex-1 bg-black/50 border border-zinc-800 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-amber-500 appearance-none"
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
              
              <p className="text-center text-sm text-zinc-500 pt-4 font-light">
                Already have an account? <Link to="/login" className="text-amber-500 hover:text-amber-400 font-medium transition-colors">Log In</Link>
              </p>
            </motion.form>
          </AnimatePresence>"""

content = re.sub(r'<AnimatePresence mode="wait">.*?</AnimatePresence>', new_ui, content, flags=re.DOTALL)

with open('src/pages/SignUp.tsx', 'w') as f:
    f.write(content)
