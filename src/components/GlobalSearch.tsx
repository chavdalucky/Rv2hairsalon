import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Scissors, Image as ImageIcon, User, Phone, Tag, Star, HelpCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';
import { triggerHaptic } from '../utils/haptics';
import { trackEvent } from '../utils/analytics';
const searchData = [
  { title: "All Services", category: "Services", path: "/services", icon: Scissors },
  { title: "Haircuts", category: "Services", path: "/services#haircuts", icon: Scissors },
  { title: "Beard Grooming", category: "Services", path: "/services#beard", icon: Scissors },
  { title: "Hair Spa", category: "Services", path: "/services#spa", icon: Scissors },
  { title: "Hair Wash", category: "Services", path: "/services#wash", icon: Scissors },
  { title: "Hair Coloring", category: "Services", path: "/services#color", icon: Scissors },
  { title: "Facial", category: "Services", path: "/services#facial", icon: Scissors },
  { title: "Manicure", category: "Services", path: "/services#manicure", icon: Scissors },
  { title: "Pedicure", category: "Services", path: "/services#pedicure", icon: Scissors },
  { title: "Gallery", category: "Pages", path: "/gallery", icon: ImageIcon },
  { title: "About Us", category: "Pages", path: "/about", icon: User },
  { title: "Contact", category: "Pages", path: "/contact", icon: Phone },
  { title: "Special Offers", category: "Offers", path: "/#offers", icon: Tag },
  { title: "Testimonials", category: "Reviews", path: "/#testimonials", icon: Star },
  { title: "FAQs", category: "Support", path: "/#faqs", icon: HelpCircle },
];

export default function GlobalSearch() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(searchData);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
    } else {
      const lowerQuery = query.toLowerCase();
      const filtered = searchData.filter(item => 
        item.title.toLowerCase().includes(lowerQuery) || 
        item.category.toLowerCase().includes(lowerQuery)
      );
      setResults(filtered);
    }
  }, [query]);

  const handleResultClick = (path: string) => {
    triggerHaptic('light');
    trackEvent('Search used', { query, selectedPath: path });
    setIsOpen(false);
    setQuery('');
    
    // Handle hash links correctly
    if (path.includes('#')) {
      const [route, hash] = path.split('#');
      if (route === '/' || route === window.location.pathname) {
        navigate(path);
        // Small delay to ensure scroll happens after navigation
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        navigate(path);
      }
    } else {
      navigate(path);
    }
  };

  const highlightMatch = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="text-amber-500 font-bold">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center p-2 rounded-full text-zinc-400 hover:text-amber-500 hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50 ml-2"
        title="Search"
      >
        <Search size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 left-0 right-0 z-[70] p-4 sm:p-6 pointer-events-none"
            >
              <div className="max-w-3xl mx-auto pointer-events-auto">
                <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                  {/* Search Input Area */}
                  <div className="relative flex items-center p-4 border-b border-zinc-800">
                    <Search className="absolute left-6 text-amber-500" size={24} />
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t("search.placeholder")}
                      className="w-full bg-transparent border-none text-white text-lg sm:text-xl pl-14 pr-12 py-2 focus:outline-none focus:ring-0 placeholder-zinc-500 font-serif"
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setIsOpen(false);
                        if (e.key === 'Enter' && results.length > 0) {
                          handleResultClick(results[0].path);
                        }
                      }}
                    />
                    {query && (
                      <button
                        onClick={() => setQuery('')}
                        className="absolute right-16 p-1 text-zinc-400 hover:text-white transition-colors"
                      >
                        <X size={20} />
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="absolute right-4 p-2 text-zinc-400 hover:text-white bg-zinc-800 rounded-full transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Results Area */}
                  <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
                    {query.trim() === '' ? (
                      <div className="p-8 text-center text-zinc-500 font-serif">
                        <Search className="mx-auto mb-4 opacity-50" size={32} />
                        <p>{t("search.start")}</p>
                      </div>
                    ) : results.length > 0 ? (
                      <ul className="py-2">
                        {results.map((result, idx) => {
                          const Icon = result.icon;
                          return (
                            <li key={idx}>
                              <button
                                onClick={() => handleResultClick(result.path)}
                                className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-zinc-800/50 transition-colors group focus:outline-none focus:bg-zinc-800/50"
                              >
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                                  <Icon size={18} />
                                </div>
                                <div className="flex-grow">
                                  <h4 className="text-white text-lg font-serif">
                                    {highlightMatch(result.title, query)}
                                  </h4>
                                  <span className="text-xs text-zinc-500 uppercase tracking-wider">
                                    {result.category}
                                  </span>
                                </div>
                                <ChevronRight className="text-zinc-600 group-hover:text-amber-500 transition-colors transform group-hover:translate-x-1" size={20} />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="p-8 text-center text-zinc-500 font-serif">
                        <p>{t("search.noResults")} "<span className="text-zinc-300">{query}</span>"</p>
                        <p className="text-sm mt-2">{t("search.noResultsDesc")}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
