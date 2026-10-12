async (page) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForFunction(() => window.__labEvidence, { timeout: 20000 });
  await page.screenshot({ path: 'verification/interactive-room.png' });
  console.log(await page.evaluate(() => ({ evidence: window.__labEvidence.projected, view: document.querySelector('main').dataset.view, text: document.body.innerText })));
}
