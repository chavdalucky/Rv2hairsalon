import re

with open('src/pages/AIStudio.tsx', 'r') as f:
    content = f.read()

old_block = """function VoiceInterface() {
  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col relative z-10 bg-black/40">
      <div className="flex-1 flex items-center justify-center text-center">
        <div className="max-w-md">
          <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/30 animate-pulse">
            <Mic size={40} className="text-amber-500" />
          </div>
          <h2 className="text-2xl font-serif text-white mb-2">Voice Assistant</h2>
          <p className="text-zinc-400 font-light">
            Tap the microphone to speak with your virtual stylist. 
            (Voice functionality is currently in development.)
          </p>
        </div>
      </div>
      <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-center">
        <button 
          className="w-16 h-16 bg-amber-500 text-black rounded-full flex items-center justify-center hover:bg-amber-400 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transform hover:scale-105"
        >
          <Mic size={24} />
        </button>
      </div>
    </div>
  );
}"""

new_block = """function VoiceInterface() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Keep the recognition instance in a ref so we can stop it manually
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setTranscript('');
        setAiResponse('');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognition.onend = async () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Use a separate effect to trigger AI call when recording stops and transcript exists
  const isInitialMount = useRef(true);
  const lastTranscript = useRef('');
  
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    const sendToAi = async () => {
      if (!isRecording && transcript.trim() && transcript !== lastTranscript.current) {
        lastTranscript.current = transcript;
        setLoading(true);
        triggerHaptic('light');
        
        try {
          const res = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              message: transcript,
              messages: [{ role: 'user', text: transcript }], // simple context
              model: 'gemini-3.5-flash' 
            })
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          
          setAiResponse(data.text);
          
          // Speech Synthesis (Speak the response back)
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(data.text);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
          }
          
        } catch (err) {
          console.error(err);
          setAiResponse("I'm sorry, I encountered an error connecting to the styling brain.");
        } finally {
          setLoading(false);
        }
      }
    };
    
    sendToAi();
  }, [isRecording, transcript]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }
    
    triggerHaptic('light');
    
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      // Cancel any ongoing speech synthesis when starting a new recording
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Could not start recognition:", e);
      }
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col relative z-10 bg-black/40">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="max-w-xl w-full">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 border transition-all duration-500 ${isRecording ? 'bg-red-500/20 border-red-500/50 animate-pulse shadow-[0_0_40px_rgba(239,68,68,0.3)]' : 'bg-amber-500/10 border-amber-500/30'}`}>
            {isRecording ? (
              <MicOff size={48} className="text-red-500" />
            ) : (
              <Mic size={48} className="text-amber-500" />
            )}
          </div>
          
          <h2 className="text-2xl font-serif text-white mb-4">Voice Assistant</h2>
          
          <div className="h-48 overflow-y-auto mb-4 custom-scrollbar px-4 flex flex-col gap-4">
            {!transcript && !aiResponse && !loading && (
              <p className="text-zinc-400 font-light mt-8">
                Tap the microphone to speak with your virtual stylist.
              </p>
            )}
            
            {transcript && (
              <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50 text-left">
                <span className="text-xs uppercase tracking-widest text-amber-500 font-bold block mb-2">You</span>
                <p className="text-white text-lg">{transcript}</p>
              </div>
            )}
            
            {loading && (
              <div className="flex items-center gap-3 text-amber-500 justify-center my-4">
                <Loader2 size={24} className="animate-spin" />
                <span className="tracking-widest uppercase text-sm">Thinking...</span>
              </div>
            )}
            
            {aiResponse && (
              <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/30 text-left">
                <span className="text-xs uppercase tracking-widest text-amber-500 font-bold block mb-2">Stylist</span>
                <p className="text-white text-lg leading-relaxed">{aiResponse}</p>
              </div>
            )}
          </div>
          
        </div>
      </div>
      <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-center mt-auto">
        <button 
          onClick={toggleRecording}
          className={`w-16 h-16 text-black rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(0,0,0,0.5)] ${isRecording ? 'bg-red-500 hover:bg-red-400 shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 'bg-amber-500 hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]'}`}
        >
          {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
      </div>
    </div>
  );
}"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('src/pages/AIStudio.tsx', 'w') as f:
        f.write(content)
    print("Updated VoiceInterface")
else:
    print("Could not find old block")
