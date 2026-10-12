async(page)=>{
  await page.setViewportSize({width:1440,height:900});await page.reload();await page.waitForFunction(()=>window.__labEvidence?.roomObjects);await page.waitForTimeout(2400);
  const read=()=>page.evaluate(()=>({world:window.__labEvidence.world,focus:window.__labEvidence.roomFocus,mechanisms:window.__labEvidence.roomMechanisms,room:window.__labEvidence.roomObjects}));
  const inventory=world=>JSON.stringify(Object.fromEntries(['stock','solids','opened','vessel','waste','recovered','clamp','toolLiquid','chamber','dirty','powderStock','spoonLoad','heating'].map(k=>[k,world[k]])));
  const initial=inventory((await read()).world),results=[];
  const click=async id=>{const item=(await read()).room[id];if(!item)throw new Error(`unregistered ${id}`);const p=item.point;if(p[0]<0||p[0]>1440||p[1]<0||p[1]>900)throw new Error(`outside screen ${id}: ${p}`);await page.mouse.click(...p);await page.waitForTimeout(1800);return (await read()).focus;};
  const home=async()=>{await page.keyboard.press('Escape');await page.waitForTimeout(2000);};
  for(const id of ['bench-drawer-1','cabinet-door-1','curtain-3.1-1','stool','writing-drawer-0','writing-chair','balance-weight-1','retort-head','retort-receiver','bell-cap']){
    await home();const focus=await click(id);if(!(await read()).mechanisms[id])throw new Error(`did not open ${id}: ${JSON.stringify(focus)}`);
    await page.screenshot({path:`output/playwright/room-${id}.png`});await click(id);if((await read()).mechanisms[id])throw new Error(`did not close ${id}`);results.push({id,opened:true,closed:true});
  }
  await home();await click('portrait');if((await read()).focus?.id!=='portrait')throw new Error('portrait not focused');await page.screenshot({path:'output/playwright/room-portrait.png'});results.push({id:'portrait',viewed:true});
  await home();const books=Object.entries((await read()).room).filter(([id,item])=>item.name==='皮面装订书'&&item.point[0]>0&&item.point[0]<1440&&item.point[1]>0&&item.point[1]<900);if(!books.length)throw new Error('no visible book');
  const book=books[Math.floor(books.length/2)][0];const bookFocus=await click(book);if(bookFocus?.name!=='皮面装订书'||!(await read()).mechanisms[bookFocus.id])throw new Error('book did not draw out');await click(bookFocus.id);if((await read()).mechanisms[bookFocus.id])throw new Error('book did not return');results.push({id:bookFocus.id,opened:true,closed:true});
  if(inventory((await read()).world)!==initial)throw new Error('room changed chemical inventory');
  await home();const point=await page.evaluate(()=>window.__labEvidence.projected.notebook);await page.mouse.click(...point);await page.waitForTimeout(2000);await page.screenshot({path:'output/playwright/room-notebook-reference.png'});
  if(await page.locator('button,article,.parchment').count())throw new Error('floating UI');
  return {results,chemicalInventoryUnchanged:true,noFloatingUI:true,registeredObjects:Object.keys((await read()).room).length};
}
