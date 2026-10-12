async (page) => {
  const read = () => page.evaluate(() => window.__labEvidence.world);
  const point = id => page.evaluate(key => window.__labEvidence.projected[key], id);
  const click = async id => { const p = await point(id); await page.mouse.click(...p); await page.waitForTimeout(1500); };
  const escape = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(1500); };
  const drag = async (id,target) => { const a=await point(id); await page.mouse.move(...a); await page.mouse.down(); await page.mouse.move(a[0]+20,a[1]+20,{steps:4}); await page.waitForTimeout(1500); const b=await point(target); await page.mouse.move(...b,{steps:16}); await page.mouse.up(); await page.waitForTimeout(400); };
  const profile = () => page.evaluate(async () => {
    const deltas=[]; let last=performance.now(); await new Promise(resolve=> { const start=last; const frame=now=>{deltas.push(now-last);last=now;if(now-start>=6000)resolve();else requestAnimationFrame(frame);};requestAnimationFrame(frame); });
    deltas.sort((a,b)=>a-b); const canvas=document.querySelector('canvas'), gl=canvas.getContext('webgl2'), ext=gl?.getExtension('WEBGL_debug_renderer_info');
    return {samples:deltas.length,meanFps:1000/(deltas.reduce((a,b)=>a+b,0)/deltas.length),p95FrameMs:deltas[Math.floor(deltas.length*0.95)],gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable',viewport:[innerWidth,innerHeight],dpr:devicePixelRatio};
  });
  await escape(); const desktop = await profile();
  // Recovery verifies the actual saved experiment survives reload.
  const before = await read(); await page.waitForTimeout(3200); const saved = await page.evaluate(()=>({value:JSON.parse(localStorage.getItem('historical-lab-v1')),valid:window.__labEvidence.validSnapshot(JSON.parse(localStorage.getItem('historical-lab-v1')))}));
  await page.reload(); await page.waitForFunction(()=>window.__labEvidence); await page.waitForTimeout(1500); const restored = await read();
  const recoveryKeys = ['stock','solids','vessel','waste','recovered','clamp','toolLiquid','chamber','powderStock','spoonLoad','positions','opened','experiment'];
  if (recoveryKeys.some(key => JSON.stringify(before[key]) !== JSON.stringify(restored[key]))) return {failure:'reload recovery mismatch',before,saved,restored};
  await escape(); await drag('beaker','beakerHome'); await escape();
  await click('notebook'); await page.getByRole('button',{name:'酸碱中和',exact:true}).click(); await escape();
  await click('water'); await click('waterCap'); await escape(); await drag('measure','water'); await drag('measure','beaker'); await drag('beaker','furnace');
  await click('furnaceDoor');
  await page.waitForTimeout(3500); const heated = await read();
  if (!heated.heating || heated.vessel.volume!==10 || heated.vessel.temperature<=20) throw new Error('furnace heating failed');
  await page.setViewportSize({width:391,height:889}); await escape(); await page.screenshot({path:'verification/interactive-narrow.png'});
  await click('notebook'); await page.getByRole('button',{name:'酸碱中和',exact:true}).waitFor(); await page.screenshot({path:'verification/notebook-narrow.png'}); await escape();
  const narrow = await profile();
  await page.setViewportSize({width:1440,height:900}); await escape();
  return {desktop,narrow,restored:true,recoveryKeys,restoredExperiment:restored.experiment,restoredAcid:restored.stock.acid,restoredGas:restored.vessel.escaped,heated:{temperature:heated.vessel.temperature,heating:heated.heating,position:heated.positions.beaker}};
}
