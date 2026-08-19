import re

def insert_log(filepath, search_str, log_action):
    with open(filepath, 'r') as f:
        content = f.read()
        
    if "const logActivity" not in content:
        import_stmt = "import { addDoc, collection, serverTimestamp } from 'firebase/firestore';\n"
        if "serverTimestamp" not in content:
            content = content.replace("from 'firebase/firestore';", "from 'firebase/firestore';\n" + import_stmt)
            
        log_func = """
  const logActivity = async (action: string) => {
    try {
      await addDoc(collection(db, 'activity_logs'), {
        action,
        module: 'Admin',
        admin: 'Admin',
        timestamp: serverTimestamp()
      });
    } catch(e) {}
  };
"""
        # Find a good place to insert log_func (e.g. after the first useEffect or inside the component)
        # We will just inline it in the replacements below for safety instead of a global func if it's too complex.

    return content

# We'll just append simple try catch blocks
def patch_file(filepath, replacements):
    with open(filepath, 'r') as f:
        content = f.read()
        
    changed = False
    for search, replace in replacements.items():
        if replace not in content:
            content = content.replace(search, replace)
            changed = True
            
    if changed:
        with open(filepath, 'w') as f:
            f.write(content)

admin_replacements = {
    "await deleteDoc(doc(db, collectionName, id));": "await deleteDoc(doc(db, collectionName, id));\n      try { await addDoc(collection(db, 'activity_logs'), { action: `Deleted item from ${collectionName}`, module: 'Content', admin: 'Admin', timestamp: serverTimestamp() }); } catch(e) {}",
    "await addDoc(collection(db, 'categories'), {": "try { await addDoc(collection(db, 'activity_logs'), { action: `Added category ${newCategory.title}`, module: 'Content', admin: 'Admin', timestamp: serverTimestamp() }); } catch(e) {}\n        await addDoc(collection(db, 'categories'), {",
    "await addDoc(collection(db, 'services'), {": "try { await addDoc(collection(db, 'activity_logs'), { action: `Added service ${newService.title}`, module: 'Content', admin: 'Admin', timestamp: serverTimestamp() }); } catch(e) {}\n        await addDoc(collection(db, 'services'), {",
}
patch_file('src/pages/Admin.tsx', admin_replacements)

settings_replacements = {
    "alert('Settings saved successfully');": "try { await addDoc(collection(db, 'activity_logs'), { action: `Updated system settings`, module: 'Settings', admin: 'Admin', timestamp: serverTimestamp() }); } catch(e) {}\n      alert('Settings saved successfully');"
}
patch_file('src/components/admin/SettingsAdmin.tsx', settings_replacements)

bookings_replacements = {
    "createAdminNotification(`Appointment ${newStatus}`, `Booking for ${data.serviceName} was marked as ${newStatus}.`);": "createAdminNotification(`Appointment ${newStatus}`, `Booking for ${data.serviceName} was marked as ${newStatus}.`);\n            try { await addDoc(collection(db, 'activity_logs'), { action: `Changed booking status to ${newStatus}`, module: 'Bookings', admin: 'Admin', timestamp: serverTimestamp() }); } catch(e) {}"
}
patch_file('src/components/admin/BookingsAdmin.tsx', bookings_replacements)
