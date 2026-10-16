import assert from 'node:assert/strict';

import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1024, height: 768 },
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const button = (name) => page.getByRole('button', { name, exact: true });
  async function demo(name) {
    await button('预览工具').click();
    await page
      .getByRole('navigation', { name: '预览菜单' })
      .getByText(name, { exact: true })
      .click();
  }
  async function checkTasks() {
    await page.goto('http://localhost:16003/#/tablet/tasks');
    await button('待开工 4').click();
    await page
      .locator('.task-detail h2')
      .filter({ hasText: 'ZX-202609-027' })
      .waitFor();
    await button('查看详情').first().click();
    await page.getByRole('dialog', { name: '工序详情' }).waitFor();
    await page
      .getByRole('dialog', { name: '工序详情' })
      .getByText('标准工时', { exact: true })
      .waitFor();
    await button('关闭').click();
    await button('刷新').click();
    await page.getByText('工序进度已刷新', { exact: true }).waitFor();
    assert.match(
      await page.locator('.task-detail > header h2').innerText(),
      /ZX-202609-027/,
    );
    await button('全部 12').click();
    await page.locator('.task-list').evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    assert.ok(
      await page.locator('.task-list').evaluate((el) => el.scrollTop > 0),
    );
    await page.locator('.process-list').evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    assert.ok(
      await page.locator('.process-list').evaluate((el) => el.scrollTop > 0),
    );
    await demo('模拟无数据／无方案');
    await page.getByText('当前状态没有生产任务').waitFor();
    await demo('模拟扫码／恢复数据');
    await page.locator('.task-detail').waitFor();
  }
  async function checkInspection() {
    await page.goto('http://localhost:16003/#/tablet/inspection');
    await demo('模拟扫码／恢复数据');
    assert.ok(await button('提交质检').isDisabled());
    await demo('模拟加载失败');
    await button('重新加载').click();
    await page.getByText('合格', { exact: true }).click();
    await page.getByLabel('明线宽度', { exact: true }).fill('7');
    await page.getByLabel('缝迹密度', { exact: true }).selectOption('12–14 针');
    await page.getByLabel('整烫与手感', { exact: true }).fill('正常');
    await page.getByLabel('返修数量', { exact: true }).fill('1');
    assert.ok(await button('提交质检').isDisabled());
    await page.getByLabel('返修数量', { exact: true }).fill('0');
    await button('提交质检').click();
    await button('继续检查').click();
    assert.equal(
      await page.getByLabel('明线宽度', { exact: true }).inputValue(),
      '7',
    );
    await button('提交质检').click();
    await button('确认提交').click();
    await page.getByText('质检结果已提交', { exact: true }).waitFor();
    await button('继续扫码').click();
    await page.getByText('请扫码质检', { exact: true }).waitFor();
    for (const name of ['模拟加载失败', '模拟无数据／无方案', '模拟不可执行']) {
      await demo(name);
      assert.equal(await button('提交质检').count(), 0);
    }
  }
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: width === 1024 ? 768 : 900 });
    for (const route of [
      'receiving',
      'lining-receiving',
      'tasks',
      'inspection',
    ]) {
      await page.goto(`http://localhost:16003/#/tablet/${route}`);
      await page.locator('.tablet-header .t-navbar__center-title').waitFor();
      if (route === 'inspection') {
        await demo('模拟扫码／恢复数据');
        await page
          .getByRole('navigation', { name: '预览菜单' })
          .waitFor({ state: 'hidden' });
        assert.ok(
          await page
            .locator('.t-radio__title')
            .first()
            .evaluate((el) => el.clientHeight <= 30),
        );
      }
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${route} overflow at ${width}`,
      );
      if (route.includes('receiving')) {
        await button('查看').nth(1).click();
        const dialog = page.getByRole('dialog', { name: '收料详情' });
        await dialog.waitFor();
        await dialog.locator('.tablet-modal-body').evaluate((el) => {
          el.scrollTop = el.scrollHeight;
        });
        const footer = await dialog
          .locator('.tablet-modal-footer')
          .boundingBox();
        assert.ok(
          footer.y >= 0 &&
            footer.y + footer.height <= page.viewportSize().height,
        );
        await page.getByLabel('包票编号').fill('BT-2-01');
        await button('登记收料').click();
        await button('关闭').click();
      }
      await page.screenshot({ path: `/tmp/tablet78-${route}-${width}.png` });
      if (route === 'tasks') await checkTasks();
      if (route === 'inspection') await checkInspection();
    }
  }
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('http://localhost:16003/#/tablet/receiving');
  await page
    .getByRole('checkbox', { name: '选择第 1 项', exact: true })
    .check();
  await page
    .getByRole('checkbox', { name: '选择第 2 项', exact: true })
    .check();
  await button('生成包票（2）').click();
  await page.getByLabel('结束流水号', { exact: true }).fill('239');
  assert.ok(await button('生成').isDisabled());
  await page.getByLabel('结束流水号', { exact: true }).fill('240');
  await button('预览').click();
  await page.getByRole('dialog', { name: '包票预览' }).waitFor();
  await button('关闭预览').click();
  await button('生成').click();
  await page.getByText('包票已生成', { exact: true }).waitFor();
  await button('查看').nth(1).click();
  await page.getByRole('dialog', { name: '收料详情' }).waitFor();
  assert.ok(
    await page
      .locator('.receiving-detail table')
      .evaluate((el) => el.clientWidth > 700),
  );
  assert.ok(
    await page.getByLabel('包票编号').evaluate((el) => el.clientHeight >= 42),
  );
  assert.equal(
    await page
      .locator('.receipt-stats')
      .evaluate(
        (el) => getComputedStyle(el).gridTemplateColumns.split(' ').length,
      ),
    4,
  );
  await page.getByLabel('包票编号').fill('BT-2-01');
  await button('登记收料').click();
  await page
    .locator('.receipt-stats dd')
    .first()
    .filter({ hasText: '62 / 120 件' })
    .waitFor();
  await page.screenshot({ path: '/tmp/tablet78-detail.png' });
  await button('关闭').click();
  await page.goto('http://localhost:16003/#/tablet/lining-receiving');
  await button('查看').nth(1).click();
  await demo('模拟扫码／恢复数据');
  await button('登记收料').click();
  await page
    .locator('.receipt-stats dd')
    .nth(1)
    .filter({ hasText: '62 / 120 件' })
    .waitFor();
  await page.getByRole('cell', { name: '里料', exact: true }).first().waitFor();
  await button('关闭').click();
  await page.goto('http://localhost:16003/#/tablet/receiving');
  assert.match(await page.locator('.quantity').nth(1).innerText(), /42/);
  assert.deepEqual(errors, []);
  console.log(
    'PASS: 1024/1440 layouts; allocation guard and preview; receipt; task filters/detail; inspection validation, confirmation and state flow.',
  );
} finally {
  await browser.close();
}
