import re

with open('src/pages/SignUp.tsx', 'r') as f:
    content = f.read()

# 1. Update email generation
content = content.replace(
    "const authEmail = formData.email ? formData.email.toLowerCase() : `${formattedPhone.replace('+', '')}@rv2.app`;",
    "const authEmail = formData.email ? formData.email.toLowerCase() : `${formattedPhone.replace('+', '')}@tempapp.com`;"
)

# 2. Add toast import
if "import { toast } from '../lib/toast';" not in content:
    content = content.replace(
        "import { Link, useNavigate } from 'react-router-dom';",
        "import { Link, useNavigate } from 'react-router-dom';\nimport { toast } from '../lib/toast';"
    )

# 3. Update error handler to show toast
old_err = """      console.error('[SignUp] ERROR:', err);
      setError(getFirebaseErrorMessage(err));"""
new_err = """      console.error('[SignUp] ERROR:', err);
      const msg = getFirebaseErrorMessage(err);
      setError(msg);
      toast(msg);"""
content = content.replace(old_err, new_err)

# 4. Make email required just in case the prompt implies it might be better
content = content.replace(
    'placeholder="Email Address (Optional)"',
    'placeholder="Email Address"'
)

with open('src/pages/SignUp.tsx', 'w') as f:
    f.write(content)
