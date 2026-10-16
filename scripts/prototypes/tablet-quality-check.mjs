import assert from 'node:assert/strict';

import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(5000);
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: width === 1024 ? 768 : 900 });
    for (const route of ['semi-qc', 'final-qc']) {
      await page.goto(`http://localhost:16003/#/tablet/${route}`);
      const button = (name) => page.getByRole('button', { name, exact: true });
      await page.getByLabel('对象筛选').fill('absent');
      await page.getByText('没有符合条件的质检对象').waitFor();
      await page.getByLabel('对象筛选').fill('175/92A');
      await button('切换记录表').click();
      assert.equal(await page.getByLabel('对象筛选').inputValue(), '175/92A');
      await button('切换看板').click();
      await button('查看检验').click();
      await button('合格').nth(0).click();
      await button('轻缺陷').nth(1).click();
      await button(route === 'semi-qc' ? '提交批量质检' : '提交质检').click();
      await button('取消').click();
      await page.getByRole('dialog', { name: '质检执行' }).waitFor();
      await button(route === 'semi-qc' ? '提交批量质检' : '提交质检').click();
      await button('确认提交').click();
      await page.getByText('质检结果已提交', { exact: true }).waitFor();
      await button('切换记录表').click();
      assert.equal(await page.locator('.table-panel tbody tr').count(), 2);
      await button('查看记录').last().click();
      await page.getByText('只读记录', { exact: true }).waitFor();
      assert.ok(await button('轻缺陷').last().isDisabled());
      const dialog = page.getByRole('dialog', { name: '质检执行' });
      await dialog.locator('.tablet-modal-body').evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      const footer = await dialog.locator('footer').boundingBox();
      assert.ok(footer.y + footer.height <= page.viewportSize().height);
      await button('关闭').click();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
    }
  }
  console.log(
    'PASS: QC filters, dual view, confirmation/cancel, record creation and read-only at 1024/1440.',
  );
} finally {
  await browser.close();
}
