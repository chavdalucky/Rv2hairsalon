import re

with open('server.ts', 'r') as f:
    content = f.read()

# Replace the chat rules
chat_rules_old = "- DO NOT say the booking is confirmed until the 'create_booking' function returns success. If it succeeds, tell them it's successfully booked. If it fails, tell them it failed.\\n- Never output fake confirmations."
chat_rules_new = "- DO NOT say the booking is confirmed until the 'create_booking' function returns success. If you are about to call the function and haven't gotten the result yet, ONLY say 'હું તમારી booking માટે details તૈયાર કરી રહ્યો છું.' (or English equivalent). If it succeeds, tell them it's successfully booked ('તમારી appointment successfully book થઈ ગઈ છે'). If it fails, tell them it failed ('Booking complete થઈ શકી નથી. કૃપા કરીને ફરી પ્રયાસ કરો.').\\n- Never output fake confirmations."

content = content.replace(chat_rules_old, chat_rules_new)

live_rules_old = "- DO NOT say the booking is confirmed until the 'create_booking' function returns success."
live_rules_new = "- DO NOT say the booking is confirmed until the 'create_booking' function returns success. If you are preparing to call the function, ONLY say 'હું તમારી booking માટે details તૈયાર કરી રહ્યો છું.'. Once it succeeds, say 'તમારી appointment successfully book થઈ ગઈ છે.'. If it fails, say 'Booking complete થઈ શકી નથી. કૃપા કરીને ફરી પ્રયાસ કરો.'."

content = content.replace(live_rules_old, live_rules_new)

with open('server.ts', 'w') as f:
    f.write(content)
print("Updated instructions in server.ts")
