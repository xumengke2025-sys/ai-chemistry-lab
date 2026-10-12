async (page) => {
  await page.setViewportSize({width:1440,height:900});await page.waitForFunction(()=>window.__labEvidence);await page.waitForTimeout(1500);
  const read=()=>page.evaluate(()=>window.__labEvidence.world);
  const button=async name=>{await page.getByRole('button',{name,exact:true}).click({timeout:10000});await page.waitForTimeout(1400);};
  await button('打开实验记录本');await button('铁与硫酸铜');
  await page.screenshot({path:'output/playwright/usability-guide.png'});
  await button('找到硫酸铜溶液');await button('打开瓶塞');
  await page.screenshot({path:'output/playwright/usability-bottle.png'});
  await button('拿起硫酸铜溶液');
  await page.screenshot({path:'output/playwright/usability-place.png'});
  await button('放到杯口');await button('找到硫酸铜溶液');
  const p=await page.evaluate(()=>window.__labEvidence.projected.copperSulfate);
  await page.mouse.move(...p);await page.mouse.down();await page.mouse.move(p[0]+115,p[1],{steps:16});await page.waitForTimeout(1600);await page.mouse.up();
  const poured=await read();if(poured.vessel.volume<=0)throw new Error('rightward pour did not transfer liquid');
  await page.waitForTimeout(500);const stopped=await read();await page.waitForTimeout(500);if((await read()).vessel.volume!==stopped.vessel.volume)throw new Error('pour did not stop on release');
  await button('收起介绍');await button('找到镊子');await button('拿起镊子');await button('夹取铁钉');
  await button('找到镊子');await button('拿起镊子');await button('投入金属');await page.waitForTimeout(7000);
  await button('找到观察镜');await button('展开化学图景');await page.screenshot({path:'output/playwright/usability-observe.png'});
  await button('收起介绍');await button('找到镊子');await button('拿起镊子');await button('取回杯中金属');
  await button('找到镊子');await button('拿起镊子');await button('放入回收托盘');
  await button('找到残液收集罐');await button('拿起反应杯');await button('倒入残液罐');
  await button('找到清洗陶盆');await button('拿起反应杯');await button('清洗空杯');
  await page.getByRole('heading',{name:'可以开始下一次实验',exact:true}).waitFor({timeout:10000});
  const end=await read();await page.screenshot({path:'output/playwright/usability-first-complete.png'});
  if(end.dirty||end.vessel.volume||!end.recovered.Cu)throw new Error('cleanup or retrieval incomplete');
  return {poured:poured.vessel.volume,sourceRemaining:poured.stock.copperSulfate,recovered:end.recovered,waste:end.waste,cleaned:!end.dirty,guideCompleted:true};
}
