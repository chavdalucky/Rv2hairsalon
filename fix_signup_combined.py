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
  });
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');

  useEffect(() => {
    if (dobDay && dobMonth && dobYear) {
      setFormData(prev => ({
        ...prev,
        dob: `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`
      }));
    } else {
      setFormData(prev => ({ ...prev, dob: '' }));
    }
  }, [dobDay, dobMonth, dobYear]);"""
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
      setError('Please select your full Date of Birth.');
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


# 4. Replace DOB inputs
old_dob_ui = """              <div>
                <label className="block text-sm text-zinc-400 mb-2 font-light">Date of Birth</label>
                <div className="flex gap-2">
                  <select
                    name="dobDay"
                    value={formData.dobDay}
                    onChange={handleInputChange}
                    className="flex-1 bg-black/50 border border-zinc-800 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-amber-500 appearance-none text-center"
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
                    className="flex-1 bg-black/50 border border-zinc-800 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-amber-500 appearance-none text-center"
                  >
                    <option value="" disabled>Month</option>
                    {months.map(m => (
                      <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                  </select>
                  <select
                    name="dobYear"
                    value={formData.dobYear}
                    onChange={handleInputChange}
                    className="flex-1 bg-black/50 border border-zinc-800 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-amber-500 appearance-none text-center"
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
content = content.replace(old_dob_ui, new_dob_ui)

with open('src/pages/SignUp.tsx', 'w') as f:
    f.write(content)
