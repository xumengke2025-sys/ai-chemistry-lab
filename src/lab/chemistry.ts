/** Teaching model: mol, mL, g, °C. No equilibrium or arbitrary-reaction prediction. */
export const species = {
  water: { mass: 18.015, charge: 0, atoms: { H: 2, O: 1 } },
  H: { mass: 1.008, charge: 1, atoms: { H: 1 } },
  OH: { mass: 17.007, charge: -1, atoms: { O: 1, H: 1 } },
  CuIon: { mass: 63.546, charge: 2, atoms: { Cu: 1 } },
  FeIon: { mass: 55.845, charge: 2, atoms: { Fe: 1 } },
  ZnIon: { mass: 65.38, charge: 2, atoms: { Zn: 1 } },
  Na: { mass: 22.99, charge: 1, atoms: { Na: 1 } },
  Cl: { mass: 35.45, charge: -1, atoms: { Cl: 1 } },
  sulfate: { mass: 96.056, charge: -2, atoms: { S: 1, O: 4 } },
  carbonate: { mass: 60.008, charge: -2, atoms: { C: 1, O: 3 } },
  carbonateSalt: { mass: 105.988, charge: 0, atoms: { Na: 2, C: 1, O: 3 } },
  Fe: { mass: 55.845, charge: 0, atoms: { Fe: 1 } },
  Cu: { mass: 63.546, charge: 0, atoms: { Cu: 1 } },
  Zn: { mass: 65.38, charge: 0, atoms: { Zn: 1 } },
  precipitate: { mass: 97.56, charge: 0, atoms: { Cu: 1, O: 2, H: 2 } },
  CO2: { mass: 44.009, charge: 0, atoms: { C: 1, O: 2 } },
  H2: { mass: 2.016, charge: 0, atoms: { H: 2 } },
} as const;
export type Species = keyof typeof species;
export type Composition = Partial<Record<Species, number>>;
export type Reagent = 'water' | 'copperSulfate' | 'acid' | 'base' | 'carbonate' | 'indicator';
export interface Vessel {
  volume: number; capacity: number; contents: Composition; indicator: number;
  gas: Composition; escaped: Composition; collected: Composition;
  closed: boolean; connected: boolean; temperature: number;
  extent: Partial<Record<ReactionId, number>>;
}
export const reagents: Record<Reagent, { name: string; formula: string; concentration: number; ions: Composition; color: string }> = {
  water: { name: '水', formula: 'H₂O', concentration: 0, ions: {}, color: '#c7dbcf' },
  copperSulfate: { name: '硫酸铜溶液', formula: 'CuSO₄(aq)', concentration: 0.1, ions: { CuIon: 1, sulfate: 1 }, color: '#24749c' },
  acid: { name: '稀盐酸', formula: 'HCl(aq)', concentration: 0.1, ions: { H: 1, Cl: 1 }, color: '#c7dbcf' },
  base: { name: '氢氧化钠溶液', formula: 'NaOH(aq)', concentration: 0.1, ions: { Na: 1, OH: 1 }, color: '#c7dbcf' },
  carbonate: { name: '碳酸钠溶液', formula: 'Na₂CO₃(aq)', concentration: 0.1, ions: { Na: 2, carbonate: 1 }, color: '#c7dbcf' },
  indicator: { name: '酸碱指示剂', formula: '酚酞 · 教学近似', concentration: 0, ions: {}, color: '#c7dbcf' },
};
export const reactions = [
  { id: 'dissolution', reactants: { carbonateSalt: 1 }, products: { carbonate: 1, Na: 2 }, equation: 'Na₂CO₃(s) → 2Na⁺(aq) + CO₃²⁻(aq)', molecular: '碳酸钠溶于水 · 示意解离' },
  { id: 'neutralization', reactants: { H: 1, OH: 1 }, products: { water: 1 }, equation: 'H⁺(aq) + OH⁻(aq) → H₂O(l)', molecular: 'HCl + NaOH → NaCl + H₂O' },
  { id: 'carbonate', reactants: { carbonate: 1, H: 2 }, products: { CO2: 1, water: 1 }, equation: 'CO₃²⁻(aq) + 2H⁺(aq) → CO₂(g) + H₂O(l)', molecular: 'Na₂CO₃ + 2HCl → 2NaCl + CO₂ + H₂O' },
  { id: 'displacement', reactants: { Fe: 1, CuIon: 1 }, products: { FeIon: 1, Cu: 1 }, equation: 'Fe(s) + Cu²⁺(aq) → Fe²⁺(aq) + Cu(s)', molecular: 'Fe + CuSO₄ → FeSO₄ + Cu' },
  { id: 'precipitation', reactants: { CuIon: 1, OH: 2 }, products: { precipitate: 1 }, equation: 'Cu²⁺(aq) + 2OH⁻(aq) → Cu(OH)₂(s)', molecular: 'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄' },
  { id: 'zinc', reactants: { Zn: 1, H: 2 }, products: { ZnIon: 1, H2: 1 }, equation: 'Zn(s) + 2H⁺(aq) → Zn²⁺(aq) + H₂(g)', molecular: 'Zn + 2HCl → ZnCl₂ + H₂↑' },
] satisfies { id: string; reactants: Composition; products: Composition; equation: string; molecular: string }[];
export type ReactionId = typeof reactions[number]['id'];
export const emptyVessel = (capacity = 100): Vessel => ({ volume: 0, capacity, contents: {}, indicator: 0, gas: {}, escaped: {}, collected: {}, closed: false, connected: false, temperature: 20, extent: {} });
export const amount = (c: Composition, id: Species) => c[id] ?? 0;
export function add(c: Composition, id: Species, mol: number) { c[id] = Math.max(0, amount(c, id) + mol); }
export function mass(c: Composition) { return Object.entries(c).reduce((sum, [id, mol]) => sum + species[id as Species].mass * mol!, 0); }
export function addLiquid(vessel: Vessel, reagent: Reagent, ml: number) {
  const transferred = Math.max(0, Math.min(ml, vessel.capacity - vessel.volume));
  const def = reagents[reagent], solute: Composition = {};
  for (const [id, coefficient] of Object.entries(def.ions)) add(solute, id as Species, def.concentration * transferred / 1000 * coefficient!);
  for (const [id, mol] of Object.entries(solute)) add(vessel.contents, id as Species, mol!);
  add(vessel.contents, 'water', (transferred - mass(solute)) / species.water.mass);
  if (reagent === 'indicator') vessel.indicator += transferred;
  vessel.volume += transferred;
  return transferred;
}
export function advance(vessel: Vessel, seconds: number) {
  if (vessel.volume <= 0 || seconds <= 0) return;
  for (const reaction of reactions) {
    const limit = Math.min(...Object.entries(reaction.reactants).map(([id, coefficient]) => amount(vessel.contents, id as Species) / coefficient!));
    // A bounded demonstrative rate. Fixed integration affects time, never stoichiometry.
    const extent = Math.min(limit, seconds * 0.0004);
    if (extent < 1e-14) continue;
    for (const [id, coefficient] of Object.entries(reaction.reactants)) add(vessel.contents, id as Species, -extent * coefficient!);
    for (const [id, coefficient] of Object.entries(reaction.products)) {
      const key = id as Species;
      const destination = key === 'CO2' || key === 'H2' ? vessel.closed ? vessel.gas : vessel.connected ? vessel.collected : vessel.escaped : vessel.contents;
      add(destination, key, extent * coefficient!);
    }
    vessel.extent[reaction.id] = (vessel.extent[reaction.id] ?? 0) + extent;
  }
}
export function openVessel(vessel: Vessel) {
  vessel.closed = false;
  for (const [id, mol] of Object.entries(vessel.gas)) add(vessel.connected ? vessel.collected : vessel.escaped, id as Species, mol!);
  vessel.gas = {};
}
export function pH(v: Vessel) {
  if (['CuIon', 'FeIon', 'ZnIon', 'carbonate', 'carbonateSalt', 'precipitate'].some(id => amount(v.contents, id as Species) > 1e-10) || v.extent.carbonate) return NaN;
  if (!v.volume) return 7;
  const excess = (amount(v.contents, 'H') - amount(v.contents, 'OH')) / (v.volume / 1000);
  return excess > 1e-7 ? -Math.log10(excess) : excess < -1e-7 ? 14 + Math.log10(-excess) : 7;
}
export function liquidColor(v: Vessel) {
  if (v.indicator && pH(v) > 8.2) return '#b85e8a';
  const copper = amount(v.contents, 'CuIon') / Math.max(v.volume / 1000, 1e-9);
  return copper > 0.02 ? '#2f809f' : copper > 0.002 ? '#75a4ab' : amount(v.contents, 'FeIon') > 0 ? '#a3b696' : '#c3d4c6';
}
export function inventory(v: Vessel): Composition {
  const result: Composition = {};
  for (const c of [v.contents, v.gas, v.escaped, v.collected]) for (const [id, mol] of Object.entries(c)) add(result, id as Species, mol!);
  return result;
}
export function elementalTotals(c: Composition) {
  const totals: Record<string, number> = { charge: 0 };
  for (const [id, mol] of Object.entries(c)) {
    const def = species[id as Species]; totals.charge += def.charge * mol!;
    for (const [element, count] of Object.entries(def.atoms)) totals[element] = (totals[element] ?? 0) + count * mol!;
  }
  return totals;
}
