import re

with open('src/components/layout/Navbar.tsx', 'r') as f:
    content = f.read()

content = content.replace("title={t('nav.login')}", 'title="Sign Up"')
content = content.replace("{t('nav.login')}", 'Sign Up')

with open('src/components/layout/Navbar.tsx', 'w') as f:
    f.write(content)
