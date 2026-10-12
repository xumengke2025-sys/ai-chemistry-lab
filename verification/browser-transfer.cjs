async (page) => {
  const point = async id => page.evaluate(key => window.__labEvidence.projected[key], id);
  const drag = async (id, target) => {
    const a = await point(id); await page.mouse.move(a[0], a[1]); await page.mouse.down();
    await page.mouse.move(a[0] + 10, a[1] + 10, { steps: 3 }); await page.waitForTimeout(1300);
    const b = await point(target); await page.mouse.move(b[0], b[1], { steps: 16 }); await page.mouse.up(); await page.waitForTimeout(250);
  };
  await page.keyboard.press('Escape'); await page.waitForTimeout(1200);
  await drag('copperSulfate', 'beaker');
  let state = await page.evaluate(() => window.__labEvidence.world);
  if (state.docked !== 'copperSulfate') throw new Error(`did not dock: ${state.feedback}`);
  let a = await point('copperSulfate'); await page.mouse.click(a[0], a[1]); await page.waitForTimeout(1200);
  await page.screenshot({ path: 'verification/bottle-docked.png' });
  return await page.evaluate(() => ({ world: window.__labEvidence.world, points: window.__labEvidence.projected, text: document.body.innerText }));
}
