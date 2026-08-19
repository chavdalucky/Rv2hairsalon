import express from 'express';
import cron from 'node-cron';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { serverDb } from './firebase-server';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, getDoc, setDoc } from 'firebase/firestore';

// Environment variables configuration
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;
const TWILIO_WHATSAPP = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'bookings@luxurysalon.com';

let twilioClient: any = null;
if (TWILIO_SID && TWILIO_AUTH) {
  twilioClient = twilio(TWILIO_SID, TWILIO_AUTH);
}

let transporter: any = null;
if (EMAIL_HOST && EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: 587,
    secure: false,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
  });
}

// Ensure settings exist
async function getNotificationSettings() {
  if (!serverDb) return null;
  const snap = await getDoc(doc(serverDb, 'settings', 'notifications'));
  if (!snap.exists()) {
    const defaultSettings: any = {
      emailEnabled: true,
      smsEnabled: true,
      whatsappEnabled: true,
      emailTemplate: "Dear {name},\n\nYour appointment for {service} on {date} at {time} is confirmed.\n\nBooking ID: {id}\nSalon Name: Luxury Salon\nAddress: 123 Elite Avenue, NY\nContact: +1 234 567 8900\n\nManage: https://luxurysalon.com/dashboard",
      smsTemplate: "Luxury Salon: Your {service} appt is confirmed for {date} at {time}. ID: {id}. Manage: https://luxurysalon.com",
      whatsappTemplate: "Luxury Salon 🌟\n\nHi {name}, your appointment is confirmed!\n\n✂️ Service: {service}\n📅 Date: {date}\n⏰ Time: {time}\n🆔 ID: {id}\n📍 Address: 123 Elite Avenue, NY\n\nManage here: https://luxurysalon.com/dashboard",
      reminderEmail: "Dear {name},\n\nThis is a reminder for your upcoming {service} appointment on {date} at {time}.\n\nBooking ID: {id}\nSalon Address: 123 Elite Avenue, NY\nContact: +1 234 567 8900",
      reminderSms: "Reminder from Luxury Salon: You have a {service} appt on {date} at {time}. ID: {id}.",
      reminderWhatsapp: "Luxury Salon Reminder ⏳\n\nHi {name}, you have an upcoming appointment!\n\n✂️ Service: {service}\n📅 Date: {date}\n⏰ Time: {time}\n\nSee you soon!"
    };
    await setDoc(doc(serverDb, 'settings', 'notifications'), defaultSettings, { merge: true });
    return defaultSettings;
  }
  return snap.data();
}

async function logNotification(bookingId: string, userId: string, type: string, channel: string, status: string, error?: string) {
  if (!serverDb) return;
  try {
    await addDoc(collection(serverDb, 'notification_logs'), {
      bookingId,
      userId,
      type, // 'confirmation', 'reminder_24h', 'reminder_2h', 'reminder_30m'
      channel, // 'email', 'sms', 'whatsapp'
      status, // 'sent', 'failed'
      error: error || null,
      timestamp: Timestamp.now()
    });
  } catch (e) {
    console.error('Failed to log notification', e);
  }
}

function fillTemplate(template: string, booking: any) {
  return template
    .replace(/{name}/g, booking.customerName || 'Customer')
    .replace(/{service}/g, booking.serviceName || 'Service')
    .replace(/{date}/g, booking.date || '')
    .replace(/{time}/g, booking.time || '')
    .replace(/{id}/g, booking.id || '')
    .replace(/{barber}/g, booking.barber || 'Stylist');
}

export async function sendNotification(booking: any, type: string) {
  const settings = await getNotificationSettings();
  if (!settings) return;

  const phone = booking.phone;
  const email = booking.email || (booking.userEmail); // assuming booking might have it

  let results = { email: 'skipped', sms: 'skipped', whatsapp: 'skipped' };

  // Determine templates
  const tplEmail = type === 'confirmation' ? settings.emailTemplate : settings.reminderEmail;
  const tplSms = type === 'confirmation' ? settings.smsTemplate : settings.reminderSms;
  const tplWa = type === 'confirmation' ? settings.whatsappTemplate : settings.reminderWhatsapp;

  const emailContent = fillTemplate(tplEmail, booking);
  const smsContent = fillTemplate(tplSms, booking);
  const waContent = fillTemplate(tplWa, booking);

  const subject = type === 'confirmation' ? 'Appointment Confirmed - Luxury Salon' : 'Appointment Reminder - Luxury Salon';

  // Email
  if (settings.emailEnabled && email) {
    if (transporter) {
      try {
        await transporter.sendMail({
          from: EMAIL_FROM,
          to: email,
          subject: subject,
          text: emailContent
        });
        await logNotification(booking.id, booking.userId, type, 'email', 'sent');
        results.email = 'sent';
      } catch (e: any) {
        await logNotification(booking.id, booking.userId, type, 'email', 'failed', e.message);
        results.email = 'failed';
      }
    } else {
      console.log(`[Email Simulation] To: ${email}\n${emailContent}`);
      await logNotification(booking.id, booking.userId, type, 'email', 'sent', 'Simulated (No Credentials)');
      results.email = 'sent (simulated)';
    }
  }

  // SMS
  if (settings.smsEnabled && phone) {
    if (twilioClient) {
      try {
        await twilioClient.messages.create({
          body: smsContent,
          from: TWILIO_PHONE,
          to: phone
        });
        await logNotification(booking.id, booking.userId, type, 'sms', 'sent');
        results.sms = 'sent';
      } catch (e: any) {
        await logNotification(booking.id, booking.userId, type, 'sms', 'failed', e.message);
        results.sms = 'failed';
      }
    } else {
      console.log(`[SMS Simulation] To: ${phone}\n${smsContent}`);
      await logNotification(booking.id, booking.userId, type, 'sms', 'sent', 'Simulated');
      results.sms = 'sent (simulated)';
    }
  }

  // WhatsApp
  if (settings.whatsappEnabled && phone) {
    if (twilioClient) {
      try {
        await twilioClient.messages.create({
          body: waContent,
          from: TWILIO_WHATSAPP,
          to: `whatsapp:${phone}`
        });
        await logNotification(booking.id, booking.userId, type, 'whatsapp', 'sent');
        results.whatsapp = 'sent';
      } catch (e: any) {
        await logNotification(booking.id, booking.userId, type, 'whatsapp', 'failed', e.message);
        results.whatsapp = 'failed';
      }
    } else {
      console.log(`[WhatsApp Simulation] To: ${phone}\n${waContent}`);
      await logNotification(booking.id, booking.userId, type, 'whatsapp', 'sent', 'Simulated');
      results.whatsapp = 'sent (simulated)';
    }
  }


  // Also create an in-app notification if userId exists
  if (booking.userId) {
     try {
        let title = 'Appointment Update';
        let body = `Your appointment status has been updated.`;
        
        if (type === 'confirmation') {
           title = 'Appointment Confirmed';
           body = `Your booking for ${booking.serviceName || 'a service'} on ${booking.date} at ${booking.time} has been CONFIRMED!`;
        } else if (type === 'reschedule_proposed') {
           title = 'Reschedule Proposed';
           body = `Admin has proposed a new time for your booking: ${booking.date} at ${booking.time}. ${booking.adminNote ? 'Note: ' + booking.adminNote : 'Please review and confirm.'}`;
        } else if (type.startsWith('reminder')) {
           title = 'Appointment Reminder';
           body = `Reminder: You have an appointment for ${booking.serviceName || 'a service'} on ${booking.date} at ${booking.time}.`;
        }
        
        await addDoc(collection(serverDb!, 'notifications'), {
           userId: booking.userId,
           title: title,
           body: body,
           type: 'Announcement',
           read: false,
           timestamp: Timestamp.now(),
           bookingId: booking.id || null,
           bookingStatus: booking.status || null
        });
     } catch (e) {
        console.error('Failed to create in-app notification', e);
     }
  }

  return results;

}

export function startNotificationCron() {
  if (!serverDb) {
    console.warn("No serverDb, cron won't start");
    return;
  }
  console.log("Starting notification cron scheduler...");
  
  // Run every 5 minutes to check for reminders
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      // To simplify, we get all pending/confirmed bookings and filter in memory since firestore date/time queries can be tricky
      const q = query(
        collection(serverDb!, 'bookings'),
        where('status', 'in', ['pending', 'confirmed'])
      );
      const snap = await getDocs(q);
      
      for (const d of snap.docs) {
        const booking = { id: d.id, ...d.data() } as any;
        if (!booking.date || !booking.time) continue;
        
        // Parse booking date/time
        const bookingDate = new Date(`${booking.date}T${booking.time}`);
        if (isNaN(bookingDate.getTime())) continue;

        const diffMs = bookingDate.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        const remindersSent = booking.remindersSent || {};
        let shouldUpdate = false;

        const settings = await getNotificationSettings();
        
        if (settings?.reminder24hEnabled !== false && diffHours > 23.5 && diffHours <= 24.5 && !remindersSent['24h']) {
          await sendNotification(booking, 'reminder_24h');
          remindersSent['24h'] = true;
          shouldUpdate = true;
        } else if (settings?.reminder2hEnabled !== false && diffHours > 1.75 && diffHours <= 2.25 && !remindersSent['2h']) {
          await sendNotification(booking, 'reminder_2h');
          remindersSent['2h'] = true;
          shouldUpdate = true;
        } else if (settings?.reminder30mEnabled !== false && diffHours > 0.25 && diffHours <= 0.75 && !remindersSent['30m']) {
          await sendNotification(booking, 'reminder_30m');
          remindersSent['30m'] = true;
          shouldUpdate = true;
        }


        if (shouldUpdate) {
          await updateDoc(doc(serverDb!, 'bookings', booking.id), { remindersSent });
          // Also create an in-app notification
          try {
             if (booking.userId) {
                await addDoc(collection(serverDb!, 'notifications'), {
                   userId: booking.userId,
                   title: 'Appointment Reminder',
                   body: `You have an appointment for ${booking.serviceName || 'a service'} on ${booking.date} at ${booking.time}.`,
                   type: 'Announcement',
                   read: false,
                   timestamp: Timestamp.now()
                });
             }
          } catch(e) {
             console.error('Failed to create in-app notification', e);
          }
        }

      }
    } catch (e) {
      console.error("Cron Error:", e);
    }
  });
}

export const notificationRouter = express.Router();

// Trigger manual confirmation / reminder (used after booking or by admin)
notificationRouter.post('/trigger', async (req, res) => {
  try {
    const { booking, type } = req.body;
    if (!booking) return res.status(400).json({ error: 'Booking data required' });
    
    const results = await sendNotification(booking, type || 'confirmation');
    res.json({ success: true, results });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Added alias /send as requested by user
notificationRouter.post('/send', async (req, res) => {
  try {
    const { booking, type } = req.body;
    if (!booking) return res.status(400).json({ error: 'Booking data required' });
    
    const results = await sendNotification(booking, type || 'confirmation');
    res.json({ success: true, results });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Admin fetching logs
notificationRouter.get('/logs', async (req, res) => {
  if (!serverDb) return res.status(500).json({ error: 'DB not connected' });
  try {
    const snap = await getDocs(collection(serverDb, 'notification_logs'));
    const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    logs.sort((a: any, b: any) => b.timestamp?.seconds - a.timestamp?.seconds);
    res.json(logs);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Admin getting settings
notificationRouter.get('/settings', async (req, res) => {
  try {
    const settings = await getNotificationSettings();
    res.json(settings);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Admin updating settings
notificationRouter.post('/settings', async (req, res) => {
  if (!serverDb) return res.status(500).json({ error: 'DB not connected' });
  try {
    await setDoc(doc(serverDb, 'settings', 'notifications'), req.body, { merge: true });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
