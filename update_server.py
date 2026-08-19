import re
with open('server.ts', 'r') as f:
    content = f.read()

# Add ws import
if "import { WebSocketServer }" not in content:
    content = content.replace("import { createServer as createViteServer } from 'vite';", "import { createServer as createViteServer } from 'vite';\nimport { WebSocketServer } from 'ws';\nimport { Modality, LiveServerMessage } from '@google/genai';")

# Update chat endpoint
chat_handler_old = """  // AI Chat Route
  app.post('/api/ai/chat', async (req, res) => {
    try {
      if (!ai) return res.status(500).json({ error: 'Gemini API key not configured' });
      const { message, model = 'gemini-3.6-flash' } = req.body;
      
      const response = await ai.models.generateContent({
        model: model,
        contents: message,
        config: {
          systemInstruction: 'You are a premium luxury salon assistant. You help users find hairstyles, understand treatments, and offer style advice. Maintain a polite, professional, and high-end tone.',
        }
      });
      
      res.json({ text: response.text });
    } catch (e: any) {
      console.error('Chat error:', e);
      res.status(500).json({ error: e.message });
    }
  });"""

chat_handler_new = """  // AI Chat Route
  app.post('/api/ai/chat', async (req, res) => {
    try {
      if (!ai) return res.status(500).json({ error: 'Gemini API key not configured' });
      // We expect 'messages' array for multi-turn chat, fallback to single message if not provided
      const { message, messages, model = 'gemini-3.1-pro-preview', systemInstruction } = req.body;
      
      const defaultInstruction = 'You are a premium luxury salon assistant. You help users find hairstyles, understand treatments, and offer style advice. Maintain a polite, professional, and high-end tone.';
      
      let contents: any[] = [];
      if (messages && Array.isArray(messages)) {
         contents = messages.map(m => ({
           role: m.role === 'assistant' ? 'model' : 'user',
           parts: [{ text: m.text }]
         }));
      } else {
         contents = [{ role: 'user', parts: [{ text: message }] }];
      }
      
      const response = await ai.models.generateContent({
        model: model,
        contents: contents,
        config: {
          systemInstruction: systemInstruction || defaultInstruction,
        }
      });
      
      res.json({ text: response.text });
    } catch (e: any) {
      console.error('Chat error:', e);
      res.status(500).json({ error: e.message });
    }
  });"""

if "messages" not in content:
    content = content.replace(chat_handler_old, chat_handler_new)

# Add WebSocket server logic at the end of startServer
ws_server_logic = """
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Setup WebSocket Server for Live API
  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on("connection", async (clientWs) => {
    try {
      if (!ai) {
         clientWs.send(JSON.stringify({ error: 'Gemini API key not configured' }));
         return;
      }
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are a highly premium, luxury salon assistant. Keep responses very brief and professional. Maintain a polite and high-end tone.",
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio) {
                clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
                clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
          onerror: (err: any) => {
            console.error('Live API Error:', err);
          },
          onclose: () => {
             // console.log("Live API Closed");
          }
        },
      });

      clientWs.on("message", (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" },
            });
          }
        } catch (err) {
          console.error("Error sending realtime input:", err);
        }
      });
      
      clientWs.on("close", () => {
         // session.close() is not available on the return value directly in the exact way in some versions, 
         // but wait, the skill says: Use `session.close()` when finished.
         // Wait, the SDK has it, let's wrap it in try-catch
         try {
            // @ts-ignore
            session.close();
         } catch(e) {}
      });

    } catch (err: any) {
      console.error('Live connection error:', err);
      clientWs.send(JSON.stringify({ error: err.message }));
    }
  });
}"""

content = content.replace("""  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}""", ws_server_logic)

with open('server.ts', 'w') as f:
    f.write(content)
print("Updated server.ts")
