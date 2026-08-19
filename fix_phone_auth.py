import re

with open('src/utils/phoneAuth.ts', 'r') as f:
    content = f.read()

content = content.replace("if (msg.includes('already exists') || code === 'auth/email-already-in-use') {", 
"""if (code === 'auth/email-already-in-use') {
    return 'An account with this email or mobile number already exists. Please log in.';
  }
  if (msg.includes('already exists')) {
    return msg;
  }
  if (False) {""")

with open('src/utils/phoneAuth.ts', 'w') as f:
    f.write(content)
