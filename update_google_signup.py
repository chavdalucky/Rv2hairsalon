import re
with open('src/pages/SignUp.tsx', 'r') as f:
    content = f.read()

google_creation = """        await setDoc(doc(db, 'users', user.uid), {
          fullName: user.displayName || 'New User',
          email: user.email,
          phone: user.phoneNumber || null,
          phoneVerified: !!user.phoneNumber,
          createdAt: new Date().toISOString(),
          role: 'user',
          rewardPoints: 10,
          rewardsTier: 'Bronze',
          totalVisits: 0,
          visits: 0,
          totalSpent: 0
        });
        
        await addDoc(collection(db, 'rewardHistory'), {
            userId: user.uid,
            adminId: 'system',
            action: `Welcome Bonus`,
            reason: `Sign up reward via Google`,
            previousPoints: 0,
            newPoints: 10,
            previousVisits: 0,
            newVisits: 0,
            date: serverTimestamp()
        });"""

content = re.sub(r"        await setDoc\(doc\(db, 'users', user\.uid\), \{[\s\S]*?totalSpent: 0\s*\}\);", google_creation, content)

with open('src/pages/SignUp.tsx', 'w') as f:
    f.write(content)
