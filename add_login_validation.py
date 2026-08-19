with open('src/pages/Login.tsx', 'r') as f:
    content = f.read()

bad = """      if (loginMethod === 'mobile-otp') {"""
good = """      if (loginMethod === 'mobile-otp') {
        if (!formData.phone || formData.phone.length < 10) {
            throw new Error('Please enter a valid 10-digit mobile number.');
        }"""
content = content.replace(bad, good)

bad2 = """      else if (loginMethod === 'mobile-password') {
        if (!formData.phone || !formData.password) {
          throw new Error('Please fill in all fields.');
        }"""
good2 = """      else if (loginMethod === 'mobile-password') {
        if (!formData.phone || !formData.password) {
          throw new Error('Please fill in all fields.');
        }
        if (formData.phone.length < 10) {
            throw new Error('Please enter a valid 10-digit mobile number.');
        }"""
content = content.replace(bad2, good2)

with open('src/pages/Login.tsx', 'w') as f:
    f.write(content)
