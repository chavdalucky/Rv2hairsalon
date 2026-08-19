export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    try {
      if (type === 'light') {
        window.navigator.vibrate(50);
      } else if (type === 'medium') {
        window.navigator.vibrate([50, 50, 50]);
      } else {
        window.navigator.vibrate(100);
      }
    } catch (e) {
      // Ignore errors on desktop
    }
  }
};
