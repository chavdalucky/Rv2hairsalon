with open("src/components/AppointmentForm.tsx", "r") as f:
    content = f.read()

content = content.replace("placeholder=t('book.notesPlaceholder')", "placeholder={t('book.notesPlaceholder')}")

with open("src/components/AppointmentForm.tsx", "w") as f:
    f.write(content)
