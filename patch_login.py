import re

with open('src/pages/Login.tsx', 'r') as f:
    content = f.read()

bad_catch_login = """    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid credentials or verification failed.');
      if (window.recaptchaVerifierLogin) {
         window.recaptchaVerifierLogin.clear();
         window.recaptchaVerifierLogin = null;
      }
    }"""

good_catch_login = """    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('operation-not-allowed')) {
          setError('Phone verification is currently unavailable. Please try again.');
      } else if (err.message?.includes('too-many-requests')) {
          setError('Too many attempts. Please wait a while before trying again.');
      } else if (err.message?.includes('invalid-credential') || err.message?.includes('user-not-found') || err.message?.includes('wrong-password')) {
          setError('Invalid credentials or verification failed.');
      } else {
          setError(err.message || 'Invalid credentials or verification failed.');
      }
      try {
          if (window.recaptchaVerifierLogin) { 
             window.recaptchaVerifierLogin.clear();
             window.recaptchaVerifierLogin = null;
          }
      } catch (e) {}
    }"""

bad_catch_otp = """    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid OTP. Please try again.');
    }"""

good_catch_otp = """    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('code-expired')) {
        setError('This OTP has expired. Please request a new one.');
      } else if (err.message?.includes('invalid-verification-code')) {
        setError('Incorrect OTP. Please check the code and try again.');
      } else {
        setError('Incorrect OTP. Please check the code and try again.');
      }
    }"""

content = content.replace(bad_catch_login, good_catch_login).replace(bad_catch_otp, good_catch_otp)

with open('src/pages/Login.tsx', 'w') as f:
    f.write(content)
