import os
import re

def patch_login():
    with open('src/pages/Login.tsx', 'r') as f:
        content = f.read()

    # Imports
    if 'GoogleAuthProvider' not in content:
        content = content.replace(
            "import { signInWithEmailAndPassword, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';",
            "import { signInWithEmailAndPassword, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';"
        )
        content = content.replace(
            "import { doc, getDoc } from 'firebase/firestore';",
            "import { doc, getDoc, setDoc } from 'firebase/firestore';"
        )

    # Add Google Auth handler
    google_handler = """  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          fullName: user.displayName || 'New User',
          email: user.email,
          phone: user.phoneNumber || null,
          phoneVerified: !!user.phoneNumber,
          createdAt: new Date().toISOString(),
          role: 'user',
          rewardPoints: 100,
          rewardsTier: 'Bronze',
          visits: 0,
          totalSpent: 0
        });
        await logActivity(user.uid, 'Account Created', 'Successfully created new account via Google');
        await createNotification(user.uid, 'Welcome to RV 2 Luxe Salon!', 'Your account has been successfully created. Enjoy 100 Welcome Points!', 'Registration');
      } else {
        await logActivity(user.uid, 'Login', 'Logged in via Google');
        await createNotification(user.uid, 'Login Successful', 'You have successfully logged in.', 'Login');
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
          setError(err.message || 'Failed to authenticate with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {"""
    if "handleGoogleSignIn" not in content:
        content = content.replace("  const handleLogin = async (e: React.FormEvent) => {", google_handler)

    # Change titles
    content = content.replace("{t('auth.login.title')}", "Welcome Back")
    content = content.replace("{t('auth.loginBtn')} to your account", "Sign in to your account")

    # Add Google Button and link to Sign Up
    google_btn = """          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-zinc-900/60 text-zinc-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleSignIn}
                type="button"
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-zinc-700 rounded-xl bg-black text-white hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 focus:ring-offset-zinc-900"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </div>
          
          <p className="text-center text-sm text-zinc-500 pt-6 font-light">
            Don't have an account? <Link to="/signup" className="text-amber-500 hover:text-amber-400 font-medium transition-colors">Create Account</Link>
          </p>"""
    
    if "Continue with Google" not in content:
        # replace the original link with new link + google button
        old_link = """          <p className="text-center text-sm text-zinc-500 pt-6 font-light">
            Don't have an account? <Link to="/signup" className="text-amber-500 hover:text-amber-400 font-medium transition-colors">Sign up</Link>
          </p>"""
        if old_link in content:
             content = content.replace(old_link, google_btn)
        else:
             content = content.replace("</motion.div>", f"{google_btn}\n        </motion.div>")

    with open('src/pages/Login.tsx', 'w') as f:
        f.write(content)

def patch_signup():
    with open('src/pages/SignUp.tsx', 'r') as f:
        content = f.read()

    # Imports
    if 'GoogleAuthProvider' not in content:
        content = content.replace(
            "import { updateProfile, createUserWithEmailAndPassword } from 'firebase/auth';",
            "import { updateProfile, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';"
        )

    # Add Google Auth handler
    google_handler = """  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          fullName: user.displayName || 'New User',
          email: user.email,
          phone: user.phoneNumber || null,
          phoneVerified: !!user.phoneNumber,
          createdAt: new Date().toISOString(),
          role: 'user',
          rewardPoints: 100,
          rewardsTier: 'Bronze',
          visits: 0,
          totalSpent: 0
        });
        await logActivity(user.uid, 'Account Created', 'Successfully created new account via Google');
        await createNotification(user.uid, 'Welcome to RV 2 Luxe Salon!', 'Your account has been successfully created. Enjoy 100 Welcome Points!', 'Registration');
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
          setError(err.message || 'Failed to authenticate with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {"""
    if "handleGoogleSignIn" not in content:
        content = content.replace("  const handleSignUp = async (e: React.FormEvent) => {", google_handler)
        # Update normal signup rewardPoints
        content = content.replace("rewardsPoints: 0,", "rewardPoints: 100,")
        content = content.replace("'Your account has been successfully created.'", "'Your account has been successfully created. Enjoy 100 Welcome Points!'")

    # Change titles
    content = content.replace("{t('auth.signup.title')}", "Create Account")
    # Actually wait, maybe it's translated, I'll just change the string or not. Let's just change it in code.

    # Add Google Button and link to Login
    google_btn = """              <button
                type="submit"
                disabled={loading}
                className="w-full relative group overflow-hidden rounded-xl bg-amber-500 text-black font-bold py-4 uppercase tracking-widest text-sm transition-all hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 shadow-[0_0_20px_rgba(245,158,11,0.2)] mt-4"
              >
                <span className="relative z-10">{loading ? 'Creating Account...' : 'Create Account'}</span>
              </button>
              
              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-800"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-zinc-900/60 text-zinc-500">Or continue with</span>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={handleGoogleSignIn}
                    type="button"
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-zinc-700 rounded-xl bg-black text-white hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 focus:ring-offset-zinc-900"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </button>
                </div>
              </div>"""
    
    if "Continue with Google" not in content:
        # replace the original button 
        old_btn = """              <button
                type="submit"
                disabled={loading}
                className="w-full relative group overflow-hidden rounded-xl bg-amber-500 text-black font-bold py-4 uppercase tracking-widest text-sm transition-all hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 shadow-[0_0_20px_rgba(245,158,11,0.2)] mt-4"
              >
                <span className="relative z-10">{loading ? 'Creating Account...' : 'Create Account'}</span>
              </button>"""
        content = content.replace(old_btn, google_btn)

    with open('src/pages/SignUp.tsx', 'w') as f:
        f.write(content)

patch_login()
patch_signup()
