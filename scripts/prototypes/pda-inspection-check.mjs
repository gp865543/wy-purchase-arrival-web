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
  await page.getByRole('link', { name: '巡检执行', exact: true }).click();
  assert.equal(await button('提交巡检').count(), 0);
  const scan = page.getByPlaceholder('请扫描或输入资产编号');
  await scan.fill('未知资产');
  await scan.press('Enter');
  await page.getByRole('alert').waitFor();
  assert.equal(await button('正常').count(), 0);
  await demoAction('模拟扫码');
  await page.getByRole('heading', { name: '电脑平缝机' }).waitFor();
  await button('提交巡检').click();
  await page.getByText('请完成所有检查项判定', { exact: true }).waitFor();
  const items = page.locator('.inspection-item');
  await items.nth(0).getByRole('button', { name: '正常', exact: true }).click();
  await page.getByText('33.3%', { exact: true }).waitFor();
  await items.nth(0).getByRole('button', { name: '正常', exact: true }).click();
  await page.getByText('已判定 0/3', { exact: true }).waitFor();
  assert.equal(
    await items
      .nth(0)
      .getByRole('button', { name: '正常', exact: true })
      .getAttribute('aria-pressed'),
    'false',
  );
  await items.nth(0).getByRole('button', { name: '正常', exact: true }).click();
  await items.nth(1).getByRole('button', { name: '异常', exact: true }).click();
  await page.getByText('66.7%', { exact: true }).waitFor();
  const abnormal = items
    .nth(1)
    .getByRole('button', { name: '异常', exact: true });
  assert.ok(
    await abnormal.evaluate((el) => {
      const [red, green, blue] = getComputedStyle(el)
        .backgroundColor.match(/\d+/g)
        .map(Number);
      return red > green && red > blue;
    }),
  );
  await abnormal.click();
  await page.getByText('已判定 1/3', { exact: true }).waitFor();
  assert.equal(
    await page.getByRole('textbox', { name: '异常原因', exact: true }).count(),
    0,
  );
  await button('提交巡检').click();
  await page.getByText('请完成所有检查项判定', { exact: true }).waitFor();
  await abnormal.click();

  await items.nth(2).getByRole('button', { name: '正常', exact: true }).click();
  await button('提交巡检').click();
  await page.getByText('请填写异常原因', { exact: true }).waitFor();
  await page
    .getByRole('textbox', { name: '异常原因', exact: true })
    .fill('防护罩松动');
  const photo = {
    name: '防护罩.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7V8AAAAASUVORK5CYII=',
      'base64',
    ),
  };
  const photoInput = page.locator('input[type=file]');
  await photoInput.setInputFiles(photo);
  await page.locator('.t-upload__image').waitFor();
  await page.locator('.t-upload__delete-btn').click();
  await page.locator('.t-upload__image').waitFor({ state: 'hidden' });
  await photoInput.setInputFiles(photo);
  await page.locator('.t-upload__image').waitFor();
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 682 });
    await items.last().scrollIntoViewIfNeeded();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    const end = await items.last().boundingBox();
    const footer = await page.locator('.pda-footer').boundingBox();
    assert.ok(end.y + end.height <= footer.y);
    await page.locator('.pda-content').evaluate((el) => {
      el.scrollTop = 0;
    });
    await page.screenshot({ path: `/tmp/pda69-inspection-${width}.png` });
    await page.locator('.t-upload__image').click();
    await page.locator('.t-image-viewer').waitFor();
    const close = page.locator('.t-image-viewer__nav-close');
    const box = await close.boundingBox();
    assert.ok(
      box.x >= 0 &&
        box.x + box.width <= width &&
        box.y >= 0 &&
        box.y + box.height <= 682,
    );
    await close.click();
    await page.locator('.t-image-viewer').waitFor({ state: 'hidden' });
    await page.setViewportSize({ width, height: 420 });
    const input = page.getByRole('textbox', { name: '异常原因', exact: true });
    await input.focus();
    await input.scrollIntoViewIfNeeded();
    const inputBox = await input.boundingBox();
    const submitBox = await button('提交巡检').boundingBox();
    assert.ok(inputBox.y >= 0 && inputBox.y + inputBox.height <= submitBox.y);
    assert.ok(submitBox.y + submitBox.height <= 420);
  }
  await page.setViewportSize({ width: 360, height: 800 });
  await button('提交巡检').evaluate((el) => {
    el.click();
    el.click();
  });
  assert.ok(await button('提交巡检').isDisabled());
  assert.ok(
    await page
      .getByRole('textbox', { name: '异常原因', exact: true })
      .isDisabled(),
  );
  assert.equal(await items.locator('button:enabled').count(), 0);
  assert.equal(await page.locator('.t-upload__delete-btn').count(), 0);
  await page.getByText('巡检已提交', { exact: true }).waitFor();
  await page.getByText('防护罩松动', { exact: true }).waitFor();
  assert.equal(await button('正常').count(), 0);
  assert.equal(await page.getByRole('textbox').count(), 0);
  await page.locator('.t-upload__image').click();
  await page.locator('.t-image-viewer').waitFor();
  await page.locator('.t-image-viewer__nav-close').click();
  await page.locator('.t-image-viewer').waitFor({ state: 'hidden' });
  await demoAction('首页');
  await page.getByRole('link', { name: '巡检执行', exact: true }).click();
  await page.getByText('巡检已提交', { exact: true }).waitFor();
  await demoAction('重置演示');
  await scan.waitFor();
  assert.equal(await button('提交巡检').count(), 0);
  await scan.fill(' ZC-0001 ');
  await scan.press('Enter');
  await page.getByRole('heading', { name: '电脑平缝机' }).waitFor();
  for (const item of await items.all())
    await item.getByRole('button', { name: '正常', exact: true }).click();
  await button('提交巡检').click();
  await demoAction('重置演示');
  await scan.waitFor();
  await page.waitForTimeout(600);
  assert.equal(await button('提交巡检').count(), 0);
  await demoAction('模拟扫码');
  await items
    .first()
    .getByRole('button', { name: '异常', exact: true })
    .click();
  await page.reload();
  await scan.waitFor();
  assert.equal(await button('正常').count(), 0);
  assert.deepEqual(errors, []);
  assert.deepEqual(uploads, []);
  console.log(
    'PASS inspection scan, judgments, photos, lock, readonly, reset and viewport checks',
  );
} finally {
  await browser.close();
}
