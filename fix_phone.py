with open('src/utils/phoneAuth.ts', 'r') as f:
    content = f.read()

bad = """export const formatPhone = (phone: string) => {
  let p = phone.replace(/\\D/g, '');
  if (p.startsWith('91') && p.length === 12) {
    return '+' + p;
  }
  if (p.length === 10) {
    return '+91' + p;
  }
  return '+' + p;
};"""

good = """export const formatPhone = (phone: string) => {
  let p = phone.replace(/\\D/g, '');
  
  // If the user somehow pasted 91 at the start of a 12 digit number, fix it
  if (p.startsWith('91') && p.length === 12) {
    p = p.substring(2);
  }
  
  if (p.length === 10) {
    return '+91' + p;
  }
  
  // Return standard format, but it might fail validation later if it's not valid
  return '+91' + p;
};"""

content = content.replace(bad, good)
with open('src/utils/phoneAuth.ts', 'w') as f:
    f.write(content)
