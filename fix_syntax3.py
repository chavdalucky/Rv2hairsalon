with open('src/components/admin/BookingsAdmin.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip_next = False
for i, line in enumerate(lines):
    if skip_next:
        skip_next = False
        continue
    if '<table className="w-full min-w-max text-left border-collapse">' in line:
        if i + 1 < len(lines) and '<table className="w-full min-w-max text-left border-collapse">' in lines[i+1]:
            skip_next = True
    new_lines.append(line)

with open('src/components/admin/BookingsAdmin.tsx', 'w') as f:
    f.writelines(new_lines)
