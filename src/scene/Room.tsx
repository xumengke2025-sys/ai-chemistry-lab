import { Box, Ring, Rod, Turned } from './geometry';
import { Balance, BellJar, Bottle, Retort, Selectable } from './Instruments';
import { useLabMaterials } from './materials';
import { Bookcase, Candle, Furnace, Linen, Portrait, Rug, TallWindow, WritingDesk } from './Furnishings';
import { RoomObject } from './RoomObject';
import { Drawer } from './Drawer';
import Architecture from './Architecture';

const leg: [number, number][] = [[0.055, 0], [0.065, 0.025], [0.063, 0.06], [0.044, 0.09], [0.042, 0.21], [0.065, 0.25], [0.07, 0.3], [0.045, 0.37], [0.043, 0.72], [0.075, 0.78], [0.08, 0.83], [0.058, 0.88], [0.055, 1.18]];
function Window({ x }: { x: number }) {
  const m = useLabMaterials();
  return <group position={[x, 2.45, -2.89]}>
    <Box at={[0, 0, -0.03]} size={[1.65, 2.45, 0.12]} material={m.wood} />
    <mesh position={[0, 0, 0.039]}><planeGeometry args={[1.43, 2.24]} /><meshStandardMaterial color="#a7b5b0" emissive="#b5c1bc" emissiveIntensity={0.45} roughness={0.25} /></mesh>
    {[-0.78, 0.78].map((xx) => <Box key={xx} at={[xx, 0, 0.12]} size={[0.12, 2.53, 0.14]} material={m.wood} />)}
    {[-1.18, 1.18].map((y) => <Box key={y} at={[0, y, 0.12]} size={[1.69, 0.13, 0.14]} material={m.wood} />)}
    <Box at={[0, 0, 0.12]} size={[0.055, 2.3, 0.09]} material={m.wood} />
    {[-0.57, 0.15, 0.73].map((y) => <Box key={y} at={[0, y, 0.12]} size={[1.49, 0.045, 0.08]} material={m.wood} />)}
    <Box at={[0, -1.28, 0.1]} size={[1.97, 0.14, 0.35]} material={m.wood} />
    <Box at={[0, 1.32, 0.06]} size={[1.94, 0.09, 0.2]} material={m.wood} />
    <Rod from={[-0.98, 1.4, 0.14]} to={[0.98, 1.4, 0.14]} radius={0.025} material={m.darkBrass} />
  </group>;
}
function Table() {
  const m = useLabMaterials();
  return <RoomObject id="workbench" name="实验工作台" description="走近查看木制工作台。点桌沿拉手开合抽屉，桌上实验器材可直接取放。" position={[0, 0, 0.6]}>
    <Box at={[0, 1.36, 0]} size={[5.6, 0.18, 1.65]} material={m.wood} />
    <Box at={[0, 1.25, 0]} size={[5.54, 0.045, 1.61]} material={m.wood} />
    {[-0.7, 0.7].map((z) => <Box key={z} at={[0, 1.17, z]} size={[5.3, 0.2, 0.13]} material={m.wood} />)}
    {[-2.52, 2.52].flatMap((x) => [-0.585, 0.585].map((z) => <group key={`${x},${z}`} position={[x, 0, z]}>
      <Turned profile={leg} material={m.wood} />
      <Box at={[0, 1.16, 0]} size={[0.16, 0.2, 0.16]} material={m.wood} />
      <Ring at={[0, 0.28, 0]} radius={0.071} tube={0.005} material={m.darkBrass} />
    </group>))}
    <Box at={[0, 0.24, 0]} size={[5.1, 0.06, 0.07]} material={m.wood} />
    {[-2.52, 2.52].map((x) => <Box key={x} at={[x, 0.24, 0]} size={[0.07, 0.06, 1.19]} material={m.wood} />)}
    {[-1.7,0,1.7].map((x,i)=><Drawer key={x} id={`bench-drawer-${i}`} position={[x,1.13,.815]}/>)}
  </RoomObject>;
}
function Cabinet({ position, tall = false }: { position: [number, number, number]; tall?: boolean }) {
  const m = useLabMaterials();
  const height = tall ? 2.9 : 1.3, width = tall ? 1.5 : 2.6;
  return <RoomObject id={tall?'tall-cabinet':'reagent-cabinet'} name={tall?'高药柜':'试剂柜'} description="走近查看柜体与收藏玻璃瓶。带标签的实验试剂由桌上的器皿量取。" position={position}>
    <Box at={[0, height / 2, -0.31]} size={[width, height, 0.08]} material={m.wood} />
    {[-width / 2, width / 2].map((x) => <Box key={x} at={[x, height / 2, 0]} size={[0.1, height, 0.65]} material={m.wood} />)}
    {[0.1, height, height + 0.06].map((y) => <Box key={y} at={[0, y, 0]} size={[width + 0.2, 0.08, 0.75]} material={m.wood} />)}
    {(tall ? [0.63, 1.2, 1.8, 2.4] : [0.65]).map((y, row) => <group key={y}>
      <Box at={[0, y, 0]} size={[width, 0.07, 0.64]} material={m.wood} />
      {Array.from({ length: tall ? 4 : 6 }, (_, i) => <Bottle key={i} at={[-width / 2 + 0.24 + i * 0.31, y + 0.04, 0.02]} scale={0.6 + ((i + row) % 3) * 0.13} green={(i + row) % 2 === 0} />)}
    </group>)}
    {!tall && [-0.86, 0, 0.86].map((x,i) => <RoomObject key={x} id={`cabinet-door-${i}`} name="药柜门" description="点黄铜拉手打开，再点关上。" position={[x-.395,.36,.35]} turn={[0,-Math.PI*.42,0]}>
      <group position={[.395,0,0]}>
      <Box size={[0.79, 0.42, 0.07]} material={m.wood} />
      <Box at={[0, 0, 0.04]} size={[0.61, 0.29, 0.02]} material={m.wood} />
      <Ring at={[0, 0.08, 0.08]} radius={0.04} material={m.brass} rotation={[0, 0, 0]} />
      </group>
    </RoomObject>)}
    {[-width / 2 + 0.12, width / 2 - 0.12].map((x) => <Box key={x} at={[x, height / 2, 0.33]} size={[0.06, height, 0.09]} material={m.wood} />)}
  </RoomObject>;
}
function BooksAndPaper() {
  const m = useLabMaterials();
  return <group position={[-1.95, 1.46, 0.97]} rotation={[0, 0.12, 0]}>
    {[0, 1, 2].map((i) => <RoomObject key={i} name="工作台装订书" description="走近查看装帧；实验记录本在书堆上方，点封面打开。" position={[0, i * 0.055, 0]} rotation={[0, i * 0.08, 0]}>
      <Box at={[0, 0.02, 0]} size={[0.6, 0.035, 0.42]} material={m.paper} />
      <Box at={[0, 0, 0]} size={[0.63, 0.01, 0.45]} material={m.wood} />
      <Box at={[0, 0.041, 0]} size={[0.63, 0.01, 0.45]} material={m.wood} />
    </RoomObject>)}
    <RoomObject name="工作台纸张" description="走近查看纸面。操作说明在可打开的实体实验本中。"><Box at={[0.55, 0.005, 0]} size={[0.42, 0.007, 0.55]} rotation={[0, -0.1, 0]} material={m.paper} /></RoomObject>
    <RoomObject name="工作台笔杆" description="走近查看笔杆。"><Rod from={[0.3, 0.015, 0.11]} to={[0.75, 0.015, -0.03]} radius={0.006} material={m.wood} /></RoomObject>
    <RoomObject name="工作台墨水瓶" description="走近查看墨水瓶。"><Turned at={[0.85, 0, -0.15]} profile={[[0, 0], [0.045, 0], [0.05, 0.08], [0.03, 0.1], [0.03, 0.12], [0.025, 0.12], [0.025, 0.09]]} material={m.greenGlass} /></RoomObject>
  </group>;
}
function Stool() {
  const m = useLabMaterials();
  return <RoomObject id="stool" name="工作台木凳" description="点木凳移开，再点放回。" position={[-1.1, 0, 2.0]} anchor={[0,.74,0]} travel={[-.4,0,.3]}>
    <Turned at={[0, 0.68, 0]} profile={[[0, 0], [0.32, 0], [0.34, 0.035], [0.32, 0.09], [0, 0.09]]} material={m.wood} />
    {[0, 2.094, 4.189].map((angle) => <Rod key={angle} from={[Math.cos(angle) * 0.29, 0, Math.sin(angle) * 0.29]} to={[Math.cos(angle) * 0.2, 0.7, Math.sin(angle) * 0.2]} radius={0.035} material={m.wood} />)}
    <Ring at={[0, 0.23, 0]} radius={0.26} tube={0.016} material={m.wood} />
  </RoomObject>;
}
export default function Room() {
  const m = useLabMaterials();
  return <group>
    <Architecture />
    <TallWindow x={-3.6} depth={-8.48} /><TallWindow x={0} depth={-8.48} /><TallWindow x={3.6} depth={-8.48} />
    <Cabinet position={[2.65, 0, -3.92]} />
    <group position={[-7.6, 0, 3.0]} rotation={[0, Math.PI / 2, 0]}><Cabinet position={[0, 0, 0]} tall /></group>
    <Bookcase position={[-6.55, .41, -8.0]} />
    <Portrait />
    <Furnace />
    <WritingDesk />
    <WritingDesk id="rear-writing" position={[-1.6,.41,-6.9]} rotation={.16} />
    <group position={[-11.9,0,-.2]} rotation={[0,Math.PI/2,0]}><Bookcase position={[0,0,0]} id="gallery-bookcase" /></group>
    <Rug />
    <Table />
    <Selectable name="balance" position={[-1.46, 1.45, 0.45]}><Balance /></Selectable>
    <Selectable name="bell" position={[0.08, 1.45, 0.32]}><BellJar /></Selectable>
    <Selectable name="retort" position={[1.35, 1.45, 0.45]}><Retort /></Selectable>
    <BooksAndPaper />
    <Stool />
    <Candle at={[-2.47, 1.45, 0.24]} />
    <Linen at={[0.93, 1.46, 1.43]} />
    <RoomObject id="copper-cylinder" name="铜制容器与支架" description="走近查看铜器的箍环与支架。" position={[4.9, 1.4, -3.89]}>
      <Turned profile={[[0, 0], [0.32, 0], [0.35, 0.035], [0.34, 0.08], [0.31, 0.1], [0.31, 0.75], [0.33, 0.77], [0.33, 0.8], [0.3, 0.83], [0, 0.83]]} material={m.copper} />
      <Ring at={[0, 0.38, 0]} radius={0.315} tube={0.014} material={m.brass} />
      <Rod from={[-0.45, 0, 0]} to={[-0.45, 1.28, 0]} radius={0.015} material={m.brass} />
      <Rod from={[0.45, 0, 0]} to={[0.45, 1.28, 0]} radius={0.015} material={m.brass} />
      <Rod from={[-0.45, 1.28, 0]} to={[0.45, 1.28, 0]} radius={0.02} material={m.brass} />
    </RoomObject>
    <RoomObject id="copper-table" name="铜器陈列台" description="走近查看木制平台与上方的铜器支架。">
      <Box at={[4.65, 1.33, -3.8]} size={[1.65, 0.14, 0.95]} material={m.wood} />
      {[4.05, 5.25].flatMap(x => [-4.1, -3.5].map(z => <Turned key={`${x},${z}`} at={[x, 0, z]} profile={leg} material={m.wood} />))}
    </RoomObject>
    <RoomObject id="floor-jar" name="陶制储物罐" description="走近查看陶罐的器形与表面。" position={[-4.87, 0, 1.38]}>
      <Turned profile={[[0, 0], [0.3, 0], [0.32, 0.07], [0.31, 0.47], [0.26, 0.65], [0.1, 0.71], [0.085, 0.87], [0.1, 0.9], [0.085, 0.92], [0.075, 0.91], [0.075, 0.7], [0.24, 0.64], [0.3, 0.46], [0.28, 0.08], [0, 0.04]]} material={m.ceramic} />
    </RoomObject>
    <RoomObject id="side-table" name="侧边工作台" description="走近查看台上的玻璃瓶、研钵与烛台。" position={[-2.9, 0, -3.38]}>
      <Box at={[0, 1.22, 0]} size={[2.45, 0.13, 1.2]} material={m.wood} />
      {[-1.02, 1.02].flatMap((x) => [-0.43, 0.43].map((z) => <Turned key={`${x},${z}`} at={[x, 0, z]} profile={leg} material={m.wood} />))}
      <Bottle at={[-0.73, 1.29, 0]} green scale={1.25} />
      <Bottle at={[-0.3, 1.29, 0.14]} scale={0.85} />
      <Bottle at={[0.13, 1.29, 0]} scale={1.05} />
      <RoomObject id="mortar" name="研钵" description="走近查看研钵与研杵。"><Turned at={[0.77, 1.29, 0.14]} material={m.ceramic} profile={[[0, 0], [0.12, 0], [0.18, 0.03], [0.21, 0.17], [0.23, 0.19], [0.23, 0.21], [0.21, 0.21], [0.19, 0.17], [0.16, 0.05], [0, 0.04]]} /></RoomObject>
      <RoomObject id="pestle" name="研杵" description="走近查看研杵的器形。"><Rod from={[0.71, 1.39, 0.14]} to={[0.94, 1.66, 0.17]} radius={0.027} material={m.ceramic} /></RoomObject>
      <Candle at={[1.04, 1.29, -0.2]} />
    </RoomObject>
  </group>;
}
