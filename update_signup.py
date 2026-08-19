import re
with open('src/pages/SignUp.tsx', 'r') as f:
    content = f.read()

# Make sure addDoc, collection, serverTimestamp are imported
if "addDoc" not in content:
    content = content.replace("doc, setDoc, getDoc } from 'firebase/firestore';", "doc, setDoc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';")

user_creation = """      await setDoc(doc(db, 'users', user.uid), {
        fullName: formData.fullName,
        phone: formattedPhone,
        email: formData.email || null,
        phoneVerified: true,
        createdAt: new Date().toISOString(),
        rewardPoints: 10,
        totalVisits: 0
      });
      
      await addDoc(collection(db, 'rewardHistory'), {
          userId: user.uid,
          adminId: 'system',
          action: `Welcome Bonus`,
          reason: `Sign up reward`,
          previousPoints: 0,
          newPoints: 10,
          previousVisits: 0,
          newVisits: 0,
          date: serverTimestamp()
      });
"""

content = re.sub(r"      await setDoc\(doc\(db, 'users', user.uid\), \{[\s\S]*?createdAt: new Date\(\)\.toISOString\(\)\s*\}\);", user_creation, content)

with open('src/pages/SignUp.tsx', 'w') as f:
    f.write(content)
