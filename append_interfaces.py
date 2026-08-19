import re

with open('src/pages/AIStudio.tsx', 'r') as f:
    content = f.read()

# Make sure we add firebase imports at the top
if "import { auth, db }" not in content:
    content = content.replace("import { useLanguage } from '../lib/LanguageContext';", "import { useLanguage } from '../lib/LanguageContext';\nimport { auth, db } from '../firebase';\nimport { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';")

chat_interface_new = """function ChatInterface() {
  const [messages, setMessages] = useState<{role: 'user'|'assistant', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const q = query(
          collection(db, 'ai_chats'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'asc')
        );
        const unsub = onSnapshot(q, (snap) => {
          const fetchedMsgs = snap.docs.map(d => {
            const data = d.data();
            return { role: data.role, text: data.text };
          });
          if (fetchedMsgs.length === 0) {
            setMessages([{ role: 'assistant', text: 'Hello! I am your AI Stylist. How can I help you discover your next amazing look today?' }]);
          } else {
            setMessages(fetchedMsgs);
          }
        });
        return () => unsub();
      } else {
        setMessages([{ role: 'assistant', text: 'Hello! I am your AI Stylist. Please log in to save our conversation.' }]);
      }
    });
    return () => unsubAuth();
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

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    triggerHaptic('light');
    trackEvent('AI Chat Message Sent');
    
    const userMsg = input.trim();
    setInput('');
    
    // Optimistic UI
    if (!auth.currentUser) {
       setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    }
    
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
          messages: allMsgs, // Full context 
          model: 'gemini-3.1-pro-preview' 
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      if (!auth.currentUser) {
         setMessages(prev => [...prev, { role: 'assistant', text: data.text }]);
      }
      await saveMessage('assistant', data.text);
    } catch (err: any) {
      if (!auth.currentUser) {
        setMessages(prev => [...prev, { role: 'assistant', text: `Sorry, I encountered an error: ${err.message}` }]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-[600px]"
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-6 py-4 ${
              msg.role === 'user' 
                ? 'bg-amber-500 text-black rounded-br-none' 
                : 'bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-bl-none'
            }`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-bl-none px-6 py-4 flex items-center gap-2">
              <Loader2 className="animate-spin text-amber-500" size={16} />
              <span className="text-zinc-400 text-sm">Thinking...</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about hairstyles, treatments, or beauty advice..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-6 pr-14 py-4 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-amber-500 text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-400 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}"""

# Need to replace ChatInterface with our new one
chat_interface_regex = re.compile(r'function ChatInterface\(\) \{.*?(?=function ImageGenerator)', re.DOTALL)
content = chat_interface_regex.sub(chat_interface_new + "\n\n", content)

voice_interface = """

// Helper function to encode PCM to Base64
function pcmToBase64(pcmData: Float32Array): string {
  const buffer = new ArrayBuffer(pcmData.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < pcmData.length; i++) {
    const s = Math.max(-1, Math.min(1, pcmData[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function VoiceInterface() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Ready');
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const startVoice = async () => {
    try {
      setStatus('Connecting...');
      setIsRecording(true);
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // 16kHz for input to Gemini
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;
      
      // 24kHz for output from Gemini
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      ws.onopen = async () => {
        setStatus('Listening...');
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          
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
        } catch (err) {
          console.error("Microphone error:", err);
          setStatus('Microphone access denied');
          stopVoice();
        }
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        if (msg.error) {
          console.error("Server error:", msg.error);
          setStatus(`Error: ${msg.error}`);
          stopVoice();
          return;
        }
        if (msg.interrupted) {
           nextStartTimeRef.current = outputCtx.currentTime;
        }
        if (msg.audio) {
          setStatus('Speaking...');
          const binary = atob(msg.audio);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const buffer = bytes.buffer;
          try {
            // Need to decode audio data manually since the SDK returns raw 16-bit PCM.
            // Wait, the SDK returns 24kHz raw PCM for Live API output!
            // We shouldn't use decodeAudioData for raw PCM.
            
            const pcm16 = new Int16Array(buffer);
            const audioBuffer = outputCtx.createBuffer(1, pcm16.length, 24000);
            const channelData = audioBuffer.getChannelData(0);
            for (let i = 0; i < pcm16.length; i++) {
              channelData[i] = pcm16[i] / 32768.0;
            }
            
            const sourceNode = outputCtx.createBufferSource();
            sourceNode.buffer = audioBuffer;
            sourceNode.connect(outputCtx.destination);
            
            const startTime = Math.max(outputCtx.currentTime, nextStartTimeRef.current);
            sourceNode.start(startTime);
            nextStartTimeRef.current = startTime + audioBuffer.duration;
            
            sourceNode.onended = () => {
              if (outputCtx.currentTime >= nextStartTimeRef.current - 0.1) {
                 setStatus('Listening...');
              }
            };
          } catch(e) {
             console.error("Audio playback error:", e);
          }
        }
      };

      ws.onclose = () => {
        stopVoice();
      };
      
    } catch(err) {
      console.error(err);
      setStatus('Connection failed');
      stopVoice();
    }
  };

  const stopVoice = () => {
    setIsRecording(false);
    setStatus('Ready');
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopVoice();
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-[600px] items-center justify-center p-6 text-center"
    >
      <div className="max-w-md mx-auto flex flex-col items-center">
         <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 transition-all duration-500 shadow-2xl ${
           isRecording 
             ? status === 'Speaking...' 
                ? 'bg-amber-500 text-black scale-110 shadow-[0_0_50px_rgba(245,158,11,0.5)] animate-pulse'
                : 'bg-zinc-800 text-amber-500 border border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]'
             : 'bg-zinc-900 border border-zinc-700 text-zinc-500'
         }`}>
            {isRecording ? <Mic size={48} /> : <MicOff size={48} />}
         </div>
         
         <h2 className="text-3xl font-serif text-white mb-2">{status}</h2>
         <p className="text-zinc-400 mb-10 max-w-sm">
           {isRecording 
             ? "Speak naturally to your AI Stylist. They can hear you and will respond in real-time."
             : "Start a real-time voice conversation with our premium AI Stylist."}
         </p>
         
         <button 
           onClick={isRecording ? stopVoice : startVoice}
           className={`px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all ${
             isRecording 
               ? 'bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20'
               : 'bg-amber-500 text-black hover:bg-amber-400 hover:scale-105 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
           }`}
         >
           {isRecording ? 'End Conversation' : 'Start Voice Chat'}
         </button>
      </div>
    </motion.div>
  );
}

"""
content = content + "\n" + voice_interface

with open('src/pages/AIStudio.tsx', 'w') as f:
    f.write(content)
print("Updated AIStudio with VoiceInterface")
