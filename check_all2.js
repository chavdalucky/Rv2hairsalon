import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.toString()));
  
  const urls = [
    '/',
    '/services',
    '/gallery',
    '/about',
    '/contact',
    '/ai-studio',
    '/login',
    '/signup',
    '/dashboard'
  ];

  for (const url of urls) {
    console.log(`Checking ${url}...`);
    await page.goto(`http://localhost:3000${url}`, { waitUntil: 'networkidle2' });
  }
  
  console.log("ERRORS:", errors);
  await browser.close();
})();
