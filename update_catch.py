import re

for filename in ['src/pages/Login.tsx', 'src/pages/SignUp.tsx']:
    with open(filename, 'r') as f:
        content = f.read()
    
    old_catch = """    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
          setError(err.message || 'Failed to authenticate with Google. Please try again.');
      }
    } finally {"""
    
    new_catch = """    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code === 'auth/popup-blocked') {
          setError('Popup blocked by browser. Please allow popups for this site and try again.');
      } else if (err.code !== 'auth/popup-closed-by-user') {
          setError(err.message || 'Failed to authenticate with Google. Please try again.');
      }
    } finally {"""

    content = content.replace(old_catch, new_catch)
    
    with open(filename, 'w') as f:
        f.write(content)

