import re

with open('src/pages/SignUp.tsx', 'r') as f:
    content = f.read()

# 1. Update formData initial state
old_form_state = """  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    dobDay: '',
    dobMonth: '',
    dobYear: '',
    acceptTerms: false
  });"""
new_form_state = """  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    dob: '',
    acceptTerms: false
  });"""
content = content.replace(old_form_state, new_form_state)

# 2. Update validation logic
old_validation = """    if (!formData.dobDay || !formData.dobMonth || !formData.dobYear) {
      setError('Please select your full Date of Birth.');
      return;
    }

    if (!formData.acceptTerms) {
      setError('Please accept the Terms of Service and Privacy Policy.');
      return;
    }

    const selectedDate = new Date(`${formData.dobYear}-${formData.dobMonth}-${formData.dobDay}`);
    if (selectedDate > new Date()) {
      setError('Date of birth cannot be in the future.');
      return;
    }"""
new_validation = """    if (!formData.dob) {
      setError('Please select your Date of Birth.');
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
    }"""
content = content.replace(old_validation, new_validation)

# 3. Update authEmail and dobString
old_auth_email_dob = """      const authEmail = formData.email ? formData.email.toLowerCase() : `${formattedPhone.replace('+', '')}@rv2.app`;
      const dobString = `${formData.dobYear}-${formData.dobMonth.padStart(2, '0')}-${formData.dobDay.padStart(2, '0')}`;"""
new_auth_email_dob = """      const authEmail = formData.email ? formData.email.toLowerCase() : `${formattedPhone.replace('+', '')}@rv2.app`;
      const dobString = formData.dob;"""
content = content.replace(old_auth_email_dob, new_auth_email_dob)

# 4. Remove const days, months, years
old_arrays = """  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);"""
content = content.replace(old_arrays, "")

# 5. Replace DOB inputs
old_dob_ui = """              <div>
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
              </div>"""
new_dob_ui = """              <div>
                <label className="block text-sm text-zinc-400 mb-2 font-light">Date of Birth</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    type="date"
                    name="dob"
                    required
                    value={formData.dob}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="block w-full pl-11 pr-4 py-3 bg-black/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert-[0.7]"
                  />
                </div>
              </div>"""
content = content.replace(old_dob_ui, new_dob_ui)

with open('src/pages/SignUp.tsx', 'w') as f:
    f.write(content)
