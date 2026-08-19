import re
with open('src/utils/phoneAuth.ts', 'r') as f:
    content = f.read()

content = content.replace(
    "return 'Registration is temporarily unavailable. Please try again or contact support.';",
    "return 'Authentication provider is disabled. Please enable Email/Password authentication in your Firebase Console.';")

with open('src/utils/phoneAuth.ts', 'w') as f:
    f.write(content)
