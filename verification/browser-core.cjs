async (page) => {
  const point = async id => page.evaluate(key => window.__labEvidence.projected[key], id);
  const clickObject = async id => { const p = await point(id); await page.mouse.click(p[0], p[1]); await page.waitForTimeout(1200); };
  await clickObject('copperSulfate');
  await page.screenshot({ path: 'verification/reagent-introduction.png' });
  return await page.evaluate(() => ({ selected: window.__labEvidence.world.selected, points: window.__labEvidence.projected, text: document.body.innerText }));
}
