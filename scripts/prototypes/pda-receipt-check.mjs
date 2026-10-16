import assert from 'node:assert/strict';

import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://localhost:16003/#/home');
  await page.getByRole('link', { name: '收货确认', exact: true }).click();
  const button = page.locator('details').filter({ hasText: '树脂四眼纽扣' });
  const fabric = page.locator('details').filter({ hasText: '涤棉斜纹面料' });
  await button.locator('summary').click();
  await fabric.locator('summary').click();
  const input = button.getByRole('spinbutton');
  const confirm = button.getByRole('button', { name: '确认收货', exact: true });
  assert.ok(await confirm.isDisabled());
  for (const value of ['0', '-1', '11', '1.5']) {
    await input.fill(value);
    await confirm.click();
    await button.getByRole('alert').waitFor();
    await button.getByText('已收 0 粒', { exact: true }).waitFor();
  }
  await input.fill('4');
  await confirm.evaluate((el) => {
    el.click();
    el.click();
  });
  assert.ok(await confirm.isDisabled());
  assert.ok(await input.isDisabled());
  await button.getByText('已收 4 粒', { exact: true }).waitFor();
  await button.getByText('剩余 6 粒', { exact: true }).waitFor();
  assert.equal(await input.inputValue(), '');
  await page.getByText('完成进度 0/2', { exact: true }).waitFor();
  await input.fill('6');
  await confirm.click();
  await page.getByText('完成进度 1/2', { exact: true }).waitFor();
  assert.equal(await input.count(), 0);
  const meters = fabric.getByRole('spinbutton');
  const receiveFabric = fabric.getByRole('button', {
    name: '确认收货',
    exact: true,
  });
  for (const value of ['0.31', '0.4']) {
    await meters.fill(value);
    await receiveFabric.click();
    await fabric.getByRole('alert').waitFor();
    await fabric.getByText('已收 0.0 米', { exact: true }).waitFor();
  }
  await meters.fill('0.1');
  await receiveFabric.click();
  await fabric.getByText('剩余 0.2 米', { exact: true }).waitFor();
  await meters.fill('0.2');
  await fabric.getByRole('button', { name: '确认收货', exact: true }).click();
  await page.getByText('完成进度 2/2', { exact: true }).waitFor();
  assert.equal(await page.getByRole('spinbutton').count(), 0);
  async function demoAction(name) {
    await page.getByRole('button', { name: '演示工具', exact: true }).click();
    await page
      .getByRole('navigation', { name: '演示菜单' })
      .getByText(name, { exact: true })
      .click();
    await page
      .getByRole('navigation', { name: '演示菜单' })
      .waitFor({ state: 'hidden' });
  }
  await demoAction('首页');
  await page.getByRole('link', { name: '收货确认', exact: true }).click();
  await page.getByText('完成进度 2/2', { exact: true }).waitFor();
  await fabric.getByText('已收 0.3 米', { exact: true }).waitFor();
  await demoAction('重置演示');
  await page.getByText('完成进度 0/2', { exact: true }).waitFor();
  await button.locator('summary').click();
  await fabric.locator('summary').click();
  assert.equal(await input.inputValue(), '');
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 682 });
    await receiveFabric.scrollIntoViewIfNeeded();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    const end = await receiveFabric.boundingBox();
    assert.ok(end.y >= 0 && end.y + end.height <= 682);
    await page.locator('.pda-content').evaluate((el) => {
      el.scrollTop = 0;
    });
    await page.screenshot({ path: `/tmp/pda67-receipt-${width}.png` });
    await page.setViewportSize({ width, height: 420 });
    await meters.focus();
    await meters.scrollIntoViewIfNeeded();
    const box = await meters.boundingBox();
    assert.ok(box.y >= 0 && box.y + box.height <= 420);
    await receiveFabric.scrollIntoViewIfNeeded();
    const action = await receiveFabric.boundingBox();
    assert.ok(action.y >= 0 && action.y + action.height <= 420);
  }
  await input.fill('4');
  await confirm.click();
  await button.getByText('已收 4 粒', { exact: true }).waitFor();
  await page.reload();
  await page.getByText('完成进度 0/2', { exact: true }).waitFor();
  await button.locator('summary').click();
  await button.getByText('已收 0 粒', { exact: true }).waitFor();
  await page.locator('.t-navbar__left').click();
  await page.getByRole('link', { name: '收货确认', exact: true }).waitFor();
  await page.goto('http://localhost:16003/#/prototype/pda/receipt');
  await page.getByText('完成进度 0/2', { exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS receipt partial quantities and completed rows');
} finally {
  await browser.close();
}
