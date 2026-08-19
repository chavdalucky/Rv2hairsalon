import re
with open('src/components/AppointmentForm.tsx', 'r') as f:
    content = f.read()

discount_ui = """
        {userPoints >= 100 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-center justify-between">
            <div>
               <p className="text-white font-medium text-sm">Use 100 Points for ₹100 Discount</p>
               <p className="text-amber-500 text-xs">You have {userPoints} points available.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} />
              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
        )}
"""

content = content.replace("        <button \n          type=\"submit\"", discount_ui + "\n        <button \n          type=\"submit\"")

with open('src/components/AppointmentForm.tsx', 'w') as f:
    f.write(content)
