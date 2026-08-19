import re

def patch(filename):
    with open(filename, 'r') as f:
        content = f.read()
    content = content.replace('href="/login"', 'href="/signup"')
    with open(filename, 'w') as f:
        f.write(content)

patch('src/components/LoginPopup.tsx')
patch('src/pages/Favourites.tsx')
