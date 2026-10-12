async (page) => {
  await page.setViewportSize({width:1440,height:900});await page.reload();await page.waitForFunction(()=>window.__labEvidence);await page.waitForTimeout(2000);
  const read=()=>page.evaluate(()=>window.__labEvidence.world);
  const click=async id=>{const p=await page.evaluate(id=>window.__labEvidence.projected[id],id);if(p[0]<0||p[0]>1440||p[1]<0||p[1]>900)throw new Error(`physical target outside screen ${id}`);await page.mouse.click(...p);await page.waitForTimeout(1400);};
  const escape=async()=>{await page.keyboard.press('Escape');await page.waitForTimeout(1700);};
  const start=async i=>{await escape();await click('notebook');await click(`notebookExp${i}`);if((await read()).experiment!==i)throw new Error(`page ${i} failed`);await click('notebookClose');};
  const pick=async id=>{for(let n=0;n<3;n++){await click(id);const held=await page.evaluate(()=>window.__labEvidence.interaction.held);if(held===id){if(await page.locator('main').getAttribute('data-view')!=='bench')throw new Error(`pickup switched camera ${id}`);return;}}throw new Error(`pick ${id} failed`);};
  const open=async id=>{await escape();await click(id);await click(`${id}Cap`);if(!(await read()).opened[id])throw new Error(`cap ${id} failed`);await escape();};
  const dose=async(source,tool='measure')=>{await pick(tool);await click(source);await pick(tool);await click('beaker');};
  const observe=async()=>{await click('lens');await escape();};
  const clean=async()=>{await pick('beaker');await click('waste');await pick('beaker');await click('wash');if((await read()).dirty||(await read()).vessel.volume)throw new Error('cleanup failed');};
  const results={};
  await start(1);await open('acid');await dose('acid');await open('indicator');await dose('indicator','pipette');await open('base');await dose('base');await dose('base');await page.waitForTimeout(4000);await observe();results.neutralization=(await read()).vessel;if(Math.abs(results.neutralization.contents.OH-.001)>1e-8)throw new Error('neutralization');await clean();
  await start(2);await open('water');await dose('water');await pick('spoon');await click('powder');await pick('spoon');await click('scale');if((await read()).weighing!=='spoon')throw new Error('weighing');await pick('spoon');await click('beaker');await pick('tube');await click('beaker');await open('acid');await dose('acid');await page.waitForTimeout(4500);await observe();results.carbonate=(await read()).vessel;if(Math.abs(results.carbonate.collected.CO2-.0005)>1e-8)throw new Error('carbonate');await clean();
  await start(3);await open('copperSulfate');await dose('copperSulfate');await open('base');await dose('base');await page.waitForTimeout(4000);await observe();results.precipitation=(await read()).vessel;if(Math.abs(results.precipitation.contents.precipitate-.0005)>1e-8)throw new Error('precipitation');await clean();
  await start(4);await pick('tweezers');await click('zinc');await pick('tweezers');await click('beaker');await pick('tube');await click('beaker');await open('acid');await dose('acid');await dose('acid');await page.waitForTimeout(5000);await observe();results.zinc=(await read()).vessel;if(Math.abs(results.zinc.collected.H2-.001)>1e-8)throw new Error('zinc');await clean();
  await start(5);await pick('tweezers');await click('zinc');await pick('tweezers');await click('beaker');await open('acid');await dose('acid');await dose('acid');await pick('beaker');await click('scale');await pick('stopper');await click('beaker');await click('stirrer');await page.waitForTimeout(5500);await pick('beaker');await click('scale');const sealed=(await read()).vessel;await pick('stopper');
  const home=await page.evaluate(()=>window.__labEvidence.projected.stopperHome);await page.mouse.move(...home);await page.keyboard.press('Escape');await page.waitForTimeout(1500);
  // Drag the stopper to its real, unlabelled place on the worktop to open the assembly.
  const a=await page.evaluate(()=>window.__labEvidence.projected.stopper);await page.mouse.move(...a);await page.mouse.down();await page.mouse.move(a[0]+20,a[1]+20,{steps:4});const b=await page.evaluate(()=>window.__labEvidence.projected.stopperHome);await page.mouse.move(...b,{steps:16});await page.mouse.up();await page.waitForTimeout(1800);
  const opened=(await read()).vessel;if(!sealed.closed||sealed.gas.H2!==.001||opened.closed||opened.escaped.H2!==.001)throw new Error('sealed transition');results.sealed={retained:sealed.gas,escaped:opened.escaped};await clean();
  if(await page.locator('button,article,.parchment').count())throw new Error('floating UI present');await page.screenshot({path:'output/playwright/physical-six-complete.png'});
  return {results,noFloatingInterface:true};
}
