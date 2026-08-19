import re

with open('src/components/AppointmentForm.tsx', 'r') as f:
    content = f.read()

# Add getDoc and doc to imports
if "getDoc" not in content:
    content = content.replace("import { collection, addDoc", "import { collection, addDoc, getDoc, doc, updateDoc, increment ")

# Add state
state_injection = """  const [usePoints, setUsePoints] = useState(false);
  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    const fetchPoints = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserPoints(userDoc.data().rewardPoints || 0);
        }
      }
    };
    fetchPoints();
  }, []);
"""
if "const [usePoints, setUsePoints]" not in content:
    content = content.replace("const [errors, setErrors] = useState<Record<string, string>>({});", state_injection + "\n  const [errors, setErrors] = useState<Record<string, string>>({});")

# Inject toggle UI
ui_injection = """          </div>
          
          {userPoints >= 100 && (
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl cursor-pointer" onClick={() => setUsePoints(!usePoints)}>
              <div className={`w-5 h-5 rounded flex items-center justify-center border ${usePoints ? 'bg-amber-500 border-amber-500 text-black' : 'border-zinc-500 text-transparent'}`}>
                 <Check size={14} strokeWidth={3} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-500">Apply ₹100 Discount</p>
                <p className="text-xs text-amber-500/70">Use 100 Reward Points</p>
              </div>
            </div>
          )}
          
          <div className="pt-2">"""
if "Apply ₹100 Discount" not in content:
    content = content.replace("</div>\n\n          <div className=\"pt-2\">", ui_injection)

# Modify submission logic
old_submit = """      await addDoc(collection(db, 'bookings'), {
        customerName: formData.name,
        phone: formData.phone,
        date: formData.date,
        time: formData.time,
        serviceName: formData.service,
        notes: formData.notes,
        status: 'Pending',
        createdAt: serverTimestamp(),
        paymentMethod: 'Cash',
        amount: 'TBD',
        userId: auth.currentUser ? auth.currentUser.uid : null,
        email: auth.currentUser ? auth.currentUser.email : null
      });"""

new_submit = """      const discountApplied = usePoints && userPoints >= 100;
      await addDoc(collection(db, 'bookings'), {
        customerName: formData.name,
        phone: formData.phone,
        date: formData.date,
        time: formData.time,
        serviceName: formData.service,
        notes: formData.notes,
        status: 'Pending',
        createdAt: serverTimestamp(),
        paymentMethod: 'Cash',
        amount: 'TBD',
        discountApplied: discountApplied ? 100 : 0,
        pointsUsed: discountApplied ? 100 : 0,
        userId: auth.currentUser ? auth.currentUser.uid : null,
        email: auth.currentUser ? auth.currentUser.email : null
      });

      if (discountApplied && auth.currentUser) {
         await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            rewardPoints: increment(-100),
            lockedPoints: increment(100)
         });
      }"""

content = content.replace(old_submit, new_submit)

# Update whatsapp message
old_wa = """const message = `*New Appointment Request*
Name: ${formData.name}
Phone: ${formData.phone}
Date: ${formData.date}
Time: ${formData.time}
Service: ${formData.service}
Notes: ${formData.notes || 'None'}`"""

new_wa = """const discountMsg = (usePoints && userPoints >= 100) ? '\\nDiscount Applied: -₹100 (100 Points)' : '';
    const message = `*New Appointment Request*
Name: ${formData.name}
Phone: ${formData.phone}
Date: ${formData.date}
Time: ${formData.time}
Service: ${formData.service}${discountMsg}
Notes: ${formData.notes || 'None'}
Payable: Cash at Salon`"""

content = content.replace(old_wa, new_wa)

with open('src/components/AppointmentForm.tsx', 'w') as f:
    f.write(content)
