import re
with open('src/components/MyAppointments.tsx', 'r') as f:
    content = f.read()

billing_jsx = """                    <div className="text-left lg:text-right bg-zinc-950 p-3 rounded-xl border border-zinc-800/50 min-w-[160px]">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-zinc-500 uppercase tracking-wider">Service:</span>
                        <span className="text-white">₹{booking.amount || '0'}</span>
                      </div>
                      {booking.discountApplied > 0 && (
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="text-amber-500 uppercase tracking-wider">Discount:</span>
                          <span className="text-amber-500">-₹{booking.discountApplied}</span>
                        </div>
                      )}
                      <div className="border-t border-zinc-800/50 my-1 pt-1 flex justify-between items-center">
                         <span className="text-xs text-zinc-500 uppercase tracking-wider">To Pay:</span>
                         <span className="text-xl font-serif text-white font-bold tracking-wide">
                            ₹{Math.max(0, (parseFloat(booking.amount || '0') || 0) - (booking.discountApplied || 0))}
                         </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 flex items-center lg:justify-end gap-1 mt-1 uppercase">
                        <CreditCard size={10}/> {booking.paymentMethod || 'Cash To Collect'}
                      </p>
                    </div>"""

old_billing = """                    <div className="text-left lg:text-right">
                      <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Total Amount</p>
                      <p className="text-2xl font-serif text-white font-bold tracking-wide">₹{booking.amount || '0'}</p>
                      <p className="text-[10px] text-zinc-500 flex items-center lg:justify-end gap-1 mt-1">
                        <CreditCard size={10}/> {booking.paymentMethod || 'Cash'}
                      </p>
                    </div>"""

content = content.replace(old_billing, billing_jsx)

with open('src/components/MyAppointments.tsx', 'w') as f:
    f.write(content)
