import assert from 'node:assert/strict';

import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const button = (name) => page.getByRole('button', { name, exact: true });
  async function demoAction(name) {
    await button('演示工具').click();
    await page
      .getByRole('navigation', { name: '演示菜单' })
      .getByText(name, { exact: true })
      .click();
    await page
      .getByRole('navigation', { name: '演示菜单' })
      .waitFor({ state: 'hidden' });
  }
  await page.goto('http://localhost:16003/#/home');
  await page.getByRole('link', { name: '资产查询', exact: true }).click();
  await page.getByPlaceholder('请扫描二维码或直接输入设备编号').waitFor();
  assert.equal(await page.locator('.asset-query .t-empty').count(), 0);
  assert.equal(await button('查询').count(), 0);
  const input = page.getByPlaceholder('请扫描二维码或直接输入设备编号');
  await input.fill(' ZC-0001 ');
  await input.press('Enter');
  await page.getByRole('heading', { name: '电脑平缝机' }).waitFor();
  await button('资产履历').click();
  await page.getByText('完成年度保养，更换机油并校准针距').waitFor();
  await button('资产履历').click();
  await page
    .getByText('完成年度保养，更换机油并校准针距')
    .waitFor({ state: 'hidden' });
  await input.fill('不存在');
  await input.press('Enter');
  await page.getByText('未找到资产，请核对编号后重试').waitFor();
  assert.equal(
    await page.getByRole('heading', { name: '电脑平缝机' }).count(),
    0,
  );
  assert.equal(await button('资产履历').count(), 0);
  await input.fill('');
  await input.press('Enter');
  await page.getByPlaceholder('请扫描二维码或直接输入设备编号').waitFor();
  assert.equal(await page.locator('.asset-query .t-empty').count(), 0);
  console.log('PASS asset manual lookup, history and missing result');
  await demoAction('模拟扫码');
  await page.getByRole('heading', { name: '电脑平缝机' }).waitFor();
  assert.equal(await input.inputValue(), 'ZC-0001');
  await button('资产履历').click();
  await demoAction('首页');
  await page.getByRole('link', { name: '资产查询', exact: true }).click();
  await page.getByText('完成年度保养，更换机油并校准针距').waitFor();
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 682 });
    const content = page.locator('.pda-content');
    const header = await page.locator('.t-navbar').boundingBox();
    assert.ok(
      await content.evaluate((el) => el.scrollHeight > el.clientHeight),
    );
    await page
      .getByText('设备试运行合格，附件与说明书齐全，投入工作服生产线使用')
      .scrollIntoViewIfNeeded();
    const end = await page
      .getByText('设备试运行合格，附件与说明书齐全，投入工作服生产线使用')
      .boundingBox();
    assert.ok(end.y >= 0 && end.y + end.height <= 682);
    const headerAfter = await page.locator('.t-navbar').boundingBox();
    assert.equal(headerAfter.y, header.y);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await content.evaluate((el) => {
      el.scrollTop = 0;
    });
    await page.screenshot({ path: `/tmp/pda65-asset-${width}.png` });
    await page.setViewportSize({ width, height: 420 });
    await input.focus();
    await input.press('Enter');
    await page.getByRole('heading', { name: '电脑平缝机' }).waitFor();
    const queryBox = await input.boundingBox();
    assert.ok(queryBox.y >= 0 && queryBox.y + queryBox.height <= 420);
    await button('资产履历').click();
  }
  await demoAction('重置演示');
  assert.equal(await input.inputValue(), '');
  await page.getByPlaceholder('请扫描二维码或直接输入设备编号').waitFor();
  assert.equal(await page.locator('.asset-query .t-empty').count(), 0);
  await demoAction('模拟扫码');
  await page.reload();
  await page.getByPlaceholder('请扫描二维码或直接输入设备编号').waitFor();
  assert.equal(await page.locator('.asset-query .t-empty').count(), 0);
  assert.equal(await input.inputValue(), '');
  await page.goto('http://localhost:16003/#/home');
  await page.goto('http://localhost:16003/#/prototype/pda/asset');
  await page.getByPlaceholder('请扫描二维码或直接输入设备编号').waitFor();
  assert.equal(await page.locator('.asset-query .t-empty').count(), 0);
  await page.locator('.t-navbar__left').click();
  await page.getByRole('link', { name: '资产查询', exact: true }).waitFor();
  console.log(
    'PASS simulated scan, navigation state, reset, refresh and three viewport widths',
  );
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
