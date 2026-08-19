import re

with open('src/components/UpcomingAppointment.tsx', 'r') as f:
    content = f.read()

# Replace the query and onSnapshot block
old_block = """        const q = query(
          collection(db, 'bookings'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const unsub = onSnapshot(q, (snap) => {
          if (!snap.empty) {
            setAppointments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          } else {
            setAppointments([]);
          }
          setLoading(false);
        });"""

new_block = """        // Fetch all recent bookings and filter/sort client-side for the latest upcoming active one
        const q = query(
          collection(db, 'bookings'),
          where('userId', '==', user.uid)
        );
        const unsub = onSnapshot(q, (snap) => {
          if (!snap.empty) {
            const allAppointments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
            
            const activeStatuses = ['pending', 'confirmed', 'awaiting_confirmation'];
            const activeAppointments = allAppointments.filter(app => activeStatuses.includes((app.status || '').toLowerCase()));
            
            if (activeAppointments.length > 0) {
              const now = new Date();
              
              // Sort by date/time ascending (closest first)
              activeAppointments.sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
                const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
                return dateA.getTime() - dateB.getTime();
              });
              
              const upcoming = activeAppointments.filter(a => {
                const date = new Date(`${a.date}T${a.time || '00:00'}`);
                return date.getTime() >= now.getTime();
              });
              
              if (upcoming.length > 0) {
                 setAppointments([upcoming[0]]);
              } else {
                 setAppointments([activeAppointments[activeAppointments.length - 1]]);
              }
            } else {
              setAppointments([]);
            }
          } else {
            setAppointments([]);
          }
          setLoading(false);
        });"""

content = content.replace(old_block, new_block)

with open('src/components/UpcomingAppointment.tsx', 'w') as f:
    f.write(content)
print("Updated UpcomingAppointment")
