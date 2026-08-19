import re

with open("src/components/LiveVoiceAssistant.tsx", "r") as f:
    content = f.read()

# Import
content = content.replace("import React, { useState, useEffect, useRef } from 'react';", "import React, { useState, useEffect, useRef } from 'react';\nimport { useLanguage } from '../lib/LanguageContext';")

# Extract hook
content = content.replace("export default function LiveVoiceAssistant() {", "export default function LiveVoiceAssistant() {\n  const { t } = useLanguage();")

# Replace strings
content = content.replace(">AI Assistant<", ">{t('ai.assistant')}<")
content = content.replace("Connecting...", "{t('ai.connecting')}")
content = content.replace(">Listening...<", ">{t('ai.listening')}<")
content = content.replace(">Disconnected<", ">{t('ai.disconnected')}<")
content = content.replace(">Speak now<", ">{t('ai.speakNow')}<")
content = content.replace(">Text<", ">{t('ai.text')}<")
content = content.replace(">Voice<", ">{t('ai.voice')}<")
content = content.replace("placeholder=\"Type your message...\"", "placeholder={t('ai.typePlaceholder')}")
content = content.replace("title=\"AI Assistant\"", "title={t('ai.assistant')}")
content = content.replace(">End Call<", ">{t('ai.endCall')}<")
content = content.replace(">Processing...<", ">{t('ai.processing')}<")
content = content.replace("<span>Send</span>", "<span>{t('ai.send')}</span>")

with open("src/components/LiveVoiceAssistant.tsx", "w") as f:
    f.write(content)
