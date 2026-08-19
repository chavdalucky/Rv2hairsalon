import re

with open("src/lib/translations.ts", "r") as f:
    content = f.read()

new_en = {
    'book.step': 'Step',
    'book.selectStylist': 'Select Stylist',
    'book.reviewDetails': 'Review Details',
    'book.back': 'Back',
    'book.nextStep': 'Next Step',
    'book.confirmBooking': 'CONFIRM BOOKING',
    'book.submitting': 'SUBMITTING...',
    'book.anyAvailable': 'Any Available',
    'book.serviceLabel': 'Service',
    'book.dateTime': 'Date & Time',
    'book.stylist': 'Stylist',
    'book.client': 'Client',
    'book.notes': 'Additional Notes (Optional)',
    'book.notesPlaceholder': 'Any special requests?',
    'book.usePointsTitle': 'Use 100 Points for ₹100 Discount',
    'book.usePointsDesc': 'You have {points} points available.',
    'book.title': 'Book Appointment',
    'book.subtitle': 'Complete your request details below.',
    'book.pastDateError': 'Past dates are not allowed',
    'book.dateRequired': 'Date is required',
    'book.timeRequired': 'Time is required',
    'book.nameRequired': 'Name is required',
    'book.phoneRequired': 'Phone is required',
    'book.phoneInvalid': 'Valid 10-digit number required',
    'book.serviceRequired': 'Please select a service',
    'book.selectAService': 'Select a Service',
    'book.confirmation': 'Confirmation',
    'reviews.verifiedClient': 'Verified Client',
    'ai.assistant': 'AI Assistant',
    'ai.connecting': 'Connecting...',
    'ai.listening': 'Listening...',
    'ai.disconnected': 'Disconnected',
    'ai.speakNow': 'Speak now',
    'ai.text': 'Text',
    'ai.voice': 'Voice',
    'ai.typePlaceholder': 'Type your message...',
    'ai.send': 'Send',
    'ai.processing': 'Processing...',
    'ai.endCall': 'End Call'
}

new_gu = {
    'book.step': 'પગલું',
    'book.selectStylist': 'સ્ટાઈલિસ્ટ પસંદ કરો',
    'book.reviewDetails': 'વિગતો તપાસો',
    'book.back': 'પાછળ',
    'book.nextStep': 'આગળનું પગલું',
    'book.confirmBooking': 'બુકિંગ કન્ફર્મ કરો',
    'book.submitting': 'સબમિટ થઈ રહ્યું છે...',
    'book.anyAvailable': 'કોઈપણ ઉપલબ્ધ',
    'book.serviceLabel': 'સેવા',
    'book.dateTime': 'તારીખ અને સમય',
    'book.stylist': 'સ્ટાઈલિસ્ટ',
    'book.client': 'ગ્રાહક',
    'book.notes': 'વધારાની નોંધો (વૈકલ્પિક)',
    'book.notesPlaceholder': 'કોઈ ખાસ વિનંતીઓ?',
    'book.usePointsTitle': '₹100 ડિસ્કાઉન્ટ માટે 100 પોઈન્ટ્સ વાપરો',
    'book.usePointsDesc': 'તમારી પાસે {points} પોઈન્ટ્સ ઉપલબ્ધ છે.',
    'book.title': 'એપોઇન્ટમેન્ટ બુક કરો',
    'book.subtitle': 'નીચે તમારી વિનંતીની વિગતો પૂર્ણ કરો.',
    'book.pastDateError': 'ભૂતકાળની તારીખોની મંજૂરી નથી',
    'book.dateRequired': 'તારીખ જરૂરી છે',
    'book.timeRequired': 'સમય જરૂરી છે',
    'book.nameRequired': 'નામ જરૂરી છે',
    'book.phoneRequired': 'ફોન નંબર જરૂરી છે',
    'book.phoneInvalid': 'માન્ય 10-અંકનો નંબર જરૂરી છે',
    'book.serviceRequired': 'કૃપા કરીને સેવા પસંદ કરો',
    'book.selectAService': 'સેવા પસંદ કરો',
    'book.confirmation': 'પુષ્ટિકરણ',
    'reviews.verifiedClient': 'પ્રમાણિત ગ્રાહક',
    'ai.assistant': 'AI સહાયક',
    'ai.connecting': 'જોડાઈ રહ્યું છે...',
    'ai.listening': 'સાંભળી રહ્યું છે...',
    'ai.disconnected': 'ડિસ્કનેક્ટ થયું',
    'ai.speakNow': 'હવે બોલો',
    'ai.text': 'ટેક્સ્ટ',
    'ai.voice': 'વૉઇસ',
    'ai.typePlaceholder': 'તમારો સંદેશ લખો...',
    'ai.send': 'મોકલો',
    'ai.processing': 'પ્રક્રિયા થઈ રહી છે...',
    'ai.endCall': 'કૉલ સમાપ્ત કરો'
}

# Split at 'gu: {\n'
parts = content.split('  gu: {\n')
en_part = parts[0]
gu_part = parts[1]

# Insert en translations right before '  gu: {'
en_part = en_part.rstrip()
if en_part.endswith(','):
    en_part = en_part[:-1]

en_part_insert = ",\n" + ",\n".join([f"    '{k}': '{v}'" for k, v in new_en.items()]) + ",\n"
en_part = en_part + en_part_insert + "\n  gu: {\n"

# The end of gu_part is '  }\n};\n\nexport type TranslationKey = keyof typeof translations.en;\n'
# Let's just find `  }\n};`
gu_part_split = gu_part.split('  }\n};')
gu_content = gu_part_split[0].rstrip()
if gu_content.endswith(','):
    gu_content = gu_content[:-1]

gu_part_insert = ",\n" + ",\n".join([f"    '{k}': '{v}'" for k, v in new_gu.items()]) + "\n  }\n};"

final_content = en_part + gu_content + gu_part_insert + gu_part_split[1]

with open("src/lib/translations.ts", "w") as f:
    f.write(final_content)

