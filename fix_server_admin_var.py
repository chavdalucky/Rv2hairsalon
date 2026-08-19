import re

with open('server.ts', 'r') as f:
    content = f.read()

# Remove the initialization block
content = re.sub(r'if \(!admin\.apps\.length\) \{[\s\S]*?\}', '', content)

with open('server.ts', 'w') as f:
    f.write(content)
print("Removed admin initialization block")
