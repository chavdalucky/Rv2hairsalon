import re

with open('src/pages/AIStudio.tsx', 'r') as f:
    content = f.read()

# Update the state type
content = re.sub(r"useState\<'chat' \| 'image' \| 'video'\>\('chat'\);", "useState<'chat' | 'voice'>('chat');", content)

# Remove tabs from the array
old_tabs = """          {[
            { id: 'chat', label: 'AI Stylist', icon: Sparkles },
            { id: 'voice', label: 'Voice Assistant', icon: Mic }, // We'll replace with Mic if imported, but let's use Sparkles for now
            { id: 'image', label: 'Create Look', icon: ImageIcon },
            { id: 'video', label: 'Animate', icon: Video },
          ]"""
new_tabs = """          {[
            { id: 'chat', label: 'AI Stylist', icon: Sparkles },
            { id: 'voice', label: 'Voice Assistant', icon: Mic },
          ]"""
content = content.replace(old_tabs, new_tabs)

# Update description
old_desc = "Experience the future of styling. Chat with our AI expert, generate new looks, or animate your transformations."
new_desc = "Experience the future of styling. Chat with our AI expert or use our voice assistant to discover your next look."
content = content.replace(old_desc, new_desc)

# Remove components from render
old_render = """            {activeTab === 'chat' && <ChatInterface key="chat" />}
            {activeTab === 'voice' && <VoiceInterface key="voice" />}
            {activeTab === 'image' && <ImageGenerator key="image" />}
            {activeTab === 'video' && <VideoGenerator key="video" />}"""
new_render = """            {activeTab === 'chat' && <ChatInterface key="chat" />}
            {activeTab === 'voice' && <VoiceInterface key="voice" />}"""
content = content.replace(old_render, new_render)

# Now, we need to remove ImageGenerator and VideoGenerator.
# We'll just truncate the file from the start of function ImageGenerator
idx = content.find("function ImageGenerator()")
if idx != -1:
    content = content[:idx]

with open('src/pages/AIStudio.tsx', 'w') as f:
    f.write(content)
print("Updated AIStudio.tsx")
