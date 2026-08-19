import re

with open('server.ts', 'r') as f:
    content = f.read()

live_old = """      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are a highly premium, luxury salon assistant. Keep responses very brief and professional. Maintain a polite and high-end tone.",
        },
        callbacks: {"""

live_new = """      
      const servicesContext = "SALON SERVICES AND PRICES:\\n" + salonServices.map(s => `- ${s.name}: ${s.price} (${s.duration})`).join("\\n");
      const liveInstruction = "You are a highly premium, luxury salon assistant. Keep responses very brief and professional. Maintain a polite and high-end tone.\\n\\n" + servicesContext + "\\n\\nIMPORTANT RULES:\\n- You must ONLY use the exact prices and services listed above. Do not guess or invent prices.\\n- If the customer speaks in Gujarati, YOU MUST reply in natural Gujarati.\\n- If the customer speaks in English, YOU MUST reply in English.\\n- If the customer asks to book an appointment, ask for their Name, Phone, Service, Date, and Time. Once you have all details, YOU MUST CALL the 'create_booking' function.\\n- DO NOT say the booking is confirmed until the 'create_booking' function returns success.";
      
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
        callbacks: {"""
        
content = content.replace(live_old, live_new)

live_msg_old = """          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio) {
                clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
                clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },"""

live_msg_new = """          onmessage: async (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio) {
                clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
                clientWs.send(JSON.stringify({ interrupted: true }));
            }
            
            // Handle Tool calls coming from Live API
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
          },"""
          
content = content.replace(live_msg_old, live_msg_new)

with open('server.ts', 'w') as f:
    f.write(content)
print("Updated server.ts Live API")
