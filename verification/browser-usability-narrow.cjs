async (page) => {
  await page.setViewportSize({width:391,height:889});await page.reload();await page.waitForFunction(()=>window.__labEvidence);await page.waitForTimeout(2000);
  const read=()=>page.evaluate(()=>window.__labEvidence.world);
  const button=async name=>{await page.getByRole('button',{name,exact:true}).click({timeout:10000});await page.waitForTimeout(1500);};
  const paper=async name=>{const b=await page.locator('.parchment').boundingBox();if(!b||b.x<0||b.y<0||b.x+b.width>392||b.y+b.height>890)throw new Error(`${name} outside viewport: ${JSON.stringify(b)}`);await page.screenshot({path:`output/playwright/usability-narrow-${name}.png`});return b;};
  const welcome=await paper('welcome');await button('打开实验记录本');await button('铁与硫酸铜');const guide=await paper('guide');
  await button('找到硫酸铜溶液');const introduction=await paper('bottle');await button('打开瓶塞');
  const before=await read();await button('拿起硫酸铜溶液');await button('取消拿取');const cancelled=await read();if(cancelled.stock.copperSulfate!==before.stock.copperSulfate||cancelled.vessel.volume!==before.vessel.volume)throw new Error('cancel transferred');
  await button('找到硫酸铜溶液');await button('拿起硫酸铜溶液');await page.keyboard.press('Escape');await page.waitForTimeout(1500);if(await page.getByRole('button',{name:'取消拿取',exact:true}).count())throw new Error('escape did not cancel');
  await button('找到硫酸铜溶液');await button('拿起硫酸铜溶液');await button('放到杯口');await button('找到硫酸铜溶液');
  const p=await page.evaluate(()=>window.__labEvidence.projected.copperSulfate);await page.mouse.move(...p);await page.mouse.down();await page.mouse.move(p[0]+90,p[1],{steps:12});await page.waitForTimeout(1600);await page.mouse.up();const poured=await read();if(!poured.vessel.volume)throw new Error('narrow pour failed');
  await button('收起介绍');await button('找到镊子');await button('拿起镊子');await button('夹取铁钉');await button('找到镊子');await button('拿起镊子');await button('投入金属');await page.waitForTimeout(7000);
  await button('找到观察镜');await button('展开化学图景');await page.screenshot({path:'output/playwright/usability-narrow-observe.png'});await button('收起介绍');
  await button('找到镊子');await button('拿起镊子');await button('取回杯中金属');await button('找到镊子');await button('拿起镊子');await button('放入回收托盘');
  await button('找到残液收集罐');await button('拿起反应杯');await button('倒入残液罐');await button('找到清洗陶盆');await button('拿起反应杯');await button('清洗空杯');
  await page.getByRole('heading',{name:'可以开始下一次实验',exact:true}).waitFor();await paper('complete');const end=await read();if(end.dirty||end.vessel.volume||!end.recovered.Cu)throw new Error('narrow cleanup failed');
  return {viewport:'391x889',welcome,guide,introduction,cancelConserves:true,escapeCancels:true,poured:poured.vessel.volume,cleaned:!end.dirty,recovered:end.recovered};
}
