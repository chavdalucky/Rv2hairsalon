import re

with open('src/utils/phoneAuth.ts', 'r') as f:
    content = f.read()

content = content.replace("  if (msg.includes('already exists') || msg.includes('Account not found')) {\n    return msg;\n  }", "  if (msg.includes('already exists') || msg.includes('Account not found') || msg.includes('Please fill in all fields') || msg.includes('Please enter a valid 10-digit mobile number')) {\n    return msg;\n  }")

with open('src/utils/phoneAuth.ts', 'w') as f:
    f.write(content)
