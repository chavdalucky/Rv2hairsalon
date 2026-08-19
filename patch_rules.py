import re

with open('firestore.rules', 'r') as f:
    content = f.read()

ai_chats_rule = """
    match /ai_chats/{chatId} {
      allow read: if isSignedIn() && (request.auth.uid == resource.data.userId || isAdmin());
      allow create: if isSignedIn() && request.auth.uid == request.resource.data.userId;
      allow update: if isSignedIn() && request.auth.uid == resource.data.userId && request.auth.uid == request.resource.data.userId;
      allow delete: if isSignedIn() && request.auth.uid == resource.data.userId;
    }
"""

if "match /ai_chats/" not in content:
    # insert before the last two closing braces
    content = content.replace("  }\n}", ai_chats_rule + "  }\n}")
    with open('firestore.rules', 'w') as f:
        f.write(content)
    print("Updated firestore.rules")
else:
    print("Already there")
