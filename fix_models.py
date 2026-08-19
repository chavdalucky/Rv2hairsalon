import re

with open('server.ts', 'r') as f:
    server_content = f.read()
server_content = server_content.replace("'gemini-3.1-pro-preview'", "'gemini-3.5-flash'")
with open('server.ts', 'w') as f:
    f.write(server_content)

with open('src/pages/AIStudio.tsx', 'r') as f:
    ai_content = f.read()
ai_content = ai_content.replace("'gemini-3.1-pro-preview'", "'gemini-3.5-flash'")
with open('src/pages/AIStudio.tsx', 'w') as f:
    f.write(ai_content)
print("Updated models")
