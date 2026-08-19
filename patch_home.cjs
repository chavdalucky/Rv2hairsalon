const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// 1. Update transforms to exactly [1.0, 1.05]
const transformTarget = `  const heroScale = useTransform(scrollY, [0, 1000], [1.05, 1.08]);`;
const transformReplace = `  const heroScale = useTransform(scrollY, [0, 1000], [1.0, 1.05]);`;
content = content.replace(transformTarget, transformReplace);

// 2. Update transition to exactly 0.4s ease-out
const transitionTarget = `            transition: 'transform 0.3s ease-out'`;
const transitionReplace = `            transition: 'transform 0.4s ease-out'`;
content = content.replace(transitionTarget, transitionReplace);

fs.writeFileSync('src/pages/Home.tsx', content);
console.log("Patched Home.tsx successfully");
