
import loungeImg from '../assets/images/luxury_waiting_lounge_1786785461271.jpg';
import threadingImg from '../assets/images/threading_and_waxing_1786785477051.jpg';
import beardImg from '../assets/images/styling_beard_1786785491990.jpg';
import facialImg from '../assets/images/premium_facials_1786785504252.jpg';

export const getImageForService = (serviceName: string, categoryId: string) => {
  const name = serviceName.toLowerCase();
  
  if (name.includes('haircut') || (name.includes('styling') && !name.includes('beard'))) return 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=1000';
  if (name.includes('beard grooming')) return 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=1000';
  if (name.includes('clean shave')) return 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1000';
  if (name.includes('styling beard') || name.includes('shave')) return beardImg;
  if (name.includes('color') || name.includes('highlight')) return 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=1000';
  if (name.includes('straightening') || name.includes('rebonding')) return 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=1000';
  if (name.includes('hair mask')) return 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&q=80&w=1000';
  if (name.includes('hair wash') || (name.includes('spa') && categoryId === 'hair')) return 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=1000';
  if (name.includes('hair treatment') || name.includes('keratin') || name.includes('smoothening')) return 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1000';
  if (name.includes('premium facial') || name.includes('facial')) return facialImg;
  if (name.includes('de-tan') || name.includes('bleach')) return 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&q=80&w=1000';
  if (name.includes('face mask')) return 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=1000';
  if (name.includes('glow')) return 'https://images.unsplash.com/photo-1500336624523-d727130c3328?auto=format&fit=crop&q=80&w=1000';
  if (name.includes('massage')) return 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1000';
  if (name.includes('scrub') || name.includes('polishing')) return 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&q=80&w=1000';
  if (name.includes('manicure') || name.includes('pedicure')) return 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=1000';
  if (name.includes('waxing') || name.includes('threading')) return threadingImg;
  if (name.includes('nail art') || name.includes('nail')) return 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80&w=1000';
  
  // Gallery specific mappings
  if (name.includes('lounge')) return loungeImg;
  if (name.includes('tools')) return 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1000';
  if (name.includes('interior')) return 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1000';
  if (name.includes('products')) return 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=80&w=1000';

  // Category fallbacks
  if (categoryId === 'hair') return 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=1000';
  if (categoryId === 'skin') return 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=1000';
  if (categoryId === 'body') return 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1000';
  if (categoryId === 'grooming') return 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=1000';
  
  return 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80&w=1000';
}
