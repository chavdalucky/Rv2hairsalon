import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, getFirebaseMessaging } from '../../firebase';
import { getToken } from 'firebase/messaging';

export type NotificationType = 
  | 'Login' 
  | 'Registration' 
  | 'Password Changed' 
  | 'Profile Updated'
  | 'Announcement'
  | 'Security Alert'
  | 'Admin Message'
  | 'Promotion';

export const createNotification = async (
  userId: string, 
  title: string, 
  body: string, 
  type: NotificationType,
  scheduledFor?: Date
) => {
  try {
    const timestamp = scheduledFor ? scheduledFor : serverTimestamp();
    if (userId === 'all') {
      // In a real backend, we would trigger a function to send to all users.
      // Here, we just store it as an admin message
      await addDoc(collection(db, 'notifications'), {
        userId: 'all',
        title,
        body,
        type,
        read: false,
        timestamp
      });
      return;
    }
    
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      body,
      type,
      read: false,
      timestamp
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

export const requestNotificationPermission = async (userId: string) => {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      try {
        const token = await getToken(messaging, { 
          // We would normally pass vapidKey here if we had one
        });
        if (token) {
          // Save the token to firestore for this user
          await addDoc(collection(db, 'fcm_tokens'), {
            userId,
            token,
            createdAt: serverTimestamp()
          });
          return token;
        }
      } catch (e) {
        // getToken fails without vapidKey or if environment doesn't support it, gracefully fallback
        console.warn('FCM push token could not be retrieved, falling back to in-app notifications only.', e);
      }
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
  }
  return null;
};

export const createAdminNotification = async (title: string, message: string) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId: 'admin',
      title,
      message,
      read: false,
      timestamp: serverTimestamp()
    });
  } catch(e) {
    console.error(e);
  }
};
