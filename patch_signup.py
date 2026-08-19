import re

with open('src/pages/SignUp.tsx', 'r') as f:
    content = f.read()

bad_setup = """  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
    }
  };"""

good_setup = """  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
      } catch (e) {
        console.warn("Recaptcha init error:", e);
      }
    }
  };"""
content = content.replace(bad_setup, good_setup)

bad_catch = """    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send OTP. Please try again.');
      if (window.recaptchaVerifier) { 
         window.recaptchaVerifier.clear();
         window.recaptchaVerifier = null;
      }
    }"""

good_catch = """    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('operation-not-allowed')) {
          setError('Phone authentication is disabled in Firebase. Please enable it in Firebase Console.');
      } else {
          setError(err.message || 'Failed to send OTP. Please try again.');
      }
      try {
          if (window.recaptchaVerifier) { 
             window.recaptchaVerifier.clear();
             window.recaptchaVerifier = null;
          }
      } catch (e) {}
    }"""
content = content.replace(bad_catch, good_catch)

with open('src/pages/SignUp.tsx', 'w') as f:
    f.write(content)
