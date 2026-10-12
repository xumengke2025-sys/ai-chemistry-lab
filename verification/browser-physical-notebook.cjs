async (page) => {
  await page.setViewportSize({width:1440,height:900});await page.reload();await page.waitForFunction(()=>window.__labEvidence);await page.waitForTimeout(2200);
  const read=()=>page.evaluate(()=>({world:window.__labEvidence.world,ui:window.__labEvidence.interaction}));
  const click=async(id)=>{const p=await page.evaluate(id=>window.__labEvidence.projected[id],id);await page.mouse.click(...p);await page.waitForTimeout(2000);};
  await page.screenshot({path:'output/playwright/physical-room.png'});if(await page.locator('button,article,.parchment').count())throw new Error('floating interface still present');
  await click('notebook');if(!(await read()).ui.bookOpen)throw new Error('physical book did not open');await page.screenshot({path:'output/playwright/physical-notebook.png'});
  const selected=[];for(let i=0;i<6;i++){await click(`notebookExp${i}`);if((await read()).world.experiment!==i)throw new Error(`physical page ${i} failed`);selected.push(i);}
  await click('notebookExp0');await click('notebookSketch');if((await read()).world.selected!=='copperSulfate')throw new Error('ink drawing did not approach bottle');
  await click('copperSulfateCap');await click('copperSulfate');if((await read()).ui.held!=='copperSulfate')throw new Error('second click did not pick bottle');await click('beaker');
  const placed=await read();if(placed.world.docked!=='copperSulfate')throw new Error('physical cup placement failed');
  await click('copperSulfate');const p=await page.evaluate(()=>window.__labEvidence.projected.copperSulfate);await page.mouse.move(...p);await page.mouse.down();await page.mouse.move(p[0]+110,p[1],{steps:14});await page.waitForTimeout(1300);await page.mouse.up();await page.waitForTimeout(600);
  const poured=(await read()).world;if(!poured.vessel.volume)throw new Error('physical pour failed');await page.waitForTimeout(600);if((await read()).world.vessel.volume!==poured.vessel.volume)throw new Error('pour did not stop');await page.screenshot({path:'output/playwright/physical-pour.png'});
  await page.keyboard.press('Escape');await page.waitForTimeout(2000);
  const pick=async id=>{await click(id);await click(id);if((await read()).ui.held!==id)throw new Error(`pick failed ${id}`);};
  await pick('tweezers');await click('iron');if(!(await read()).world.clamp.Fe)throw new Error('physical iron pickup failed');await pick('tweezers');await click('beaker');await page.waitForTimeout(6500);
  await click('lens');if(!(await read()).world.micro)throw new Error('lens failed');await page.screenshot({path:'output/playwright/physical-reaction.png'});await page.keyboard.press('Escape');await page.waitForTimeout(2000);
  await pick('tweezers');await click('beaker');await pick('tweezers');await click('recovery');await pick('beaker');await click('waste');await pick('beaker');await click('wash');
  const end=await read();if(end.world.dirty||end.world.vessel.volume||!end.world.recovered.Cu)throw new Error('physical cleanup failed');
  await click('notebook');await page.screenshot({path:'output/playwright/physical-complete.png'});
  await page.setViewportSize({width:391,height:889});await page.waitForTimeout(2400);await page.screenshot({path:'output/playwright/physical-notebook-narrow.png'});await click('notebookExp4');if((await read()).world.experiment!==4)throw new Error('narrow book selection failed');
  await click('notebookClose');await page.screenshot({path:'output/playwright/physical-narrow.png'});
  return {noFloatingInterface:true,selected,poured:poured.vessel.volume,recovered:end.world.recovered,cleaned:!end.world.dirty,guideSteps:end.ui.completed,narrowPageSelection:true};
}
