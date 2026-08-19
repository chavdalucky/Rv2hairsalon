import re

with open('src/pages/AIStudio.tsx', 'r') as f:
    content = f.read()

# Fix unused imports
content = re.sub(
    r"import \{ Sparkles, Image as ImageIcon, Video, Send, Loader2, Upload, Download, CheckCircle, Mic, MicOff \} from 'lucide-react';",
    "import { Sparkles, Send, Loader2 } from 'lucide-react';",
    content
)
content = re.sub(r"import OptimizedImage from '\.\./components/OptimizedImage';\n", "", content)
content = re.sub(
    r"import \{ collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp \} from 'firebase/firestore';",
    "import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';",
    content
)

# Remove tabs UI completely
tabs_block = r"""        \{/\* Tabs \*/\}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          \{\[
            \{ id: 'chat', label: 'AI Stylist', icon: Sparkles \},
          \]\.map\(tab => \(
            <button
              key=\{tab\.id\}
              onClick=\{\(\) => \{
                triggerHaptic\('light'\);
                setActiveTab\(tab\.id as any\);
                trackEvent\('AI Studio Tab Changed', \{ tab: tab\.id \}\);
              \}\}
              className=\{`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all \$\{
                activeTab === tab\.id 
                  \? 'bg-amber-500 text-black shadow-\[0_0_20px_rgba\(245,158,11,0\.3\)\]'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              \}`\}
            >
              <tab\.icon size=\{18\} />
              \{tab\.label\}
            </button>
          \)\)\}
        </div>"""

content = re.sub(tabs_block, "", content)

# Remove AnimatePresence since we don't need to switch tabs
content = content.replace(
"""        {/* Content Area */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden min-h-[600px] flex flex-col relative">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' && <ChatInterface key="chat" />}
          </AnimatePresence>
        </div>""",
"""        {/* Content Area */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden min-h-[600px] flex flex-col relative">
          <ChatInterface />
        </div>""")

# Remove activeTab state
content = re.sub(r"  const \[activeTab, setActiveTab\] = useState\<'chat'\>\('chat'\);\n", "", content)

with open('src/pages/AIStudio.tsx', 'w') as f:
    f.write(content)
print("Fixed AIStudio.tsx")
