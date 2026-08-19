import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('ERROR:', msg.text());
  });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:3000/ai-studio', { waitUntil: 'networkidle2' });
  
  await page.type('input[type="text"]', 'Hello');
  // Click the send button (it's the only button inside the input container)
  await page.click('button.bg-amber-500');
  
  await new Promise(r => setTimeout(r, 4000));
  
  console.log("Done checking chat.");
  await browser.close();
})();
