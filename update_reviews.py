import re

with open("src/components/Reviews.tsx", "r") as f:
    content = f.read()

# Replace imports
new_imports = """import { useLanguage } from '../lib/LanguageContext';
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquarePlus, User, Loader2, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';"""
content = re.sub(r"import \{ useLanguage \}.*?import \{ Star, MessageSquarePlus, User, Loader2 \} from 'lucide-react';", new_imports, content, flags=re.DOTALL)

# Add embla setup right after states
embla_setup = """  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: true }, [
    Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true })
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);"""
content = re.sub(r"const \[successMsg, setSuccessMsg\] = useState\(''\);\n", "const [successMsg, setSuccessMsg] = useState('');\n" + embla_setup + "\n", content)

# Replace the grid with Embla layout
grid_regex = r'<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">.*?{reviews\.length === 0 && !loading && \(\s*<div className="col-span-full py-12 text-center text-zinc-500 font-light">\s*\{t\(\'reviews\.empty\'\)\}\s*</div>\s*\)}\s*</div>'

new_slider = """{reviews.length > 0 ? (
          <div className="relative max-w-5xl mx-auto px-4 sm:px-12">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex -ml-4 touch-pan-y">
                {reviews.map((review, i) => (
                  <div key={review.id} className="min-w-0 shrink-0 grow-0 basis-full sm:basis-1/2 lg:basis-1/3 pl-4">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4 }}
                      className="p-8 h-full bg-zinc-900 border border-zinc-800 rounded-2xl relative group hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between shadow-xl"
                    >
                      <div>
                        <div className="absolute font-serif text-8xl text-amber-500/10 -top-6 right-4 pointer-events-none transition-transform group-hover:scale-110 group-hover:text-amber-500/20">"</div>
                        <div className="flex items-center gap-4 mb-6 relative z-10">
                          <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20 shrink-0">
                            <User className="text-amber-500 w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-white font-bold tracking-wide">{review.name}</h4>
                            <div className="flex text-amber-500 mt-1">
                              {[...Array(5)].map((_, idx) => (
                                <Star key={idx} size={14} className={idx < review.rating ? "fill-current" : "text-zinc-700"} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-zinc-300 leading-relaxed relative z-10 font-light italic mb-6">
                          "{review.text}"
                        </p>
                      </div>
                      
                      {/* Optional service tag visual (Since we don't have a rigid service field, we can use a small decorative element) */}
                      <div className="border-t border-zinc-800/80 pt-4 mt-auto">
                        <div className="flex items-center gap-2 text-xs text-amber-500/80 font-medium tracking-widest uppercase">
                           <Quote size={12} className="text-amber-500" />
                           Verified Client
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>

            {/* Slider Controls */}
            <div className="flex items-center justify-center gap-8 mt-10">
              <button 
                onClick={scrollPrev} 
                className="w-12 h-12 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-amber-500 hover:border-amber-500/50 transition-all disabled:opacity-30 disabled:hover:border-zinc-800 disabled:hover:text-zinc-400"
              >
                <ChevronLeft size={24} />
              </button>
              
              <div className="flex items-center gap-3">
                {reviews.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollTo(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === selectedIndex ? 'w-8 bg-amber-500' : 'w-2 bg-zinc-800 hover:bg-zinc-600'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              <button 
                onClick={scrollNext} 
                className="w-12 h-12 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-amber-500 hover:border-amber-500/50 transition-all disabled:opacity-30 disabled:hover:border-zinc-800 disabled:hover:text-zinc-400"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="py-12 text-center text-zinc-500 font-light">
              {t('reviews.empty')}
            </div>
          )
        )}"""
content = re.sub(grid_regex, new_slider, content, flags=re.DOTALL)

with open("src/components/Reviews.tsx", "w") as f:
    f.write(content)
