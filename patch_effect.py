import re

for file in ['src/pages/Login.tsx', 'src/pages/SignUp.tsx']:
    with open(file, 'r') as f:
        content = f.read()

    bad_login = """  useEffect(() => {
    return () => {
      if (window.recaptchaVerifierLogin) {
        window.recaptchaVerifierLogin.clear();
      }
    };
  }, []);"""

    good_login = """  useEffect(() => {
    return () => {
      try {
        if (window.recaptchaVerifierLogin) {
          window.recaptchaVerifierLogin.clear();
        }
      } catch (e) {}
    };
  }, []);"""

    bad_signup = """  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
    };
  }, []);"""

    good_signup = """  useEffect(() => {
    return () => {
      try {
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
        }
      } catch (e) {}
    };
  }, []);"""

    content = content.replace(bad_login, good_login).replace(bad_signup, good_signup)
    with open(file, 'w') as f:
        f.write(content)
