// Visual verification: renders the live dashboard in headless Edge and checks
// that the charts actually paint (non-zero size, SVG series present).
// Usage: node scripts/verify-charts.mjs [url]
import puppeteer from 'puppeteer-core';

const URL = process.argv[2] || 'http://127.0.0.1:4000/finance-gst-tracker/';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--no-sandbox', '--window-size=1440,2400'],
  defaultViewport: { width: 1440, height: 2400 },
});

try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));

  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60_000 });
  // Analytics can take a few seconds cold — wait for recharts SVGs to appear.
  await page.waitForSelector('.recharts-surface', { timeout: 90_000 }).catch(() => {});

  // Pre-size the viewport to the full document BEFORE settling: a fullPage
  // screenshot resizes the viewport, which makes ResponsiveContainer re-render
  // and re-animate — capturing blank plots. Fixed viewport = stable capture.
  const docHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewport({ width: 1440, height: Math.min(docHeight, 6000) });
  await new Promise((r) => setTimeout(r, 3500)); // let charts re-render + animations finish

  const report = await page.evaluate(() => {
    const surfaces = [...document.querySelectorAll('.recharts-responsive-container')];
    return {
      chartContainers: surfaces.length,
      sizes: surfaces.map((el) => `${el.clientWidth}x${el.clientHeight}`),
      areaPaths: document.querySelectorAll('.recharts-area-area').length,
      linePaths: document.querySelectorAll('.recharts-line-curve').length,
      bars: document.querySelectorAll('.recharts-bar-rectangle').length,
      pieSectors: document.querySelectorAll('.recharts-pie-sector').length,
      kpiValues: [...document.querySelectorAll('p.tabular-nums')].slice(0, 6).map((p) => p.textContent.trim()),
      emptyMessages: [...document.querySelectorAll('section')].filter((s) =>
        s.textContent.includes('No data for the selected filters')).length,
    };
  });

  await page.screenshot({ path: 'scripts/dashboard-verify.png' });

  console.log(JSON.stringify(report, null, 2));
  if (errors.length) console.log('JS ERRORS:', errors.slice(0, 5));
  const visible = report.chartContainers > 0 && report.sizes.every((s) => !s.endsWith('x0'));
  const hasSeries = report.areaPaths + report.bars + report.pieSectors + report.linePaths > 0;
  console.log(visible && hasSeries
    ? '✓ CHARTS RENDER WITH DATA'
    : '✗ CHARTS STILL BROKEN');
} finally {
  await browser.close();
}
