with open('src/pages/Login.tsx', 'r') as f:
    content = f.read()

bad = """    if (name === 'phone' && typeof finalValue === 'string') {
        finalValue = finalValue.replace(/\\D/g, '');
    }"""
good = """    if (name === 'phone' && typeof finalValue === 'string') {
        finalValue = finalValue.replace(/\\D/g, '');
        if (finalValue.length > 10) {
            finalValue = finalValue.substring(0, 10);
        }
    }"""

content = content.replace(bad, good)

with open('src/pages/Login.tsx', 'w') as f:
    f.write(content)
