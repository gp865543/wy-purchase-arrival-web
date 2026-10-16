import assert from 'node:assert/strict';

import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: width === 1024 ? 768 : 900 });
    await page.goto('http://localhost:16003/#/home');
    await page.getByRole('button', { name: '预览工具', exact: true }).click();
    await page.getByRole('link', { name: '平板首页', exact: true }).click();
    await page.locator('.tablet-home').waitFor();
    assert.equal(await page.locator('.tablet-header').count(), 0);
    await page.waitForFunction(() => {
      const image = document.querySelector('.tablet-home-watermark');
      return image?.complete && image.naturalWidth > 0;
    });
    const layout = await page.locator('.tablet-home-grid').evaluate((el) => ({
      columns: getComputedStyle(el).gridTemplateColumns.split(' ').length,
      icon: el.querySelector('.tablet-home-icon').getBoundingClientRect().width,
      watermarkOpacity: getComputedStyle(
        document.querySelector('.tablet-home-watermark'),
      ).opacity,
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    assert.deepEqual(layout, {
      columns: 5,
      icon: 64,
      watermarkOpacity: '0.07',
      overflow: false,
    });
    const links = await page.locator('.tablet-home a').evaluateAll((els) =>
      els.map((el) => ({
        name: el.querySelector('strong').textContent.trim(),
        href: el.getAttribute('href'),
      })),
    );
    assert.deepEqual(
      links.map((link) => link.name).toSorted(),
      [
        '面料收料',
        '里料收料',
        '面料入库',
        '里料入库',
        '缝制领料',
        '缝制入库',
        '整烫接收',
        '半成品质检',
        '成品质检',
        '包装贴签',
        '装箱',
        '生产计划',
        '生产任务查看',
        '工序质检',
        'Andon 提报',
        '裁剪包票',
      ].toSorted(),
    );
    for (const link of links) {
      await page
        .locator('.tablet-home')
        .getByRole('link', { name: link.name, exact: true })
        .click();
      await page.waitForURL(`**/${link.href}`);
      await page.locator('.tablet-main > *').first().waitFor();
      await page.locator('.t-navbar__left').click();
      await page.locator('.tablet-home').waitFor();
    }
    await page.screenshot({ path: `/tmp/tablet80-home-${width}.png` });
    await page.getByRole('button', { name: '预览工具', exact: true }).click();
    await page.getByRole('link', { name: 'PDA 首页', exact: true }).click();
    await page.locator('.home-directory').waitFor();
  }
  assert.deepEqual(errors, []);
  console.log(
    'PASS: tablet home layout, all available entries, back navigation and PDA round trip at 1024/1440.',
  );
} finally {
  await browser.close();
}
