import assert from 'node:assert/strict';

import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(5000);
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: width === 1024 ? 768 : 900 });
    const button = (name) => page.getByRole('button', { name, exact: true });
    await page.goto('http://localhost:16003/#/tablet/packaging');
    await page.getByLabel('包装对象筛选').fill('WY202609100001');
    await button('查看明细').click();
    await page.getByRole('dialog', { name: '单件明细' }).waitFor();
    await button('关闭').click();
    await button('切换记录表').click();
    assert.equal(
      await page.getByLabel('包装对象筛选').inputValue(),
      'WY202609100001',
    );
    await button('标签预览').click();
    await page
      .locator('.garment-label')
      .getByText('WY202609100001', { exact: true })
      .waitFor();
    await button('打印').click();
    await page.getByText('标签已进入打印预览', { exact: true }).waitFor();
    await button('关闭').click();
    await page.getByLabel('包装对象筛选').fill('absent');
    await page.getByText('没有符合条件的包装记录').waitFor();
    await button('重置').click();
    assert.equal(await page.locator('.table-panel tbody tr').count(), 20);
    await page.goto('http://localhost:16003/#/tablet/cartons');
    await button('查看装箱单').first().click();
    assert.ok(await button('上一页').isDisabled());
    await button('下一页').click();
    assert.ok(await button('下一页').isDisabled());
    await page.getByText('共 10 件 · 第 2 / 2 页', { exact: true }).waitFor();
    await button('关闭').click();
    await button('切换记录表').click();
    await button('移出').first().click();
    await button('取消').click();
    assert.equal(await page.locator('.table-panel tbody tr').count(), 30);
    await button('移出').first().click();
    await button('确认移出').click();
    await button('切换看板').click();
    await button('查看装箱单').first().click();
    await page.getByText('共 9 件 · 第 1 / 2 页', { exact: true }).waitFor();
    const footer = await page
      .getByRole('dialog', { name: '装箱单预览' })
      .locator('footer')
      .boundingBox();
    assert.ok(footer.y + footer.height <= page.viewportSize().height);
  }
  console.log(
    'PASS: packaging detail/label/filter and carton cancellation, removal and pagination at 1024/1440.',
  );
} finally {
  await browser.close();
}
