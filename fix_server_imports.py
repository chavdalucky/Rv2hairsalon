import re

with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace("import { db } from './firebase';\\nimport { collection, addDoc, serverTimestamp } from 'firebase/firestore';", "import { db } from './firebase';\nimport { collection, addDoc, serverTimestamp } from 'firebase/firestore';")

with open('server.ts', 'w') as f:
    f.write(content)
