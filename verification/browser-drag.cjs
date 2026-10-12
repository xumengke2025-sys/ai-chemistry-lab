async (page) => {
  await page.reload(); await page.waitForFunction(() => window.__labEvidence); await page.waitForTimeout(2200);
  const p = await page.evaluate(() => window.__labEvidence.projected.copperSulfate);
  await page.mouse.move(...p); await page.mouse.down();
  const down = await page.evaluate(() => ({busy:window.__labEvidence.world.busy, view:document.querySelector('main').dataset.view}));
  await page.mouse.move(p[0] + 30, p[1] + 30, { steps: 5 }); await page.waitForTimeout(1500);
  const move = await page.evaluate(() => ({busy:window.__labEvidence.world.busy, view:document.querySelector('main').dataset.view, points:window.__labEvidence.projected}));
  const b = move.points.beaker; await page.mouse.move(...b, {steps:20}); await page.mouse.up(); await page.waitForTimeout(400);
  await page.screenshot({path:'verification/drag-diagnostic.png'});
  return { down, move, final:await page.evaluate(()=>({busy:window.__labEvidence.world.busy, docked:window.__labEvidence.world.docked, feedback:window.__labEvidence.world.feedback}))};
}
