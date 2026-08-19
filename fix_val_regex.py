import re
with open('src/pages/SignUp.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'    if \(!formData\.dobDay \|\| !formData\.dobMonth \|\| !formData\.dobYear\) \{.*?setError\(\'Date of birth cannot be in the future\.\'\);\n      return;\n    \}',
"""    if (!formData.dob) {
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
    }""", content, flags=re.DOTALL)

with open('src/pages/SignUp.tsx', 'w') as f:
    f.write(content)
