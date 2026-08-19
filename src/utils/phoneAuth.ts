import { auth } from '../../firebase';
import { RecaptchaVerifier } from 'firebase/auth';

export const formatPhone = (phone: string) => {
  let p = phone.replace(/\D/g, '');
  
  // If the user somehow pasted 91 at the start of a 12 digit number, fix it
  if (p.startsWith('91') && p.length === 12) {
    p = p.substring(2);
  }
  
  if (p.length === 10) {
    return '+91' + p;
  }
  
  // Return standard format, but it might fail validation later if it's not valid
  return '+91' + p;
};

export const getFirebaseErrorMessage = (err: any) => {
  const msg = err.message || '';
  const code = err.code || '';
  // Let Firebase show the actual error message for operation-not-allowed
  // so the developer can see the exact cause.
  if (msg.includes('invalid-phone-number') || code === 'auth/invalid-phone-number') {
    return 'Invalid phone number format. Please check the number.';
  }
  if (msg.includes('too-many-requests') || code === 'auth/too-many-requests') {
    return 'Too many attempts. Please wait a while before trying again.';
  }
  if (msg.includes('quota-exceeded') || code === 'auth/quota-exceeded') {
    return 'SMS quota exceeded. Please try again later.';
  }
  if (msg.includes('captcha-check-failed') || code === 'auth/captcha-check-failed') {
    return 'reCAPTCHA verification failed. Please try again.';
  }
  if (msg.includes('invalid-verification-code') || code === 'auth/invalid-verification-code') {
    return 'Incorrect OTP. Please check the code and try again.';
  }
  if (msg.includes('code-expired') || code === 'auth/code-expired') {
    return 'This OTP has expired. Please request a new one.';
  }
  if (msg.includes('session-expired') || code === 'auth/session-expired') {
    return 'Session expired. Please request a new OTP.';
  }
  if (msg.includes('network-request-failed') || code === 'auth/network-request-failed') {
    return 'Network error. Please check your internet connection.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Authentication provider is disabled. Please enable Email/Password authentication in your Firebase Console.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email or mobile number already exists. Please log in.';
  }
  if (msg.includes('already exists') || msg.includes('Account not found') || msg.includes('Please fill in all fields') || msg.includes('Please enter a valid 10-digit mobile number')) {
    return msg;
  }
  if (false) {
    return 'An account with this mobile number already exists. Please log in.';
  }
  if (msg.includes('invalid-credential') || code === 'auth/invalid-credential' || msg.includes('user-not-found') || msg.includes('wrong-password')) {
    return 'Invalid credentials or verification failed.';
  }
  return 'Authentication failed. Please try again.';
};

export const setupRecaptcha = (containerId: string) => {
  console.log(`[PhoneAuth] Setting up Recaptcha for container: ${containerId}`);
  
  if (window.recaptchaVerifier) {
    console.log("[PhoneAuth] Existing RecaptchaVerifier found. Clearing it.");
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {
      console.warn("[PhoneAuth] Error clearing existing recaptcha:", e);
    }
    window.recaptchaVerifier = null;
  }

  let container = document.getElementById(containerId);
  if (!container) {
    console.log(`[PhoneAuth] Container ${containerId} not found. Creating it dynamically.`);
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  } else {
    console.log(`[PhoneAuth] Container ${containerId} found in DOM.`);
  }

  try {
    console.log("[PhoneAuth] Initializing new RecaptchaVerifier...");
    window.recaptchaVerifier = new RecaptchaVerifier(auth, container, {
      size: 'invisible',
      callback: (response: any) => {
        console.log("[PhoneAuth] Recaptcha verified successfully.");
      },
      'expired-callback': () => {
        console.log("[PhoneAuth] Recaptcha expired.");
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        }
      }
    });
    console.log("[PhoneAuth] RecaptchaVerifier initialized.");
  } catch (e) {
    console.error("[PhoneAuth] ERROR initializing RecaptchaVerifier:", e);
  }
};

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}
