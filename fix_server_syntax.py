import re

with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace("dotenv.config();\\n);}", "dotenv.config();")

with open('server.ts', 'w') as f:
    f.write(content)
