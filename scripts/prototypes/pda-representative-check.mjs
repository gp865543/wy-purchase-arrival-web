import assert from 'node:assert/strict';

import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.setDefaultTimeout(5000);
  await page.goto('http://localhost:16003/');
  await page.getByRole('button', { name: '一衣一码', exact: true }).click();
  await page.getByText('一衣一码页面待接入', { exact: true }).waitFor();
  await page
    .getByText('一衣一码页面待接入', { exact: true })
    .waitFor({ state: 'hidden' });
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 682 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    const homeFooter = await page.locator('.home-footer').boundingBox();
    assert.ok(homeFooter.y < 682);
  }
  await page.setViewportSize({ width: 360, height: 682 });
  await page.getByRole('button', { name: '第 2 组：产线示例' }).click();
  await page.waitForFunction(
    () =>
      document
        .querySelector('[aria-label="第 2 组：产线示例"]')
        .getAttribute('aria-current') === 'true',
  );
  await page.locator('.group-carousel').hover();
  await page.mouse.wheel(-400, 0);
  await page.waitForFunction(
    () =>
      document
        .querySelector('[aria-label="第 1 组：业务页面"]')
        .getAttribute('aria-current') === 'true',
  );
  await page.getByRole('button', { name: '第 2 组：产线示例' }).click();
  await page
    .getByRole('link', { name: '产线示例', exact: true })
    .first()
    .click();
  await page.getByText('今日产线', { exact: true }).waitFor();
  await page.goBack();
  await page
    .getByRole('link', { name: '库存盘点', exact: true })
    .first()
    .click();
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
  await button('保存本项').waitFor();
  assert.ok(await button('保存本项').isDisabled());
  await page.getByPlaceholder('输入条码').fill('wrong');
  await button('核对条码').click();
  assert.match(await page.getByRole('alert').innerText(), /条码不匹配/);
  const roll = (number) =>
    page.getByRole('spinbutton', {
      name: `第 ${number} 卷（米）`,
      exact: true,
    });
  assert.ok(await roll(1).isDisabled());
  assert.ok(await button('增加卷').isDisabled());
  for (const quantity of ['0.3', '0']) {
    await demoAction('模拟扫码');
    assert.ok(
      await page.getByPlaceholder('请输入', { exact: true }).isDisabled(),
    );
    await demoAction('模拟扫码');
    await page.getByPlaceholder('请输入', { exact: true }).fill('-1');
    assert.ok(await button('保存本项').isDisabled());
    if (quantity === '0.3') {
      await roll(1).fill('0.1');
      await button('增加卷').click();
      assert.ok(await button('保存本项').isDisabled());
      for (const invalid of [
        '-1',
        '0.12',
        '0.10',
        '0.10000000000000001',
        '1e309',
      ]) {
        await roll(2).fill(invalid);
        assert.ok(await button('保存本项').isDisabled());
        assert.match(await page.getByRole('alert').innerText(), /每卷/);
      }
      await roll(2).fill('0');
      await roll(2).blur();
      assert.equal(await roll(2).inputValue(), '0.0');
      await roll(2).fill('0.2');
      await page.getByText('合计 0.3 米', { exact: true }).waitFor();
      await roll(1).fill('0.2');
      await page.getByText('合计 0.4 米', { exact: true }).waitFor();
      await roll(1).fill('0.1');
      await roll(1).blur();
      assert.equal(await roll(1).inputValue(), '0.1');
      assert.equal(await roll(1).getAttribute('step'), '0.1');
      for (const width of [320, 360, 390]) {
        await page.setViewportSize({ width, height: 420 });
        await roll(2).focus();
        const input = await roll(2).boundingBox();
        const footer = await page.locator('.pda-footer').boundingBox();
        assert.ok(input.y >= 0 && input.y + input.height <= footer.y);
        assert.ok(footer.y + footer.height <= 420);
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
      }
      await page.setViewportSize({ width: 320, height: 682 });
      await page.screenshot({ path: '/tmp/pda66-rolls.png' });
    } else {
      await page.getByPlaceholder('请输入', { exact: true }).fill('');
      assert.ok(await button('保存本项').isDisabled());
      await page.getByPlaceholder('请输入', { exact: true }).fill(quantity);
    }
    await button('保存本项').click();
    assert.ok(await button('保存本项').isDisabled());
    if (quantity === '0.3') {
      await page.getByText('第 2 卷：0.2 米', { exact: true }).waitFor();
      assert.ok(await button('提交盘点').isDisabled());
      await button('下一货位').click();
    }
  }
  await button('提交盘点').click();
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 682 });
    const dialog = await page.locator('.t-dialog').boundingBox();
    assert.ok(dialog.x >= 0 && dialog.x + dialog.width <= width);
  }
  await button('继续核对').click();
  assert.match(await page.locator('.summary').innerText(), /2 \/ 2 项/);
  await button('提交盘点').click();
  await button('确认提交').click();
  await page.getByText('第 1 卷：0.1 米', { exact: true }).waitFor();
  await page.getByText('第 2 卷：0.2 米', { exact: true }).waitFor();
  await page.getByRole('heading', { name: '盘点已提交' }).waitFor();
  assert.equal(await page.getByRole('spinbutton').count(), 0);
  await demoAction('工艺详情');
  await demoAction('库存盘点');
  await page.getByRole('heading', { name: '盘点已提交' }).waitFor();
  await page.locator('.t-navbar__left').click();
  await page
    .getByRole('link', { name: '库存盘点', exact: true })
    .first()
    .click();
  await page.getByRole('heading', { name: '盘点已提交' }).waitFor();
  await demoAction('重置演示');
  assert.ok(await button('保存本项').isDisabled());
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 682 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    const footer = await page.locator('.pda-footer').boundingBox();
    assert.ok(footer.y + footer.height <= 682);
  }
  await demoAction('模拟扫码');
  await demoAction('模拟扫码');
  const quantityInput = page.getByPlaceholder('请输入', { exact: true });
  await quantityInput.fill('1');
  await quantityInput.focus();
  const inputBox = await quantityInput.boundingBox();
  const footerBox = await page.locator('.pda-footer').boundingBox();
  assert.ok(inputBox.y >= 0 && inputBox.y + inputBox.height <= footerBox.y);
  await page.reload();
  assert.ok(await button('保存本项').isDisabled());

  await demoAction('工艺详情');
  await page.getByText('物料', { exact: true }).click();
  await page.getByPlaceholder('搜索物料名称、规格或部门').fill('不存在');
  await page.getByText('未找到匹配物料，请调整关键词').waitFor();
  await page.getByPlaceholder('搜索物料名称、规格或部门').fill('纽扣');
  await page.locator('.material-button').click();
  await page.getByRole('dialog', { name: '树脂四眼纽扣' }).waitFor();
  await page.setViewportSize({ width: 320, height: 682 });
  assert.match(await page.locator('.material-sheet').innerText(), /7,200 粒/);
  await page.waitForTimeout(350); // Allow the popup entrance transition to finish.
  await page.screenshot({ path: '/tmp/pda61-material.png' });
  await button('关闭规格').click();
  await demoAction('重置演示');
  await page.getByRole('heading', { name: '计划信息' }).waitFor();
  for (const tab of ['单品', '号型', '基本']) {
    await page.getByText(tab, { exact: true }).click();
  }
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 800 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert.ok(
      await page
        .locator('.pda-content')
        .evaluate((el) => el.scrollHeight > el.clientHeight),
    );
  }
  await page.setViewportSize({ width: 360, height: 800 });
  await page.screenshot({ path: '/tmp/pda61-plan.png' });
  await demoAction('首页');
  await page
    .locator('.home-footer')
    .getByRole('link', { name: '工艺计划单' })
    .click();
  await page.getByRole('link', { name: /GY-202609-026/ }).click();
  await page.getByRole('heading', { name: '计划信息' }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    'PASS: home groups, navigation and state retention; stocktake guards and completion; detail tabs, search, popup; 320/360/390px layouts.',
  );
} finally {
  await browser.close();
}
