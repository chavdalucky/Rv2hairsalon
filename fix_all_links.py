import re
import glob

files = [
    'src/components/layout/Navbar.tsx',
    'src/components/LuxuryCTA.tsx',
    'src/pages/Home.tsx',
    'src/pages/Contact.tsx'
]

# We need to change:
# href="https://wa.me/918000068138" onClick={(e) => {     triggerHaptic('light');     trackEvent('WhatsApp button clicked');   }}
# target="_blank"
# rel="noopener noreferrer"
# to:
# href="#" onClick={(e) => { e.preventDefault(); triggerHaptic('light'); trackEvent('Book Now button clicked'); window.dispatchEvent(new CustomEvent('open-booking-modal')); }}

for file in files:
    with open(file, 'r') as f:
        content = f.read()

    # regex to match the exact string or something similar
    content = re.sub(
        r'href="https://wa\.me/918000068138" onClick=\{\(e\) => \{.*?\}\}',
        r'href="#" onClick={(e) => { e.preventDefault(); triggerHaptic(\'light\'); trackEvent(\'Book Now button clicked\'); window.dispatchEvent(new CustomEvent(\'open-booking-modal\')); }}',
        content,
        flags=re.DOTALL
    )
    # remove target="_blank" and rel="noopener noreferrer"
    content = content.replace('target="_blank"', '')
    content = content.replace('rel="noopener noreferrer"', '')
    
    with open(file, 'w') as f:
        f.write(content)
