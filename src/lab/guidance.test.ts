import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialWorld, dropItem, worldInventory } from './world';
import { clickTargets, experimentSteps } from './guidance';
import { useInteraction } from './interaction';

test('click placement offers liquid sources only when open and forbids adding to sealed cups',()=>{
  const w=initialWorld();assert.ok(!clickTargets(w,'measure').some(t=>!t.home));
  w.opened.acid=true;assert.ok(clickTargets(w,'measure').some(t=>t.id==='acid'&&!t.home));
  w.toolLiquid.measure={reagent:'acid',ml:10};w.vessel.closed=true;
  assert.deepEqual(clickTargets(w,'measure'),[{id:'measure',label:'放回原位',home:true}]);
});
test('loaded tweezers offer adding/recovery while empty tweezers offer actual metal stocks',()=>{
  let w=initialWorld();assert.ok(clickTargets(w,'tweezers').some(t=>t.id==='iron'));
  w=dropItem(w,'tweezers',w.positions.iron);
  assert.ok(!clickTargets(w,'tweezers').some(t=>t.id==='iron'));
  assert.ok(clickTargets(w,'tweezers').some(t=>t.id==='recovery'));
});
test('looking at chemistry without observing it does not finish a guide observation step',()=>{
  const w=initialWorld(3);w.vessel.extent.precipitation=.0005;
  const index=experimentSteps(w).findIndex(s=>s.drawing==='observe');
  assert.equal(experimentSteps(w,false)[index].done,false);assert.equal(experimentSteps(w,true)[index].done,true);
});
test('picking and cancelling never removes or manufactures material; restart clears progress',()=>{
  const w=initialWorld(),before=worldInventory(w);useInteraction.getState().pick('acid');
  useInteraction.getState().complete(5);useInteraction.getState().cancel();assert.deepEqual(worldInventory(w),before);
  useInteraction.getState().resetProgress();assert.equal(useInteraction.getState().held,null);assert.equal(useInteraction.getState().completed,0);
});
test('replacing a bottle at the cup returns the previous bottle to its own support',()=>{
  let w=initialWorld();const before=worldInventory(w);w=dropItem(w,'acid',w.positions.beaker);w=dropItem(w,'base',w.positions.beaker);
  assert.equal(w.docked,'base');assert.deepEqual(w.positions.acid,initialWorld().positions.acid);assert.deepEqual(worldInventory(w),before);
});
