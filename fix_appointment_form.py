import re

with open("src/components/AppointmentForm.tsx", "r") as f:
    content = f.read()

# Replace hardcoded text with translation keys
content = content.replace("label: 'Service'", "label: t('book.serviceLabel')")
content = content.replace("label: 'Date & Time'", "label: t('book.dateTime')")
content = content.replace("label: 'Stylist'", "label: t('book.stylist')")
content = content.replace("label: 'Confirmation'", "label: t('book.confirmation')")

content = content.replace("'Please select a service'", "t('book.serviceRequired')")
content = content.replace("'Date is required'", "t('book.dateRequired')")
content = content.replace("'Past dates are not allowed'", "t('book.pastDateError')")
content = content.replace("'Time is required'", "t('book.timeRequired')")
content = content.replace("'Name is required'", "t('book.nameRequired')")
content = content.replace("'Phone is required'", "t('book.phoneRequired')")
content = content.replace("'Valid 10-digit number required'", "t('book.phoneInvalid')")

content = content.replace(">Select Stylist<", ">{t('book.selectStylist')}<")
content = content.replace(">Review Details<", ">{t('book.reviewDetails')}<")
content = content.replace(">Back<", ">{t('book.back')}<")
content = content.replace(">Next Step<", ">{t('book.nextStep')}<")
content = content.replace("'CONFIRM BOOKING'", "t('book.confirmBooking')")
content = content.replace("'SUBMITTING...'", "t('book.submitting')")
content = content.replace(">Service<", ">{t('book.serviceLabel')}<")
content = content.replace(">Date & Time<", ">{t('book.dateTime')}<")
content = content.replace(">Stylist<", ">{t('book.stylist')}<")
content = content.replace(">Client<", ">{t('book.client')}<")
content = content.replace(">Additional Notes (Optional)<", ">{t('book.notes')}<")
content = content.replace("\"Any special requests?\"", "t('book.notesPlaceholder')")
content = content.replace(">Use 100 Points for ₹100 Discount<", ">{t('book.usePointsTitle')}<")
content = content.replace("You have {userPoints} points available.", "{t('book.usePointsDesc').replace('{points}', userPoints.toString())}")
content = content.replace(">Book Appointment<", ">{t('book.title')}<")
content = content.replace(">Complete your request details below.<", ">{t('book.subtitle')}<")
content = content.replace(">Select a Service<", ">{t('book.selectAService')}<")

# Handling "Any Available" safely
content = content.replace("stylists = [\"Any Available\",", "stylists = [t('book.anyAvailable'),")
# The state is initialized as 'Any Available'
content = content.replace("stylist: 'Any Available',", "stylist: t('book.anyAvailable'),")

with open("src/components/AppointmentForm.tsx", "w") as f:
    f.write(content)
