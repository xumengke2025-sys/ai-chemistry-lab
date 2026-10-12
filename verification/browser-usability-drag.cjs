async (page) => {
  await page.setViewportSize({width:1440,height:900});await page.reload();await page.waitForFunction(()=>window.__labEvidence);await page.waitForTimeout(1800);
  const read=()=>page.evaluate(()=>window.__labEvidence.world);
  const point=id=>page.evaluate(key=>window.__labEvidence.projected[key],id);
  const button=async name=>{await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(1800);};
  const drag=async(id,target)=>{const a=await point(id);await page.mouse.move(...a);await page.mouse.down();await page.mouse.move(a[0]+20,a[1]+20,{steps:4});await page.waitForTimeout(800);const b=await point(target);await page.mouse.move(...b,{steps:20});await page.mouse.up();await page.waitForTimeout(1800);};
  const hide=async()=>{await page.keyboard.press('Escape');if(await page.getByRole('button',{name:'收起操作图解',exact:true}).count())await button('收起操作图解');};
  await button('打开实验记录本');await button('铁与硫酸铜');await button('收起操作图解');
  await drag('measure','acid');const closed=await read();if(closed.toolLiquid.measure||!closed.feedback.includes('先打开'))throw new Error(`closed source: ${closed.feedback}`);
  await drag('copperSulfate','beaker');if((await read()).docked!=='copperSulfate')throw new Error('drag docking failed');
  const p=await point('copperSulfate');await page.mouse.click(...p);await page.waitForTimeout(1800);await button('打开瓶塞');
  const a=await point('copperSulfate');await page.mouse.move(...a);await page.mouse.down();await page.mouse.move(a[0],a[1]-110,{steps:15});await page.waitForTimeout(1200);await page.mouse.up();await page.waitForTimeout(500);
  const poured=await read();if(!poured.vessel.volume)throw new Error('upward pour failed');await page.waitForTimeout(600);if((await read()).vessel.volume!==poured.vessel.volume)throw new Error('pour continues');
  await hide();await drag('tweezers','iron');const clamped=await read();if(!clamped.clamp.Fe)throw new Error(`drag clamping: ${clamped.feedback}`);
  await drag('tweezers','beaker');await page.waitForTimeout(6000);if(!(await read()).vessel.extent.displacement)throw new Error('drag metal transfer failed');
  await drag('stopper','beaker');await drag('measure','copperSulfate');const loaded=await read();if(loaded.toolLiquid.measure?.ml!==10)throw new Error('drag measurement failed');
  await drag('measure','beaker');const sealed=await read();if(sealed.toolLiquid.measure?.ml!==10||sealed.vessel.volume!==loaded.vessel.volume||!sealed.feedback.includes('密闭'))throw new Error(`sealed rejection failed: ${sealed.feedback}`);
  await page.screenshot({path:'output/playwright/usability-drag-sealed.png'});
  await drag('stopper','stopperHome');await drag('beaker','waste');await drag('beaker','wash');const end=await read();if(end.dirty||end.vessel.volume)throw new Error('drag cleanup failed');
  return {closedSourceRejected:closed.feedback,dragDocking:true,upwardPoured:poured.vessel.volume,dragClamped:clamped.clamp,sealedRejected:sealed.feedback,cleaned:!end.dirty};
}
