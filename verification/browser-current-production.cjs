async(page)=>{
  await page.setViewportSize({width:1440,height:900});await page.goto('http://127.0.0.1:4173/');await page.waitForFunction(()=>document.querySelector('canvas')?.width>0);await page.bringToFront();await page.waitForTimeout(8000);
  const profile=()=>page.evaluate(async()=>{
    const deltas=[];let last=performance.now();await new Promise(resolve=>{const start=last;const frame=now=>{deltas.push(now-last);last=now;if(now-start>=6000)resolve();else requestAnimationFrame(frame);};requestAnimationFrame(frame);});
    deltas.sort((a,b)=>a-b);const gl=document.querySelector('canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');
    return {samples:deltas.length,meanFps:1000/(deltas.reduce((a,b)=>a+b,0)/deltas.length),p95FrameMs:deltas[Math.floor(deltas.length*.95)],gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable',viewport:[innerWidth,innerHeight],dpr:devicePixelRatio};
  });
  const desktop=await profile();await page.screenshot({path:'output/playwright/room-production-desktop.png'});await page.setViewportSize({width:391,height:889});await page.waitForTimeout(2000);const narrow=await profile();await page.screenshot({path:'output/playwright/room-production-narrow.png'});await page.setViewportSize({width:1440,height:900});
  return {url:page.url(),title:await page.title(),noFloatingUI:await page.locator('button,article,.parchment').count()===0,developmentTelemetry:await page.evaluate(()=>!!window.__labEvidence),desktop,narrow};
}
