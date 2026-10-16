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
  await page
    .getByRole('link', { name: '工艺计划单', exact: true })
    .first()
    .click();
  assert.equal(await page.locator('.preview-nav').count(), 0);
  assert.equal(await button('模拟加载失败').count(), 0);
  assert.equal(await button('清空搜索').count(), 0);
  await button('演示工具').click();
  await page
    .getByRole('navigation', { name: '演示菜单' })
    .getByRole('link', { name: '首页', exact: true })
    .focus();
  await page.keyboard.press('Escape');
  await page
    .getByRole('navigation', { name: '演示菜单' })
    .waitFor({ state: 'hidden' });
  await button('演示工具').click();
  await page.locator('.t-navbar').click();
  await page
    .getByRole('navigation', { name: '演示菜单' })
    .waitFor({ state: 'hidden' });
  const search = page.getByPlaceholder('搜索计划编号、名称或客户');
  await search.fill('不存在');
  await page.getByText('未找到匹配计划，请调整关键词').waitFor();
  await page.locator('.plan-list .t-search__clear').click();
  assert.equal(await page.locator('.plan-list a').count(), 6);
  assert.equal(await page.getByText('共 6 张计划', { exact: true }).count(), 0);
  await search.fill('027');
  assert.equal(await page.locator('.plan-list a').count(), 1);
  await demoAction('模拟加载失败');
  await page.getByRole('alert').getByText('计划加载失败，请重试').waitFor();
  assert.equal(await page.locator('.plan-list a').count(), 0);
  await button('重试').click();
  await page.getByRole('link', { name: /GY-202609-027/ }).click();
  await page.getByRole('heading', { name: '冬季加厚工作服' }).waitFor();
  assert.match(
    await page.locator('.plan-content').innerText(),
    /SO-202608-1087/,
  );
  await page.locator('.t-navbar__left').click();
  assert.equal(await search.inputValue(), '027');
  await demoAction('重置演示');
  assert.equal(await search.inputValue(), '');
  assert.equal(await page.locator('.plan-list a').count(), 6);
  await page.getByRole('link', { name: /GY-202609-026/ }).click();
  await page.getByRole('heading', { name: '秋季长袖工作服' }).waitFor();
  for (const [tab, content] of [
    ['单品', 'WY-2609-01'],
    ['号型', '165/84A'],
    ['基本', 'SO-202608-1086'],
  ]) {
    await page.getByText(tab, { exact: true }).click();
    assert.match(
      await page.locator('.plan-content').innerText(),
      new RegExp(content),
    );
  }
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 682 });
    const content = page.locator('.pda-content');
    assert.ok(
      await content.evaluate((el) => el.scrollHeight > el.clientHeight),
    );
    const headerBefore = await page.locator('.t-navbar').boundingBox();
    await content.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.getByText('制作要求', { exact: true }).scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 800);
    const headerAfter = await page.locator('.t-navbar').boundingBox();
    assert.equal(headerAfter.y, headerBefore.y);
    assert.equal(await page.evaluate(() => window.scrollY), 0);
    const end = await page.getByText('制作要求', { exact: true }).boundingBox();
    assert.ok(end.y >= 0 && end.y + end.height <= 682);
    await content.evaluate((el) => {
      el.scrollTop = 0;
    });
    await page.getByText('物料', { exact: true }).click();
    const materialSearch = page.getByPlaceholder('搜索物料名称、规格或部门');
    await materialSearch.fill('不存在');
    await page.getByText('未找到匹配物料，请调整关键词').waitFor();
    await materialSearch.fill('纽扣');
    await materialSearch.focus();
    const input = await materialSearch.boundingBox();
    assert.ok(input.y >= 0 && input.y + input.height <= 682);
    await page.locator('.material-button').click();
    const dialog = page.getByRole('dialog', { name: '树脂四眼纽扣' });
    await dialog.waitFor();
    assert.match(await dialog.innerText(), /7,200 粒/);
    await page.waitForTimeout(350); // Finish the popup transition before measuring.
    const box = await dialog.boundingBox();
    assert.ok(
      box.x >= 0 &&
        box.x + box.width <= width &&
        box.y >= 0 &&
        box.y + box.height <= 682,
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({ path: `/tmp/pda64-material-${width}.png` });
    await button('关闭规格').click();
    await page.getByText('基本', { exact: true }).click();
  }
  await page.getByText('物料', { exact: true }).click();
  await demoAction('首页');
  await page
    .getByRole('link', { name: '工艺计划单', exact: true })
    .first()
    .click();
  await page.getByRole('link', { name: /GY-202609-026/ }).click();
  assert.equal(
    await page.getByPlaceholder('搜索物料名称、规格或部门').inputValue(),
    '纽扣',
  );
  await page.locator('.t-navbar__left').click();
  await demoAction('重置演示');
  await page.getByRole('link', { name: /GY-202609-026/ }).click();
  await page.getByRole('heading', { name: '计划信息' }).waitFor();
  await page.getByText('物料', { exact: true }).click();
  assert.equal(
    await page.getByPlaceholder('搜索物料名称、规格或部门').inputValue(),
    '',
  );
  await page.getByPlaceholder('搜索物料名称、规格或部门').fill('线');
  await page.locator('.t-navbar__left').click();
  await search.fill('026');
  await page.getByRole('link', { name: /GY-202609-026/ }).click();
  await demoAction('重置演示');
  await page.locator('.t-navbar__left').click();
  assert.equal(await search.inputValue(), '');
  await search.fill('物流');
  assert.equal(await page.locator('.plan-list a').count(), 1);
  await page.reload();
  assert.equal(await search.inputValue(), '');
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 420 }); // Reduced viewport with search focused.
    await search.focus();
    await demoAction('模拟加载失败');
    await button('重试').click();
    await page.locator('.plan-list a').last().scrollIntoViewIfNeeded();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
  }
  await page.getByRole('link', { name: /GY-202609-031/ }).click();
  await page
    .getByRole('heading', { name: '冬季加厚工作服 · 备货批次' })
    .waitFor();
  assert.match(
    await page.locator('.plan-content').innerText(),
    /SO-202609-1091/,
  );
  await page.locator('.t-navbar__left').click();
  await page.locator('.pda-content').evaluate((el) => {
    el.scrollTop = 0;
  });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.screenshot({ path: '/tmp/pda64-list.png' });
  await page.goto('http://localhost:16003/#/prototype/pda/plan/GY-202609-027');
  await page.getByRole('heading', { name: '冬季加厚工作服' }).waitFor();
  await page.getByText('单品', { exact: true }).click();
  await page.getByRole('heading', { name: '藏青加厚款' }).waitFor();
  await page.getByText('物料', { exact: true }).click();
  await page.getByRole('button', { name: /树脂拉链/ }).click();
  await page.getByRole('dialog', { name: '树脂拉链' }).waitFor();
  await page.goBack();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  await page.goto('http://localhost:16003/#/prototype/pda/plan/missing');
  await page.getByText('未找到该工艺计划，请返回列表').waitFor();
  await page.locator('.t-navbar__left').click();
  await search.waitFor();
  assert.deepEqual(errors, []);
  console.log(
    'PASS: plan search, empty, clear, failure/retry, corresponding detail and return.',
  );
} finally {
  await browser.close();
}
