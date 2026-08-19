import re
with open('src/components/MyAppointments.tsx', 'r') as f:
    content = f.read()

# Make sure useMemo is imported
if "useMemo" not in content:
    content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect, useMemo } from 'react';")

old_filtered = """  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = (apt.serviceName || '').toLowerCase().includes(search.toLowerCase()) || (apt.id || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (apt.status || 'pending').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });"""

new_filtered = """  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const matchesSearch = (apt.serviceName || '').toLowerCase().includes(search.toLowerCase()) || (apt.id || '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || (apt.status || 'pending').toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, statusFilter]);"""

content = content.replace(old_filtered, new_filtered)

with open('src/components/MyAppointments.tsx', 'w') as f:
    f.write(content)
