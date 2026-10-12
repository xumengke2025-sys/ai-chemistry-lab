async (page) => {
  await page.screenshot({path:'verification/debug.png'});
  return await page.evaluate(() => ({ world: window.__labEvidence.world, points: window.__labEvidence.projected, view: document.querySelector('main').dataset.view, text: document.body.innerText }));
}
