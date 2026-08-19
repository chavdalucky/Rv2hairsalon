with open('src/pages/SignUp.tsx', 'r') as f:
    content = f.read()

bad = """      setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);"""
good = """      setupRecaptcha();
      
      console.log("Firebase Auth instance:", auth ? "Present" : "Missing");
      console.log("Formatted Phone:", formattedPhone);
      console.log("Recaptcha Verifier:", window.recaptchaVerifier ? "Present" : "Missing");
      console.log("Recaptcha Container in DOM:", document.getElementById('recaptcha-container') ? "Present" : "Missing");

      if (!window.recaptchaVerifier) {
         throw new Error("auth/argument-error: RecaptchaVerifier is missing");
      }

      const result = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);"""
content = content.replace(bad, good)

with open('src/pages/SignUp.tsx', 'w') as f:
    f.write(content)
