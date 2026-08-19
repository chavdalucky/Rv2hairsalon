import re

with open('server.ts', 'r') as f:
    content = f.read()

# Remove /api/ai/image endpoint
image_endpoint = r"""  app\.post\('/api/ai/image', async \(req, res\) => \{.*?\n  \}\);"""
content = re.sub(image_endpoint, "", content, flags=re.DOTALL)

with open('server.ts', 'w') as f:
    f.write(content)
print("Fixed server.ts")
