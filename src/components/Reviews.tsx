import { useLanguage } from '../lib/LanguageContext';
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquarePlus, User, Loader2, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

export default function Reviews() {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: true }, [
    Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true })
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

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

  const onInit = useCallback(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onInit();
    onSelect();
    emblaApi.on('reInit', onInit);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onInit, onSelect]);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(100)),
      (snap) => {
        const approvedReviews = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((doc: any) => doc.status === 'approved');
        setReviews(approvedReviews);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');

    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const text = (form.elements.namedItem('text') as HTMLTextAreaElement).value;
    const ratingValue = (form.elements.namedItem('rating') as HTMLSelectElement).value;

    try {
      await addDoc(collection(db, 'reviews'), {
        name,
        text,
        rating: parseInt(ratingValue, 10) || 5,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setSuccessMsg(t('reviews.success'));
      form.reset();
      setShowForm(false);
    } catch (err) {
      alert(t('reviews.error'));
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  return (
    <section className="py-24 bg-zinc-950 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-4">{t('reviews.title')}</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 mx-auto mb-8"></div>
          
          {loading ? (
            <div className="flex justify-center items-center h-20 text-amber-500"><Loader2 className="animate-spin w-8 h-8" /></div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 px-8 py-4 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.05)]">
                <span className="text-4xl font-serif font-bold text-amber-400">{avgRating}</span>
                <div className="flex flex-col items-start gap-1">
                  <div className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={18} className={s <= Math.round(Number(avgRating)) ? 'fill-current' : 'text-zinc-700'} />
                    ))}
                  </div>
                  <span className="text-sm text-zinc-400 uppercase tracking-widest">{reviews.length} {t('reviews.verified')}</span>
                </div>
              </div>
              
              {!showForm && (
                <button 
                  onClick={() => setShowForm(true)}
                  className="mt-6 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase text-black bg-amber-500 hover:bg-amber-400 px-6 py-3 rounded transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                >
                  <MessageSquarePlus size={18} /> {t('reviews.share')}
                </button>
              )}
            </div>
          )}
        </div>

        <AnimatePresence>
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto mb-8 p-4 bg-green-900/40 border border-green-500/50 text-green-300 rounded text-center"
            >
              {successMsg}
            </motion.div>
          )}

          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-2xl mx-auto mb-16 overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 p-8 rounded shadow-2xl space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-serif text-white">{t('reviews.write')}</h3>
                  <button type="button" onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white text-sm uppercase">{t('reviews.cancel')}</button>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400 uppercase tracking-widest">{t('reviews.name')}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                    <input name="name" required maxLength={100} className="w-full bg-black border border-zinc-800 rounded px-10 py-3 text-white focus:border-amber-500 focus:outline-none transition-colors" placeholder={t("reviews.namePlaceholder")} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-zinc-400 uppercase tracking-widest">{t('reviews.rating')}</label>
                  <select name="rating" required className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-white focus:border-amber-500 focus:outline-none transition-colors appearance-none cursor-pointer">
                    <option value="5">⭐⭐⭐⭐⭐ {t('reviews.rating.5')}</option>
                    <option value="4">⭐⭐⭐⭐ {t('reviews.rating.4')}</option>
                    <option value="3">⭐⭐⭐ {t('reviews.rating.3')}</option>
                    <option value="2">⭐⭐ {t('reviews.rating.2')}</option>
                    <option value="1">⭐ {t('reviews.rating.1')}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-zinc-400 uppercase tracking-widest">{t('reviews.experience')}</label>
                  <textarea name="text" required maxLength={2000} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 text-white focus:border-amber-500 focus:outline-none transition-colors h-32 resize-none" placeholder={t("reviews.experiencePlaceholder")}></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold uppercase tracking-widest rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? t('reviews.submitting') : t('reviews.submit')}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {reviews.length > 0 ? (
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
                           {t('reviews.verifiedClient')}
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
                {scrollSnaps.map((_, index) => (
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
        )}
      </div>
    </section>
  );
}
