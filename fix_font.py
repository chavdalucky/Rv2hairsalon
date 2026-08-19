import re

with open("src/index.css", "r") as f:
    content = f.read()

# Add logic so that when .font-gujarati is active on body, it overrides serif for headings too
css_addition = """
@layer utilities {
  .font-gujarati,
  .font-gujarati h1, 
  .font-gujarati h2, 
  .font-gujarati h3, 
  .font-gujarati h4, 
  .font-gujarati h5, 
  .font-gujarati h6,
  .font-gujarati .font-serif {
    font-family: 'Noto Sans Gujarati', sans-serif !important;
  }
}
"""

content = content.replace(".font-gujarati {\n    font-family: 'Noto Sans Gujarati', sans-serif;\n  }", css_addition.strip())

with open("src/index.css", "w") as f:
    f.write(content)
