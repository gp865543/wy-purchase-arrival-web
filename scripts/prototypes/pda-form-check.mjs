import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';

import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
  page.setDefaultTimeout(5000);
  const errors = [];
  const uploads = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (request.method() !== 'GET') uploads.push(request.url());
  });
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
  async function layout(name, input, submit) {
    for (const width of [320, 360, 390]) {
      await page.setViewportSize({ width, height: 682 });
      await input.scrollIntoViewIfNeeded();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.locator('.pda-content').evaluate((el) => {
        el.scrollTop = 0;
      });
      await page.screenshot({ path: `/tmp/pda68-${name}-${width}.png` });
      if (name === 'transfer') {
        await page
          .getByRole('button', { name: '调入部门', exact: true })
          .click();
        const picker = await page.locator('.t-picker').boundingBox();
        assert.ok(picker.x >= 0 && picker.x + picker.width <= width);
        await page
          .locator('.t-picker')
          .getByText('取消', { exact: true })
          .click();
        await page.locator('.t-picker').waitFor({ state: 'hidden' });
      }
      if (name === 'andon') {
        await page.locator('.t-upload__image').click();
        await page.locator('.t-image-viewer').waitFor();
        const close = page.locator('.t-image-viewer__nav-close');
        const bounds = await close.boundingBox();
        assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width);
        assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= 682);
        await close.click();
        await page.locator('.t-image-viewer').waitFor({ state: 'hidden' });
      }
      await page.setViewportSize({ width, height: 420 });
      await input.focus();
      await input.scrollIntoViewIfNeeded();
      const box = await input.boundingBox();
      assert.ok(box.y >= 0 && box.y + box.height <= 420);
      const footer = await submit.boundingBox();
      assert.ok(footer.y >= 0 && footer.y + footer.height <= 420);
    }
    await page.setViewportSize({ width: 360, height: 800 });
  }
  await page.goto('http://localhost:16003/#/prototype/pda/transaction');
  const button = (name) => page.getByRole('button', { name, exact: true });
  await button('提交申请').click();
  await page.getByRole('alert').waitFor();
  await page
    .getByRole('textbox', { name: '调拨原因', exact: true })
    .fill('生产线调整');
  await button('报废').click();
  assert.equal(await page.getByRole('alert').count(), 0);
  await page
    .getByRole('textbox', { name: '报废原因', exact: true })
    .fill('设备老化');
  await button('调拨').click();
  assert.equal(
    await page
      .getByRole('textbox', { name: '调拨原因', exact: true })
      .inputValue(),
    '生产线调整',
  );
  for (const name of ['调入部门', '调入地点']) {
    await button(name).click();
    await page.locator('.t-picker').getByText('取消', { exact: true }).click();
    assert.match(await button(name).textContent(), /请选择/);
    await button(name).click();
    await page.locator('.t-picker').getByText('确定', { exact: true }).click();
    assert.doesNotMatch(await button(name).textContent(), /请选择/);
  }
  await button('调入部门').click();
  await page.locator('.t-picker').getByText('取消', { exact: true }).click();
  assert.match(await button('调入部门').textContent(), /缝制二组/);
  await page.getByLabel('调拨日期', { exact: true }).fill('');
  await button('提交申请').click();
  await page.getByRole('alert').waitFor();
  await page.getByLabel('调拨日期', { exact: true }).fill('2026-09-10');
  await layout(
    'transfer',
    page.getByRole('textbox', { name: '调拨原因', exact: true }),
    button('提交申请'),
  );
  await button('提交申请').click();
  await page.getByRole('heading', { name: '申请已提交' }).waitFor();
  await page.getByText('生产线调整', { exact: true }).waitFor();
  assert.equal(await page.getByText('设备老化', { exact: true }).count(), 0);
  console.log(
    'PASS transaction conditional fields, drafts, picker and receipt',
  );
  await demoAction('首页');
  await page.getByRole('link', { name: '资产事务', exact: true }).click();
  await page.getByRole('heading', { name: '申请已提交' }).waitFor();
  await demoAction('重置演示');
  await button('报废').click();
  await button('提交申请').click();
  await page.getByRole('alert').waitFor();
  await button('报废类型').click();
  await page.locator('.t-picker').getByText('确定', { exact: true }).click();
  await page
    .getByRole('textbox', { name: '报废原因', exact: true })
    .fill('设备老化');
  await layout(
    'scrap',
    page.getByRole('textbox', { name: '报废原因', exact: true }),
    button('提交申请'),
  );
  await button('提交申请').click();
  await page.getByRole('heading', { name: '申请已提交' }).waitFor();
  await page.getByText('设备老化', { exact: true }).waitFor();
  assert.equal(await page.getByText('调入部门', { exact: true }).count(), 0);
  await page.reload();
  await button('提交申请').waitFor();
  assert.equal(
    await page
      .getByRole('textbox', { name: '调拨原因', exact: true })
      .inputValue(),
    '',
  );
  await demoAction('首页');
  await page.getByRole('link', { name: 'Andon 提报', exact: true }).click();
  await button('提交提报').click();
  await page.getByRole('alert').waitFor();
  await page
    .getByRole('textbox', { name: '异常描述', exact: true })
    .fill('平缝机断针，等待维修');
  const photo = {
    name: '现场.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7V8AAAAASUVORK5CYII=',
      'base64',
    ),
  };
  await page.locator('input[type=file]').setInputFiles(photo);
  await page.locator('.t-upload__image').click();
  await page.locator('.t-image-viewer').waitFor();
  await page.locator('.t-image-viewer__nav-close').click();
  await page.locator('.t-image-viewer').waitFor({ state: 'hidden' });
  await page.locator('.t-upload__delete-btn').click();
  await page.locator('.t-upload__image').waitFor({ state: 'hidden' });
  await page.locator('input[type=file]').setInputFiles(photo);
  await page.locator('.t-upload__image').waitFor();
  assert.equal(await page.locator('.t-upload__image').count(), 1);
  await page.getByText('紧急', { exact: true }).click();
  await layout(
    'andon',
    page.getByRole('textbox', { name: '异常描述', exact: true }),
    button('提交提报'),
  );
  await button('提交提报').click();
  await page.getByRole('heading', { name: '提报已提交' }).waitFor();
  await page.getByText('平缝机断针，等待维修', { exact: true }).waitFor();
  await demoAction('首页');
  await page.getByRole('link', { name: 'Andon 提报', exact: true }).click();
  await page.getByRole('heading', { name: '提报已提交' }).waitFor();
  assert.equal(await page.locator('.t-upload__delete-btn').count(), 0);
  await page.locator('.t-upload__image').click();
  await page.locator('.t-image-viewer').waitFor();
  await page.locator('.t-image-viewer__nav-close').click();
  await page.locator('.t-image-viewer').waitFor({ state: 'hidden' });
  await demoAction('重置演示');
  await page.locator('.t-upload__image').waitFor({ state: 'hidden' });
  assert.equal(
    await page
      .getByRole('textbox', { name: '异常描述', exact: true })
      .inputValue(),
    '',
  );
  await page
    .getByRole('textbox', { name: '异常描述', exact: true })
    .fill('刷新前草稿');
  await page.reload();
  assert.equal(
    await page
      .getByRole('textbox', { name: '异常描述', exact: true })
      .inputValue(),
    '',
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(uploads, []);
  console.log(
    'PASS Andon photo add, preview, delete, receipt, reset and viewport checks',
  );
} finally {
  await browser.close();
}
