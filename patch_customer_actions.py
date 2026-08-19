with open('src/pages/SignUp.tsx', 'r') as f:
    content = f.read()

import_stmt = "import { createAdminNotification } from '../utils/notifications';\n"
if "createAdminNotification" not in content:
    content = content.replace("import { auth, db } from '../firebase';", "import { auth, db } from '../firebase';\n" + import_stmt)
    content = content.replace("          email: authEmail,\n          createdAt: new Date().toISOString()\n        });", "          email: authEmail,\n          createdAt: new Date().toISOString()\n        });\n        createAdminNotification('New Customer Registration', `${formData.fullName} has registered an account.`);")
    with open('src/pages/SignUp.tsx', 'w') as f:
        f.write(content)

with open('src/pages/Services.tsx', 'r') as f:
    content = f.read()

if "createAdminNotification" not in content:
    content = content.replace("import { db, auth } from '../firebase';", "import { db, auth } from '../firebase';\n" + import_stmt)
    content = content.replace("        await deleteDoc(doc(db, 'favorites', favId));", "        await deleteDoc(doc(db, 'favorites', favId));\n        createAdminNotification('Customer Activity', `A customer removed a service from their favourites.`);")
    content = content.replace("          addedAt: serverTimestamp()\n        });", "          addedAt: serverTimestamp()\n        });\n        createAdminNotification('Customer Activity', `A customer added ${service.title} to their favourites.`);")
    with open('src/pages/Services.tsx', 'w') as f:
        f.write(content)
