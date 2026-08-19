import re
with open('src/pages/SignUp.tsx', 'r') as f:
    content = f.read()

match = re.search(r'const handleSignUp = async \(e: React\.FormEvent\) => \{.*?\n  \};\n', content, flags=re.DOTALL)
if match:
    print(match.group(0))
