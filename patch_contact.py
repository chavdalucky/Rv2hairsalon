import re

with open('src/pages/Contact.tsx', 'r') as f:
    content = f.read()

# Replace the form with the component
start_marker = '<form className="space-y-8" onSubmit={(e) => e.preventDefault()}>'
end_marker = '</form>'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker) + len(end_marker)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + '<AppointmentForm />' + content[end_idx:]
    
    # Add import
    import_stmt = "import AppointmentForm from '../components/AppointmentForm';\n"
    if 'import AppointmentForm' not in new_content:
        # Find the last import
        last_import_idx = new_content.rfind('import ')
        next_line_idx = new_content.find('\n', last_import_idx) + 1
        new_content = new_content[:next_line_idx] + import_stmt + new_content[next_line_idx:]
        
    with open('src/pages/Contact.tsx', 'w') as f:
        f.write(new_content)
    print("Patched Contact.tsx")
else:
    print("Could not find markers")
