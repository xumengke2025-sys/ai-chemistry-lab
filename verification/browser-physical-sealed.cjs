async(page)=>{
  await page.setViewportSize({width:1440,height:900});await page.reload();await page.waitForFunction(()=>window.__labEvidence);await page.waitForTimeout(2000);
  const read=()=>page.evaluate(()=>({world:window.__labEvidence.world,mass:window.__labEvidence.weighingMass,held:window.__labEvidence.interaction.held}));
  const point=id=>page.evaluate(id=>window.__labEvidence.projected[id],id);
  const click=async id=>{const p=await point(id);if(p[0]<0||p[0]>1440||p[1]<0||p[1]>900)throw new Error(`outside screen ${id}`);await page.mouse.click(...p);await page.waitForTimeout(1600);};
  const escape=async()=>{await page.keyboard.press('Escape');await page.waitForTimeout(1800);};
  const pick=async id=>{for(let n=0;n<3;n++){await click(id);if((await read()).held===id){if(await page.locator('main').getAttribute('data-view')!=='bench')throw new Error('camera switched while picking');return;}}throw new Error(`pick ${id}`);};
  const dose=async()=>{await pick('measure');await click('acid');await pick('measure');await click('beaker');};
  await escape();await click('notebook');await click('notebookExp5');await click('notebookClose');
  await pick('tweezers');await click('zinc');await pick('tweezers');await click('beaker');await click('acid');await click('acidCap');await escape();await dose();await dose();
  await pick('beaker');await click('scale');const unsealed=(await read()).mass;
  await pick('stopper');await click('beaker');await pick('beaker');await click('scale');const before=await read();if(!before.world.vessel.closed||Math.abs(before.mass-105.14)>1e-8)throw new Error(`before mass ${before.mass}`);
  await click('scale');await page.screenshot({path:'output/playwright/physical-sealed-before.png'});await escape();await click('stirrer');await page.waitForTimeout(5500);const after=await read();if(Math.abs(after.mass-before.mass)>1e-8||Math.abs(after.world.vessel.gas.H2-.001)>1e-8)throw new Error('closed mass or gas');
  await click('scale');await page.screenshot({path:'output/playwright/physical-sealed-after.png'});await escape();
  const a=await point('stopper');await page.mouse.move(...a);await page.mouse.down();await page.mouse.move(a[0]+20,a[1]+20,{steps:4});await page.mouse.move(...await point('stopperHome'),{steps:20});await page.mouse.up();await page.waitForTimeout(1800);
  await pick('beaker');await click('scale');const opened=await read();if(opened.world.vessel.closed||Math.abs(before.mass-opened.mass-.002016)>1e-8)throw new Error(`opened mass ${opened.mass}`);
  await click('scale');await page.screenshot({path:'output/playwright/physical-sealed-opened.png'});await escape();
  const keys=['stock','solids','vessel','waste','recovered','clamp','toolLiquid','chamber','dirty','powderStock','spoonLoad','positions','opened','experiment'];const saved=JSON.stringify(keys.map(k=>opened.world[k]));await page.waitForTimeout(3500);await page.reload();await page.waitForFunction(()=>window.__labEvidence);await page.waitForTimeout(2000);const restored=await read();if(JSON.stringify(keys.map(k=>restored.world[k]))!==saved)throw new Error('saved inventory did not restore');
  await pick('beaker');await click('waste');await pick('beaker');await click('wash');if((await read()).world.dirty||(await read()).world.vessel.volume)throw new Error('cleanup');
  return {unsealedMass:unsealed,sealedBefore:before.mass,sealedAfter:after.mass,openedMass:opened.mass,escapedMass:before.mass-opened.mass,retainedH2:after.world.vessel.gas.H2,restoredFields:keys.length,cleaned:true};
}
