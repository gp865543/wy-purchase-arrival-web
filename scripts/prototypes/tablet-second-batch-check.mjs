import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';

import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1024, height: 768 },
  });
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const button = (name) => page.getByRole('button', { name, exact: true });
  async function go(name) {
    await page.goto(`http://localhost:16003/#/tablet/${name}`);
    await page
      .locator(name === 'home' ? '.tablet-home' : '.tablet-header')
      .waitFor();
  }
  async function demo(name) {
    await button('预览工具').click();
    await page
      .getByRole('navigation', { name: '预览菜单' })
      .getByText(name, { exact: true })
      .click();
  }
  async function checkPlan() {
    await go('home');
    await page
      .locator('.tablet-home')
      .getByRole('link', { name: '生产计划', exact: true })
      .click();
    await page.getByLabel('编号筛选').fill('absent');
    await page.getByText('没有符合条件的生产计划').waitFor();
    await button('重置').click();
    assert.equal(await page.locator('.plan-query-table th').count(), 9);
    await page.getByLabel('编号筛选').fill('GY-202609-026');
    await button('查看').click();
    await page.getByText('单品', { exact: true }).click();
    await page.getByRole('columnheader', { name: '单品编码' }).waitFor();
    await page.getByText('物料', { exact: true }).click();
    await button('细分规格').first().click();
    await page.getByRole('dialog', { name: '物料细分规格' }).waitFor();
    await button('关闭').click();
    await page.getByText('号型', { exact: true }).click();
    await page.locator('summary').first().click();
    assert.equal(
      await page.locator('details').first().getAttribute('open'),
      null,
    );
    await page.locator('.t-navbar__left').click();
    assert.equal(
      await page.getByLabel('编号筛选').inputValue(),
      'GY-202609-026',
    );
  }
  async function checkAndon() {
    await go('andon');
    assert.ok(await button('提交提报').isDisabled());
    await button('设备故障').click();
    await page.getByLabel('问题描述').fill('平缝机断线，需要维修人员检查。');
    await page.locator('input[type=file]').setInputFiles({
      name: '现场.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlS8AAAAASUVORK5CYII=',
        'base64',
      ),
    });
    await page.getByRole('img', { name: '现场照片' }).waitFor();
    await button('预览现场照片').click();
    await page.getByRole('dialog', { name: '现场照片' }).waitFor();
    await button('关闭').click();
    await button('移除照片').click();
    assert.equal(await page.getByRole('img', { name: '现场照片' }).count(), 0);
    await demo('模拟加载失败');
    await button('提交提报').click();
    await page.getByText('提交失败，请重试', { exact: true }).waitFor();
    await button('提交提报').click();
    await page.getByRole('heading', { name: 'Andon 问题已提交' }).waitFor();
    await button('继续提报').click();
    assert.equal(await page.getByLabel('问题描述').inputValue(), '');
  }
  async function checkTickets() {
    await go('tickets');
    await page.getByLabel('包票编号筛选').fill('absent');
    await page.getByText('没有符合条件的裁剪包票').waitFor();
    await button('重置').click();
    await button('作废').first().click();
    await button('取消').click();
    assert.ok(await button('打印').first().isEnabled());
    await button('作废').first().click();
    await button('确认').click();
    assert.ok(await button('打印').first().isDisabled());
    await button('启用').first().click();
    await button('确认').click();
    assert.ok(await button('打印').first().isEnabled());
    await button('打印').first().click();
    await page
      .getByRole('dialog', { name: '票据预览' })
      .getByRole('button', { name: '打印', exact: true })
      .click();
    await page.getByText('票据已进入打印预览', { exact: true }).waitFor();
    await button('关闭').click();
    await demo('标签预览');
    await page.locator('.garment-label').waitFor();
    await button('关闭').click();
  }
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: width === 1024 ? 768 : 900 });
    for (const name of [
      'home',
      'plans',
      'cartons',
      'tickets',
      'andon',
      'semi-qc',
      'final-qc',
    ]) {
      await go(name);
      await page.locator('.tablet-main').waitFor();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${name} overflows ${width}`,
      );
      await page.screenshot({ path: `/tmp/tablet78-${name}-${width}.png` });
      if (name === 'plans') await checkPlan();
      if (name === 'andon') await checkAndon();
      if (name === 'tickets') await checkTickets();
    }
  }
  await page.setViewportSize({ width: 1024, height: 768 });
  await go('cartons');
  await button('查看装箱单').first().click();
  await page.getByRole('dialog', { name: '装箱单预览' }).waitFor();
  await button('下一页').click();
  await page.getByText('共 10 件 · 第 2 / 2 页', { exact: true }).waitFor();
  await page.screenshot({ path: '/tmp/tablet78-carton-preview.png' });
  await button('关闭').click();
  await button('切换记录表').click();
  await button('移出').first().click();
  await button('确认移出').click();
  assert.equal(await page.locator('.table-panel tbody tr').count(), 29);
  await button('切换看板').click();
  assert.match(
    await page.locator('.receiving-card').first().innerText(),
    /已装 9/,
  );
  await go('semi-qc');
  await button('查看检验').click();
  await button('合格').nth(0).click();
  await button('合格').nth(1).click();
  await page.getByLabel('返修数量').fill('1');
  assert.ok(await button('提交批量质检').isDisabled());
  await page.getByLabel('合格数量').fill('19');
  await button('提交批量质检').click();
  await button('确认提交').click();
  await button('切换记录表').click();
  await button('查看记录').last().click();
  assert.equal(await button('提交批量质检').count(), 0);
  await button('关闭').click();
  await go('final-qc');
  await button('查看检验').click();
  await page.getByLabel('业务时间').fill('2026-09-09T16:00');
  await button('查询').click();
  await page.getByText('当前业务时间没有质检记录').waitFor();
  await page.getByLabel('业务时间').fill('2026-09-10T16:00');
  await button('查询').click();
  await button('作废').click();
  await button('确认作废').click();
  await page.getByText('已作废', { exact: true }).waitFor();
  await page.screenshot({ path: '/tmp/tablet78-final-qc-popup.png' });
  assert.deepEqual(errors, []);
  console.log(
    'PASS: second batch 1024/1440 layouts, plan return, carton pagination/removal, ticket invalidation/label, Andon photo/submit/reset, QC quantities/read-only/history/invalidation.',
  );
} finally {
  await browser.close();
}
