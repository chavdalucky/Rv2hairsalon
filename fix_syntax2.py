with open('src/components/admin/BookingsAdmin.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'className="w-full min-w-max text-left border-collapse"' in line and 'className="w-full min-w-max text-left border-collapse">' in line:
        lines[i] = '          <table className="w-full min-w-max text-left border-collapse">\n'

with open('src/components/admin/BookingsAdmin.tsx', 'w') as f:
    f.writelines(lines)
