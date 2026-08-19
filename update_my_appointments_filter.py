import re
with open('src/components/MyAppointments.tsx', 'r') as f:
    content = f.read()

# Update filteredAppointments logic
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

content = re.sub(
    r"  const filteredAppointments = useMemo\(\) => \{[\s\S]*?\}, \[appointments, search, statusFilter\]\);",
    new_filter_logic,
    content
)

# Update select options
new_select_options = """          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>"""

content = re.sub(
    r"          <select [\s\S]*?</select>",
    new_select_options,
    content
)

with open('src/components/MyAppointments.tsx', 'w') as f:
    f.write(content)
