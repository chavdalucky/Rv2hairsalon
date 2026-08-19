import re

with open('server.ts', 'r') as f:
    content = f.read()

# Replace the tool definition to use Type enum
if "import { GoogleGenAI, GenerateVideosOperation" in content:
    content = content.replace("import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';", "import { GoogleGenAI, GenerateVideosOperation, Type } from '@google/genai';")
elif "import { GoogleGenAI, GenerateVideosOperation, Type" not in content:
    content = content.replace("import { GoogleGenAI,", "import { GoogleGenAI, Type,")

content = content.replace('type: "OBJECT"', 'type: Type.OBJECT')
content = content.replace('type: "STRING"', 'type: Type.STRING')

# Wait, there's another occurrence of type: "STRING"
# Python replace replaces all occurrences.

with open('server.ts', 'w') as f:
    f.write(content)
print("Fixed TypeScript errors for Type enum")
