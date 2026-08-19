import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, Loader2, Mic, MicOff, Volume2 } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { trackEvent } from '../utils/analytics';
import { useLanguage } from '../lib/LanguageContext';
import { auth, db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AIStudio() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen pt-24 pb-12 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-6"
          >
            <Sparkles size={16} />
            <span className="text-sm font-bold tracking-widest uppercase">AI Studio</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-serif text-white mb-4">Virtual Salon Assistant</h1>
          <p className="text-zinc-400 max-w-2xl mx-auto">Experience the future of styling. Chat with our AI expert to discover your next look.</p>
        </div>

        {/* Content Area */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden min-h-[450px] md:min-h-[600px] flex flex-col relative max-w-[92%] sm:max-w-full mx-auto w-full">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}

// === Subcomponents ===

const INITIAL_WELCOME = "Welcome to RV 2 AI Assistant ✨\nનમસ્તે! અમે તમારી કેવી રીતે મદદ કરી શકીએ?";

const SUGGESTIONS = [
  "Book an appointment",
  "Check services & prices",
  "Hair style suggestions",
  "Ask about salon services"
];

function ChatInterface() {
  const [messages, setMessages] = useState<any[]>([{ role: 'assistant', text: INITIAL_WELCOME }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Voice feature states
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const recognitionRef = useRef<any>(null);
  const modeRef = useRef(mode);

  useEffect(() => {
     modeRef.current = mode;
     if (mode === 'text') {
        window.speechSynthesis?.cancel();
        if (isListening) recognitionRef.current?.stop();
     }
  }, [mode, isListening]);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      // Let browser determine the language based on locale/settings or we can leave it unset
      // so it can handle English and Gujarati if system supports it.
      
      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError('');
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleSend(transcript); // Send the spoken text
      };
      
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
           setVoiceError('Microphone access denied. Please allow permissions.');
        } else {
           setVoiceError(`Microphone error: ${event.error}`);
        }
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    } else {
      setVoiceError('Speech recognition is not supported in this browser.');
    }

    return () => {
       if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch(e) {}
       }
       window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const saveMessage = async (role: 'user'|'assistant', text: string) => {
    const user = auth.currentUser;
    if (user) {
      await addDoc(collection(db, 'ai_chats'), {
        userId: user.uid,
        role,
        text,
        createdAt: serverTimestamp()
      });
    }
  };

  const speakText = (text: string) => {
    if (modeRef.current === 'voice' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setVoiceError('');
      try {
        recognitionRef.current?.start();
      } catch (err) {
        // Ignore if already started
      }
    }
  };

  const handleSend = async (overrideText?: string | React.MouseEvent) => {
    const isOverrideStr = typeof overrideText === 'string';
    const userMsg = isOverrideStr ? overrideText.trim() : input.trim();
    
    if (!userMsg || loading) return;
    triggerHaptic('light');
    trackEvent('AI Chat Message Sent');
    
    if (!isOverrideStr) {
       setInput('');
    }
    
    // Update local UI immediately
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    await saveMessage('user', userMsg);
    
    setLoading(true);

    try {
      // Create context payload
      const allMsgs = [...messages, { role: 'user', text: userMsg }];
      
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg,
          messages: allMsgs, 
          model: 'gemini-3.5-flash' 
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      const aiResponseText = data.text;
      setMessages(prev => [...prev, { role: 'assistant', text: aiResponseText }]);
      await saveMessage('assistant', aiResponseText);
      speakText(aiResponseText);
    } catch (err: any) {
      let errMsg = err.message;
      if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('resource_exhausted')) {
          errMsg = "I'm currently receiving too many requests. Please try again in a few moments.";
      }
      const errResponse = `Sorry, I encountered an error: ${errMsg}`;
      setMessages(prev => [...prev, { role: 'assistant', text: errResponse }]);
      speakText("Sorry, I encountered an error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-[450px] md:h-[600px]"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-amber-500" />
          <h2 className="font-serif text-lg text-white">AI Stylist</h2>
        </div>
        <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button 
            onClick={() => setMode('text')} 
            className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${mode === 'text' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'}`}
          >
            Text
          </button>
          <button 
            onClick={() => setMode('voice')} 
            className={`px-4 py-2 rounded-md text-sm font-bold transition-colors flex items-center gap-2 ${mode === 'voice' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'}`}
          >
            <Volume2 size={14} /> Voice
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-4 py-3 md:px-6 md:py-4 text-sm md:text-base ${
              msg.role === 'user' 
                ? 'bg-amber-500 text-black rounded-br-none' 
                : 'bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-bl-none'
            }`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {messages.length === 1 && !loading && (
           <div className="flex flex-wrap gap-2 mt-4">
             {SUGGESTIONS.map((suggestion, i) => (
               <button
                 key={i}
                 onClick={() => handleSend(suggestion)}
                 className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-full text-sm text-zinc-300 transition-colors"
               >
                 {suggestion}
               </button>
             ))}
           </div>
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-bl-none px-4 py-3 md:px-6 md:py-4 flex items-center gap-2">
              <Loader2 className="animate-spin text-amber-500" size={16} />
              <span className="text-zinc-400 text-sm">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 md:p-4 border-t border-zinc-800 bg-zinc-900/50">
        {voiceError && (
          <p className="text-red-500 text-xs mb-2 text-center">{voiceError}</p>
        )}
        
        {mode === 'voice' ? (
          <div className="flex flex-col items-center justify-center py-4">
            <button
              onClick={toggleListening}
              className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]' 
                  : 'bg-amber-500 text-black hover:bg-amber-400 hover:scale-105 shadow-lg'
              }`}
            >
              {isListening ? <Mic size={32} /> : <MicOff size={32} />}
            </button>
            <p className="text-zinc-400 text-sm mt-4 font-medium">
              {isListening ? "Listening... Speak now." : "Tap the microphone to speak"}
            </p>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about hairstyles, treatments, or beauty advice..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-4 pr-12 md:pl-6 md:pr-14 py-3 md:py-4 text-sm md:text-base text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-amber-500 text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-400 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
