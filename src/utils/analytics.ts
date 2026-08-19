import { db, auth } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const trackEvent = async (eventName: string, eventData: any = {}) => {
  try {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const deviceType = isMobile ? 'Mobile' : /Tablet|iPad/i.test(navigator.userAgent) ? 'Tablet' : 'Desktop';
    
    // Non-blocking fire and forget
    addDoc(collection(db, 'analytics_events'), {
      eventName,
      eventData,
      deviceType,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: serverTimestamp(),
      userId: auth.currentUser ? auth.currentUser.uid : 'anonymous',
    }).catch(e => {
        // Silently fail to not affect performance
    });
  } catch (error) {
    // Silently fail to not affect performance
  }
};

export const trackPerformance = () => {
  if (typeof window === 'undefined' || !window.performance) return;
  
  window.addEventListener('load', () => {
    setTimeout(() => {
      try {
        const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navEntry) {
          const loadTime = navEntry.loadEventEnd - navEntry.startTime;
          trackEvent('Browser performance', { loadTimeMs: Math.round(loadTime) });
        }
      } catch(e) {}
    }, 0);
  });
};
