import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto('http://localhost:4321/sol?target=neptune', { waitUntil: 'networkidle' });
await page.waitForTimeout(5000);
await page.screenshot({ path: 'C:/Users/ibrah/AppData/Local/Temp/claude/np-hero.png' });
for (const [i, top] of [[1,700],[2,1700],[3,2700],[4,3700]]) {
  await page.evaluate((t) => { const el = document.getElementById('ex-content-overlay'); if(el) el.scrollTop = t; }, top);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `C:/Users/ibrah/AppData/Local/Temp/claude/np-s0${i}.png` });
}
await browser.close();
console.log('done');
