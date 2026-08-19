import re

with open('server.ts', 'r') as f:
    content = f.read()

old_live_block = """      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: { parts: [{ text: liveInstruction }] },
          tools: tools,
        }
      });
      
      session.on("message", async (message: LiveServerMessage) => {
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
      });
      
      session.on("error", (err: any) => {
        console.error('Live API Error:', err);
      });
      
      session.on("close", () => {
         // console.log("Live API Closed");
      });
      
      clientWs.on("message", (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              mediaChunks: [{ mimeType: "audio/pcm;rate=16000", data: parsed.audio }]
            });
          }
        } catch (err) {
          console.error("Error sending realtime input:", err);
        }
      });"""

new_live_block = """      const session = await ai.live.connect({
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
      });"""

content = content.replace(old_live_block, new_live_block)

with open('server.ts', 'w') as f:
    f.write(content)
print("Updated live block.")
