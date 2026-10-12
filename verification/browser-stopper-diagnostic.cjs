async(page)=>{
  const read=()=>page.evaluate(()=>({gesture:window.__labGesture,world:window.__labEvidence.world}));
  const a=await page.evaluate(()=>window.__labEvidence.projected.stopper);await page.mouse.move(...a);await page.mouse.down();const down=await read();await page.mouse.move(a[0]+20,a[1]+20,{steps:4});const moved=await read();const b=await page.evaluate(()=>window.__labEvidence.projected.beaker);await page.mouse.move(...b,{steps:20});const target=await read();await page.mouse.up();await page.waitForTimeout(1800);const up=await read();
  return {points:{a,b},down:down.gesture,moved:moved.gesture,target:target.gesture,up:up.gesture,closed:up.world.vessel.closed,stopper:up.world.positions.stopper,feedback:up.world.feedback};
}
