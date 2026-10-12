async (page) => {
  const read = () => page.evaluate(() => window.__labEvidence.world);
  const point = id => page.evaluate(key => window.__labEvidence.projected[key], id);
  const click = async id => { const p = await point(id); await page.mouse.click(...p); await page.waitForTimeout(1200); };
  const escape = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(1200); };
  const drag = async (id,target) => { const a = await point(id); await page.mouse.move(...a); await page.mouse.down(); await page.mouse.move(a[0]+20,a[1]+20,{steps:4}); await page.waitForTimeout(1200); const b = await point(target); await page.mouse.move(...b,{steps:16}); await page.mouse.up(); await page.waitForTimeout(300); };
  const reset = async name => { await escape(); await click('notebook'); await page.getByRole('button',{name,exact:true}).click(); await escape(); };
  const open = async id => { await click(id); await click(`${id}Cap`); await escape(); if (!(await read()).opened[id]) throw new Error(`opening ${id} failed`); };
  const measure = async id => { await drag('measure',id); if (!((await read()).toolLiquid.measure?.ml > 0)) throw new Error(`measure ${id} failed`); await drag('measure','beaker'); };
  const show = async file => { await click('beaker'); await page.screenshot({path:`verification/${file}.png`}); await escape(); };
  const results = {};
  await reset('酸碱中和'); await open('acid'); await open('base'); await open('indicator');
  await measure('acid'); await measure('base'); await drag('pipette','indicator'); await drag('pipette','beaker'); await page.waitForTimeout(4000);
  results.neutral = (await read()).vessel; await measure('base'); await page.waitForTimeout(4000); results.baseExcess = (await read()).vessel;
  await show('neutralization-base-excess');
  await reset('氢氧化铜沉淀'); await open('copperSulfate'); await open('base'); await measure('copperSulfate'); await measure('base'); await page.waitForTimeout(4500);
  results.precipitation = (await read()).vessel; if (!(results.precipitation.contents.precipitate > 0)) throw new Error('precipitation missing'); await show('precipitation');
  await reset('碳酸盐与酸'); await open('water'); await open('acid'); await measure('water');
  await drag('spoon','powder'); await drag('spoon','scale'); results.powder = {load:(await read()).spoonLoad,weighing:(await read()).weighing};
  await drag('spoon','beaker'); await drag('tube','beaker'); await measure('acid'); await page.waitForTimeout(4500); results.carbonate = (await read()).vessel;
  if (!(results.carbonate.collected.CO2 > 0)) throw new Error('carbonate collection missing'); await show('carbonate-collection');
  return results;
}
