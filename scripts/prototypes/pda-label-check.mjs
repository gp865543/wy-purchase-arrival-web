import assert from 'node:assert/strict';

import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 360, height: 682 } });
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const button = (name) => page.getByRole('button', { name, exact: true });
  async function demo(name) {
    await button('演示工具').click();
    await page
      .getByRole('navigation', { name: '演示菜单' })
      .getByText(name, { exact: true })
      .click();
  }
  await page.goto('http://localhost:16003/#/home');
  await page.getByRole('link', { name: '库提衣票', exact: true }).click();
  await page.getByRole('heading', { name: '库提衣票批量预览' }).waitFor();
  assert.equal(await page.locator('.garment-label').count(), 3);
  await button('确认并打印').click();
  await page.getByText('处理中', { exact: true }).first().waitFor();
  assert.ok(await button('处理中').isDisabled());
  await page.getByText('1 / 3 张', { exact: true }).waitFor();
  await page.getByText('处理成功', { exact: true }).waitFor();
  await demo('首页');
  await page.getByRole('link', { name: '库提衣票', exact: true }).click();
  await page.getByText('处理成功', { exact: true }).waitFor();
  await demo('单张补打');
  await page.getByRole('heading', { name: '单张补打' }).waitFor();
  assert.equal(await page.locator('.garment-label').count(), 1);
  assert.ok(await button('确认补打').isDisabled());
  const reason = page.getByRole('textbox', { name: '补打原因' });
  await reason.fill('标签破损');
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 420 });
    await reason.focus();
    await reason.scrollIntoViewIfNeeded();
    const input = await reason.boundingBox();
    const footer = await page.locator('.pda-footer').boundingBox();
    assert.ok(input.y >= 0 && input.y + input.height <= footer.y);
    assert.ok(footer.y + footer.height <= 420);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    const label = await page.locator('.garment-label').boundingBox();
    assert.ok(Math.abs(label.width / label.height - 35 / 85) < 0.001);
  }
  await page.setViewportSize({ width: 360, height: 682 });
  await demo('模拟失败');
  await button('确认补打').click();
  assert.ok(await reason.isDisabled());
  await page.getByText('处理失败', { exact: true }).waitFor();
  assert.equal(await reason.inputValue(), '标签破损');
  await demo('重置演示');
  assert.equal(await reason.inputValue(), '');
  await reason.fill('标签丢失');
  await button('确认补打').click();
  await page.getByText('处理成功', { exact: true }).waitFor();
  await demo('库提衣票');
  await page.getByText('处理成功', { exact: true }).waitFor();
  await demo('重置演示');
  await button('确认并打印').click();
  await demo('重置演示');
  await page.waitForTimeout(1800);
  await page.getByText('待确认', { exact: true }).waitFor();
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 682 });
    await page.locator('.garment-label').last().scrollIntoViewIfNeeded();
    assert.ok(
      await page
        .locator('.pda-content')
        .evaluate((el) => el.scrollHeight > el.clientHeight),
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
  }
  await page.screenshot({ path: '/tmp/pda71-labels.png' });
  await page.reload();
  await page.getByText('待确认', { exact: true }).waitFor();
  await demo('单张补打');
  assert.equal(await reason.inputValue(), '');
  assert.deepEqual(errors, []);
  console.log(
    'PASS: labels, reason, progress/success/failure, reset, retention and narrow layouts.',
  );
} finally {
  await browser.close();
}
