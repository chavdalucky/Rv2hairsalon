import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingWhatsApp from '../FloatingWhatsApp';
import ToastContainer from '../ToastContainer';
import BookingModal from '../BookingModal';
import LiveVoiceAssistant from '../LiveVoiceAssistant';
import { useState, useEffect } from 'react';

export default function Layout() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    const handleOpenBooking = () => setIsBookingOpen(true);
    window.addEventListener('open-booking-modal', handleOpenBooking);
    return () => window.removeEventListener('open-booking-modal', handleOpenBooking);
  }, []);

  return (
    <div className="flex min-h-screen flex-col font-sans text-zinc-300">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <FloatingWhatsApp />
      <LiveVoiceAssistant />
      <ToastContainer />
      <Footer />
      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
    </div>
  );
}
