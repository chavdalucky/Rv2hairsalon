import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent, trackPerformance } from '../utils/analytics';

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Initial website open
    if (!sessionStorage.getItem('session_started')) {
      trackEvent('Website opened');
      sessionStorage.setItem('session_started', 'true');
      trackPerformance();
    }
  }, []);

  useEffect(() => {
    const pageNames: Record<string, string> = {
      '/': 'Home page viewed',
      '/about': 'About page viewed',
      '/services': 'Services page viewed',
      '/gallery': 'Gallery page viewed',
      '/contact': 'Contact page viewed',
      '/dashboard': 'Profile viewed',
    };
    
    const eventName = pageNames[location.pathname];
    if (eventName) {
      trackEvent(eventName);
    }
  }, [location.pathname]);

  return null;
}
