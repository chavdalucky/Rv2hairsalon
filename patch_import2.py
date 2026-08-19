with open('server/notifications.ts', 'r') as f:
    content = f.read()

bad = "import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, getDoc } from 'firebase/firestore';"
good = "import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, getDoc, setDoc } from 'firebase/firestore';"
content = content.replace(bad, good)

with open('server/notifications.ts', 'w') as f:
    f.write(content)
