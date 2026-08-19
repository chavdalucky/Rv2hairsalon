import re
with open('src/components/admin/BookingsAdmin.tsx', 'r') as f:
    content = f.read()

history_code = """
            <div className="space-y-3 text-sm text-zinc-300 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
               <p><strong className="text-zinc-500 w-24 inline-block">ID:</strong> {detailsModal.id}</p>
               <p><strong className="text-zinc-500 w-24 inline-block">Name:</strong> {detailsModal.customerName}</p>
               <p><strong className="text-zinc-500 w-24 inline-block">Phone:</strong> {detailsModal.phone}</p>
               <p><strong className="text-zinc-500 w-24 inline-block">Service:</strong> {detailsModal.serviceName}</p>
               <p><strong className="text-zinc-500 w-24 inline-block">Date:</strong> {detailsModal.date}</p>
               <p><strong className="text-zinc-500 w-24 inline-block">Time:</strong> {detailsModal.time}</p>
               <p><strong className="text-zinc-500 w-24 inline-block">Status:</strong> {detailsModal.status}</p>
               <p><strong className="text-zinc-500 w-24 inline-block">Amount:</strong> ₹{detailsModal.amount}</p>
               <p><strong className="text-zinc-500 w-24 inline-block">Notes:</strong> {detailsModal.notes || 'None'}</p>
               
               {detailsModal.activityHistory && detailsModal.activityHistory.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-zinc-800">
                     <p className="text-amber-500 font-bold mb-2">Activity History</p>
                     <div className="space-y-2">
                        {detailsModal.activityHistory.map((h: any, i: number) => (
                           <div key={i} className="text-xs bg-black p-2 rounded border border-zinc-800">
                              <p className="text-white font-medium">{h.action}</p>
                              {h.note && <p className="text-zinc-400 mt-0.5">{h.note}</p>}
                              <p className="text-zinc-600 mt-1">{new Date(h.date).toLocaleString()}</p>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
            </div>
"""

content = re.sub(r'<div className="space-y-3 text-sm text-zinc-300">[\s\S]*?<div className="mt-6 flex gap-3">', history_code + '            <div className="mt-6 flex gap-3">', content)

with open('src/components/admin/BookingsAdmin.tsx', 'w') as f:
    f.write(content)

