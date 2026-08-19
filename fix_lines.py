with open("src/components/AppointmentForm.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "else if (onSuccess) onSuccess();" in line:
        new_lines.append(line)
        new_lines.append("              }}\n")
    else:
        new_lines.append(line)

with open("src/components/AppointmentForm.tsx", "w") as f:
    f.writelines(new_lines)
