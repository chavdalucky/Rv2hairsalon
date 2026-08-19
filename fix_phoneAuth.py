import re

with open('src/utils/phoneAuth.ts', 'r') as f:
    content = f.read()

content = content.replace("return err.message || 'Authentication failed. Please try again.';", "return 'Authentication failed. Please try again.';")

with open('src/utils/phoneAuth.ts', 'w') as f:
    f.write(content)
