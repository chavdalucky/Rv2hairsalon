with open('src/components/admin/NotificationsAdmin.tsx', 'r') as f:
    content = f.read()

# Add new settings for timing
if "reminder24hEnabled: true" not in content:
    content = content.replace("whatsappTemplate: '',", "whatsappTemplate: '',\n    reminder24hEnabled: true,\n    reminder2hEnabled: true,\n    reminder30mEnabled: true,")

old_reminders = """            <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2 mt-4">Reminder Templates</h3>"""
new_reminders = """            <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2 mt-4">Appointment Reminders</h3>
            
            <div className="flex flex-wrap gap-6 mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={settings.reminder24hEnabled ?? true} onChange={(e) => setSettings({...settings, reminder24hEnabled: e.target.checked})} className="w-5 h-5 rounded border-zinc-700 text-amber-500 focus:ring-amber-500 bg-black" />
                <span className="text-white text-sm">24 hours before</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={settings.reminder2hEnabled ?? true} onChange={(e) => setSettings({...settings, reminder2hEnabled: e.target.checked})} className="w-5 h-5 rounded border-zinc-700 text-amber-500 focus:ring-amber-500 bg-black" />
                <span className="text-white text-sm">2 hours before</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={settings.reminder30mEnabled ?? true} onChange={(e) => setSettings({...settings, reminder30mEnabled: e.target.checked})} className="w-5 h-5 rounded border-zinc-700 text-amber-500 focus:ring-amber-500 bg-black" />
                <span className="text-white text-sm">30 minutes before</span>
              </label>
            </div>
            <h3 className="text-sm font-bold text-zinc-400 mb-2 mt-4">Reminder Templates</h3>"""

if "24 hours before" not in content:
    content = content.replace(old_reminders, new_reminders)

with open('src/components/admin/NotificationsAdmin.tsx', 'w') as f:
    f.write(content)

with open('server/notifications.ts', 'r') as f:
    server_content = f.read()

cron_logic_old = """        if (diffHours > 23.5 && diffHours <= 24.5 && !remindersSent['24h']) {
          await sendNotification(booking, 'reminder_24h');
          remindersSent['24h'] = true;
          shouldUpdate = true;
        } else if (diffHours > 1.75 && diffHours <= 2.25 && !remindersSent['2h']) {
          await sendNotification(booking, 'reminder_2h');
          remindersSent['2h'] = true;
          shouldUpdate = true;
        } else if (diffHours > 0.25 && diffHours <= 0.75 && !remindersSent['30m']) {
          await sendNotification(booking, 'reminder_30m');
          remindersSent['30m'] = true;
          shouldUpdate = true;
        }"""

cron_logic_new = """        const settings = await getNotificationSettings();
        
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
        }"""

if "settings?.reminder24hEnabled" not in server_content:
    server_content = server_content.replace(cron_logic_old, cron_logic_new)

with open('server/notifications.ts', 'w') as f:
    f.write(server_content)
