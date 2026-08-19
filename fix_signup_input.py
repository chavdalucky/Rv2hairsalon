with open('src/pages/SignUp.tsx', 'r') as f:
    content = f.read()

bad = """onChange={(e) => setPhone(e.target.value.replace(/\\D/g, ''))}"""
good = """onChange={(e) => setPhone(e.target.value.replace(/\\D/g, '').substring(0, 10))}"""

content = content.replace(bad, good)
with open('src/pages/SignUp.tsx', 'w') as f:
    f.write(content)
