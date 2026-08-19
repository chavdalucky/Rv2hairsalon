import re

with open('src/pages/Services.tsx', 'r') as f:
    content = f.read()

# 1. Add imports
import_stmt = "import BookingModal from '../components/BookingModal';\n"
if 'import BookingModal' not in content:
    last_import_idx = content.rfind('import ')
    next_line_idx = content.find('\n', last_import_idx) + 1
    content = content[:next_line_idx] + import_stmt + content[next_line_idx:]

# 2. Add state to Services component
# Find: const Services = () => {  (or similar)
# Actually let's look for `export default function Services()`
start_comp = content.find('export default function Services')
if start_comp == -1:
    start_comp = content.find('const Services =')
    
# Find the first useState after start_comp
first_state = content.find('useState', start_comp)
state_insert = content.rfind('\n', 0, first_state) + 1

new_state = "  const [bookingModalOpen, setBookingModalOpen] = useState(false);\n  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState('');\n"
content = content[:state_insert] + new_state + content[state_insert:]

# 3. Replace the WhatsApp button in the category with a button that opens the modal
# we need to replace:
# <a \n                      href="https://wa.me/918000068138" ... > ... </a>
# with a <button>

whatsapp_btn_start = '<a \n                      href="https://wa.me/918000068138"'
if whatsapp_btn_start not in content:
    whatsapp_btn_start = '<a\n                      href="https://wa.me/918000068138"'
if whatsapp_btn_start not in content:
    # let's just use regex to find the category book button
    pass

# We can replace the category button using regex
pattern = re.compile(r'<a[^>]*href="https://wa\.me/918000068138"[^>]*onClick=\{\(e\) => \{[^}]*\}\}[^>]*>\s*<span[^>]*>\{t\("services\.book"\)\} \{category\.title\.split\([^)]*\)\[0\]\} <MessageCircle size=\{18\} /></span>\s*<div[^>]*></div>\s*</a>', re.MULTILINE | re.DOTALL)

def replace_btn(match):
    return """<button 
                      onClick={(e) => {
                          e.preventDefault();
                          setSelectedServiceForBooking('');
                          setBookingModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-3 w-full py-5 bg-transparent border border-zinc-700 text-white font-bold uppercase tracking-widest text-sm rounded transition-all duration-500 hover:border-amber-500 hover:bg-amber-500 hover:text-black overflow-hidden relative group/btn"
                    >
                       <span className="relative z-10 flex items-center gap-2">{t("services.book")} {category.title.split(' ')[0]}</span>
                       <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-out"></div>
                    </button>"""

content = pattern.sub(replace_btn, content)

# 4. Add "Book Now" text link under each item desc
# Find: <p className="text-zinc-400 max-w-[85%] leading-relaxed font-light">{item.desc}</p>
desc_pattern = r'(<p className="text-zinc-400 max-w-\[85%\] leading-relaxed font-light">\{item\.desc\}</p>)'
desc_replace = r'\1\n                        <button onClick={(e) => { e.preventDefault(); setSelectedServiceForBooking(item.name); setBookingModalOpen(true); }} className="text-xs text-amber-500 font-bold uppercase tracking-widest hover:text-white transition-colors mt-3 inline-block">Book Now</button>'
content = re.sub(desc_pattern, desc_replace, content)

# 5. Add BookingModal at the end of the return statement
return_end = content.rfind('</div>\n  );')
if return_end != -1:
    modal_code = """
      <BookingModal 
        isOpen={bookingModalOpen} 
        onClose={() => setBookingModalOpen(false)} 
        initialService={selectedServiceForBooking} 
      />
"""
    content = content[:return_end] + modal_code + content[return_end:]


with open('src/pages/Services.tsx', 'w') as f:
    f.write(content)
print("Patched Services.tsx")
