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
    for (const [route, stage, single] of [
      ['fabric-storage', '入库', false],
      ['lining-storage', '入库', false],
      ['sewing-issue', '领料', false],
      ['sewing-storage', '入库', true],
      ['ironing-receiving', '接收', true],
    ]) {
      await page.goto(`http://localhost:16003/#/tablet/${route}`);
      await page.getByLabel('批号筛选').fill('absent');
      await page.getByRole('button', { name: '查询', exact: true }).click();
      await page.getByText(/没有符合条件的/).waitFor();
      await page.getByRole('button', { name: '重置', exact: true }).click();
      await page
        .getByRole('button', { name: '查看', exact: true })
        .nth(1)
        .click();
      const dialog = page.getByRole('dialog', {
        name: `${stage}详情`,
        exact: true,
      });
      await dialog.waitFor();
      await dialog
        .getByRole('heading', { name: single ? '单件明细' : '包票明细' })
        .waitFor();
      const body = dialog.locator('.tablet-modal-body');
      await body.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      const footer = await dialog.locator('.tablet-modal-footer').boundingBox();
      assert.ok(footer.y + footer.height <= page.viewportSize().height);
      await dialog.getByRole('textbox').fill(single ? 'WY-2-001' : 'BT-2-01');
      await dialog.getByRole('button', { name: `登记${stage}` }).click();
      await page.getByText(`${stage}登记成功`, { exact: true }).waitFor();
      await dialog.getByRole('button', { name: '关闭', exact: true }).click();
      assert.match(
        await page.locator('.quantity').nth(1).innerText(),
        single ? /43/ : /62/,
      );
      await page.locator('.t-navbar__left').click();
      await page.locator('.tablet-home').waitFor();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
    }
  }
  assert.deepEqual(errors, []);
  console.log(
    'PASS: five flow variants at 1024/1440, filtering, detail grains, scrolling, registration and return.',
  );
} finally {
  await browser.close();
}
