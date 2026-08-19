import re

with open("src/lib/translations.ts", "r") as f:
    content = f.read()

# I will parse the json object of 'en' and 'gu' out of it, update it, and write it back, or just use string replacements.
# Let's see what's the best way.

import json
# Actually it's typescript so I'll write a Python script to do string replacement carefully.
