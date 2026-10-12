async (page) => {
  await page.setViewportSize({ width: 1440, height: 900 }); await page.waitForFunction(() => window.__labEvidence); await page.waitForTimeout(1800);
  const state = async () => page.evaluate(() => window.__labEvidence.world);
  const point = async id => page.evaluate(key => window.__labEvidence.projected[key], id);
  const click = async id => { const p = await point(id); await page.mouse.click(...p); await page.waitForTimeout(1500); };
  const escape = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(1500); };
  const drag = async (id, target) => { const a = await point(id); await page.mouse.move(...a); await page.mouse.down(); await page.mouse.move(a[0]+20,a[1]+20,{steps:4}); await page.waitForTimeout(1500); const b = await point(target); await page.mouse.move(...b,{steps:20}); await page.mouse.up(); await page.waitForTimeout(500); };
  await click('notebook'); await page.getByRole('button',{name:'铁与硫酸铜',exact:true}).click(); await escape();
  await page.screenshot({path:'verification/interactive-room.png'});
  await drag('copperSulfate','beaker');
  if ((await state()).docked !== 'copperSulfate') { await page.screenshot({path:'verification/first-failure.png'}); return {failure:'bottle docking failed',world:await state(),gesture:await page.evaluate(()=>window.__labGesture)}; }
  await click('copperSulfate'); await click('copperSulfateCap');
  if (!(await state()).opened.copperSulfate) throw new Error('open cap failed');
  const a = await point('copperSulfate'); await page.mouse.move(...a); await page.mouse.down(); await page.mouse.move(a[0],a[1]-120,{steps:20});
  await page.waitForTimeout(2000); const during = await state(); await page.screenshot({path:'verification/continuous-pour.png'}); await page.mouse.up(); await page.waitForTimeout(500);
  const poured = await state(); if (!(poured.vessel.volume > 0)) throw new Error(`pour failed: ${JSON.stringify({duringAngle:during.angle,busy:during.busy,docked:during.docked,feedback:during.feedback})}`);
  await escape(); await drag('tweezers','iron'); const clamped = await state();
  if (!(clamped.clamp.Fe > 0)) throw new Error(`clamp failed ${clamped.feedback}`);
  await drag('tweezers','beaker'); await page.waitForFunction(() => window.__labEvidence.world.vessel.extent.displacement > 0); await page.waitForTimeout(6000);
  await click('beaker'); await page.screenshot({path:'verification/iron-reaction.png'});
  const reacted = await state(); await page.getByRole('button',{name:'观察化学图景',exact:true}).click(); await page.waitForTimeout(600); await page.screenshot({path:'verification/iron-micro.png'});
  await escape(); await drag('tweezers','beaker'); const retrieved = await state();
  await drag('beaker','waste'); const emptied = await state(); await drag('beaker','wash'); const cleaned = await state();
  return {poured:{volume:poured.vessel.volume,stock:poured.stock.copperSulfate,angle:poured.angle},clamped:clamped.clamp,reacted:reacted.vessel,retrieved:retrieved.clamp,emptied:{volume:emptied.vessel.volume,waste:emptied.waste},cleaned:!cleaned.dirty,fps:await page.evaluate(()=>window.__labEvidence.fps)};
}
