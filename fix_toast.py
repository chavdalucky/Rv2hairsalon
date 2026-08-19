import re
with open('src/components/MyAppointments.tsx', 'r') as f:
    content = f.read()

content = content.replace("const [activeAppointment, setActiveAppointment] = useState<any>(null); = useState<{message: string, type: 'success' | 'error'} | null>(null);", "const [activeAppointment, setActiveAppointment] = useState<any>(null);")

with open('src/components/MyAppointments.tsx', 'w') as f:
    f.write(content)
