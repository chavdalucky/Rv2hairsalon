import re

with open("src/components/Reviews.tsx", "r") as f:
    content = f.read()

content = content.replace("Verified Client", "{t('reviews.verifiedClient')}")

with open("src/components/Reviews.tsx", "w") as f:
    f.write(content)
