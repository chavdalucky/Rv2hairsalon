import re

with open('src/components/layout/Layout.tsx', 'r') as f:
    content = f.read()

content = content.replace("import ToastContainer from '../ToastContainer';", 
"""import ToastContainer from '../ToastContainer';
import BookingModal from '../BookingModal';
import { useState, useEffect } from 'react';""")

content = content.replace("export default function Layout() {", 
"""export default function Layout() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    const handleOpenBooking = () => setIsBookingOpen(true);
    window.addEventListener('open-booking-modal', handleOpenBooking);
    return () => window.removeEventListener('open-booking-modal', handleOpenBooking);
  }, []);
""")

content = content.replace("<Footer />", 
"""<Footer />
      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />""")

with open('src/components/layout/Layout.tsx', 'w') as f:
    f.write(content)
