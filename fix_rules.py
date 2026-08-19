import re

with open('firestore.rules', 'r') as f:
    content = f.read()

# Update bookings
content = content.replace("allow create: if isSignedIn();", "allow create: if true;")

# Update notifications
old_notif = "allow create: if isSignedIn() && (request.auth.uid == request.resource.data.userId || isAdmin());"
new_notif = "allow create: if (isSignedIn() && (request.auth.uid == request.resource.data.userId || isAdmin())) || request.resource.data.userId == 'admin';"
content = content.replace(old_notif, new_notif)

with open('firestore.rules', 'w') as f:
    f.write(content)
