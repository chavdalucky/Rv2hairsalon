import re

with open('src/components/layout/Navbar.tsx', 'r') as f:
    content = f.read()

content = content.replace("navigate('/login')", "navigate('/signup')")

with open('src/components/layout/Navbar.tsx', 'w') as f:
    f.write(content)
