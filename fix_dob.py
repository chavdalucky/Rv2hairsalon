import re

with open('src/pages/SignUp.tsx', 'r') as f:
    content = f.read()

old_dob_effect = """  useEffect(() => {
    if (dobDay && dobMonth && dobYear) {
      setFormData(prev => ({
        ...prev,
        dob: `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`
      }));
    } else {
      setFormData(prev => ({ ...prev, dob: '' }));
    }
  }, [dobDay, dobMonth, dobYear]);"""

new_dob_effect = """  useEffect(() => {
    if (dobDay && dobMonth && dobYear) {
      setFormData(prev => ({
        ...prev,
        dob: `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`
      }));
      if (error === 'Please select your full Date of Birth.') {
         setError('');
      }
    } else {
      setFormData(prev => ({ ...prev, dob: '' }));
    }
  }, [dobDay, dobMonth, dobYear, error]);"""

content = content.replace(old_dob_effect, new_dob_effect)

with open('src/pages/SignUp.tsx', 'w') as f:
    f.write(content)
