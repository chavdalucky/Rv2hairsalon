import re
with open('server.ts', 'r') as f:
    text = f.read()

print("File has %d lines" % len(text.split('\\n')))
