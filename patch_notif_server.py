with open('server/notifications.ts', 'r') as f:
    content = f.read()

bad1 = """    await updateDoc(doc(serverDb, 'settings', 'notifications'), defaultSettings).catch(async () => {
      await addDoc(collection(serverDb, 'settings'), defaultSettings);
    });"""

good1 = """    await setDoc(doc(serverDb, 'settings', 'notifications'), defaultSettings, { merge: true });"""

bad2 = """    await updateDoc(doc(serverDb, 'settings', 'notifications'), req.body).catch(async () => {
       await addDoc(collection(serverDb, 'settings'), req.body); // Fallback
    });"""

good2 = """    await setDoc(doc(serverDb, 'settings', 'notifications'), req.body, { merge: true });"""

content = content.replace(bad1, good1).replace(bad2, good2)

with open('server/notifications.ts', 'w') as f:
    f.write(content)
