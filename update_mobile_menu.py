import re

with open('src/components/layout/Navbar.tsx', 'r') as f:
    content = f.read()

# find the wrapper div
# from: <div className="relative z-10 px-4 pt-4 pb-12 space-y-2 overflow-y-auto overscroll-contain max-h-[calc(100dvh-4rem)]">
# to:   <div className="relative z-10 max-h-[calc(100dvh-4rem)] flex flex-col">
#         <div className="px-4 pt-4 pb-4 space-y-2 overflow-y-auto overscroll-contain">

content = content.replace(
    '<div className="relative z-10 px-4 pt-4 pb-12 space-y-2 overflow-y-auto overscroll-contain max-h-[calc(100dvh-4rem)]">',
    '<div className="relative z-10 max-h-[calc(100dvh-4rem)] flex flex-col">\n              <div className="px-4 pt-4 pb-4 space-y-2 overflow-y-auto overscroll-contain">'
)

# find the bottom grid
# from: <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-zinc-900/50">
# to:   </div>
#       <div className="p-4 mt-auto border-t border-zinc-900/50 bg-zinc-950 sticky bottom-0 z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.8)]">
#         <div className="grid grid-cols-2 gap-4">

content = content.replace(
    '<div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-zinc-900/50">',
    '</div>\n              <div className="p-4 mt-auto border-t border-zinc-900/50 bg-zinc-950 sticky bottom-0 z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.8)]">\n                <div className="grid grid-cols-2 gap-4">'
)

# We need to add one more closing </div> because we split the wrapper.
# Find the end of the mobile menu block
#                 </a>
#               </div>
#             </div>
#           </motion.div>
# to:
#                 </a>
#               </div>
#               </div>
#             </div>
#           </motion.div>

content = content.replace(
    '</a>\n              </div>\n            </div>\n          </motion.div>',
    '</a>\n                </div>\n              </div>\n            </div>\n          </motion.div>'
)

with open('src/components/layout/Navbar.tsx', 'w') as f:
    f.write(content)

