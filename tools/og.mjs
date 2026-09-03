// Renders tools/og.html to assets/og.png at 1200x630.
// Usage: npx serve . (or any static server on :8731), then `node tools/og.mjs`.
import { createRequire } from 'module';
const require = createRequire('/private/tmp/');
const puppeteer = require('puppeteer');

const ORIGIN = process.env.ORIGIN || 'http://localhost:8731';
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.goto(ORIGIN + '/tools/og.html', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 1200));
await page.screenshot({ path: 'assets/og.png' });
await browser.close();
console.log('wrote assets/og.png');
