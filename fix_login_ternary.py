import re

with open('src/pages/Login.tsx', 'r') as f:
    content = f.read()

# Replace the specific remaining ternary parts. 
# In the original file, it was:
#           {!isResetMode && !otpSent && (
# And we want it to be:
#           {!isResetMode && (
content = content.replace("{!isResetMode && !otpSent && (", "{!isResetMode && (")

# The ternary ended with `</form>\n          )}` at the end of the motion.div.
# I'll just use regex to remove `          )}` right before `        </motion.div>`
content = re.sub(r'          \)\}\n        </motion\.div>', '        </motion.div>', content)

# Remove `(loginMethod === 'mobile-otp' || loginMethod === 'mobile-password')`
content = content.replace("(loginMethod === 'mobile-otp' || loginMethod === 'mobile-password')", "(loginMethod === 'mobile-password')")

# The reset text says: "To reset via Mobile Number, simply log in using the **OTP** option above and change your password from the Dashboard."
# We should change this to "Please contact support if you need to reset your password via Mobile Number, or use Email reset."
content = content.replace("To reset via Mobile Number, simply log in using the <strong>OTP</strong> option above and change your password from the Dashboard.", "To reset via Mobile Number, please log in with your email or contact support if you do not have an email attached.")

# Remove recaptcha-container-login
content = content.replace('<div id="recaptcha-container-login"></div>', '')

# Remove window.recaptchaVerifier logic
recaptcha_clear = """      try {
          if (window.recaptchaVerifier) {
              window.recaptchaVerifier.clear();
             window.recaptchaVerifier = null;
          }
      } catch (e) {}"""
content = content.replace(recaptcha_clear, "")

recaptcha_clear2 = """      try {
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
        }
      } catch (e) {}"""
content = content.replace(recaptcha_clear2, "")

# Remove imports
content = content.replace("RecaptchaVerifier, signInWithPhoneNumber, signInWithEmailAndPassword", "signInWithEmailAndPassword")

with open('src/pages/Login.tsx', 'w') as f:
    f.write(content)
