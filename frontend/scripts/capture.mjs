import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto('http://127.0.0.1:5173');
  await page.locator('.hero').waitFor();
  await page.screenshot({ path: '../docs/dashboard.png', fullPage: true, animations: 'disabled' });
  await page.goto('http://127.0.0.1:5173/#history');
  await page.getByRole('button', { name: 'Chi tiết', exact: true }).first().click();
  await page.getByRole('button', { name: 'Xem cách suy luận', exact: true }).click();
  await page.getByRole('button', { name: 'Working Memory', exact: true }).click();
  await page.screenshot({ path: '../docs/inference.png', fullPage: true, animations: 'disabled' });
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto('http://127.0.0.1:5173');
  await mobile.locator('.hero').waitFor();
  await mobile.screenshot({ path: '../docs/mobile.png', fullPage: true, animations: 'disabled' });
  console.log('Saved dashboard, inference and mobile screenshots.');
} finally {
  await browser.close();
}
