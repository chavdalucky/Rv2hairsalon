import re

with open('server.ts', 'r') as f:
    lines = f.readlines()

with open('server.ts', 'w') as f:
    for line in lines:
        if line.strip() == '}':
            pass
        elif line.strip() == ';}':
            pass
        elif line.strip() == ');}':
            pass
        else:
            f.write(line)
