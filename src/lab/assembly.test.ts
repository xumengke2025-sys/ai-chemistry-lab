import { test } from 'node:test';
import assert from 'node:assert/strict';
import { amount, mass, advance, inventory, elementalTotals } from './chemistry';
import { dropItem, initialWorld, validSnapshot, worldInventory, weighingMass } from './world';
import { items } from './registry';
const close = (a: number, b: number) => assert.ok(Math.abs(a-b) < 1e-8, `${a} != ${b}`);
test('powder weighing, dissolution and acid reaction conserve stock and elements', () => {
  let w = initialWorld(2); const before = elementalTotals(worldInventory(w)); w.opened.water = true; w.opened.acid = true;
  w = dropItem(w,'measure',w.positions.water); w = dropItem(w,'measure',w.positions.beaker);
  w = dropItem(w,'spoon',w.positions.powder); w = dropItem(w,'spoon',w.positions.scale); close(weighingMass(w),0.1);
  w = dropItem(w,'spoon',w.positions.beaker); w = dropItem(w,'measure',w.positions.acid); w = dropItem(w,'measure',w.positions.beaker);
  for (let i=0;i<200;i++) advance(w.vessel,0.05);
  close(amount(w.vessel.escaped,'CO2'),0.0005); close(mass(w.vessel.escaped),0.0220045);
  const after = elementalTotals(worldInventory(w)); for (const element of Object.keys(before)) close(before[element],after[element]); assert.ok(validSnapshot(w));
});
test('closed assembly follows cup during reweighing; gas mass stays in system', () => {
  let w = initialWorld(5); w.opened.acid = true; w = dropItem(w,'tweezers',w.positions.zinc); w = dropItem(w,'tweezers',w.positions.beaker);
  for (let i=0;i<2;i++) { w = dropItem(w,'measure',w.positions.acid); w = dropItem(w,'measure',w.positions.beaker); }
  w = dropItem(w,'beaker',w.positions.scale); const start = weighingMass(w); w = dropItem(w,'stopper',w.positions.beaker);
  w.vessel.contents.Zn = w.chamber.Zn; w.chamber = {}; for(let i=0;i<200;i++) advance(w.vessel,0.05);
  w = dropItem(w,'beaker',items.scale.home); close(weighingMass(w),start); close(mass(w.vessel.gas),0.002016); assert.ok(validSnapshot(w));
  w = dropItem(w,'stopper',items.stopper.home); w = dropItem(w,'beaker',items.scale.home); close(weighingMass(w),start-0.002016); assert.ok(validSnapshot(w));
});
test('collected gas remains outside cup after connected cup is moved', () => {
  let w = initialWorld(); w = dropItem(w,'tube',w.positions.beaker); w = dropItem(w,'beaker',items.scale.home);
  assert.ok(w.vessel.connected); close(w.positions.tube[0]-w.positions.beaker[0],0.15); assert.ok(validSnapshot(w));
  const before = inventory(w.vessel); w = dropItem(w,'tube',items.tube.home); assert.equal(w.vessel.connected,false); assert.deepEqual(inventory(w.vessel),before);
});
test('invalid placement does not detach a sealed or connected system', () => {
  let w = initialWorld(); w = dropItem(w,'stopper',w.positions.beaker); w.vessel.gas.H2 = 0.001;
  w = dropItem(w,'stopper',[20,1,20]); assert.ok(w.vessel.closed); close(w.vessel.gas.H2!,0.001); assert.equal(amount(w.vessel.escaped,'H2'),0);
  let connected = initialWorld(); connected = dropItem(connected,'tube',connected.positions.beaker); connected = dropItem(connected,'tube',[20,1,20]); assert.ok(connected.vessel.connected);
});
test('emptying a docked cup returns its source bottle to a supported home', () => {
  let w = initialWorld(); w = dropItem(w, 'copperSulfate', w.positions.beaker);
  assert.equal(w.docked, 'copperSulfate'); const stock = w.stock.copperSulfate;
  w = dropItem(w, 'beaker', items.waste.home);
  assert.equal(w.docked, null); assert.deepEqual(w.positions.copperSulfate, items.copperSulfate.home);
  close(w.stock.copperSulfate, stock); assert.ok(validSnapshot(w));
});
