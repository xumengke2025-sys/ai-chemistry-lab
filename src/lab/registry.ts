import type { Reagent } from './chemistry';
export type ItemId = Reagent | 'iron' | 'copper' | 'zinc' | 'tweezers' | 'beaker' | 'waste' | 'wash' | 'lens' | 'notebook' | 'pipette' | 'measure' | 'stopper' | 'tube' | 'scale' | 'stirrer' | 'powder' | 'spoon' | 'furnace';
export type Position = [number, number, number];
export const items: Record<ItemId, { name: string; home: Position; description: string; movable: boolean }> = {
  powder: { name: '碳酸钠 · Na₂CO₃', home: [-1.42, 1.49, 1.18], description: '用药匙取 0.100 g，在称量托盘上称量；投入有液体的反应杯后溶解。', movable: false },
  spoon: { name: '药匙', home: [-1.58, 1.49, 0.91], description: '拖到碳酸钠取样，再拖到称量托盘或反应杯。', movable: true },
  furnace: { name: '炉具', home: [-4.86, 1.39, -2.48], description: '点炭火口开启或关闭，拖杯至炉台加热。温度为 20–60 °C 的教学近似，不作热化学预测。', movable: false },
  copperSulfate: { name: '硫酸铜溶液', home: [1.75, 1.38, -3.55], description: '瓶子放到杯口后，开塞并向右倾倒。松手即停；需要定量时用量取器皿。', movable: true },
  water: { name: '水', home: [2.2, 1.38, -3.55], description: '用于稀释。清洗请到右侧陶盆。', movable: true },
  acid: { name: '稀盐酸', home: [2.65, 1.38, -3.55], description: '0.100 mol/L。与碱、碳酸盐或锌反应。', movable: true },
  base: { name: '氢氧化钠溶液', home: [3.1, 1.38, -3.55], description: '0.100 mol/L。中和稀盐酸或生成氢氧化铜沉淀。', movable: true },
  carbonate: { name: '碳酸钠溶液', home: [3.55, 1.38, -3.55], description: '0.100 mol/L。加入酸生成二氧化碳。', movable: true },
  indicator: { name: '酚酞指示剂', home: [2.18, 1.46, 1.03], description: '用滴管取液；pH 大于约 8.2 呈粉红。颜色不是中和程度读数。', movable: true },
  iron: { name: '铁钉 · Fe', home: [-0.68, 1.49, 1.03], description: '用镊子夹取，每次 0.140 g；投入硫酸铜后表面沉积铜。', movable: true },
  copper: { name: '铜片 · Cu', home: [-0.95, 1.49, 1.03], description: '用镊子夹取，每次 0.140 g；在硫酸铜中不发生同样置换。', movable: true },
  zinc: { name: '锌粒 · Zn', home: [-1.22, 1.49, 1.03], description: '用镊子夹取，每次 0.140 g；与稀盐酸产生氢气。', movable: true },
  tweezers: { name: '镊子', home: [-0.48, 1.49, 1.08], description: '拖到金属夹取，再拖到杯口投入；拖到杯中可取回残余金属和沉积铜。', movable: true },
  beaker: { name: '反应杯', home: [0.23, 1.48, 1.04], description: '容量 100 mL。拖到残液罐倒空，再拖到陶盆洗净。', movable: true },
  waste: { name: '残液收集罐', home: [2.53, 1.46, 1.06], description: '把反应杯拖到此处，收集残液与固体，不将残液倒入洗盆。', movable: false },
  wash: { name: '清洗陶盆', home: [4.2, 1.38, -3.5], description: '反应杯先倒空再洗；清洗会移除污迹。', movable: false },
  lens: { name: '观察镜', home: [0.63, 1.49, 1.08], description: '点击展开或收起化学图景。拖动图景旋转，滚轮放大。', movable: false },
  notebook: { name: '实验记录本', home: [-1.85, 1.49, 1.09], description: '打开记录本，选择实验页签恢复起始布置；所有投料均由你亲手完成。', movable: false },
  pipette: { name: '滴管', home: [1.01, 1.49, 1.05], description: '拖到已开塞瓶子取 0.5 mL，再拖到杯口逐滴加入。', movable: true },
  measure: { name: '量取器皿', home: [1.4, 1.49, 1.05], description: '拖到已开塞瓶子量取 10 mL，再拖到杯口加入；剩余容量限制转移。', movable: true },
  stopper: { name: '密闭塞 · 内置隔室', home: [0.72, 1.49, 1.24], description: '拖到杯口密闭。杯内隔室可先存一份金属；密闭后点击玻璃棒触发内部混合。', movable: true },
  tube: { name: '导管与集气瓶', home: [0.96, 1.49, 0.75], description: '拖到杯口连接。连接时生成气体进入集气瓶；解除连接后逸散。', movable: true },
  scale: { name: '称量托盘', home: [-1.48, 1.48, 1.68], description: '拖药匙或金属至托盘称量；杯装置空载 85.000 g（含系留塞），读数还含液体、固体和留存气体。', movable: false },
  stirrer: { name: '玻璃棒', home: [1.72, 1.49, 1.07], description: '拖到杯中搅拌；密闭实验点击棒柄，使隔室金属落入液体。', movable: true },
};
export const experimentNames = ['铁与硫酸铜', '酸碱中和', '碳酸盐与酸', '氢氧化铜沉淀', '锌与稀酸', '密闭质量守恒'];
