import re

with open('src/utils/phoneAuth.ts', 'r') as f:
    content = f.read()

# Make the operation-not-allowed softer if needed, but it's fundamentally a console issue.
# Actually I will just replace the exact code string
content = content.replace(
    "return 'Authentication method disabled. Please enable Email/Password provider in the Firebase Console (Authentication > Sign-in method).';",
    "return 'Registration is temporarily unavailable. Please try again or contact support.';"
)

with open('src/utils/phoneAuth.ts', 'w') as f:
    f.write(content)
