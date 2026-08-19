import re

for filename in ['src/pages/SignUp.tsx', 'src/pages/Dashboard.tsx', 'src/pages/Login.tsx']:
    with open(filename, 'r') as f:
        content = f.read()

    # Change maxLength={12} to maxLength={10}
    content = content.replace("maxLength={12}", "maxLength={10}")
    
    with open(filename, 'w') as f:
        f.write(content)
