with open("src/lib/translations.ts", "r") as f:
    lines = f.readlines()

new_lines = []
seen_en = set()
seen_gu = set()
current_lang = 'en'

for line in lines:
    if '  gu: {' in line:
        current_lang = 'gu'
    
    import re
    match = re.search(r"^\s*'([^']+)'\s*:", line)
    if match:
        key = match.group(1)
        if current_lang == 'en':
            if key not in seen_en:
                seen_en.add(key)
                new_lines.append(line)
        else:
            if key not in seen_gu:
                seen_gu.add(key)
                new_lines.append(line)
    else:
        new_lines.append(line)

with open("src/lib/translations.ts", "w") as f:
    f.writelines(new_lines)
