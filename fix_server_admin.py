import re

with open('server.ts', 'r') as f:
    content = f.read()

# Replace imports
content = content.replace("import admin from 'firebase-admin';", "import { db } from './firebase';\\nimport { collection, addDoc, serverTimestamp } from 'firebase/firestore';")
content = content.replace("if (!admin.apps.length) {\\n  admin.initializeApp({\\n    projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'ai-studio-4bf51ebd-4a82-4ea7-828c-5dfeb0d6f5cb'\\n  });\\n}", "")

# Replace tool handler
old_handler = """async function handleToolCall(functionCall: any): Promise<any> {
  if (functionCall.name === "create_booking") {
    try {
      const db = admin.firestore();
      const bookingData = {
        userId: "ai_assistant_booking",
        customerName: functionCall.args.customerName,
        phone: functionCall.args.customerPhone,
        serviceName: functionCall.args.serviceName,
        date: functionCall.args.date,
        time: functionCall.args.time,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        source: 'AI Assistant'
      };
      const docRef = await db.collection('bookings').add(bookingData);
      
      // Attempt notification
      try {
        await db.collection('notifications').add({
          userId: 'admin',
          title: 'New AI Booking',
          message: `Booking for ${bookingData.customerName} - ${bookingData.serviceName} (${bookingData.date} at ${bookingData.time})`,
          type: 'booking',
          read: false,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch(e) { console.error("Notification error:", e); }
      
      return { status: "success", bookingId: docRef.id, message: "Booking created successfully in the database." };
    } catch (e: any) {
      console.error("Booking creation failed:", e);
      return { status: "error", message: e.message };
    }
  }
  return { status: "error", message: "Unknown function" };
}"""

new_handler = """async function handleToolCall(functionCall: any): Promise<any> {
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
}"""

content = content.replace(old_handler, new_handler)

with open('server.ts', 'w') as f:
    f.write(content)
print("Replaced firebase-admin with client SDK in server.ts")
