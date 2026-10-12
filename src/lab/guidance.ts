import { amount, mass, reagents } from './chemistry';
import type { World } from './world';
import { items, type ItemId } from './registry';

export type Drawing = 'look' | 'pick' | 'pour' | 'clamp' | 'measure' | 'observe' | 'clean' | 'gas' | 'weigh' | 'seal';
export interface GuideStep { title: string; instruction: string; target: ItemId; drawing: Drawing; done: boolean }
const step = (title: string, instruction: string, target: ItemId, drawing: Drawing, done: boolean): GuideStep => ({title,instruction,target,drawing,done});

export function experimentSteps(w: World, observed = false): GuideStep[] {
  const v=w.vessel, extent=v.extent, has=(id: Parameters<typeof amount>[1]) => amount(v.contents,id)>1e-9;
  const opened=(id: keyof typeof reagents) => !!w.opened[id];
  let steps: GuideStep[];
  if(w.experiment===0) steps=[
    step('取硫酸铜溶液','走近柜中的硫酸铜瓶，点木塞拔开。页中器具素描可以帮助走近。','copperSulfate','look',opened('copperSulfate')),
    step('把瓶子放到杯口','再点一次瓶身拿起，点反应杯放到杯口；也可按住瓶子直接拖过去。','copperSulfate','pick',w.docked==='copperSulfate'||has('CuIon')||!!extent.displacement),
    step('倒入蓝色溶液','按住瓶身向右拖，让瓶口朝杯中倾斜；有液流才是在倒液，松手立即停止。','copperSulfate','pour',v.volume>0&&(has('CuIon')||!!extent.displacement)),
    step('用镊子夹铁钉','拿起镊子，再点铁钉夹取；也可把镊子直接拖到铁钉上。','tweezers','clamp',amount(w.clamp,'Fe')>0||has('Fe')||!!extent.displacement),
    step('把铁钉投入杯中','拿起装着铁钉的镊子，放到反应杯中。','tweezers','clamp',has('Fe')||!!extent.displacement),
    step('观察铜沉积','点观察镜，展开方程式与粒子。铁钉表面变铜色，颜色和反应量随真实材料变化。','lens','observe',observed&&!!extent.displacement),
    step('取回杯中的金属','反应停止后，用空镊子点反应杯夹取剩余金属与沉积铜。','tweezers','clamp',amount(w.clamp,'Cu')>0||mass(w.recovered)>0),
  ];
  else if(w.experiment===1) steps=[
    step('打开稀盐酸','点稀盐酸瓶，打开瓶塞；本实验用量取器皿控制剂量。','acid','look',opened('acid')),
    step('量取并加入 10 mL 酸','拿起量取器皿，点酸瓶取液；再拿起它，点杯口加入。','measure','measure',v.volume>=10&&(has('H')||!!extent.neutralization)),
    step('滴入酚酞','打开酚酞瓶；用滴管取 0.5 mL，再点杯口滴入。','indicator','measure',v.indicator>0),
    step('加入碱，与酸中和','打开氢氧化钠瓶，用量取器皿加入 10 mL。还可用滴管少量加入，观察颜色变化。','base','measure',!!extent.neutralization),
    step('再加入碱，观察过量','继续加一份碱，使碱过量。酚酞转粉红；粉红不代表恰好中和。','base','measure',has('OH')&&!!extent.neutralization),
    step('展开化学图景','点观察镜查看 H⁺ 与 OH⁻ 的变化，再收起继续操作。','lens','observe',observed),
  ];
  else if(w.experiment===2) steps=[
    step('准备 10 mL 水','打开水瓶；用量取器皿取水，再加入反应杯。','water','measure',v.volume>=10),
    step('取碳酸钠粉末','拿起药匙，点粉末罐取 0.100 g；药匙上的粉末会随取样出现。','spoon','pick',w.spoonLoad>0||has('carbonateSalt')||has('carbonate')||!!extent.carbonate),
    step('先称量药匙上的粉末','拿起装有粉末的药匙，点称量托盘读取质量。','scale','weigh',w.weighing==='spoon'&&w.spoonLoad>0),
    step('加入杯中溶解','拿起药匙，点杯口加入。粉末遇水解离为离子。','spoon','pick',has('carbonate')||has('carbonateSalt')||!!extent.carbonate),
    step('连接集气导管','拿起导管，点杯口连接；集气瓶收集之后生成的气体。','tube','gas',v.connected),
    step('加入 10 mL 稀盐酸','打开酸瓶，用量取器皿取酸，再点杯口。出现气泡，集气瓶中积累 CO₂。','acid','measure',!!extent.carbonate&&amount(v.collected,'CO2')>0),
    step('观察气体与方程式','点观察镜查看离子与 CO₂；生成量受真实剂量限制。','lens','observe',observed),
  ];
  else if(w.experiment===3) steps=[
    step('加入 10 mL 硫酸铜','打开硫酸铜瓶；量取器皿先点瓶子取液，再点杯口加入。','copperSulfate','measure',has('CuIon')||!!extent.precipitation),
    step('加入 10 mL 氢氧化钠','打开碱瓶；用量取器皿取液，再点杯口加入。杯底出现蓝色沉淀。','base','measure',!!extent.precipitation),
    step('区分沉淀与溶液','点观察镜。蓝色固相聚集与液体中的离子分开显示。','lens','observe',observed),
  ];
  else if(w.experiment===4) steps=[
    step('夹取锌粒','拿起镊子，点锌粒取 0.140 g，再拿起镊子点杯口投入。','tweezers','clamp',has('Zn')||!!extent.zinc),
    step('先连接集气导管','拿起导管，点杯口连接，之后生成的氢气才进入集气瓶。','tube','gas',v.connected),
    step('加入两份稀盐酸','打开酸瓶；量取器皿每次取 10 mL，取液与加入操作重复两次。','acid','measure',w.stock.acid<=80&&!!extent.zinc),
    step('观察氢气与锌消耗','点观察镜；集气量来自实际反应，不是固定演示。','lens','observe',observed&&amount(v.collected,'H2')>0),
  ];
  else steps=[
    step('把锌放入杯内隔室','拿起镊子点锌粒夹取，再拿起镊子点杯口。此页的锌先留在干燥隔室。','tweezers','clamp',amount(w.chamber,'Zn')>0||!!extent.zinc),
    step('加入 20 mL 稀盐酸','打开酸瓶，用量取器皿取液、加入两次。此时隔室尚未打开。','acid','measure',v.volume>=20),
    step('称量反应前的装置','拿起反应杯，点称量托盘；点击托盘读数。','scale','weigh',w.weighing==='beaker'&&!extent.zinc),
    step('塞紧杯口','拿起密闭塞，点杯口。导管与密闭塞不能同时连接。','stopper','seal',v.closed),
    step('在密闭系统内部混合','直接点击玻璃棒，让隔室中的锌落入酸中；不需要取下塞子。','stirrer','seal',!!extent.zinc),
    step('复称并观察','拿起杯子，再点称量托盘；比较反应前后，密闭时总质量相同。可点观察镜查看留在系统中的气体。','scale','weigh',w.weighing==='beaker'&&amount(v.gas,'H2')>=0.000999),
    step('开塞，再比较质量','把密闭塞从杯口拖回桌上原位。气体逸出后质量降低，再称量比较。','stopper','gas',!v.closed&&amount(v.escaped,'H2')>0),
  ];
  if(w.experiment===0) steps.push(step('放入金属回收托盘','拿起夹着金属的镊子，放到铁钉前方的木质回收托盘。','tweezers','clean',mass(w.recovered)>0));
  steps.push(step('倒入残液收集罐','拿起杯子，点残液罐。清洗陶盆不能接收残液。','waste','clean',v.volume===0&&mass(w.waste)>0));
  steps.push(step('洗净，准备下一次','拿起空杯，点右侧清洗陶盆。实验记录本可以切换或重新开始实验。','wash','clean',!w.dirty&&mass(w.waste)>0));
  return steps;
}

export interface DropTarget { id: ItemId | 'recovery'; label: string; home?: boolean }
export function clickTargets(w: World, held: ItemId): DropTarget[] {
  const targets: DropTarget[]=[];
  const cup=(label:string) => { if(!w.vessel.closed) targets.push({id:'beaker',label}); };
  if(held in reagents) cup('放到杯口');
  else if(held==='measure'||held==='pipette') {
    if(w.toolLiquid[held]?.ml) cup(held==='measure'?'加入杯中':'滴入杯中');
    else for(const id of Object.keys(reagents) as (keyof typeof reagents)[]) if(w.opened[id]&&w.stock[id]>0) targets.push({id,label:`取${held==='measure'?' 10':' 0.5'} mL`});
  } else if(held==='tweezers') {
    if(mass(w.clamp)>0) {cup('投入金属');targets.push({id:'scale',label:'称量金属'},{id:'recovery',label:'放入回收托盘'});}
    else { for(const id of ['iron','copper','zinc'] as const) if(w.solids[id]>0) targets.push({id,label:`夹取${items[id].name.split(' ·')[0]}`}); if(['Fe','Cu','Zn'].some(id=>amount(w.vessel.contents,id as 'Fe')>0))cup('取回杯中金属'); }
  } else if(held==='spoon') {if(w.spoonLoad>0){cup('加入粉末');targets.push({id:'scale',label:'称量粉末'});}else targets.push({id:'powder',label:'取 0.100 g 粉末'});}
  else if(held==='beaker') targets.push({id:'waste',label:'倒入残液罐'},{id:'wash',label:'清洗空杯'},{id:'scale',label:'称量装置'},{id:'furnace',label:'放上炉台'});
  else if(held==='stopper'&&!w.vessel.connected) targets.push({id:'beaker',label:'塞紧杯口'});
  else if(held==='tube'&&!w.vessel.closed) targets.push({id:'beaker',label:'连接导管'});
  else if(held==='stirrer')cup('搅拌');
  targets.push({id:held,label:'放回原位',home:true});
  return targets;
}
