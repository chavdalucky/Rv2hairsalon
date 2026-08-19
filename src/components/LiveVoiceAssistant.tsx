import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { Mic, MicOff, Loader2, X, MessageSquare, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function pcmToBase64(pcmData: Float32Array) {
  const buffer = new ArrayBuffer(pcmData.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < pcmData.length; i++) {
    let s = Math.max(-1, Math.min(1, pcmData[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToPcm(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const buffer = bytes.buffer;
  const view = new DataView(buffer);
  const pcmData = new Float32Array(buffer.byteLength / 2);
  for (let i = 0; i < pcmData.length; i++) {
    pcmData[i] = view.getInt16(i * 2, true) / 0x8000;
  }
  return pcmData;
}

export default function LiveVoiceAssistant() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'voice' | 'text'>('text');
  
  // Voice State
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  
  // Text State
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  
  const connectVoice = async () => {
    setIsConnecting(true);
    setVoiceError(null);
    setMode('voice');
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
         throw new Error("Microphone access is restricted. Please open the app in a new tab using the top-right button.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(err => {
        throw new Error("Microphone access denied. Please allow microphone permissions or open the app in a new tab.");
      });
      streamRef.current = stream;
      
      const inputCtx = new AudioContext({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;
      
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = 0;
      activeSourcesRef.current = [];
      
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;
        
        source.connect(processor);
        processor.connect(inputCtx.destination);
        
        processor.onaudioprocess = (e) => {
           if (ws.readyState === WebSocket.OPEN) {
              const base64 = pcmToBase64(e.inputBuffer.getChannelData(0));
              ws.send(JSON.stringify({ audio: base64 }));
           }
        };
      };
      
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.error) {
           console.error("Live API Error:", msg.error);
           setVoiceError(msg.error);
           disconnectVoice();
           return;
        }
        
        if (msg.audio && outputAudioCtxRef.current) {
          try {
            const ctx = outputAudioCtxRef.current;
            const pcmData = base64ToPcm(msg.audio);
            const buffer = ctx.createBuffer(1, pcmData.length, 24000);
            buffer.getChannelData(0).set(pcmData);
            
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            
            if (nextStartTimeRef.current < ctx.currentTime) {
               nextStartTimeRef.current = ctx.currentTime;
            }
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            
            activeSourcesRef.current.push(source);
            source.onended = () => {
               activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
            };
          } catch(e) { console.error("Audio playback error", e); }
        }
        
        if (msg.interrupted && outputAudioCtxRef.current) {
          activeSourcesRef.current.forEach(s => s.stop());
          activeSourcesRef.current = [];
          nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
        }
      };
      
      ws.onerror = () => {
        setVoiceError("WebSocket connection failed.");
        disconnectVoice();
      };
      
      ws.onclose = () => {
        disconnectVoice();
      };
      
    } catch (err: any) {
      console.error(err);
      setVoiceError(err.message || "Could not access microphone.");
      setIsConnecting(false);
    }
  };
  
  const disconnectVoice = () => {
    setIsConnected(false);
    setIsConnecting(false);
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(()=>{});
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(()=>{});
      outputAudioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    activeSourcesRef.current.forEach(s => {
       try { s.stop(); } catch(e){}
    });
    activeSourcesRef.current = [];
  };

  useEffect(() => {
    return () => {
      disconnectVoice();
    };
  }, []);

  const togglePanel = () => {
    if (isOpen) {
      setIsOpen(false);
      disconnectVoice();
    } else {
      setIsOpen(true);
      if (messages.length === 0) {
        setMessages([{ role: 'assistant', text: 'Hello! I am your AI Salon Assistant. I speak English and Gujarati. How can I help you book an appointment today? / નમસ્તે! હું તમારી કેવી રીતે મદદ કરી શકું?' }]);
      }
    }
  };
  
  const sendTextMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const userMsg = { role: 'user', text: inputText.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg.text,
          messages: messages,
          systemInstruction: "You are a helpful, professional, and friendly AI Salon Assistant for RV 2 Hair Salon. You are fluent in both English and Gujarati. If the user speaks Gujarati, reply in Gujarati. Keep your answers brief and focused on booking appointments or answering salon questions."
        })
      });
      const data = await res.json();
      if (data.text) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.text }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I'm having trouble connecting right now." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "An error occurred. Please try again later." }]);
    }
    setIsTyping(false);
  };
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, mode]);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={togglePanel}
        className={`fixed bottom-24 right-4 sm:right-6 z-[9999] p-4 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center ${
          isOpen 
            ? 'bg-zinc-800 text-amber-500 hover:bg-zinc-700' 
            : 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-110'
        }`}
        title={t('ai.assistant')}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Connection / Status Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-40 right-4 sm:right-6 z-[9999] w-[calc(100vw-32px)] sm:w-[350px] max-w-[380px] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ height: '500px', maxHeight: '65vh' }}
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-black/50 shrink-0 rounded-t-2xl">
              <h3 className="font-serif text-white font-medium flex items-center gap-2">
                <span className="text-amber-500">
                  <MessageSquare size={16} />
                </span>
                AI Assistant
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex bg-zinc-800 rounded-lg p-1">
                  <button 
                    onClick={() => { setMode('text'); disconnectVoice(); }}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${mode === 'text' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Text
                  </button>
                  <button 
                    onClick={() => connectVoice()}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${mode === 'voice' ? 'bg-amber-500/20 text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                  >
                    {isConnected && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                    Voice
                  </button>
                </div>
                {/* Mobile Close Button */}
                <button 
                  onClick={togglePanel} 
                  className="sm:hidden text-zinc-400 hover:text-white p-1 ml-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Content Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 flex flex-col gap-4 relative">
              {mode === 'voice' ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    {voiceError ? (
                      <div className="text-red-400 text-sm">
                        <p>{voiceError}</p>
                        <button onClick={connectVoice} className="mt-4 px-4 py-2 bg-zinc-800 text-amber-500 rounded-lg text-sm font-medium">Try Again</button>
                      </div>
                    ) : isConnecting ? (
                      <div className="flex flex-col items-center gap-3 text-zinc-400">
                        <Loader2 size={24} className="animate-spin text-amber-500" />
                        <span className="text-sm">Connecting to AI...</span>
                      </div>
                    ) : isConnected ? (
                      <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full bg-amber-500/10 flex items-center justify-center animate-pulse">
                            <div className="w-16 h-16 rounded-full bg-amber-500/30 flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center justify-center text-black">
                                <Mic size={20} />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className="text-lg text-white font-medium block">{t('ai.listening')}</span>
                          <span className="text-sm text-zinc-400 mt-1 block">English & Gujarati Supported</span>
                        </div>
                        <button 
                          onClick={disconnectVoice}
                          className="mt-4 px-6 py-2 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-full text-sm font-medium transition-colors"
                        >
                          End Voice Chat
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-zinc-400">
                        <Mic size={48} className="text-zinc-700" />
                        <p className="text-sm">Speak naturally to book appointments or ask questions.</p>
                        <button onClick={connectVoice} className="px-6 py-2 bg-amber-500 text-black rounded-full font-medium hover:bg-amber-400">Start Voice</button>
                      </div>
                    )}
                 </div>
              ) : (
                 <>
                    {messages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                         <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                           m.role === 'user' 
                             ? 'bg-amber-500 text-black rounded-tr-sm' 
                             : 'bg-zinc-800 text-zinc-200 rounded-tl-sm border border-zinc-700'
                         }`}>
                           {m.text}
                         </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                         <div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
                            <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                            <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                         </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                 </>
              )}
            </div>
            
            {/* Input Area (Text Mode Only) */}
            {mode === 'text' && (
              <form onSubmit={sendTextMessage} className="p-3 border-t border-zinc-800 bg-zinc-950 shrink-0">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder={t('ai.typePlaceholder')}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-full pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                    disabled={isTyping}
                  />
                  <button 
                    type="submit"
                    disabled={!inputText.trim() || isTyping}
                    className="absolute right-2 p-2 bg-amber-500 text-black rounded-full disabled:opacity-50 disabled:bg-zinc-700 disabled:text-zinc-500 hover:bg-amber-400 transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
