with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

bad = """onChange={(e) => setVerifyPhoneInput(e.target.value.replace(/\\D/g, ''))}"""
good = """onChange={(e) => setVerifyPhoneInput(e.target.value.replace(/\\D/g, '').substring(0, 10))}"""

content = content.replace(bad, good)
with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)
