import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

export type ActivityType = 
  | 'Account Created'
  | 'Login'
  | 'Logout'
  | 'Password Changed'
  | 'Email Verified'
  | 'Mobile Verified'
  | 'Profile Updated'
  | 'Profile Photo Updated'
  | 'Account Deleted';

export const logActivity = async (userId: string, activityType: ActivityType, details: string = '') => {
  try {
    await addDoc(collection(db, 'activity_logs'), {
      userId,
      activityType,
      details,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
