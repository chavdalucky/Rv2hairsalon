import re

# We will read both files and inject Google Auth logic

def add_google_imports(content):
    if "GoogleAuthProvider" not in content:
        content = content.replace(
            "import { updateProfile, createUserWithEmailAndPassword } from 'firebase/auth';",
            "import { updateProfile, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';"
        )
        content = content.replace(
            "import { signInWithEmailAndPassword, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';",
            "import { signInWithEmailAndPassword, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';"
        )
    return content

# I'll just write the entire files or modify them. Let's see how they look.
