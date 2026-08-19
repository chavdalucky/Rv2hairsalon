with open('server/notifications.ts', 'r') as f:
    content = f.read()

trigger_code = """// Trigger manual confirmation / reminder (used after booking or by admin)
notificationRouter.post('/trigger', async (req, res) => {
  try {
    const { booking, type } = req.body;
    if (!booking) return res.status(400).json({ error: 'Booking data required' });
    
    const results = await sendNotification(booking, type || 'confirmation');
    res.json({ success: true, results });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});"""

send_code = """// Trigger manual confirmation / reminder (used after booking or by admin)
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
});"""

content = content.replace(trigger_code, send_code)
with open('server/notifications.ts', 'w') as f:
    f.write(content)
