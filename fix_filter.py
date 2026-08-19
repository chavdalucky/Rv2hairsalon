import re
with open('src/components/MyAppointments.tsx', 'r') as f:
    content = f.read()

old_filter_logic = """  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const matchesSearch = (apt.serviceName || '').toLowerCase().includes(search.toLowerCase()) || (apt.id || '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || (apt.status || 'pending').toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, statusFilter]);"""

new_filter_logic = """  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const matchesSearch = (apt.serviceName || '').toLowerCase().includes(search.toLowerCase()) || (apt.id || '').toLowerCase().includes(search.toLowerCase());
      
      let matchesStatus = true;
      if (statusFilter !== 'all') {
         const s = (apt.status || 'pending').toLowerCase();
         if (statusFilter === 'upcoming') {
            matchesStatus = ['pending', 'awaiting_confirmation'].includes(s);
         } else if (statusFilter === 'expired') {
            matchesStatus = s === 'expired';
         } else {
            matchesStatus = s === statusFilter;
         }
      }
      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, statusFilter]);"""

content = content.replace(old_filter_logic, new_filter_logic)

with open('src/components/MyAppointments.tsx', 'w') as f:
    f.write(content)
