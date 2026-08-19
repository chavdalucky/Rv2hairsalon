import re

with open('src/utils/phoneAuth.ts', 'r') as f:
    content = f.read()

content = content.replace("  if (msg.includes('already exists') || code === 'auth/email-already-in-use') {", 
"""  if (code === 'auth/operation-not-allowed') {
    return 'Authentication method disabled. Please enable Email/Password provider in the Firebase Console (Authentication > Sign-in method).';
  }
  if (msg.includes('already exists') || code === 'auth/email-already-in-use') {""")

with open('src/utils/phoneAuth.ts', 'w') as f:
    f.write(content)

with open('src/pages/SignUp.tsx', 'r') as f:
    content = f.read()

content = content.replace("      setError(err.message || 'Failed to create account. Please try again.');", "      setError(getFirebaseErrorMessage(err));")

with open('src/pages/SignUp.tsx', 'w') as f:
    f.write(content)

