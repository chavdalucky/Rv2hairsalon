import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer } from 'ws';
import { Modality, LiveServerMessage } from '@google/genai';
import { GoogleGenAI, GenerateVideosOperation, Type } from '@google/genai';
import dotenv from 'dotenv';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { salonServices } from './src/data/salonData';

dotenv.config();

import { notificationRouter, startNotificationCron } from './server/notifications';

const tools = [{
  functionDeclarations: [
    {
      name: "create_booking",
      description: "Creates a real salon appointment booking for the customer in the backend database. You MUST call this function when the customer explicitly wants to book an appointment and provides all required details. NEVER tell the user the appointment is confirmed until this function returns success.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          customerName: { type: Type.STRING, description: "Name of the customer" },
          customerPhone: { type: Type.STRING, description: "Mobile number of the customer" },
          serviceName: { type: Type.STRING, description: "Name of the service to book (e.g., Haircut & Styling)" },
          date: { type: Type.STRING, description: "Date of the appointment in YYYY-MM-DD format" },
          time: { type: Type.STRING, description: "Time of the appointment in HH:mm format" }
        },
        required: ["customerName", "customerPhone", "serviceName", "date", "time"]
      }
    }
  ]
}];

async function handleToolCall(functionCall: any): Promise<any> {
  if (functionCall.name === "create_booking") {
    try {
      const bookingData = {
        userId: "ai_assistant_booking",
        customerName: functionCall.args.customerName,
        phone: functionCall.args.customerPhone,
        serviceName: functionCall.args.serviceName,
        date: functionCall.args.date,
        time: functionCall.args.time,
        status: 'pending',
        createdAt: serverTimestamp(),
        source: 'AI Assistant'
      };
      const docRef = await addDoc(collection(db, 'bookings'), bookingData);
      
      // Attempt notification
      try {
        await addDoc(collection(db, 'notifications'), {
          userId: 'admin',
          title: 'New AI Booking',
          message: `Booking for ${bookingData.customerName} - ${bookingData.serviceName} (${bookingData.date} at ${bookingData.time})`,
          type: 'booking',
          read: false,
          timestamp: serverTimestamp()
        });
      } catch(e) { console.error("Notification error:", e); }
      
      return { status: "success", bookingId: docRef.id, message: "Booking created successfully in the database." };
    } catch (e: any) {
      console.error("Booking creation failed:", e);
      return { status: "error", message: e.message };
    }
  }
  return { status: "error", message: "Unknown function" };
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  app.use(express.json({ limit: '50mb' }));
  
  app.use('/api/notifications', notificationRouter);
  startNotificationCron();
  
  app.post('/api/ai/chat', async (req, res) => {
    try {
      if (!ai) return res.status(500).json({ error: 'Gemini API key not configured' });
      const { message, messages, model = 'gemini-3.5-flash', systemInstruction } = req.body;
      
      const servicesContext = "SALON SERVICES AND PRICES:\n" + salonServices.map(s => `- ${s.name}: ${s.price} (${s.duration})`).join("\n");
      const fullInstruction = (systemInstruction || "You are a helpful salon assistant.") + "\n\n" + servicesContext;
      
      let contents = [];
      if (messages && messages.length > 0) {
        contents = messages.map((m: any) => ({
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
            systemInstruction: fullInstruction,
            tools: tools,
            temperature: 0.2
        }
      });
      
      if (response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0];
        const result = await handleToolCall(call);
        
        contents.push(response.candidates?.[0]?.content || {
            role: 'model',
            parts: [{ functionCall: call }]
        });
        
        contents.push({
          role: 'user',
          parts: [{
            functionResponse: {
              name: call.name,
              response: result
            }
          }]
        });
        
        const finalResponse = await ai.models.generateContent({
          model: model,
          contents: contents,
          config: {
              systemInstruction: fullInstruction,
              tools: tools,
              temperature: 0.2
          }
        });
        return res.json({ text: finalResponse.text });
      }
      
      res.json({ text: response.text });
    } catch (e: any) {
      console.error('Chat error:', e);
      res.status(500).json({ error: e.message });
    }
  });



  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const wss = new WebSocketServer({ server, path: '/live' });
  wss.on("connection", async (clientWs) => {
    try {
      if (!ai) {
         clientWs.send(JSON.stringify({ error: 'Gemini API key not configured' }));
         return;
      }
      
      const servicesContext = "SALON SERVICES AND PRICES:\n" + salonServices.map(s => `- ${s.name}: ${s.price} (${s.duration})`).join("\n");
      const liveInstruction = "You are a highly premium, luxury salon assistant. Keep responses very brief and professional. Maintain a polite and high-end tone.\n\n" + servicesContext + "\n\nIMPORTANT RULES:\n- You must ONLY use the exact prices and services listed above. Do not guess or invent prices.\n- If the customer speaks in Gujarati, YOU MUST reply in natural Gujarati.\n- If the customer speaks in English, YOU MUST reply in English.\n- If the customer asks to book an appointment, ask for their Name, Phone, Service, Date, and Time. Once you have all details, YOU MUST CALL the 'create_booking' function.\n- DO NOT say the booking is confirmed until the 'create_booking' function returns success. If you are preparing to call the function, ONLY say 'હું તમારી booking માટે details તૈયાર કરી રહ્યો છું.'. Once it succeeds, say 'તમારી appointment successfully book થઈ ગઈ છે.'. If it fails, say 'Booking complete થઈ શકી નથી. કૃપા કરીને ફરી પ્રયાસ કરો.'.";
      
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: liveInstruction,
          tools: tools,
        },
        callbacks: {
          onmessage: async (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio) {
                clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
                clientWs.send(JSON.stringify({ interrupted: true }));
            }
            
            if (message.toolCall) {
               const functionCalls = message.toolCall.functionCalls;
               if (functionCalls && functionCalls.length > 0) {
                 const call = functionCalls[0];
                 const result = await handleToolCall(call);
                 session.sendToolResponse({
                   functionResponses: [{
                     name: call.name,
                     id: call.id,
                     response: result
                   }]
                 });
               }
            }
          },
          onerror: (err: any) => {
            console.error('Live API Error:', err);
          },
          onclose: () => {
             // console.log("Live API Closed");
          }
        }
      });
      
      clientWs.on("message", (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" }
            });
          }
        } catch (err) {
          console.error("Error sending realtime input:", err);
        }
      });
      
      clientWs.on("close", () => {
         try {
            session.close();
         } catch(e) {}
      });
      
    } catch (err: any) {
      console.error('Live connection error:', err);
      clientWs.send(JSON.stringify({ error: err.message }));
    }
  });
}

startServer();
