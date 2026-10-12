async (page) => {
  const point = async id => page.evaluate(key => window.__labEvidence.projected[key], id);
  const click = async id => { const p = await point(id); await page.mouse.click(...p); await page.waitForTimeout(1300); };
  const drag = async (id, target) => { const a = await point(id); await page.mouse.move(...a); await page.mouse.down(); await page.mouse.move(a[0] + 20, a[1] + 20, {steps:4}); await page.waitForTimeout(1500); const b = await point(target); await page.mouse.move(...b, {steps:20}); await page.mouse.up(); await page.waitForTimeout(250); };
  // Prior script placed the bottle above the vessel through real mouse dragging.
  await click('copperSulfate');
  await click('copperSulfateCap');
  const opened = await page.evaluate(() => window.__labEvidence.world.opened.copperSulfate);
  if (!opened) throw new Error('cap did not open');
  const a = await point('copperSulfate'); await page.mouse.move(...a); await page.mouse.down(); await page.mouse.move(a[0], a[1]-125, {steps:20});
  await page.waitForTimeout(1800); await page.screenshot({path:'verification/continuous-pour.png'}); await page.mouse.up();
  const poured = await page.evaluate(() => ({volume:window.__labEvidence.world.vessel.volume,stock:window.__labEvidence.world.stock.copperSulfate,angle:window.__labEvidence.world.angle}));
  await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
  await drag('tweezers','iron');
  const clamped = await page.evaluate(() => window.__labEvidence.world.clamp);
  await drag('tweezers','beaker'); await page.waitForTimeout(6000);
  const reacted = await page.evaluate(() => window.__labEvidence.world.vessel);
  await click('beaker'); await page.screenshot({path:'verification/iron-reaction.png'});
  await page.getByRole('button',{name:'观察化学图景',exact:true}).click(); await page.waitForTimeout(1200);
  await page.screenshot({path:'verification/iron-micro.png'});
  return {poured,clamped,reacted};
}
