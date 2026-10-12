import { create } from 'zustand';
import { add, addLiquid, advance, amount, elementalTotals, emptyVessel, inventory, mass, openVessel, reagents, species, type Composition, type Reagent, type Species, type Vessel } from './chemistry';
import { items, type ItemId, type Position } from './registry';
import { useInteraction } from './interaction';

type Metal = 'iron' | 'copper' | 'zinc';
const metals: Record<Metal, Species> = { iron: 'Fe', copper: 'Cu', zinc: 'Zn' };
export interface World {
  version: 1; positions: Record<ItemId, Position>; stock: Record<Reagent, number>; solids: Record<Metal, number>;
  opened: Partial<Record<Reagent, boolean>>; vessel: Vessel; waste: Composition; recovered: Composition;
  clamp: Composition; toolLiquid: Partial<Record<'pipette' | 'measure', { reagent: Reagent; ml: number }>>;
  chamber: Composition; dirty: boolean; experiment: number; docked: Reagent | null; angle: number;
  selected: ItemId | null; micro: boolean; detail: boolean; busy: boolean; feedback: string; weighing: ItemId | null;
  powderStock: number; spoonLoad: number; heating: boolean;
}
export function initialWorld(experiment = 0): World {
  return { version: 1, positions: Object.fromEntries(Object.entries(items).map(([id, def]) => [id, [...def.home]])) as Record<ItemId, Position>,
    stock: { water: 200, copperSulfate: 100, acid: 100, base: 100, carbonate: 100, indicator: 10 }, solids: { iron: 2.8, copper: 2.8, zinc: 2.8 },
    opened: {}, vessel: emptyVessel(), waste: {}, recovered: {}, clamp: {}, toolLiquid: {}, chamber: {}, dirty: false, experiment,
    docked: null, angle: 0, selected: null, micro: false, detail: false, busy: false, feedback: '', weighing: null, powderStock: 5.3, spoonLoad: 0, heating: false };
}
const clone = (w: World) => structuredClone(w);
const isReagent = (id: ItemId): id is Reagent => id in reagents;
const near = (p: Position, target: Position, radius = 0.28) => Math.hypot(p[0] - target[0], p[2] - target[2]) < radius;
const merge = (to: Composition, from: Composition) => { for (const [id, mol] of Object.entries(from)) add(to, id as Species, mol!); };
function place(w: World, id: ItemId, p: Position) {
  const old = w.positions[id]; w.positions[id] = p;
  if (id === 'beaker') {
    for (const attached of [w.vessel.closed ? 'stopper' : null, w.vessel.connected ? 'tube' : null, w.docked] as (ItemId | null)[])
      if (attached) { const point = w.positions[attached]; w.positions[attached] = [point[0] + p[0] - old[0], point[1] + p[1] - old[1], point[2] + p[2] - old[2]]; }
  }
}
function transfer(w: World, reagent: Reagent, ml: number) {
  if (!w.opened[reagent]) { w.feedback = '先打开瓶塞'; return 0; }
  if (w.vessel.closed) { w.feedback = '杯口已密闭'; return 0; }
  const moved = addLiquid(w.vessel, reagent, Math.min(ml, w.stock[reagent])); w.stock[reagent] -= moved;
  w.dirty ||= moved > 0; return moved;
}
export function dropItem(input: World, id: ItemId, p: Position): World {
  const w = clone(input); w.busy = false; w.angle = 0; w.feedback = ''; w.weighing = null;
  const cup = w.positions.beaker;
  if (id === 'spoon' && near(p, items.powder.home, 0.2)) {
    if (w.spoonLoad) w.feedback = '先放下药匙中的固体';
    else { w.spoonLoad = Math.min(0.1, w.powderStock); w.powderStock -= w.spoonLoad; w.feedback = `取样 ${w.spoonLoad.toFixed(3)} g`; }
    w.positions.spoon = [...items.spoon.home]; return w;
  }
  if (id === 'beaker' && near(p, items.furnace.home, 0.4)) { place(w, id, [items.furnace.home[0], 1.39, items.furnace.home[2]]); w.feedback = '杯已放在炉台；点炉门控制火力'; return w; }
  if (id === 'beaker') {
    if (near(p, items.waste.home, 0.36)) {
      openVessel(w.vessel); merge(w.waste, w.vessel.contents); merge(w.waste, w.vessel.gas); merge(w.waste, w.chamber);
      const escaped = w.vessel.escaped, collected = w.vessel.collected;
      if (w.docked) w.positions[w.docked] = [...items[w.docked].home];
      w.vessel = { ...emptyVessel(), escaped, collected }; w.chamber = {}; w.docked = null;
      w.positions.stopper = [...items.stopper.home]; w.positions.tube = [...items.tube.home];
      place(w, 'beaker', [...items.beaker.home]); w.feedback = '残液与固体已收入收集罐；把空杯拖到陶盆清洗'; return w;
    }
    if (near(p, items.wash.home, 0.4)) {
      w.feedback = w.vessel.volume > 1e-9 || mass(w.vessel.contents) > 1e-9 || mass(w.chamber) > 1e-9 ? '先把残液倒入收集罐' : '杯已洗净，可以再做实验';
      if (!w.vessel.volume && !mass(w.vessel.contents) && !mass(w.chamber)) { w.dirty = false; w.vessel.extent = {}; }
      place(w, 'beaker', [...items.beaker.home]); return w;
    }
  }
  if (id === 'pipette' || id === 'measure') {
    const source = (Object.keys(reagents) as Reagent[]).find(key => near(p, w.positions[key], 0.21));
    if (source) {
      if (!w.opened[source]) w.feedback = '先打开来源瓶塞';
      else if (w.toolLiquid[id]?.ml) w.feedback = '先用完器皿中的液体';
      else { const ml = Math.min(id === 'pipette' ? 0.5 : 10, w.stock[source]); w.stock[source] -= ml; w.toolLiquid[id] = { reagent: source, ml }; w.feedback = `已取 ${ml.toFixed(1)} mL`; }
      w.positions[id] = [...items[id].home]; return w;
    }
  }
  if (id === 'tweezers') {
    const metal = (Object.keys(metals) as Metal[]).find(key => near(p, w.positions[key], 0.18));
    if (metal) {
      if (mass(w.clamp)) w.feedback = '先放下已夹取的金属';
      else { const grams = Math.min(0.14, w.solids[metal]); w.solids[metal] -= grams; add(w.clamp, metals[metal], grams / species[metals[metal]].mass); w.feedback = `夹取 ${grams.toFixed(3)} g`; }
      w.positions[id] = [...items[id].home]; return w;
    }
    if (near(p, items.scale.home, 0.2)) { w.weighing = id; w.positions[id] = [items.scale.home[0], 1.56, items.scale.home[2]]; return w; }
  }
  if (id !== 'beaker' && near(p, cup, 0.25)) {
    if (isReagent(id)) {
      if(w.docked && w.docked!==id) w.positions[w.docked]=[...items[w.docked].home];
      w.docked = id; w.positions[id] = [cup[0] - 0.26, cup[1] + 0.45, cup[2]];
      w.feedback = '瓶子已放到杯口'; return w;
    }
    if (id === 'stopper') {
      if (w.vessel.connected) { w.feedback = '先取下导管再密闭'; return w; }
      w.vessel.closed = true; w.positions[id] = [cup[0], cup[1] + 0.43, cup[2]]; w.feedback = '系统密闭；点击玻璃棒使隔室中的金属落入'; return w;
    }
    if (id === 'tube') {
      if (w.vessel.closed) { w.feedback = '先取下密闭塞'; return w; }
      w.vessel.connected = true; w.positions[id] = [cup[0] + 0.15, cup[1] + 0.4, cup[2]]; w.feedback = '导管已连接，后续气体进入集气瓶'; return w;
    }
    if (w.vessel.closed) { w.feedback = '密闭杯口不能投料'; return w; }
    if (id === 'spoon') { add(w.vessel.contents, 'carbonateSalt', w.spoonLoad / species.carbonateSalt.mass); w.feedback = `加入 ${w.spoonLoad.toFixed(3)} g 碳酸钠`; w.dirty ||= w.spoonLoad > 0; w.spoonLoad = 0; w.positions.spoon = [...items.spoon.home]; return w; }
    if (id === 'tweezers') {
      if (mass(w.clamp)) {
        merge(w.experiment === 5 ? w.chamber : w.vessel.contents, w.clamp); w.clamp = {}; w.dirty = true;
        w.feedback = w.experiment === 5 ? '金属在杯内干燥隔室；加酸、称量、密闭，再点击玻璃棒内部混合' : '金属已投入';
      } else {
        for (const key of ['Fe', 'Cu', 'Zn'] as Species[]) { add(w.clamp, key, amount(w.vessel.contents, key)); w.vessel.contents[key] = 0; }
        w.feedback = mass(w.clamp) ? '已取出残余金属及沉积铜' : '杯中没有可夹取的金属';
      }
      w.positions[id] = [...items[id].home]; return w;
    }
    if (id === 'pipette' || id === 'measure') {
      const liquid = w.toolLiquid[id];
      if (liquid) { const moved = addLiquid(w.vessel, liquid.reagent, liquid.ml); liquid.ml -= moved; w.dirty ||= moved > 0; w.feedback = `加入 ${moved.toFixed(1)} mL`; }
      else w.feedback = '先从已开塞的药剂瓶取液';
      w.positions[id] = [...items[id].home]; return w;
    }
    if (id === 'stirrer') { w.feedback = '已搅拌；教学速率不预测真实搅拌动力学'; w.positions[id] = [...items[id].home]; return w; }
    if (id in metals) { w.feedback = '用镊子夹取金属后投入'; return w; }
  }
  if (id === 'tweezers' && mass(w.clamp) && near(p, [-0.8, 1.49, 1.22], 0.23)) {
    merge(w.recovered, w.clamp); w.clamp = {}; w.feedback = '金属已放入回收托盘'; w.positions[id] = [...items[id].home]; return w;
  }
  if (near(p, items.scale.home, 0.22)) { w.weighing = id; place(w, id, [items.scale.home[0], 1.51, items.scale.home[2]]); return w; }
  // Keep movable objects on a supported front strip; reject occupied or unsupported placements.
  const supported = p[0] > -2.65 && p[0] < 2.68 && p[2] > 0.91 && p[2] < 1.26;
  const occupied = Object.entries(w.positions).some(([key, pos]) => key !== id && items[key as ItemId].movable && near(p, pos, 0.18));
  let destination: Position | null = null;
  if (near(p, items[id].home, 0.12)) destination = [...items[id].home];
  else if (supported && !occupied) destination = [p[0], id === 'beaker' ? 1.48 : 1.49, p[2]];
  if (destination) {
    if (id === 'stopper' && w.vessel.closed) openVessel(w.vessel);
    if (id === 'tube') w.vessel.connected = false;
    if (isReagent(id) && w.docked === id) w.docked = null;
    place(w, id, destination);
  } else w.feedback = '此处不能放置，物件回到原位';
  return w;
}
interface Actions {
  inspect: (id: ItemId | null) => void; setBusy: (value: boolean) => void; drop: (id: ItemId, position: Position) => void;
  toggleOpen: (id: Reagent) => void; setAngle: (value: number) => void; tick: (seconds: number) => void;
  toggleMicro: () => void; toggleDetail: () => void; reset: (experiment?: number) => void; mix: () => void; restore: () => void;
  toggleHeat: () => void;
}
export const useWorld = create<World & Actions>((set, get) => ({ ...initialWorld(),
  inspect: selected => set({ selected, detail: false }), setBusy: busy => set({ busy }), drop: (id, p) => set(dropItem(snapshot(get()), id, p)),
  toggleOpen: id => set(w => ({ opened: { ...w.opened, [id]: !w.opened[id] }, feedback: w.opened[id] ? '瓶塞已闭合' : '瓶塞已打开' })),
  setAngle: angle => set({ angle: Math.max(0, Math.min(1.4, angle)) }),
  tick: seconds => {
    const current = get(), w = snapshot(current);
    if (w.docked && w.angle > 0.45) transfer(w, w.docked, (w.angle - 0.45) * 12 * seconds);
    advance(w.vessel, seconds);
    if (w.vessel.volume > 0) {
      const target = w.heating && near(w.positions.beaker, items.furnace.home, 0.3) ? 60 : 20;
      if (Math.abs(w.vessel.temperature - target) > 0.1) w.vessel.temperature += (target - w.vessel.temperature) * (1 - Math.exp(-seconds / 20));
    }
    if (JSON.stringify(w.vessel) !== JSON.stringify(current.vessel) || w.dirty !== current.dirty || w.feedback !== current.feedback)
      set({ vessel: w.vessel, stock: w.stock, dirty: w.dirty, feedback: w.feedback });
  },
  toggleMicro: () => set(w => ({ micro: !w.micro })), toggleDetail: () => set(w => ({ detail: !w.detail })),
  toggleHeat: () => set(w => ({ heating: !w.heating, feedback: w.heating ? '炭火已关闭' : '炭火已开启' })),
  reset: (experiment = get().experiment) => { useInteraction.getState().resetProgress(); set(initialWorld(experiment)); },
  mix: () => { const w = snapshot(get()); if (w.vessel.closed && mass(w.chamber)) { merge(w.vessel.contents, w.chamber); w.chamber = {}; w.feedback = '隔室已开启，密闭系统内部混合'; } else w.feedback = '玻璃棒用于搅拌；密闭混合需要隔室中有金属'; set(w); },
  restore: () => { try { const value: unknown = JSON.parse(localStorage.getItem('historical-lab-v1') ?? 'null'); if (validSnapshot(value)) set({ ...value, busy: false, angle: 0, selected: null, feedback: '已恢复上次实验' }); else set({ feedback: '没有可恢复的有效记录' }); } catch { set({ feedback: '记录损坏，保留当前实验' }); } },
}));
export function snapshot(state: World): World { return clone(Object.fromEntries(Object.keys(initialWorld()).map(key => [key, state[key as keyof World]])) as unknown as World); }
export function validSnapshot(value: unknown): value is World {
  if (!value || typeof value !== 'object') return false;
  const w = value as World;
  const finite = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0;
  const composition = (c: unknown) => !!c && typeof c === 'object' && Object.entries(c).every(([id, n]) => id in species && finite(n));
  if (w.version !== 1 || !Number.isInteger(w.experiment) || w.experiment < 0 || w.experiment > 5 || !w.positions || !w.stock || !w.solids || !w.vessel) return false;
  if (!Object.keys(items).every(key => { const p = w.positions[key as ItemId]; return Array.isArray(p) && p.length === 3 && p.every(n => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) < 20); })) return false;
  if (!Object.keys(reagents).every(key => finite(w.stock[key as Reagent]) && w.stock[key as Reagent] <= initialWorld().stock[key as Reagent])) return false;
  if (!Object.keys(metals).every(key => finite(w.solids[key as Metal]) && w.solids[key as Metal] <= 2.8)) return false;
  const v = w.vessel;
  if (![v.contents, v.gas, v.escaped, v.collected, w.waste, w.recovered, w.clamp, w.chamber].every(composition)) return false;
  if (!finite(v.volume) || v.capacity !== 100 || v.volume > v.capacity || !finite(v.indicator) || !finite(v.temperature)) return false;
  if (typeof v.closed !== 'boolean' || typeof v.connected !== 'boolean' || (v.closed && v.connected) || (!v.closed && mass(v.gas) > 1e-9)) return false;
  if (!w.opened || Object.entries(w.opened).some(([id, open]) => !(id in reagents) || typeof open !== 'boolean')) return false;
  if (!w.toolLiquid || Object.entries(w.toolLiquid).some(([id, liquid]) => !['pipette', 'measure'].includes(id) || !liquid || !(liquid.reagent in reagents) || !finite(liquid.ml) || liquid.ml > (id === 'pipette' ? 0.5 : 10))) return false;
  if (w.docked !== null && !(w.docked in reagents)) return false;
  if (w.selected !== null && !(w.selected in items)) return false;
  if (![w.dirty, w.micro, w.detail, w.busy].every(n => typeof n === 'boolean') || typeof w.feedback !== 'string' || !finite(w.angle) || w.angle > 1.4) return false;
  if (!v.extent || Object.values(v.extent).some(n => !finite(n))) return false;
  if (w.weighing !== null && !(w.weighing in items)) return false;
  if (v.temperature < 20 || v.temperature > 60) return false;
  if ([w.clamp, w.recovered, w.chamber].some(c => Object.keys(c).some(id => !['Fe', 'Cu', 'Zn'].includes(id)))) return false;
  if ([v.gas, v.escaped, v.collected].some(c => Object.keys(c).some(id => !['H2', 'CO2'].includes(id)))) return false;
  if (!finite(w.powderStock) || w.powderStock > 5.3 || !finite(w.spoonLoad) || w.spoonLoad > 0.1 || typeof w.heating !== 'boolean') return false;
  try {
    const original = elementalTotals(worldInventory(initialWorld())), actual = elementalTotals(worldInventory(w));
    if (Object.keys(original).some(key => Math.abs(original[key] - (actual[key] ?? 0)) > 1e-7)) return false;
    if (v.closed && !near(w.positions.stopper, w.positions.beaker, 0.1)) return false;
    if (v.connected && !near(w.positions.tube, [w.positions.beaker[0] + 0.15, 0, w.positions.beaker[2]], 0.1)) return false;
  } catch { return false; }
  return true;
}
export function worldInventory(w: World) {
  const c: Composition = inventory(w.vessel); merge(c, w.waste); merge(c, w.recovered); merge(c, w.clamp); merge(c, w.chamber);
  add(c, 'carbonateSalt', (w.powderStock + w.spoonLoad) / species.carbonateSalt.mass);
  for (const [id, grams] of Object.entries(w.solids)) add(c, metals[id as Metal], grams / species[metals[id as Metal]].mass);
  for (const [id, ml] of Object.entries(w.stock)) { const source = emptyVessel(1000); addLiquid(source, id as Reagent, ml); merge(c, source.contents); }
  for (const liquid of Object.values(w.toolLiquid)) if (liquid) { const source = emptyVessel(); addLiquid(source, liquid.reagent, liquid.ml); merge(c, source.contents); }
  return c;
}
export function weighingMass(w: World) {
  if (w.weighing === 'beaker') return 85 + mass(w.vessel.contents) + mass(w.vessel.gas) + mass(w.chamber);
  if (w.weighing === 'tweezers') return mass(w.clamp);
  if (w.weighing === 'spoon') return w.spoonLoad;
  if (w.weighing && w.weighing in metals) return w.solids[w.weighing as Metal];
  return 0;
}
