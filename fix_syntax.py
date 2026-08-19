import re
with open('src/components/admin/BookingsAdmin.tsx', 'r') as f:
    content = f.read()

content = content.replace('<table className="w-full min-w-max text-left border-collapse"> className="w-full min-w-max text-left border-collapse">', '<table className="w-full min-w-max text-left border-collapse">')

with open('src/components/admin/BookingsAdmin.tsx', 'w') as f:
    f.write(content)
