with open('src/pages/Login.tsx', 'r') as f:
    content = f.read()

bad = """      setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifierLogin);"""
good = """      setupRecaptcha();

      console.log("Firebase Auth instance:", auth ? "Present" : "Missing");
      console.log("Formatted Phone:", formattedPhone);
      console.log("Recaptcha Verifier:", window.recaptchaVerifierLogin ? "Present" : "Missing");
      console.log("Recaptcha Container in DOM:", document.getElementById('recaptcha-container-login') ? "Present" : "Missing");

      if (!window.recaptchaVerifierLogin) {
         throw new Error("auth/argument-error: RecaptchaVerifierLogin is missing");
      }

      const result = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifierLogin);"""
content = content.replace(bad, good)

with open('src/pages/Login.tsx', 'w') as f:
    f.write(content)
