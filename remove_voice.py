import re

with open('src/pages/AIStudio.tsx', 'r') as f:
    content = f.read()

# Update the state type
content = re.sub(r"useState\<'chat' \| 'voice'\>\('chat'\);", "useState<'chat'>('chat');", content)

# Remove tabs from the array
old_tabs = """          {[
            { id: 'chat', label: 'AI Stylist', icon: Sparkles },
            { id: 'voice', label: 'Voice Assistant', icon: Mic },
          ]"""
new_tabs = """          {[
            { id: 'chat', label: 'AI Stylist', icon: Sparkles },
          ]"""
content = content.replace(old_tabs, new_tabs)

# Update description
old_desc = "Experience the future of styling. Chat with our AI expert or use our voice assistant to discover your next look."
new_desc = "Experience the future of styling. Chat with our AI expert to discover your next look."
content = content.replace(old_desc, new_desc)

# Remove components from render
old_render = """          <AnimatePresence mode="wait">
            {activeTab === 'chat' && <ChatInterface key="chat" />}
            {activeTab === 'voice' && <VoiceInterface key="voice" />}
          </AnimatePresence>"""
new_render = """          <AnimatePresence mode="wait">
            {activeTab === 'chat' && <ChatInterface key="chat" />}
          </AnimatePresence>"""
content = content.replace(old_render, new_render)

# Truncate the file from the start of function VoiceInterface
idx = content.find("function VoiceInterface()")
if idx != -1:
    content = content[:idx]

with open('src/pages/AIStudio.tsx', 'w') as f:
    f.write(content)
print("Updated AIStudio.tsx")
