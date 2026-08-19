import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

# 1. Add dob states
dob_states = """  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  
  const years = Array.from({ length: 2015 - 1950 + 1 }, (_, i) => 2015 - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
"""
if "const [dobDay" not in content:
    content = content.replace("  const [verifyPhoneModal, setVerifyPhoneModal] = useState(false);", dob_states + "\n  const [verifyPhoneModal, setVerifyPhoneModal] = useState(false);")

# 2. Populate dob states when data is fetched
fetch_data_old = """          setFormData(prev => ({
            ...prev,
            fullName: data.fullName || user.displayName || '',
            phone: data.phone || '',
            dob: data.dob || ''
          }));"""
fetch_data_new = """          setFormData(prev => ({
            ...prev,
            fullName: data.fullName || user.displayName || '',
            phone: data.phone || '',
            dob: data.dob || ''
          }));
          if (data.dob) {
            const [y, m, d] = data.dob.split('-');
            setDobYear(y || '');
            setDobMonth(m ? String(parseInt(m)) : '');
            setDobDay(d ? String(parseInt(d)) : '');
          }"""
content = content.replace(fetch_data_old, fetch_data_new)

# 3. Update handleUpdateProfile
handle_update_old = """  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!auth.currentUser) return;
    
    try {
      setLoading(true);
      await updateProfile(auth.currentUser, { displayName: formData.fullName });
      
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        fullName: formData.fullName,
        dob: formData.dob
      });
      
      
      
      await logActivity(auth.currentUser.uid, 'Profile Updated', 'Updated profile information');
      await createNotification(auth.currentUser.uid, 'Profile Updated', 'Your profile information has been updated.', 'Profile Updated');
      
      setUserProfile((prev: any) => ({ ...prev, fullName: formData.fullName, phone: formData.phone }));
      setSuccess('Profile updated successfully.');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };"""

handle_update_new = """  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!auth.currentUser) return;
    
    try {
      setLoading(true);
      
      let finalDob = '';
      if (dobDay && dobMonth && dobYear) {
         finalDob = `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`;
      }
      
      let formattedPhone = '';
      if (formData.phone) {
         formattedPhone = formatPhone(formData.phone);
         
         // Update phone_to_email optionally if it's new
         if (formattedPhone !== userProfile?.phone) {
             const phoneDoc = await getDoc(doc(db, 'phone_to_email', formattedPhone));
             if (phoneDoc.exists() && phoneDoc.data().uid !== auth.currentUser.uid) {
                 throw new Error('This phone number is already registered to another account.');
             }
             await setDoc(doc(db, 'phone_to_email', formattedPhone), {
                 email: auth.currentUser.email || `${formattedPhone.replace('+', '')}@tempapp.com`,
                 uid: auth.currentUser.uid
             });
         }
      }
      
      await updateProfile(auth.currentUser, { displayName: formData.fullName });
      
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        fullName: formData.fullName,
        dob: finalDob,
        phone: formattedPhone
      });
      
      await logActivity(auth.currentUser.uid, 'Profile Updated', 'Updated profile information');
      await createNotification(auth.currentUser.uid, 'Profile Updated', 'Your profile information has been updated.', 'Profile Updated');
      
      setUserProfile((prev: any) => ({ ...prev, fullName: formData.fullName, dob: finalDob, phone: formattedPhone }));
      setFormData((prev: any) => ({ ...prev, phone: formattedPhone, dob: finalDob }));
      
      setSuccess('Profile updated successfully.');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };"""

content = content.replace(handle_update_old, handle_update_new)

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)
