import React from 'react';
import { MapPin, Navigation } from 'lucide-react';

export default function LocationMap() {
  const url = "https://www.google.com/maps/dir/?api=1&destination=RV+2+Hair+Saloon,+NH+51,+Prachi,+Gujarat+362268,+India";

  return (
    <a 
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-black border-t border-zinc-800 relative overflow-hidden group cursor-pointer h-[400px] flex items-center justify-center transition-colors duration-700 hover:bg-zinc-900"
    >
      <div className="flex flex-col items-center justify-center p-6 text-center transition-transform duration-700 md:group-hover:scale-110">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-amber-500/20 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all duration-500 will-change-transform group-hover:scale-110">
          <MapPin className="text-amber-500 w-10 h-10" />
        </div>
        <h3 className="text-white text-2xl md:text-3xl font-serif tracking-wide mb-3 text-shadow-sm group-hover:text-amber-500 transition-colors duration-500">RV 2 Hair Saloon</h3>
        <p className="text-zinc-300 font-light text-base md:text-lg mb-8 max-w-md mx-auto text-shadow-sm">NH 51, Prachi, Gujarat 362268, India</p>
        
        <div 
          className="px-8 py-4 bg-amber-500 text-black font-bold uppercase tracking-widest text-sm rounded flex items-center justify-center gap-3 transition-all duration-500 md:hover:-translate-y-1 md:hover:scale-[1.03] md:hover:shadow-[0_10px_30px_rgba(245,158,11,0.6)] shadow-[0_0_15px_rgba(245,158,11,0.3)]"
        >
           Get Directions <Navigation size={18} />
        </div>
      </div>
    </a>
  );
}
