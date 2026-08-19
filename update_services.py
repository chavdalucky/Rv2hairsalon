import re
with open('src/pages/Services.tsx', 'r') as f:
    content = f.read()

if "import { useLocation" not in content:
    content = content.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';\nimport { useLocation } from 'react-router-dom';")

if "const location = useLocation();" not in content:
    content = content.replace("export default function Services() {\n  const { t } = useLanguage();", "export default function Services() {\n  const { t } = useLanguage();\n  const location = useLocation();")

# Add an effect to check for redeem
redeem_effect = """  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('redeem') === 'true') {
      setBookingModalOpen(true);
      toast.success('Your ₹100 discount coupon is active and ready for your next booking!');
      // clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location]);
"""

if "const params = new URLSearchParams" not in content:
    content = content.replace("useEffect(() => {\n    let unsubFav", redeem_effect + "\n  useEffect(() => {\n    let unsubFav")

with open('src/pages/Services.tsx', 'w') as f:
    f.write(content)
