import re

with open('src/pages/SignUp.tsx', 'r') as f:
    content = f.read()

# Update validation logic
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

with open('src/pages/SignUp.tsx', 'w') as f:
    f.write(content)
