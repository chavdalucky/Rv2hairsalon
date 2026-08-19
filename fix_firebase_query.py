import re

with open('src/pages/AIStudio.tsx', 'r') as f:
    content = f.read()

# Replace query
query_old = """        const q = query(
          collection(db, 'ai_chats'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'asc')
        );"""
query_new = """        const q = query(
          collection(db, 'ai_chats'),
          where('userId', '==', user.uid)
        );"""

# Replace onSnapshot
snap_old = """        const unsub = onSnapshot(q, (snap) => {
          const fetchedMsgs = snap.docs.map(d => {
            const data = d.data();
            return { role: data.role, text: data.text };
          });"""
snap_new = """        const unsub = onSnapshot(q, (snap) => {
          const fetchedMsgs = snap.docs
            .map(d => ({ id: d.id, data: d.data() }))
            .sort((a, b) => {
               const timeA = a.data.createdAt?.toMillis?.() || 0;
               const timeB = b.data.createdAt?.toMillis?.() || 0;
               return timeA - timeB;
            })
            .map(d => ({ role: d.data.role, text: d.data.text }));"""

content = content.replace(query_old, query_new)
content = content.replace(snap_old, snap_new)

with open('src/pages/AIStudio.tsx', 'w') as f:
    f.write(content)
print("Fixed composite index query in AIStudio")
