async (page) => {
  await page.setViewportSize({width:1440,height:900}); await page.reload();
  await page.waitForFunction(()=>window.__labEvidence); await page.waitForTimeout(2200);
  const read=()=>page.evaluate(()=>window.__labEvidence.world);
  const click=async id=>{const p=await page.evaluate(id=>window.__labEvidence.projected[id],id);if(!p||p[0]<0||p[0]>1440||p[1]<0||p[1]>900)throw new Error(`target outside screen ${id}`);await page.mouse.click(...p);await page.waitForTimeout(1450);};
  const escape=async()=>{await page.keyboard.press('Escape');await page.waitForTimeout(1500);};
  const start=async i=>{await escape();await click('notebook');await click(`notebookExp${i}`);await click('notebookClose');if((await read()).experiment!==i)throw new Error('experiment selection');};
  const pick=async id=>{for(let n=0;n<3;n++){await click(id);if(await page.evaluate(()=>window.__labEvidence.interaction.held)===id)return;}throw new Error(`pickup ${id}: ${JSON.stringify(await read())}`);};
  const open=async id=>{await escape();await click(id);await click(`${id}Cap`);if(!(await read()).opened[id])throw new Error(`open ${id}`);await escape();};
  const dose=async(source,tool='measure')=>{await pick(tool);await click(source);await pick(tool);await click('beaker');};
  const photo=async name=>{await click('beaker');await page.waitForTimeout(1000);await page.screenshot({path:`output/playwright/showcase-${name}.png`});};
  const clean=async()=>{await escape();await pick('beaker');await click('waste');await pick('beaker');await click('wash');if((await read()).dirty||(await read()).vessel.volume)throw new Error('cleanup');};
  const approx=(actual,expected)=>{if(Math.abs((actual??0)-expected)>1e-9)throw new Error(`amount ${actual} != ${expected}`);};
  const results={};
  // Restore may contain a cup on the balance from an interrupted experiment.
  // Clear it through the same waste and wash operations before reaching the book.
  if((await read()).dirty||(await read()).vessel.volume)await clean();
  await start(0);await open('copperSulfate');await dose('copperSulfate');await pick('tweezers');await click('iron');await pick('tweezers');await click('beaker');await page.waitForTimeout(4000);
  results.iron=(await read()).vessel;approx(results.iron.contents.Cu,.001);approx(results.iron.volume,10);await photo('iron');await click('lens');await page.screenshot({path:'output/playwright/showcase-iron-particles.png'});await escape();
  await pick('tweezers');await click('beaker');await pick('tweezers');await click('recovery');await clean();
  await start(1);await open('acid');await dose('acid');await open('indicator');await dose('indicator','pipette');await open('base');await dose('base');await page.waitForTimeout(4000);
  results.neutral=(await read()).vessel;approx(results.neutral.contents.H,0);approx(results.neutral.contents.OH,0);approx(results.neutral.extent.neutralization,.001);await photo('neutral');
  await escape();await dose('base','pipette');await page.waitForTimeout(1000);results.baseExcess=(await read()).vessel;approx(results.baseExcess.contents.OH,.00005);await photo('base-excess');await clean();
  await start(3);await open('copperSulfate');await dose('copperSulfate');await open('base');await dose('base');await page.waitForTimeout(4000);
  results.precipitate=(await read()).vessel;approx(results.precipitate.contents.precipitate,.0005);approx(results.precipitate.contents.CuIon,.0005);await photo('precipitate');await click('lens');await page.screenshot({path:'output/playwright/showcase-precipitate-particles.png'});await escape();await clean();
  if(await page.locator('button,article,.parchment').count())throw new Error('floating UI');
  return {results,cleaned:true,physicalMouseActions:true,noFloatingInterface:true};
}
