async(page)=>{
  await page.setViewportSize({width:1440,height:900});await page.reload();await page.waitForFunction(()=>window.__labEvidence);await page.waitForTimeout(2200);
  const read=()=>page.evaluate(()=>window.__labEvidence.world);
  const click=async id=>{const p=await page.evaluate(id=>window.__labEvidence.projected[id],id);await page.mouse.click(...p);await page.waitForTimeout(1600);};
  const pick=async id=>{for(let n=0;n<3;n++){await click(id);if(await page.evaluate(()=>window.__labEvidence.interaction.held)===id)return;}throw new Error(`pick ${id}`);};
  const escape=async()=>{await page.keyboard.press('Escape');await page.waitForTimeout(1600);};
  await escape();await click('notebook');await click('notebookExp3');await click('notebookClose');
  for(const source of ['copperSulfate','base']){await escape();await click(source);await click(`${source}Cap`);await escape();await pick('measure');await click(source);await pick('measure');await click('beaker');}
  await page.waitForTimeout(4000);const v=(await read()).vessel;if(Math.abs(v.contents.precipitate-.0005)>1e-9)throw new Error('precipitate amount');
  await click('beaker');await page.screenshot({path:'output/playwright/showcase-precipitate.png'});
  await escape();await pick('beaker');await click('waste');await pick('beaker');await click('wash');
  return {vessel:v,cleaned:!(await read()).dirty};
}
