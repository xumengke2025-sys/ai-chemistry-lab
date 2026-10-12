async (page) => {
  const read = () => page.evaluate(() => window.__labEvidence.world);
  const point = id => page.evaluate(key => window.__labEvidence.projected[key], id);
  const click = async id => { const p = await point(id); await page.mouse.click(...p); await page.waitForTimeout(1200); };
  const escape = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(1200); };
  const drag = async (id,target) => { const a = await point(id); await page.mouse.move(...a); await page.mouse.down(); await page.mouse.move(a[0]+20,a[1]+20,{steps:4}); await page.waitForTimeout(1200); const b = await point(target); await page.mouse.move(...b,{steps:16}); await page.mouse.up(); await page.waitForTimeout(300); };
  const reset = async name => { await escape(); await click('notebook'); await page.getByRole('button',{name,exact:true}).click(); await escape(); };
  const open = async id => { await click(id); await click(`${id}Cap`); await escape(); };
  const measure = async id => { await drag('measure',id); await drag('measure','beaker'); };
  const weigh = w => 85 + Object.entries(w.vessel.contents).reduce((a,[id,n])=>a+({water:18.015,H:1.008,Cl:35.45,Zn:65.38,ZnIon:65.38}[id]??0)*n,0) + (w.vessel.gas.H2??0)*2.016 + (w.chamber.Zn??0)*65.38;
  const results = {};
  await reset('锌与稀酸'); await open('acid'); await drag('tweezers','zinc'); await drag('tweezers','beaker'); await drag('tube','beaker'); await measure('acid'); await measure('acid'); await page.waitForTimeout(4500);
  results.zinc = (await read()).vessel;
  if (Math.abs((results.zinc.collected.H2??0)-0.001)>1e-8) throw new Error('zinc gas collection wrong');
  await click('beaker'); await page.screenshot({path:'verification/zinc-collection.png'}); await escape();
  await reset('密闭质量守恒'); await open('acid'); await drag('tweezers','zinc'); await drag('tweezers','beaker'); await measure('acid'); await measure('acid'); await drag('beaker','scale');
  const before = await read(); if (!before.chamber.Zn || before.vessel.contents.Zn) throw new Error('dry chamber isolation failed');
  await click('scale'); await page.screenshot({path:'verification/closed-before.png'}); await escape();
  await drag('stopper','beaker'); if (!(await read()).vessel.closed) throw new Error('closed assembly failed');
  await click('stirrer'); await page.waitForTimeout(5000); await drag('beaker','scale');
  const after = await read(); if (Math.abs(weigh(before)-weigh(after))>1e-8) throw new Error('closed mass changed');
  if (Math.abs((after.vessel.gas.H2??0)-0.001)>1e-8) throw new Error('closed gas missing');
  await click('scale'); await page.screenshot({path:'verification/closed-after.png'}); await escape();
  await drag('stopper','stopperHome');
  await drag('beaker','scale'); const opened = await read();
  if (opened.vessel.closed || Math.abs(weigh(after)-weigh(opened)-0.002016)>1e-8) throw new Error('opening via stopper home failed');
  results.closed = {before:weigh(before),after:weigh(after),opened:weigh(opened),gas:after.vessel.gas,escaped:opened.vessel.escaped};
  return results;
}
