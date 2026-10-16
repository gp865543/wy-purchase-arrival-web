import assert from 'node:assert/strict';

import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://localhost:16003/#/home');
  await page.getByRole('link', { name: '入库上架', exact: true }).click();
  await page.getByText('累计上架 0 粒 · 0 条记录', { exact: true }).waitFor();
  await page.getByRole('button', { name: '新增上架', exact: true }).click();
  const location = page.getByRole('textbox', { name: '货位', exact: true });
  const quantity = page.getByRole('spinbutton', { name: /^数量/ });
  await location.fill('A-01-03');
  await quantity.fill('5');
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await page.getByText('累计上架 0 粒 · 0 条记录', { exact: true }).waitFor();
  await page.getByRole('button', { name: '新增上架', exact: true }).click();
  assert.equal(await location.inputValue(), '');
  assert.equal(await quantity.inputValue(), '');
  await location.fill('A-01-03');
  await quantity.fill('5');
  await page
    .getByRole('button', { name: '保存记录', exact: true })
    .evaluate((el) => {
      el.click();
      el.click();
    });
  await page.getByText('累计上架 5 粒 · 1 条记录', { exact: true }).waitFor();
  await page.getByRole('link', { name: '记录 1', exact: false }).click();
  await page.getByRole('heading', { name: '记录详情', exact: true }).waitFor();
  await page.getByText('A-01-03', { exact: true }).waitFor();
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
  await page.getByRole('link', { name: '工序报工', exact: true }).click();
  await page.getByRole('button', { name: '新增报工', exact: true }).click();
  await page.waitForURL('**/report/new');
  const worker = page.getByRole('textbox', { name: '操作人', exact: true });
  await worker.fill('张师傅');
  await quantity.fill('12');
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await page.waitForURL('**/report');
  await page.getByText('累计报工 0 件 · 0 条记录', { exact: true }).waitFor();
  await page.getByRole('button', { name: '新增报工', exact: true }).click();
  assert.equal(await worker.inputValue(), '');
  assert.equal(await quantity.inputValue(), '');
  await page.getByRole('button', { name: '保存记录', exact: true }).click();
  await page.getByRole('alert').waitFor();
  await worker.fill('张师傅');
  for (const value of ['0', '-1', '1.5', '1e309']) {
    await quantity.fill(value);
    await page.getByRole('button', { name: '保存记录', exact: true }).click();
    await page.getByRole('alert').waitFor();
    await page.getByText('累计报工 0 件 · 0 条记录', { exact: true }).waitFor();
  }
  await quantity.fill('12');
  await page
    .getByRole('textbox', { name: '备注', exact: true })
    .fill('完成第一包');
  await page
    .getByRole('button', { name: '保存记录', exact: true })
    .evaluate((el) => {
      el.click();
      el.click();
    });
  await page.waitForURL('**/report');
  await page.getByText('累计报工 12 件 · 1 条记录', { exact: true }).waitFor();
  await page.getByRole('link', { name: '记录 1', exact: false }).click();
  await page.getByText('张师傅', { exact: true }).waitFor();
  await page.getByText('完成第一包', { exact: true }).waitFor();
  await page.locator('.t-navbar__left').click();
  await page.waitForURL('**/report');
  await demoAction('首页');
  await page.getByRole('link', { name: '工序报工', exact: true }).click();
  await page.getByText('累计报工 12 件 · 1 条记录', { exact: true }).waitFor();
  await page.getByText('GC-202609-026 · 缝制过程卡', { exact: true }).waitFor();
  await page.getByRole('button', { name: '新增报工', exact: true }).click();
  assert.equal(await worker.inputValue(), '');
  await worker.fill('未保存');
  await demoAction('重置演示');
  await page.waitForURL('**/report');
  await page.getByText('累计报工 0 件 · 0 条记录', { exact: true }).waitFor();
  await page.goto('http://localhost:16003/#/prototype/pda/report/1');
  await page.getByText('未找到该记录，请返回列表', { exact: true }).waitFor();
  await page.getByRole('button', { name: '返回记录列表', exact: true }).click();
  await demoAction('入库上架');
  await page.getByText('累计上架 5 粒 · 1 条记录', { exact: true }).waitFor();
  await page.getByRole('link', { name: '记录 1', exact: false }).click();
  await demoAction('重置演示');
  await page.getByText('累计上架 0 粒 · 0 条记录', { exact: true }).waitFor();
  assert.equal(
    await page.getByRole('link', { name: '记录 1', exact: false }).count(),
    0,
  );
  for (const [kind, label, inputLabel] of [
    ['putaway', '上架', '货位'],
    ['report', '报工', '操作人'],
  ]) {
    await page.goto(`http://localhost:16003/#/prototype/pda/${kind}`);
    for (const width of [320, 360, 390]) {
      await page.setViewportSize({ width, height: 682 });
      // Several saved records make the list genuinely scrollable.
      for (let i = 0; i < 3; i++) {
        await page
          .getByRole('button', { name: `新增${label}`, exact: true })
          .click();
        await page
          .getByRole('textbox', { name: inputLabel, exact: true })
          .fill('A-01-03');
        await quantity.fill('2');
        await page
          .getByRole('textbox', { name: '备注', exact: true })
          .fill('长备注'.repeat(30));
        await page
          .getByRole('button', { name: '保存记录', exact: true })
          .click();
        await page
          .getByRole('button', { name: `新增${label}`, exact: true })
          .waitFor();
      }
      await page
        .getByRole('link', { name: '记录 ', exact: false })
        .last()
        .scrollIntoViewIfNeeded();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.screenshot({ path: `/tmp/pda70-${kind}-list-${width}.png` });
      await page
        .getByRole('button', { name: `新增${label}`, exact: true })
        .click();
      await page.screenshot({ path: `/tmp/pda70-${kind}-form-${width}.png` });
      await page.setViewportSize({ width, height: 420 });
      await quantity.focus();
      await quantity.scrollIntoViewIfNeeded();
      const box = await quantity.boundingBox();
      const footer = await page.locator('.pda-footer').boundingBox();
      assert.ok(box.y >= 0 && box.y + box.height <= footer.y);
      const button = await page
        .getByRole('button', { name: '保存记录', exact: true })
        .boundingBox();
      assert.ok(button.y >= 0 && button.y + button.height <= 420);
      await page.getByRole('button', { name: '取消', exact: true }).click();
    }
    await page.reload();
    await page
      .getByText(
        `累计${label} 0 ${kind === 'report' ? '件' : '粒'} · 0 条记录`,
        { exact: true },
      )
      .waitFor();
  }
  assert.deepEqual(errors, []);
  console.log('PASS collection entry, cancel, save and detail');
} finally {
  await browser.close();
}
