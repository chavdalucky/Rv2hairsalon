with open('src/components/MyAppointments.tsx', 'r') as f:
    content = f.read()

import re
old_effect_regex = re.compile(r"  useEffect\(\(\) => \{\s*if \(\!userId\) return;\s*const q = query\(\s*collection\(db, 'bookings'\),\s*where\('userId', '==', userId\),\s*orderBy\('createdAt', 'desc'\)\s*\);\s*const unsub = onSnapshot\(q, \(snap\) => \{\s*setAppointments\(snap\.docs\.map\(d => \(\{ id: d\.id, \.\.\.d\.data\(\) \}\)\)\);\s*setLoading\(false\);\s*\}\);\s*return \(\) => unsub\(\);\s*\}, \[userId\]\);", re.MULTILINE)

match = old_effect_regex.search(content)
if match:
    new_effect = """  useEffect(() => {
    if (!userId && !userPhone && !userEmail) {
       setLoading(false);
       return;
    }
    
    // Fetch all bookings or handle it client side for simplicity
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    
    const unsub = onSnapshot(q, (snap) => {
      const allBookings = snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
      
      const filtered = allBookings.filter(b => {
         const matchUserId = b.userId && b.userId === userId;
         
         const cleanUserPhone = userPhone ? userPhone.replace(/\D/g, '').slice(-10) : '';
         const cleanBookingPhone = b.phone ? b.phone.replace(/\D/g, '').slice(-10) : '';
         const matchPhone = cleanUserPhone && cleanBookingPhone && cleanUserPhone === cleanBookingPhone;
         
         const matchEmail = userEmail && b.email && b.email.toLowerCase() === userEmail.toLowerCase();
         
         return matchUserId || matchPhone || matchEmail;
      });
      
      setAppointments(filtered);
      setLoading(false);
    });
    
    return () => unsub();
  }, [userId, userPhone, userEmail]);"""

    content = content[:match.start()] + new_effect + content[match.end():]

with open('src/components/MyAppointments.tsx', 'w') as f:
    f.write(content)
