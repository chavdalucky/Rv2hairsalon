import re
with open('src/components/admin/BookingsAdmin.tsx', 'r') as f:
    content = f.read()

old_td = """                  <td className="p-3">
                    <p className="text-zinc-300 text-sm">{b.serviceName || 'Custom Service'}</p>
                    <p className="text-amber-500 text-xs font-mono">₹{b.amount}</p>
                  </td>"""

new_td = """                  <td className="p-3">
                    <p className="text-zinc-300 text-sm font-medium">{b.serviceName || 'Custom Service'}</p>
                    <div className="mt-1 flex flex-col gap-0.5 text-[10px] font-mono">
                       <span className="text-zinc-400">Total: ₹{b.amount || 0}</span>
                       {b.discountApplied > 0 && <span className="text-amber-500">Discount: -₹{b.discountApplied}</span>}
                       <span className="text-white font-bold text-xs">Collect: ₹{Math.max(0, (parseFloat(b.amount || '0') || 0) - (b.discountApplied || 0))}</span>
                    </div>
                  </td>"""

content = content.replace(old_td, new_td)

with open('src/components/admin/BookingsAdmin.tsx', 'w') as f:
    f.write(content)
