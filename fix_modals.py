import re
with open('src/components/MyAppointments.tsx', 'r') as f:
    content = f.read()

# Remove 'layout' from the motion.div inside the map
content = content.replace("              <motion.div \n                layout\n                initial={{ opacity: 0 }}\n", "              <motion.div \n                initial={{ opacity: 0 }}\n")

# Make sure react-dom is imported for createPortal
if "createPortal" not in content:
    content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { createPortal } from 'react-dom';")

# Move the modals to be rendered via createPortal
modal_start_index = content.find("{/* Reschedule Modal */}")
if modal_start_index != -1:
    before_modals = content[:modal_start_index]
    modals = content[modal_start_index:content.rfind("</div>\n  );\n}")]
    
    new_modals = """
      {typeof document !== 'undefined' && createPortal(
        <>
""" + modals.replace("\n      {/*", "\n          {/*").replace("\n      </AnimatePresence>", "\n          </AnimatePresence>") + """
        </>,
        document.body
      )}
"""
    new_content = before_modals + new_modals + "    </div>\n  );\n}\n"
    
    with open('src/components/MyAppointments.tsx', 'w') as f:
        f.write(new_content)
