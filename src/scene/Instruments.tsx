import { Box, CurvedTube, Ring, Rod, Turned } from './geometry';
import { useLabMaterials } from './materials';
import { useLabStore, type Exhibit } from '../store';
import { labOwnsClick, useInteraction } from '../lab/interaction';
import { useWorld } from '../lab/world';
import { RoomObject, usePhysicalHover } from './RoomObject';

const instrumentNotes: Partial<Record<Exhibit, {name:string;description:string}>> = {
  balance: {name:'黄铜天平',description:'查看横梁、悬丝与双盘结构。空盘保持平衡；实验样品的质量记录来自桌上称量托盘，读数写入实验本。'},
  bell: {name:'玻璃钟罩',description:'查看钟罩与底座，顶端黄铜塞可拔出再装回。实验气体由杯口导管收集；此钟罩用于结构展示。'},
  retort: {name:'蒸馏器',description:'查看蒸馏瓶、导管与接收瓶的连接。当前模型提供结构观察，未模拟沸腾、冷凝与馏分收集。'},
};

export function Selectable({ name, children, position }: { name: Exhibit; children: React.ReactNode; position: [number, number, number] }) {
  const select = useLabStore((state) => state.select);
  const hover = usePhysicalHover();
  return <group position={position} onClick={(event) => { event.stopPropagation(); if (!labOwnsClick()&&!useWorld.getState().busy) { const note=instrumentNotes[name];if(note)useInteraction.getState().referRoom(note);select(name); } }} onPointerOver={(event) => { if(useWorld.getState().busy)return;event.stopPropagation();if(!labOwnsClick())hover.over(event.object); }} onPointerOut={hover.clear}>
    {children}
  </group>;
}
export function Balance() {
  const m = useLabMaterials();
  return <>
    <Box at={[0, 0.055, 0]} size={[0.8, 0.11, 0.4]} material={m.wood} />
    <Box at={[0, 0.116, 0]} size={[0.83, 0.012, 0.43]} material={m.darkBrass} />
    {[-0.31, 0.31].flatMap((x) => [-0.13, 0.13].map((z) => <Turned key={`${x},${z}`} at={[x, -0.035, z]} profile={[[0, 0], [0.045, 0], [0.045, 0.04], [0.03, 0.07]]} material={m.brass} />))}
    <Turned at={[0, 0.12, 0]} profile={[[0, 0], [0.09, 0], [0.095, 0.025], [0.07, 0.035], [0.07, 0.06], [0.035, 0.075], [0.027, 0.11], [0.04, 0.14], [0.028, 0.18], [0.026, 0.23]]} material={m.brass} />
    <Turned at={[0, 0.35, 0]} profile={[[0.025, 0], [0.025, 0.52], [0.045, 0.54], [0.045, 0.56], [0.025, 0.58], [0.025, 0.63], [0, 0.66]]} material={m.brass} />
    <Ring at={[0, 0.75, 0.008]} radius={0.105} tube={0.006} material={m.brass} rotation={[0, 0, 0]} />
    <group position={[0, 0.89, 0]}>
      <Rod from={[-0.49, 0, 0]} to={[0.49, 0, 0]} radius={0.015} material={m.brass} />
      <Rod from={[-0.44, 0, 0]} to={[0, 0.07, 0]} radius={0.008} material={m.brass} />
      <Rod from={[0.44, 0, 0]} to={[0, 0.07, 0]} radius={0.008} material={m.brass} />
      <Rod from={[0, 0, 0.025]} to={[0, -0.29, 0.025]} radius={0.005} material={m.iron} />
      {[-0.46, 0.46].map((x) => <group key={x} position={[x, 0, 0]}>
        {[0, 2.094, 4.189].map((angle) => <Rod key={angle} from={[0, 0, 0]} to={[Math.cos(angle) * 0.16, -0.42, Math.sin(angle) * 0.16]} radius={0.003} material={m.darkBrass} />)}
        <Turned at={[0, -0.46, 0]} profile={[[0, 0], [0.04, 0], [0.1, 0.013], [0.16, 0.03], [0.17, 0.045], [0.17, 0.052], [0.155, 0.048], [0.09, 0.026], [0, 0.008]]} material={m.brass} />
        <Ring at={[0, -0.41, 0]} radius={0.169} tube={0.003} material={m.brass} />
      </group>)}
    </group>
    {[-0.13, 0, 0.13].map((x, i) => <RoomObject key={x} id={`balance-weight-${i}`} name="天平砝码" description="轻点提起查看，再点放回。此处展示砝码结构；实验样品在称量托盘上称量，读数写入实验本。" travel={[0,.1,.06]}><Turned at={[x + 0.8, 0, 0.05]} scale={0.65 + i * 0.15} profile={[[0, 0], [0.05, 0], [0.05, 0.06], [0.025, 0.065], [0.025, 0.09], [0, 0.09]]} material={m.brass} /></RoomObject>)}
  </>;
}
export function Retort() {
  const m = useLabMaterials();
  return <>
    <Turned profile={[[0, 0], [0.28, 0], [0.3, 0.035], [0.28, 0.065], [0.24, 0.08], [0.24, 0.32], [0.27, 0.34], [0.27, 0.38], [0.23, 0.4], [0.22, 0.42]]} material={m.copper} />
    <Ring at={[0, 0.23, 0]} radius={0.241} tube={0.012} material={m.darkBrass} />
    {Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[Math.cos(i * Math.PI / 6) * 0.242, 0.27, Math.sin(i * Math.PI / 6) * 0.242]} material={m.darkBrass}><sphereGeometry args={[0.007, 10, 8]} /></mesh>)}
    {[-0.12, 0, 0.12].map((x) => <Box key={x} at={[x, 0.18, 0.246]} size={[0.038, 0.075, 0.025]} material={m.iron} />)}
    <RoomObject id="retort-head" name="蒸馏器玻璃头与导管" description="轻点抬起玻璃头查看连接，再点装回。当前用于器件结构观察，未模拟沸腾与冷凝。" anchor={[0,.6,0]} travel={[0,.3,0]}>
      <Turned at={[0, 0.34, 0]} profile={[[0.08, 0], [0.17, 0.04], [0.225, 0.13], [0.23, 0.23], [0.2, 0.33], [0.12, 0.41], [0.055, 0.44], [0.052, 0.57], [0.058, 0.58], [0.058, 0.6], [0.045, 0.6], [0.045, 0.44], [0.11, 0.405], [0.19, 0.325], [0.22, 0.23], [0.215, 0.13], [0.16, 0.05], [0.08, 0.014]]} material={m.glass} />
      <CurvedTube points={[[0.16, 0.75, 0], [0.34, 0.79, -.08], [0.52, 0.7, -.22], [0.73, 0.55, -.37], [0.9, 0.42, -.45]]} radius={0.023} material={m.glass} />
    </RoomObject>
    <RoomObject id="retort-receiver" name="蒸馏接收瓶" description="轻点移开接收瓶查看瓶口，再点归位。此瓶用于装置结构观察。" anchor={[.9,.24,-.27]} travel={[.16,0,.18]}>
      <Turned at={[0.9, 0, -.45]} profile={[[0, 0], [0.09, 0], [0.16, 0.06], [0.2, 0.18], [0.18, 0.29], [0.06, 0.34], [0.047, 0.42], [0.06, 0.44], [0.045, 0.44], [0.039, 0.34], [0.17, 0.28], [0.19, 0.18], [0.15, 0.06], [0.08, 0.01], [0, 0.01]]} material={m.glass} />
    </RoomObject>
    <Rod from={[-0.34, 0, -0.12]} to={[-0.34, 1.05, -0.12]} radius={0.015} material={m.iron} />
    <Rod from={[-0.34, 0.73, -0.12]} to={[-0.02, 0.73, -0.12]} radius={0.014} material={m.brass} />
    <Ring at={[0, 0.69, 0]} radius={0.195} material={m.iron} />
  </>;
}
export function BellJar() {
  const m = useLabMaterials();
  return <>
    <Turned profile={[[0, 0], [0.44, 0], [0.45, 0.025], [0.42, 0.06], [0.42, 0.14], [0.4, 0.16], [0.36, 0.16], [0.36, 0.06], [0, 0.06]]} material={m.ceramic} />
    <Turned at={[0, 0.085, 0]} profile={[[0.31, 0], [0.31, 0.6], [0.3, 0.7], [0.27, 0.79], [0.2, 0.86], [0.1, 0.9], [0.034, 0.91], [0.03, 0.99], [0.05, 1.0], [0.05, 1.035], [0.025, 1.035], [0.024, 0.9], [0.095, 0.889], [0.195, 0.849], [0.258, 0.78], [0.29, 0.69], [0.3, 0.6], [0.3, 0]]} material={m.glass} />
    <RoomObject id="bell-cap" name="钟罩瓶塞" description="点黄铜瓶塞拔出，再点装回。此处展示器件结构；实验中的气体另由杯口导管收集。" travel={[.12,.12,0]}><Turned at={[0, 1.12, 0]} profile={[[0, 0], [0.035, 0], [0.035, 0.04], [0.05, 0.06], [0.035, 0.09], [0, 0.09]]} material={m.brass} /></RoomObject>
    <Turned at={[0, 0.06, 0]} profile={[[0, 0], [0.08, 0], [0.08, 0.04], [0.02, 0.06], [0.02, 0.2], [0.07, 0.22], [0.07, 0.25], [0, 0.25]]} material={m.copper} />
    <CurvedTube points={[[0.04, 1.17, 0], [0.18, 1.17, 0], [0.42, 1.04, 0], [0.49, 0.36, 0], [0.63, 0.18, 0]]} radius={0.014} material={m.brass} />
    <Rod from={[0.64, 0.11, -0.04]} to={[0.64, 0.23, -0.04]} radius={0.018} material={m.brass} />
    <Rod from={[0.59, 0.21, -0.04]} to={[0.69, 0.21, -0.04]} radius={0.009} material={m.brass} />
  </>;
}
export function Bottle({ at, scale = 1, green = false }: { at: [number, number, number]; scale?: number; green?: boolean }) {
  const m = useLabMaterials();
  return <RoomObject name={green?'绿色收藏玻璃瓶':'透明收藏玻璃瓶'} description="走近查看瓶体与木塞。用于投料的试剂在带标签的实验瓶中。" position={at}><group scale={scale}>
    <Turned profile={[[0, 0], [0.12, 0], [0.135, 0.025], [0.135, 0.27], [0.12, 0.31], [0.055, 0.37], [0.05, 0.46], [0.062, 0.465], [0.062, 0.48], [0.043, 0.48], [0.043, 0.37], [0.11, 0.3], [0.125, 0.27], [0.125, 0.03], [0, 0.015]]} material={green ? m.greenGlass : m.glass} />
    <Turned at={[0, 0.47, 0]} profile={[[0, 0], [0.044, 0], [0.048, 0.07], [0, 0.07]]} material={m.wood} />
  </group></RoomObject>;
}
