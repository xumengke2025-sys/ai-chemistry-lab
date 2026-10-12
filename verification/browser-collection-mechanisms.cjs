async(page)=>{
  await page.setViewportSize({width:1440,height:900});await page.reload();await page.waitForFunction(()=>window.__labEvidence?.roomObjects);await page.waitForTimeout(2200);
  const read=()=>page.evaluate(()=>({world:window.__labEvidence.world,room:window.__labEvidence.roomObjects,states:window.__labEvidence.roomMechanisms,focus:window.__labEvidence.roomFocus}));
  const inventory=w=>JSON.stringify(['stock','solids','vessel','waste','recovered','clamp','toolLiquid','chamber','dirty','powderStock','spoonLoad'].map(k=>w[k]));const initial=inventory((await read()).world),results=[];
  const click=async id=>{const p=(await read()).room[id].point;if(p[0]<0||p[0]>1440||p[1]<0||p[1]>900)throw new Error(`outside ${id}: ${p}`);await page.mouse.click(...p);await page.waitForTimeout(1800);};
  for(const id of ['writing-chair','balance-weight-1','retort-head','retort-receiver','bell-cap']){
    await page.keyboard.press('Escape');await page.waitForTimeout(2000);await click(id);const opened=await read();if(!opened.states[id])throw new Error(`did not move ${id}: ${JSON.stringify(opened.focus)}`);await page.screenshot({path:`output/playwright/room-${id}.png`});await click(id);if((await read()).states[id])throw new Error(`did not return ${id}`);results.push({id,moved:true,returned:true});
  }
  if(inventory((await read()).world)!==initial)throw new Error('collection mechanisms changed chemical inventory');return {results,chemicalInventoryUnchanged:true,registeredObjects:Object.keys((await read()).room).length};
}
