import { test } from 'node:test';
import assert from 'node:assert/strict';
import { add, addLiquid, advance, amount, elementalTotals, emptyVessel, inventory, mass, openVessel, pH, reactions, type Composition, type Species } from './chemistry';
import { dropItem, initialWorld, validSnapshot, weighingMass, worldInventory } from './world';
import { items } from './registry';
const close = (a: number, b: number, tolerance = 1e-9) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);
const conserved = (before: Composition, after: Composition) => {
  close(mass(before), mass(after)); const a = elementalTotals(before), b = elementalTotals(after);
  for (const element of new Set([...Object.keys(a), ...Object.keys(b)])) close(a[element] ?? 0, b[element] ?? 0);
};
const finish = (v: ReturnType<typeof emptyVessel>, step = 0.05) => { for (let i = 0; i < 30 / step; i++) advance(v, step); };
for (const reaction of reactions) test(`stoichiometry conserves ${reaction.id}`, () => conserved(reaction.reactants, reaction.products));
for (const [grams, ml, expected] of [[0.014, 40, 0.014 / 55.845], [0.28, 10, 0.001], [0.14, 0, 0]]) test(`iron ${grams}g / ${ml}mL`, () => {
  const v = emptyVessel(); addLiquid(v, 'copperSulfate', ml); add(v.contents, 'Fe', grams / 55.845); const before = inventory(v); finish(v);
  close(amount(v.contents, 'Cu'), expected); close(amount(v.contents, 'Fe'), grams / 55.845 - expected); conserved(before, inventory(v));
});
test('copper is a negative control; no spontaneous identical displacement', () => { const v = emptyVessel(); addLiquid(v, 'copperSulfate', 20); add(v.contents, 'Cu', 0.002); finish(v); close(amount(v.contents, 'CuIon'), 0.002); close(amount(v.contents, 'Cu'), 0.002); assert.deepEqual(v.extent, {}); });
for (const [acid, base, expectedSign] of [[20, 10, -1], [10, 20, 1], [10, 10, 0], [0, 0, 0]]) test(`neutralization acid ${acid} / base ${base}`, () => {
  const v = emptyVessel(); addLiquid(v, 'acid', acid); addLiquid(v, 'base', base); const before = inventory(v); finish(v);
  close(v.extent.neutralization ?? 0, Math.min(acid, base) * 0.0001); assert.equal(Math.sign(pH(v) - 7), expectedSign); conserved(before, inventory(v));
});
for (const [cu, oh] of [[10, 40], [40, 10], [10, 20], [10, 0]]) test(`precipitation ${cu} / ${oh}`, () => {
  const v = emptyVessel(); addLiquid(v, 'copperSulfate', cu); addLiquid(v, 'base', oh); const before = inventory(v); finish(v);
  close(amount(v.contents, 'precipitate'), Math.min(cu * 0.0001, oh * 0.0001 / 2)); conserved(before, inventory(v));
});
for (const closed of [false, true]) for (const connected of [false, true]) test(`carbonate gas closed=${closed} connected=${connected}`, () => {
  const v = emptyVessel(); addLiquid(v, 'carbonate', 20); addLiquid(v, 'acid', 10); v.closed = closed; v.connected = connected; const before = inventory(v); const start = mass(v.contents); finish(v);
  close(amount(closed ? v.gas : connected ? v.collected : v.escaped, 'CO2'), 0.0005); conserved(before, inventory(v));
  if (closed) { close(mass(v.contents) + mass(v.gas), start); openVessel(v); close(amount(v.gas, 'CO2'), 0); close(amount(connected ? v.collected : v.escaped, 'CO2'), 0.0005); }
});
for (const [grams, acid] of [[0.014, 40], [0.14, 10], [0.14, 0]]) test(`zinc gas ${grams} / ${acid}`, () => { const v = emptyVessel(); addLiquid(v, 'acid', acid); add(v.contents, 'Zn', grams / 65.38); const before = inventory(v); finish(v); close(amount(v.escaped, 'H2'), Math.min(grams / 65.38, acid * 0.0001 / 2)); conserved(before, inventory(v)); });
test('viewing speed / integration step never changes final quantities', () => {
  const a = emptyVessel(), b = emptyVessel(); for (const v of [a, b]) { addLiquid(v, 'copperSulfate', 20); add(v.contents, 'Fe', 0.001); }
  finish(a, 0.05); finish(b, 0.2); for (const id of Object.keys(a.contents) as Species[]) close(amount(a.contents, id), amount(b.contents, id));
});
test('capacity, zero dose, completion and repeated additions', () => {
  const v = emptyVessel(20); close(addLiquid(v, 'acid', 0), 0); close(addLiquid(v, 'acid', 30), 20); close(addLiquid(v, 'base', 10), 0); close(v.volume, 20);
  const x = emptyVessel(); addLiquid(x, 'acid', 10); addLiquid(x, 'base', 10); finish(x); const before = inventory(x); finish(x); conserved(before, inventory(x)); addLiquid(x, 'base', 10); finish(x); close(amount(x.contents, 'OH'), 0.001);
});
test('twenty consecutive take / put cycles preserve metal and prevent duplication', () => {
  let w = initialWorld(); for (let i = 0; i < 20; i++) { w = dropItem(w, 'tweezers', w.positions.iron); const stock = w.solids.iron; w = dropItem(w, 'tweezers', w.positions.iron); close(w.solids.iron, stock); w = dropItem(w, 'tweezers', w.positions.beaker); }
  close(w.solids.iron, 0); close(amount(w.vessel.contents, 'Fe') * 55.845, 2.8); close(mass(w.clamp), 0);
});
test('twenty liquid transfers are atomic, closed sources and vessels reject transfer', () => {
  let w = initialWorld(); const stock = w.stock.acid; w = dropItem(w, 'measure', w.positions.acid); close(w.stock.acid, stock);
  w.opened.acid = true; for (let i = 0; i < 20; i++) { w = dropItem(w, 'measure', w.positions.acid); w = dropItem(w, 'measure', w.positions.beaker); }
  close(w.vessel.volume, 100); close(w.stock.acid + (w.toolLiquid.measure?.ml ?? 0) + w.vessel.volume, 100);
  w.vessel.closed = true; w = dropItem(w, 'measure', w.positions.beaker); close(w.vessel.volume, 100);
});
test('residual metal can be retrieved and clean-up preserves waste', () => {
  let w = initialWorld(); w = dropItem(w, 'tweezers', w.positions.iron); w = dropItem(w, 'tweezers', w.positions.beaker); w = dropItem(w, 'tweezers', w.positions.beaker);
  close(mass(w.clamp), 0.14); w = dropItem(w, 'tweezers', [-0.8, 1.49, 1.22]); close(mass(w.recovered), 0.14);
  addLiquid(w.vessel, 'copperSulfate', 10); const before = mass(w.vessel.contents); w = dropItem(w, 'beaker', items.wash.home); close(w.vessel.volume, 10); w = dropItem(w, 'beaker', items.waste.home); close(mass(w.waste), before); close(w.vessel.volume, 0); w = dropItem(w, 'beaker', items.wash.home); assert.equal(w.dirty, false);
});
test('closed mixing stores metal separately until triggered and weighing excludes escaped gas', () => {
  let w = initialWorld(5); w = dropItem(w, 'tweezers', w.positions.zinc); w = dropItem(w, 'tweezers', w.positions.beaker); close(amount(w.vessel.contents, 'Zn'), 0); close(mass(w.chamber), 0.14);
  addLiquid(w.vessel, 'acid', 20); w = dropItem(w, 'stopper', w.positions.beaker); w.weighing = 'beaker'; const before = weighingMass(w); add(w.vessel.contents, 'Zn', amount(w.chamber, 'Zn')); w.chamber = {}; finish(w.vessel); close(weighingMass(w), before); openVessel(w.vessel); assert.ok(weighingMass(w) < before);
});
test('unsupported placement is rejected, snapshot corruption does not load', () => {
  const w = initialWorld(); const moved = dropItem(w, 'iron', [8, -5, 8]); assert.deepEqual(moved.positions.iron, w.positions.iron); assert.ok(validSnapshot(w));
  for (const corrupt of [null, {}, { ...w, version: 2 }, { ...w, stock: { ...w.stock, acid: -1 } }, { ...w, vessel: { ...w.vessel, volume: 1000 } }, { ...w, clamp: { bogus: 1 } }]) assert.equal(validSnapshot(corrupt), false);
});
test('snapshot inventory cannot manufacture or lose matter', () => {
  let w = initialWorld(); const before = worldInventory(w); w.opened.acid = true; w = dropItem(w, 'measure', w.positions.acid); w = dropItem(w, 'measure', w.positions.beaker);
  w = dropItem(w, 'tweezers', w.positions.zinc); w = dropItem(w, 'tweezers', w.positions.beaker); finish(w.vessel); conserved(before, worldInventory(w)); assert.ok(validSnapshot(w));
  const corrupt = structuredClone(w); corrupt.vessel.contents.Cu = 1; assert.equal(validSnapshot(corrupt), false);
});
