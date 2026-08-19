import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "const years = Array.from({ length: 2015 - 1950 + 1 }, (_, i) => 2015 - i);",
    "const years = Array.from({ length: new Date().getFullYear() - 1950 + 1 }, (_, i) => new Date().getFullYear() - i);"
)
# And remove appearance-none
content = content.replace("appearance-none text-center", "")

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)

with open('src/pages/SignUp.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "const years = Array.from({ length: 2015 - 1950 + 1 }, (_, i) => 2015 - i);",
    "const years = Array.from({ length: new Date().getFullYear() - 1950 + 1 }, (_, i) => new Date().getFullYear() - i);"
)
# And remove appearance-none
content = content.replace("appearance-none text-center", "")

with open('src/pages/SignUp.tsx', 'w') as f:
    f.write(content)
