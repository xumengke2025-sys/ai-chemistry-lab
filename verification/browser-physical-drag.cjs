async (page) => {
  await page.setViewportSize({width:1440,height:900});await page.reload();await page.waitForFunction(()=>window.__labEvidence);await page.waitForTimeout(2200);
  const read=()=>page.evaluate(()=>window.__labEvidence.world);
  const point=id=>page.evaluate(key=>window.__labEvidence.projected[key],id);
  const click=async id=>{await page.mouse.click(...await point(id));await page.waitForTimeout(1800);};
  const escape=async()=>{await page.keyboard.press('Escape');await page.waitForTimeout(1800);};
  const drag=async(id,target)=>{const a=await point(id);await page.mouse.move(...a);await page.mouse.down();await page.mouse.move(a[0]+20,a[1]+20,{steps:4});const b=await point(target);await page.mouse.move(...b,{steps:20});await page.mouse.up();await page.waitForTimeout(1800);};
  await escape();await click('notebook');await click('notebookExp0');await click('notebookClose');
  await drag('measure','acid');const closed=await read();if(closed.toolLiquid.measure||!closed.feedback.includes('先打开'))throw new Error(`closed source: ${closed.feedback}`);
  const a=await point('copperSulfate'),before=await read();await page.mouse.move(...a);await page.mouse.down();await page.mouse.move(a[0]+80,a[1]+40,{steps:10});await page.keyboard.press('Escape');await page.mouse.up();await page.waitForTimeout(1800);
  const cancelled=await read();if(cancelled.busy||cancelled.angle||cancelled.vessel.volume||cancelled.stock.copperSulfate!==before.stock.copperSulfate)throw new Error('cancel changed chemistry or left a busy gesture');
  await drag('copperSulfate','beaker');if((await read()).docked!=='copperSulfate')throw new Error('drag docking failed');
  await click('copperSulfate');await click('copperSulfateCap');if(!(await read()).opened.copperSulfate)throw new Error('physical cap failed');
  const p=await point('copperSulfate');await page.mouse.move(...p);await page.mouse.down();await page.mouse.move(p[0],p[1]-110,{steps:15});await page.waitForTimeout(1200);await page.mouse.up();await page.waitForTimeout(500);
  const poured=await read();if(!poured.vessel.volume)throw new Error('upward pour failed');await page.waitForTimeout(700);if((await read()).vessel.volume!==poured.vessel.volume)throw new Error('pour continues');
  await escape();await drag('tweezers','iron');const clamped=await read();if(!clamped.clamp.Fe)throw new Error(`drag clamping: ${clamped.feedback}`);
  await drag('tweezers','beaker');await page.waitForTimeout(6000);if(!(await read()).vessel.extent.displacement)throw new Error('drag metal transfer failed');
  await drag('stopper','beaker');await drag('measure','copperSulfate');const loaded=await read();if(loaded.toolLiquid.measure?.ml!==10)throw new Error('drag measurement failed');
  await drag('measure','beaker');const sealed=await read();if(sealed.toolLiquid.measure?.ml!==10||sealed.vessel.volume!==loaded.vessel.volume||!sealed.feedback.includes('密闭'))throw new Error(`sealed rejection: ${sealed.feedback}`);
  await page.screenshot({path:'output/playwright/physical-drag-sealed.png'});
  await drag('stopper','stopperHome');await drag('tweezers','beaker');await drag('tweezers','recovery');await drag('beaker','waste');await drag('beaker','wash');const end=await read();if(end.dirty||end.vessel.volume||!end.recovered.Cu)throw new Error('drag cleanup failed');
  await escape();await click('notebook');await page.setViewportSize({width:391,height:889});await page.waitForTimeout(2200);await click('notebookExp4');if((await read()).experiment!==4)throw new Error('narrow notebook page failed');await page.screenshot({path:'output/playwright/physical-current-narrow-book.png'});await click('notebookClose');await page.screenshot({path:'output/playwright/physical-current-narrow-room.png'});
  if(await page.locator('button,article,.parchment').count())throw new Error('floating interface');
  await page.setViewportSize({width:1440,height:900});
  return {closedSourceRejected:closed.feedback,cancelledWithoutTransfer:true,dragDocking:true,upwardPoured:poured.vessel.volume,pourStopped:true,dragClamped:clamped.clamp,sealedRejected:sealed.feedback,recovered:end.recovered,cleaned:!end.dirty,narrowPageSelection:true,noFloatingUI:true};
}
