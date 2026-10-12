import { useEffect, useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Box, Ring, Rod, Turned, CurvedTube } from './geometry';
import { useLabMaterials } from './materials';
import { Bottle } from './Instruments';
import { RoomObject } from './RoomObject';
import { Drawer } from './Drawer';

const spineColors = ['#4c362a', '#354036', '#6e392c', '#8b7350', '#3e413c'];
const seatLeg: [number, number][] = [[0.023, 0], [0.034, 0.02], [0.035, 0.07], [0.024, 0.11], [0.026, 0.4], [0.041, 0.44], [0.039, 0.47], [0.03, 0.7]];

export function Books({ count = 8 }: { count?: number }) {
  const m = useLabMaterials();
  return <group>
    {Array.from({ length: count }, (_, i) => {
      const width = 0.05 + (i % 3) * 0.015, height = 0.3 + (i % 4) * 0.035;
      return <RoomObject key={i} name="皮面装订书" description="点书脊抽出查看，再点放回。实验步骤与用量记在主工作台的实验记录本中。" localViewDirection={[0,0,1]} anchor={[0,0,.115]} travel={[0,0,.13]} position={[i * 0.09, height / 2, 0]} rotation={[0, 0, i === count - 1 ? -0.07 : 0]}>
        <mesh castShadow receiveShadow><boxGeometry args={[width, height, 0.22]} /><meshStandardMaterial color={spineColors[i % 5]} roughness={0.9} /></mesh>
        <Box at={[width / 2 + 0.002, 0, -0.01]} size={[0.008, height - 0.025, 0.19]} material={m.paper} />
        {[-height / 2 + 0.045, height / 2 - 0.055].map((y) => <Box key={y} at={[0, y, 0.116]} size={[width, 0.007, 0.008]} material={m.brass} />)}
      </RoomObject>;
    })}
  </group>;
}

export function Bookcase({ position, id="bookcase" }: { position: [number, number, number]; id?:string }) {
  const m = useLabMaterials();
  return <RoomObject id={id} name="藏书柜" description="可走近查看书柜和装帧，点每册书的书脊抽出，再点放回。" position={position} localViewDirection={[0,0,1]}>
    <Box at={[0, 1.65, -0.28]} size={[1.85, 3.3, 0.1]} material={m.wood} />
    {[-0.95, 0.95].map((x) => <Box key={x} at={[x, 1.65, 0]} size={[0.13, 3.3, 0.65]} material={m.wood} />)}
    {[0.12, 0.77, 1.39, 2.01, 2.64, 3.26].map((y, i) => <group key={y}>
      <Box at={[0, y, 0]} size={[1.9, 0.075, 0.61]} material={m.wood} />
      {i < 5 && <group position={[-0.77, y + 0.04, 0.09]}><Books count={i === 2 ? 12 : 17} /></group>}
      {i === 2 && <Bottle at={[0.7, y + 0.04, 0.05]} scale={0.75} green />}
    </group>)}
    <Box at={[0, 3.37, 0]} size={[2.15, 0.1, 0.77]} material={m.wood} />
    <Box at={[0, 3.28, 0]} size={[2.03, 0.05, 0.7]} material={m.wood} />
    {[-0.95, 0.95].map((x) => <Turned key={x} at={[x, 3.4, 0]} scale={1.25} material={m.wood} profile={[[0, 0], [0.045, 0], [0.045, 0.04], [0.026, 0.06], [0.05, 0.1], [0.04, 0.14], [0, 0.17]]} />)}
  </RoomObject>;
}

function Curtain({ side,windowX }: { side: number;windowX:number }) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry(), positions: number[] = [], uvs: number[] = [], indices: number[] = [];
    const columns = 36, rows = 48;
    for (let y = 0; y <= rows; y++) for (let x = 0; x <= columns; x++) {
      const u = x / columns, v = y / rows;
      const gathered = 0.52 - 0.27 * Math.exp(-((v - 0.65) ** 2) / 0.02);
      positions.push(side * (0.8 + u * gathered), -v * 2.88, 0.2 + Math.sin(u * Math.PI * 10) * 0.065 + 0.08 * Math.sin(v * Math.PI));
      uvs.push(u, v);
      if (x < columns && y < rows) { const a = y * (columns + 1) + x; indices.push(a, a + columns + 1, a + 1, a + 1, a + columns + 1, a + columns + 2); }
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geo.setIndex(indices); geo.computeVertexNormals(); return geo;
  }, [side]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const m = useLabMaterials();
  return <RoomObject id={`curtain-${windowX}-${side}`} name="窗帘与系绳" description="点帘布或黄铜系绳收拢，再点展开。" travel={[side*.3,0,0]}>
    <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial color="#827962" roughness={1} side={THREE.DoubleSide} /></mesh>
    <CurvedTube points={[[side * 0.8, -1.91, 0.32], [side * 0.98, -1.98, 0.37], [side * 1.12, -1.93, 0.23]]} radius={0.011} material={m.darkBrass} />
    <Rod from={[side * 1.1, -1.95, 0.3]} to={[side * 1.1, -2.14, 0.3]} radius={0.012} material={m.darkBrass} />
  </RoomObject>;
}

export function TallWindow({ x, depth=-4.43 }: { x: number; depth?:number }) {
  const m = useLabMaterials();
  const glazing=useMemo(()=>{
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;const c=canvas.getContext('2d')!;
    const sky=c.createLinearGradient(0,0,0,512);sky.addColorStop(0,'#a4b5bb');sky.addColorStop(.65,'#d3d3bc');sky.addColorStop(1,'#acae95');c.fillStyle=sky;c.fillRect(0,0,256,512);
    // Muted garden silhouettes give the glazing depth without competing with the bench.
    for(let i=0;i<9;i++){const px=(i*47+x*13+256)%256,py=420+Math.sin(i*3.1)*28;c.fillStyle=i%2?'#969e8e':'#9da594';c.beginPath();c.ellipse(px,py,25+i%3*5,45+i%4*7,0,0,Math.PI*2);c.fill();c.fillRect(px-2,py,4,512-py);}
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
  },[x]);
  useEffect(()=>()=>glazing.dispose(),[glazing]);
  return <RoomObject id={`window-${x}`} name="高窗" description="走近查看窗框、玻璃与帘布。帘布和系绳可以单独收拢。" position={[x, 3.65, depth]}>
    <Box at={[0, 0, -0.06]} size={[1.9, 3.1, 0.15]} material={m.wood} />
    <mesh position={[0, 0, 0.029]}><planeGeometry args={[1.67, 2.88]} /><meshStandardMaterial map={glazing} emissiveMap={glazing} emissive="#d4d9cd" emissiveIntensity={.3} roughness={.32} /></mesh>
    {[-0.89, 0.89].map((xx) => <Box key={xx} at={[xx, 0, 0.12]} size={[0.12, 3.14, 0.14]} material={m.wood} />)}
    {[-1.52, 1.52].map((y) => <Box key={y} at={[0, y, 0.12]} size={[1.94, 0.13, 0.14]} material={m.wood} />)}
    <Box at={[0, 0, 0.12]} size={[0.06, 2.94, 0.09]} material={m.wood} />
    {[-0.8, -0.08, 0.64].map((y) => <Box key={y} at={[0, y, 0.12]} size={[1.76, 0.047, 0.08]} material={m.wood} />)}
    <Box at={[0, -1.64, 0.14]} size={[2.22, 0.16, 0.4]} material={m.wood} />
    <Box at={[0, 1.66, 0.03]} size={[2.23, 0.1, 0.24]} material={m.wood} />
    <Rod from={[-1.4, 1.77, 0.2]} to={[1.4, 1.77, 0.2]} radius={0.022} material={m.darkBrass} />
    <group position={[0, 1.75, 0.04]}><Curtain side={-1} windowX={x}/><Curtain side={1} windowX={x}/></group>
  </RoomObject>;
}

export function Portrait() {
  const m = useLabMaterials(), texture = useTexture('/art/lavoisier-portrait.jpg');
  return <RoomObject id="portrait" name="拉瓦锡肖像" description="走近查看肖像与画框；按 Escape 返回房间。" position={[-8.12, 3.06, 5.1]} rotation={[0, Math.PI / 2, 0]}>
    <Box at={[0, 0, 0]} size={[1.47, 1.94, 0.08]} material={m.wood} />
    <mesh position={[0, 0, 0.048]}><planeGeometry args={[1.24, 1.65]} /><meshStandardMaterial map={texture} roughness={0.95} /></mesh>
    {[-0.68, 0.68].map((x) => <Box key={x} at={[x, 0, 0.1]} size={[0.07, 1.83, 0.08]} material={m.darkBrass} />)}
    {[-0.89, 0.89].map((y) => <Box key={y} at={[0, y, 0.1]} size={[1.43, 0.07, 0.08]} material={m.darkBrass} />)}
  </RoomObject>;
}

export function Candle({ at }: { at: [number, number, number] }) {
  const m = useLabMaterials();
  return <RoomObject name="烛台" description="走近查看黄铜底座、蜡烛与烛芯。" position={at}>
    <Turned material={m.brass} profile={[[0, 0], [0.12, 0], [0.13, 0.02], [0.1, 0.04], [0.06, 0.06], [0.035, 0.09], [0.025, 0.18], [0.04, 0.22], [0.024, 0.25], [0.025, 0.32], [0.075, 0.34], [0.075, 0.37], [0.04, 0.38]]} />
    <Turned at={[0, 0.37, 0]} material={m.ceramic} profile={[[0, 0], [0.032, 0], [0.032, 0.23], [0.025, 0.24], [0, 0.23]]} />
    <Rod from={[0, 0.6, 0]} to={[0, 0.62, 0]} radius={0.003} material={m.iron} />
  </RoomObject>;
}

export function Chair({ at, rotation = 0, id="writing-chair" }: { at: [number, number, number]; rotation?: number; id?:string }) {
  const m = useLabMaterials();
  return <RoomObject id={id} name="书桌椅" description="点椅子拉开，再点推回书桌。" position={at} rotation={[0, rotation, 0]} anchor={[0,1.5,-.34]} travel={[0,0,-.4]}>
    <Box at={[0, 0.72, 0]} size={[0.67, 0.1, 0.61]} material={m.wood} />
    <Box at={[0, 0.79, 0]} size={[0.61, 0.06, 0.54]} material={m.ceramic} />
    {[-0.26, 0.26].flatMap((x) => [-0.23, 0.23].map((z) => <Turned key={`${x},${z}`} at={[x, 0, z]} profile={seatLeg} material={m.wood} />))}
    {[-0.27, 0.27].map((x) => <Rod key={x} from={[x, 0.7, -0.26]} to={[x, 1.51, -0.34]} radius={0.03} material={m.wood} />)}
    <Box at={[0, 1.5, -0.34]} size={[0.64, 0.13, 0.07]} material={m.wood} />
    {[-0.17, 0, 0.17].map((x) => <Turned key={x} at={[x, 0.87, -0.28]} rotation={[-0.09, 0, 0]} scale={0.78} material={m.wood} profile={[[0.014, 0], [0.014, 0.12], [0.035, 0.24], [0.035, 0.36], [0.014, 0.5], [0.014, 0.7]]} />)}
    {[-0.25, 0.25].map((x) => <Rod key={x} from={[x, 0.25, -0.23]} to={[x, 0.25, 0.23]} radius={0.019} material={m.wood} />)}
    <Rod from={[-0.25, 0.25, 0]} to={[0.25, 0.25, 0]} radius={0.022} material={m.wood} />
  </RoomObject>;
}

export function WritingDesk({id="writing",position=[4.05,0,2.2],rotation=-.2}:{id?:string;position?:[number,number,number];rotation?:number}) {
  const m = useLabMaterials();
  return <RoomObject id={`${id}-desk`} name="书写桌" description="走近查看桌面；点拉手开合抽屉，点椅子拉开，书籍可以抽出查看。" position={position} rotation={[0,rotation,0]}>
    <Box at={[0, 1.11, 0]} size={[2.6, 0.13, 1.3]} material={m.wood} />
    <Box at={[0, 1.175, 0]} size={[1.3, 0.012, 0.75]} material={m.iron} />
    {[-1.06, 1.06].flatMap((x) => [-0.48, 0.48].map((z) => <Turned key={`${x},${z}`} at={[x, 0, z]} scale={1.5} material={m.wood} profile={seatLeg} />))}
    {[-.58,.58].map((x,i)=><Drawer key={x} id={`${id}-drawer-${i}`} position={[x,.96,.59]} width={1.1} depth={.48}/>)}
    <group position={[0.5, 1.2, -0.33]}><Books count={5} /></group>
    <RoomObject name="书桌纸张" description="走近查看纸张。实验操作与记录在主工作台的实体实验本中。"><Box at={[0, 1.198, 0.08]} size={[0.62, 0.008, 0.46]} material={m.paper} rotation={[0, -0.13, 0]} /></RoomObject>
    <RoomObject name="书桌笔杆" description="走近查看笔杆与书写桌布置。"><Rod from={[-0.31, 1.21, 0.09]} to={[0.26, 1.21, 0.28]} radius={0.006} material={m.wood} /></RoomObject>
    <RoomObject name="墨水瓶" description="走近查看墨水瓶；此瓶不用于实验投料。"><Turned at={[-0.43, 1.19, -0.16]} material={m.greenGlass} profile={[[0, 0], [0.06, 0], [0.06, 0.075], [0.038, 0.095], [0.035, 0.13]]} /></RoomObject>
    <Candle at={[-1, 1.18, -0.24]} />
    <Chair id={`${id}-chair`} at={[0.25, 0, 1.03]} rotation={Math.PI - 0.13} />
  </RoomObject>;
}

export function Furnace() {
  const m = useLabMaterials();
  return <RoomObject id="furnace-body" name="炉台" description="走近查看炉具。实验杯可放上炉台，点炭火口控制教学加热。" position={[-5.14, 0, -2.48]} rotation={[0, Math.PI / 2, 0]}>
    <Box at={[0, 0.04, 0.12]} size={[1.93, 0.1, 1.2]} material={m.plaster} />
    {[-0.65, 0.65].map((x) => <Box key={x} at={[x, 0.65, 0]} size={[0.26, 1.21, 0.65]} material={m.plaster} />)}
    <Box at={[0, 1.25, 0]} size={[1.63, 0.23, 0.81]} material={m.plaster} />
    <Box at={[0, 1.44, 0]} size={[1.92, 0.15, 1.0]} material={m.plaster} />
    <Box at={[0, 3.15, -0.25]} size={[1.63, 3.3, 0.4]} material={m.plaster} />
    <Box at={[0, 0.61, -0.29]} size={[1.03, 1.13, 0.03]} material={m.iron} />
    {Array.from({ length: 7 }, (_, i) => <Rod key={i} from={[-0.46 + i * 0.15, 0.14, 0.35]} to={[-0.46 + i * 0.15, 0.47, 0.35]} radius={0.013} material={m.iron} />)}
    <Rod from={[-0.57, 0.4, 0.35]} to={[0.57, 0.4, 0.35]} radius={0.018} material={m.iron} />
    {[0, 1, 2].map((i) => <Rod key={i} from={[-0.39, 0.16 + i * 0.06, 0.03]} to={[0.37, 0.16 + i * 0.06, 0.19]} radius={0.045} material={m.wood} />)}
    <Turned at={[0, 1.52, 0]} material={m.copper} profile={[[0, 0], [0.17, 0], [0.22, 0.04], [0.24, 0.27], [0.18, 0.34], [0.09, 0.38], [0, 0.38]]} />
    <CurvedTube points={[[0.16, 1.72, 0], [0.27, 1.77, 0], [0.36, 1.89, 0]]} radius={0.032} material={m.copper} />
    <Ring at={[0, 1.9, 0]} radius={0.18} tube={0.013} rotation={[0, 0, 0]} material={m.iron} />
    <Candle at={[-0.63, 1.52, 0.12]} />
    <Rod from={[1.04, 0.03, 0.1]} to={[1.04, 1.15, 0.1]} radius={0.012} material={m.iron} />
    <Ring at={[1.04, 1.16, 0.1]} radius={0.044} tube={0.012} rotation={[0, 0, 0]} material={m.iron} />
    <Box at={[1.04, 0.09, 0.1]} size={[0.15, 0.15, 0.06]} material={m.iron} />
  </RoomObject>;
}

export function Rug() {
  const m = useLabMaterials();
  const texture = useMemo(() => {
    const size = 512, data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const edge = Math.min(x, y, size - 1 - x, size - 1 - y), dx = Math.abs(x - 256), dy = Math.abs(y - 256);
      const diamond = Math.abs((dx / 1.35 + dy) % 80 - 40) < 4;
      const border = edge < 12 || (edge > 23 && edge < 31) || (edge > 45 && edge < 52);
      const motif = edge < 50 ? ((x + y) % 24 < 4) : diamond;
      const rgb = border ? [145, 116, 75] : motif ? [139, 107, 65] : [82, 37, 30];
      const grain = (Math.sin(x * 7.4 + y * 17.8) + Math.cos(y * Math.PI)) * 5;
      const index = (y * size + x) * 4;
      for (let i = 0; i < 3; i++) data[index + i] = rgb[i] + grain; data[index + 3] = 255;
    }
    const map = new THREE.DataTexture(data, size, size); map.colorSpace = THREE.SRGBColorSpace; map.needsUpdate = true; return map;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return <RoomObject id="rug" name="地毯" description="走近查看织纹、边饰与流苏。" position={[0.4, 0.03, 1.32]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[6.5, 4.1]} /><meshStandardMaterial map={texture} roughness={1} /></mesh>
    {[-1, 1].flatMap((side) => Array.from({ length: 50 }, (_, i) => <Rod key={`${side},${i}`} from={[-3.17 + i * 0.13, 0, side * 2.05]} to={[-3.17 + i * 0.13, 0, side * 2.13]} radius={0.006} material={m.cord} />))}
  </RoomObject>;
}

export function Linen({ at }: { at: [number, number, number] }) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, -0.36), new THREE.Vector3(0, 0, -0.12), new THREE.Vector3(0, -0.025, 0.005), new THREE.Vector3(0, -0.24, 0.05), new THREE.Vector3(0, -0.52, 0.04)]);
    const positions: number[] = [], indices: number[] = [], steps = 32;
    for (let y = 0; y <= steps; y++) for (let x = 0; x <= steps; x++) {
      const u = x / steps, v = y / steps, p = curve.getPoint(v), fold = Math.sin(u * Math.PI * 8) * 0.009;
      const z = p.z + fold * v;
      const yPosition = z < 0 ? Math.max(0.004, p.y + fold * (1 - v)) : p.y + fold * (1 - v);
      positions.push((u - 0.5) * 0.53, yPosition, z);
      if (x < steps && y < steps) { const a = y * (steps + 1) + x; indices.push(a, a + steps + 1, a + 1, a + 1, a + steps + 1, a + steps + 2); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geo.setIndex(indices); geo.computeVertexNormals(); return geo;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <RoomObject id="linen" name="工作台亚麻布" description="走近查看布面与垂落的褶皱。"><mesh geometry={geometry} position={at} castShadow receiveShadow><meshStandardMaterial color="#b6ab8d" roughness={1} side={THREE.DoubleSide} /></mesh></RoomObject>;
}
