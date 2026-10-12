import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { amount, liquidColor, mass, pH, reagents, reactions, type Reagent, type Species } from '../lab/chemistry';
import { experimentNames, items, type ItemId, type Position } from '../lab/registry';
import { snapshot, useWorld, validSnapshot, weighingMass } from '../lab/world';
import { useLabStore } from '../store';
import { Box, CurvedTube, Ring, Rod, Turned } from './geometry';
import { MaterialContext, useLabMaterials } from './materials';
import { pickObject, placeHeld } from './labActions';
import { clickTargets } from '../lab/guidance';
import { consumeLabPointer, useInteraction } from '../lab/interaction';
import { projectRoomObjects, usePhysicalHover, useRoomMechanisms } from './RoomObject';
import PhysicalNotebook, { bookSize } from './PhysicalNotebook';

const isReagent = (id: ItemId): id is Reagent => id in reagents;
const metalSpecies: Partial<Record<ItemId, Species>> = { iron: 'Fe', copper: 'Cu', zinc: 'Zn' };
function PaperLabel({ text, at, width = 0.26 }: { text: string; at: Position; width?: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 256;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#d8c49c'; ctx.fillRect(0, 0, 768, 256);
    ctx.strokeStyle = '#8d7045'; ctx.lineWidth = 5; ctx.strokeRect(13, 13, 742, 230);
    ctx.fillStyle = '#382f22'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = text.split('\n'); ctx.font = `${lines.length>2?46:54}px Georgia, "Microsoft YaHei", serif`;lines.forEach((line, i) => ctx.fillText(line, 384, 128 + (i - (lines.length - 1) / 2) * 70, 700));
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; return map;
  }, [text]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={at}><planeGeometry args={[width, width * (text.split('\n').length>2?.5:1/3)]} /><meshStandardMaterial map={texture} roughness={1} side={THREE.DoubleSide} /></mesh>;
}
function BottleModel({ id }: { id: Reagent }) {
  const m = useLabMaterials(), w = useWorld();
  const open = w.opened[id], fill = w.stock[id] / (id === 'water' ? 200 : id === 'indicator' ? 10 : 100);
  return <>
    <Turned profile={[[0, 0], [0.13, 0], [0.145, 0.03], [0.145, 0.29], [0.13, 0.33], [0.065, 0.4], [0.06, 0.49], [0.07, 0.5], [0.049, 0.5], [0.049, 0.4], [0.12, 0.32], [0.134, 0.29], [0.134, 0.035], [0, 0.024]]} material={m.glass} />
    {fill > 0 && <mesh position={[0, 0.035 + fill * 0.23 / 2, 0]}><cylinderGeometry args={[0.13, 0.13, fill * 0.23, 32]} /><meshStandardMaterial color={reagents[id].color} transparent opacity={0.65} depthWrite={false} roughness={0.24} /></mesh>}
    <group position={open ? [0.19, 0.06, 0] : [0, 0.49, 0]} onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); w.toggleOpen(id); }}>
      <Turned profile={[[0, 0], [0.05, 0], [0.053, 0.075], [0.06, 0.083], [0, 0.083]]} material={m.wood} />
      <mesh position={[0, 0.04, 0]} visible={false}><sphereGeometry args={[0.09, 12, 8]} /></mesh>
    </group>
    <PaperLabel text={`${reagents[id].name}\n${id === 'indicator' ? '酚酞' : reagents[id].formula}${reagents[id].concentration>0?`\n${reagents[id].concentration.toFixed(3)} mol/L`:''}`} at={[0, 0.18, 0.155]} width={0.23} />
  </>;
}
function VesselModel() {
  const m = useLabMaterials(), v = useWorld(s => s.vessel), dirty = useWorld(s => s.dirty);
  const height = Math.max(0.003, v.volume / v.capacity * 0.34);
  const copper = amount(v.contents, 'Cu'), iron = amount(v.contents, 'Fe'), zinc = amount(v.contents, 'Zn');
  return <>
    <Turned profile={[[0, 0], [0.17, 0], [0.19, 0.025], [0.19, 0.4], [0.205, 0.42], [0.207, 0.44], [0.175, 0.44], [0.177, 0.04], [0, 0.04]]} material={m.glass} />
    {v.volume > 0 && <mesh position={[0, 0.041 + height / 2, 0]}><cylinderGeometry args={[0.175, 0.175, height, 40]} /><meshStandardMaterial color={liquidColor(v)} transparent opacity={0.43} depthWrite={false} roughness={0.21} /></mesh>}
    {Array.from({ length: 5 }, (_, i) => <PaperLabel key={i} text={`${(i + 1) * 20}`} at={[0.08, 0.07 + i * 0.068, 0.191]} width={0.065} />)}
    {iron + copper > 0 && <group position={[-0.06, 0.07, 0]} rotation={[0, 0, 0.6]}><Rod from={[0, 0, 0]} to={[0, 0.24, 0]} radius={0.009 + Math.min(0.006, copper * 3)} material={copper > 0 ? m.copper : m.iron} /></group>}
    {zinc > 0 && <mesh position={[0.05, 0.07, 0]} material={m.iron}><icosahedronGeometry args={[0.035, 1]} /></mesh>}
    {amount(v.contents, 'precipitate') > 0 && <Precipitate mol={amount(v.contents,'precipitate')}/>}
    {dirty && !v.volume && <Ring at={[0, 0.06, 0]} radius={0.174} tube={0.004} material={m.copper} />}
    <Bubbles />
  </>;
}
function Precipitate({mol}:{mol:number}) {
  const mesh=useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(()=>{
    if(!mesh.current)return;
    const count=Math.min(128,Math.max(1,Math.ceil(mol/.0005*96))),dummy=new THREE.Object3D();
    mesh.current.count=count;
    for(let i=0;i<count;i++){
      const angle=i*2.3999632297,radius=.137*Math.sqrt(((i*37)%128+.5)/128),grain=((i*23)%31)/31;
      dummy.position.set(Math.cos(angle)*radius,.047+grain*.008,Math.sin(angle)*radius);
      dummy.rotation.set(i*.37,i*.61,i*.23);dummy.scale.set(.010+grain*.006,.006+grain*.004,.012+grain*.006);
      dummy.updateMatrix();mesh.current.setMatrixAt(i,dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate=true;mesh.current.computeBoundingSphere();
  },[mol]);
  return <instancedMesh ref={mesh} args={[undefined,undefined,128]}><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color="#4687b2" roughness={1}/></instancedMesh>;
}
function Bubbles() {
  const group = useRef<THREE.Group>(null), v = useWorld(s => s.vessel);
  const active = v.volume > 0 && amount(v.contents, 'H') > 1e-10 && (amount(v.contents, 'Zn') > 1e-10 || amount(v.contents, 'carbonate') > 1e-10);
  useFrame(({ clock }) => { group.current?.children.forEach((bubble, i) => { bubble.position.y = 0.06 + ((clock.elapsedTime * 0.15 + i / 12) % 1) * (v.volume / 100 * 0.34); }); });
  return <group ref={group} visible={active}>{Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[Math.sin(i * 5) * 0.12, 0.08, Math.cos(i * 5) * 0.12]}><sphereGeometry args={[0.009, 8, 6]} /><meshStandardMaterial color="#d6e3d0" transparent opacity={0.5} /></mesh>)}</group>;
}
function Model({ id }: { id: ItemId }) {
  const m = useLabMaterials(), w = useWorld();
  if (id in metalSpecies && w.solids[id as 'iron' | 'copper' | 'zinc'] <= 1e-9) return null;
  if (isReagent(id)) return <BottleModel id={id} />;
  if (id === 'beaker') return <VesselModel />;
  if (id === 'powder') return <><Turned profile={[[0, 0], [0.07, 0], [0.09, 0.025], [0.09, 0.08], [0.08, 0.085], [0.07, 0.03], [0, 0.03]]} material={m.ceramic} /><mesh position={[0, 0.045, 0]} material={m.paper}><coneGeometry args={[0.06, 0.04, 12]} /></mesh></>;
  if (id === 'spoon') return <><Rod from={[-0.11, 0.03, 0]} to={[0.11, 0.03, 0]} radius={0.008} material={m.brass} /><mesh position={[0.11, 0.03, 0]} scale={[1.4, 0.4, 1]} material={w.spoonLoad ? m.paper : m.brass}><sphereGeometry args={[0.025, 16, 8]} /></mesh></>;
  if (id === 'furnace') return <group position={[0.1, -0.87, 0]}><Box size={[0.045, 0.3, 0.34]} material={m.iron} /><mesh position={[0.035, 0, 0]} onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); w.toggleHeat(); }}><boxGeometry args={[0.05, 0.18, 0.2]} /><meshStandardMaterial color={w.heating ? '#ad6031' : '#3e352b'} emissive={w.heating ? '#cb572b' : '#000000'} emissiveIntensity={0.7} /></mesh></group>;
  if (id === 'iron') return <><Rod from={[-0.1, 0.02, 0]} to={[0.1, 0.02, 0]} radius={0.014} material={m.iron} /><Box at={[-0.1, 0.02, 0]} size={[0.016, 0.058, 0.058]} material={m.iron} /></>;
  if (id === 'copper') return <Box at={[0, 0.018, 0]} size={[0.18, 0.025, 0.095]} material={m.copper} />;
  if (id === 'zinc') return <>{[0, 1, 2].map(i => <mesh key={i} position={[(i - 1) * 0.055, 0.035, 0]} material={m.iron}><icosahedronGeometry args={[0.035, 1]} /></mesh>)}</>;
  if (id === 'tweezers') return <>
    {[-1, 1].map(sign => <Rod key={sign} from={[-0.14, 0.04, 0]} to={[0.15, 0.02, sign * 0.025]} radius={0.008} material={m.iron} />)}
    {mass(w.clamp) > 0 && <mesh position={[0.15, 0.025, 0]} material={amount(w.clamp, 'Cu') ? m.copper : m.iron}><boxGeometry args={[0.08, 0.015, 0.035]} /></mesh>}
  </>;
  if (id === 'lens') return <><Ring at={[0, 0.17, 0]} radius={0.095} tube={0.012} material={m.brass} rotation={[0.25, 0, 0]} /><Rod from={[0, 0, 0]} to={[0, 0.08, 0]} radius={0.012} material={m.wood} /><mesh position={[0, 0.17, 0]} rotation={[0.25, 0, 0]} material={m.glass}><circleGeometry args={[0.086, 32]} /></mesh></>;
  if (id === 'notebook') return <PhysicalNotebook/>;
  if (id === 'waste' || id === 'wash') return <><Turned profile={id === 'waste' ? [[0, 0], [0.13, 0], [0.16, 0.03], [0.16, 0.27], [0.19, 0.3], [0.17, 0.32], [0.14, 0.27], [0.13, 0.04], [0, 0.04]] : [[0, 0], [0.22, 0], [0.3, 0.16], [0.31, 0.18], [0.29, 0.18], [0.2, 0.025], [0, 0.025]]} material={m.ceramic} /><PaperLabel text={items[id].name} at={[0, 0.09, id === 'wash' ? 0.27 : 0.165]} width={0.26} /></>;
  if (id === 'pipette' || id === 'stirrer') return <><Rod from={[-0.14, 0.025, 0]} to={[0.14, 0.025, 0]} radius={0.009} material={m.glass} />{id === 'pipette' && <mesh position={[-0.14, 0.025, 0]} material={m.wood}><sphereGeometry args={[0.025, 12, 8]} /></mesh>}{id === 'pipette' && w.toolLiquid.pipette?.ml ? <Rod from={[0, 0.025, 0]} to={[0.1, 0.025, 0]} radius={0.006} material={m.copper} /> : null}</>;
  if (id === 'measure') return <><Turned profile={[[0, 0], [0.065, 0], [0.065, 0.015], [0.035, 0.02], [0.035, 0.28], [0.046, 0.3], [0.03, 0.3], [0.03, 0.03], [0, 0.025]]} material={m.glass} /><PaperLabel text="10 mL" at={[0, 0.15, 0.04]} width={0.068} />{w.toolLiquid.measure?.ml ? <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.029, 0.029, w.toolLiquid.measure.ml / 10 * 0.2, 24]} /><meshStandardMaterial color={reagents[w.toolLiquid.measure.reagent].color} transparent opacity={0.7} /></mesh> : null}</>;
  if (id === 'stopper') return <Turned profile={[[0, 0], [0.17, 0], [0.18, 0.04], [0.19, 0.045], [0.19, 0.055], [0, 0.055]]} material={m.wood} />;
  if (id === 'tube') return <><CurvedTube points={[[0, 0, 0], [0, 0.17, 0], [0.18, 0.22, 0], [0.38, 0.1, 0], [0.38, -0.18, 0]]} radius={0.012} material={m.glass} /><Turned at={[0.38, -0.24, 0]} profile={[[0, 0], [0.08, 0], [0.08, 0.34], [0.034, 0.38], [0.034, 0.4], [0.024, 0.4], [0.024, 0.37], [0.07, 0.33], [0.07, 0.02], [0, 0.02]]} material={m.glass} /></>;
  return <><Turned profile={[[0, 0], [0.14, 0], [0.19, 0.025], [0.19, 0.04], [0.17, 0.045], [0, 0.02]]} material={m.brass} /><PaperLabel text={w.weighing ? `${weighingMass(w).toFixed(3)} g` : '称量'} at={[0, 0.075, 0.2]} width={0.29} /></>;
}
function Movable({ id }: { id: ItemId }) {
  const w = useWorld(), root = useRef<THREE.Group>(null);
  const held=useInteraction(s=>s.held);
  const controls = useThree(s => s.controls) as unknown as { enabled: boolean } | null;
  const hover=usePhysicalHover();
  const gesture = useRef<{ x: number; y: number; pointer: number; dragged: boolean; pour: boolean; readyAt: number; origin: Position; previousSelected: ItemId | null } | null>(null);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.49), []);
  useLayoutEffect(() => { if (!gesture.current) root.current?.position.set(...w.positions[id]); }, [w.positions, id, held]);
  const down = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0 || useWorld.getState().busy) return;
    e.stopPropagation(); w.setBusy(true);
    if (controls) controls.enabled = false;
    gesture.current = { x: e.clientX, y: e.clientY, pointer: e.pointerId, dragged: false, pour: isReagent(id) && w.docked === id, readyAt: performance.now() + (e.pointerType === 'touch' ? 350 : 0), origin: [...w.positions[id]], previousSelected: w.selected };
    if (import.meta.env.DEV) (window as unknown as { __labGesture: unknown }).__labGesture = { id, phase: 'down', pour: gesture.current.pour };
    (e.target as unknown as { setPointerCapture: (id: number) => void }).setPointerCapture(e.pointerId);
  };
  const move = (e: ThreeEvent<PointerEvent>) => {
    const g = gesture.current; if (!g || !root.current) return; e.stopPropagation();
    if (performance.now() < g.readyAt) return;
    if (Math.hypot(e.clientX - g.x, e.clientY - g.y) < 7 && !g.dragged) return;
    g.dragged = true;
    if (g.pour && (e.clientX-g.x>7 || Math.abs(e.clientY-g.y)>=Math.abs(e.clientX-g.x))) { w.setAngle(Math.max((e.clientX-g.x)/100,(g.y-e.clientY)/100)); return; }
    g.pour = false;
    if (!items[id].movable) return;
    const hovered = e.intersections.map(hit => {
      let object: THREE.Object3D | null = hit.object;
      while (object && !object.userData.itemId && !object.userData.homeId) object = object.parent;
      return object ? { key: (object.userData.itemId ?? object.userData.homeId) as ItemId, home: !!object.userData.homeId } : null;
    }).find(hit => hit && (hit.key !== id || hit.home));
    if (import.meta.env.DEV) (window as unknown as { __labGesture: unknown }).__labGesture = { id, phase: 'move', hovered, hits: e.intersections.length };
    if (hovered) { const target = hovered.home ? items[hovered.key].home : useWorld.getState().positions[hovered.key]; root.current.position.set(target[0], 1.7, target[2]); return; }
    const hit = e.ray.intersectPlane(plane, new THREE.Vector3());
    if (hit) root.current.position.set(THREE.MathUtils.clamp(hit.x, -5.6, 5.6), 1.7, THREE.MathUtils.clamp(hit.z, -4, 3));
  };
  const up = (e: ThreeEvent<PointerEvent>) => {
    const g = gesture.current; if (!g) return; e.stopPropagation(); consumeLabPointer();
    gesture.current = null; w.setAngle(0); w.setBusy(false);
    if (controls) controls.enabled = true;
    (e.target as unknown as { releasePointerCapture: (id: number) => void }).releasePointerCapture(g.pointer);
    if (g.dragged) {
      if (import.meta.env.DEV) (window as unknown as { __labGesture: unknown }).__labGesture = { id, phase: 'up', pour: g.pour, position: root.current?.position.toArray() };
      if (!g.pour && items[id].movable && root.current) w.drop(id, root.current.position.toArray() as Position);
      root.current?.position.set(...useWorld.getState().positions[id]);
      if(!g.pour){w.inspect(null);useLabStore.getState().select('bench');}
    } else {
      const currentHeld=useInteraction.getState().held;
      if(currentHeld){const target=clickTargets(useWorld.getState(),currentHeld).find(t=>t.id===id&&!t.home);if(target)placeHeld(target);else useWorld.setState({feedback:'此处无法放置。按 Escape 放回，再检查瓶塞、杯口或工具。'});return;}
      if(id==='notebook'){useInteraction.getState().openBook(true);w.inspect(id);useLabStore.getState().select('interactive');return;}
      useInteraction.getState().refer(id);
      if(w.selected===id&&items[id].movable&&!(id in metalSpecies)&&!(id==='stirrer'&&w.vessel.closed)){pickObject(id);return;}
      if (id === 'lens') { if(!w.micro)useInteraction.getState().observe();w.toggleMicro(); w.inspect(w.micro ? null : 'beaker'); if (w.micro) { useLabStore.getState().select('room'); return; } }
      else if (id === 'stirrer' && w.vessel.closed) w.mix();
      else w.inspect(id);
      useLabStore.getState().select('interactive');
    }
  };
  useEffect(() => {
    const cancel = () => { if (!gesture.current) return; gesture.current = null; useWorld.getState().setBusy(false); useWorld.getState().setAngle(0); root.current?.position.set(...useWorld.getState().positions[id]); };
    window.addEventListener('blur', cancel); window.addEventListener('pointercancel', cancel);
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') cancel(); };
    window.addEventListener('keydown', escape);
    return () => { window.removeEventListener('blur', cancel); window.removeEventListener('pointercancel', cancel); window.removeEventListener('keydown', escape); };
  }, [id]);
  useFrame(() => { if (root.current && isReagent(id)) root.current.rotation.z = w.docked === id ? -w.angle : 0; });
  if(held===id)return null;
  return <group ref={root} position={w.positions[id]} userData={{ itemId: id }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onClick={e => e.stopPropagation()} onDoubleClick={e => e.stopPropagation()} onPointerOver={e => { if (!useWorld.getState().busy) e.stopPropagation();useInteraction.getState().hover(id); hover.over(e.object,held?(clickTargets(useWorld.getState(),held).some(t=>t.id===id&&!t.home)?'pointer':'not-allowed'):items[id].movable ? 'grab' : 'pointer'); }} onPointerOut={() => {if(useInteraction.getState().hovered===id)useInteraction.getState().hover(null); hover.clear(); }}>
    <Model id={id} />
    {!isReagent(id) && id !== 'beaker' && id !== 'tube' && items[id].movable && <mesh position={[0, 0.04, 0]}><boxGeometry args={[0.24, 0.1, 0.12]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>}
  </group>;
}
function MicroView() {
  const w = useWorld(), [rotation, setRotation] = useState(0), [zoom, setZoom] = useState(1);
  const controls = useThree(s => s.controls) as unknown as { enabled: boolean } | null;
  const gesture = useRef<number | null>(null), particles = useRef<THREE.Group>(null);
  useEffect(() => { if (!w.micro && controls) { controls.enabled = true; gesture.current = null; } }, [w.micro, controls]);
  const v = w.vessel, progress = Object.entries(v.extent).filter(([id]) => id !== 'dissolution').sort((a, b) => b[1]! - a[1]!);
  const reaction = reactions.find(r => r.id === progress[0]?.[0]);
  useFrame(({ clock }) => {
    particles.current?.children.forEach((p, i) => { p.position.y = Math.sin(clock.elapsedTime * 0.65 + i * 2) * 0.06; });
  });
  if (!w.micro) return null;
  const activeIons = (['CuIon', 'FeIon', 'ZnIon', 'H', 'OH', 'carbonate', 'Na', 'Cl', 'sulfate'] as Species[]).filter(id => amount(v.contents, id) > 1e-10);
  const labels: Partial<Record<Species, string>> = { CuIon: 'Cu²⁺', FeIon: 'Fe²⁺', ZnIon: 'Zn²⁺', H: 'H⁺', OH: 'OH⁻', carbonate: 'CO₃²⁻', Na: 'Na⁺', Cl: 'Cl⁻', sulfate: 'SO₄²⁻' };
  return <group position={[w.positions.beaker[0], 2.55, w.positions.beaker[2]]}>
    <group position={[0, 0.38, 0]} rotation={[0, rotation, 0]} scale={zoom} onPointerOver={e => { e.stopPropagation(); if (controls) controls.enabled = false; }} onPointerOut={() => { if (controls && gesture.current === null) controls.enabled = true; }} onPointerDown={e => { e.stopPropagation(); gesture.current = e.clientX; w.setBusy(true); (e.target as unknown as { setPointerCapture: (id: number) => void }).setPointerCapture(e.pointerId); }} onPointerMove={e => { if (gesture.current !== null) { e.stopPropagation(); setRotation(r => r + (e.clientX - gesture.current!) * 0.015); gesture.current = e.clientX; } }} onPointerUp={e => { e.stopPropagation(); gesture.current = null; w.setBusy(false); (e.target as unknown as { releasePointerCapture: (id: number) => void }).releasePointerCapture(e.pointerId); }} onWheel={e => { e.stopPropagation(); setZoom(z => THREE.MathUtils.clamp(z - e.deltaY * 0.001, 0.65, 1.5)); }}>
      <mesh><boxGeometry args={[1.2, 0.5, 0.35]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>
      <group ref={particles}>{activeIons.slice(0, 6).map((ion, i) => <group key={ion} position={[(i - (Math.min(activeIons.length, 6) - 1) / 2) * 0.16, 0, Math.sin(i) * 0.09]}><mesh><sphereGeometry args={[0.034, 16, 12]} /><meshStandardMaterial color={ion === 'CuIon' ? '#3e80ac' : ion === 'FeIon' ? '#91a079' : '#ae926c'} /></mesh><PaperLabel text={labels[ion]!} at={[0, -0.07, 0.045]} width={0.14} /></group>)}</group>
      {(amount(v.contents, 'precipitate') > 0 || amount(v.contents, 'Cu') > 0) && <group position={[0.28, -0.21, 0]}>{Array.from({ length: 6 }, (_, i) => <mesh key={i} position={[(i % 3) * 0.05, Math.floor(i / 3) * 0.05, 0]}><sphereGeometry args={[0.023, 12, 8]} /><meshStandardMaterial color={amount(v.contents, 'precipitate') ? '#498fc0' : '#b36e44'} /></mesh>)}</group>}
      <Molecule id={reaction?.id === 'zinc' ? 'H2' : reaction?.id === 'carbonate' ? 'CO2' : 'water'} />
      {reaction?.id === 'displacement' && <ElectronTransfer />}
    </group>
  </group>;
}
function Molecule({ id }: { id: 'water' | 'CO2' | 'H2' }) {
  const bond = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c2b89c' }), []);
  useEffect(() => () => bond.dispose(), [bond]);
  const atoms: { p: Position; color: string; size: number }[] = id === 'CO2' ? [{ p: [-0.1, 0, 0], color: '#ac5b45', size: 0.035 }, { p: [0, 0, 0], color: '#45433d', size: 0.03 }, { p: [0.1, 0, 0], color: '#ac5b45', size: 0.035 }] : id === 'H2' ? [{ p: [-0.04, 0, 0], color: '#e5dcc4', size: 0.03 }, { p: [0.04, 0, 0], color: '#e5dcc4', size: 0.03 }] : [{ p: [0, 0, 0], color: '#ac5b45', size: 0.035 }, { p: [-0.06, 0.046, 0], color: '#e5dcc4', size: 0.02 }, { p: [0.06, 0.046, 0], color: '#e5dcc4', size: 0.02 }];
  const bonds = id === 'CO2' ? [[1, 0], [1, 2]] : id === 'H2' ? [[0, 1]] : [[0, 1], [0, 2]];
  return <group position={[-0.3, -0.2, 0]}>{atoms.map((a, i) => <mesh key={i} position={a.p}><sphereGeometry args={[a.size, 16, 12]} /><meshStandardMaterial color={a.color} /></mesh>)}{bonds.map(([from, to], i) => <Rod key={i} from={atoms[from].p} to={atoms[to].p} radius={0.007} material={bond} />)}<PaperLabel text={id === 'water' ? 'H₂O' : id === 'H2' ? 'H₂' : 'CO₂'} at={[0, -0.06, 0.05]} width={0.12} /></group>;
}
function ElectronTransfer() {
  const group = useRef<THREE.Group>(null);
  const active = useWorld(w => amount(w.vessel.contents, 'Fe') > 1e-10 && amount(w.vessel.contents, 'CuIon') > 1e-10);
  useFrame(({ clock }) => { if (!active) return; group.current?.children.forEach((p, i) => { const t = (clock.elapsedTime * 0.3 + i * 0.15) % 1; p.position.set(-0.3 + t * 0.6, 0.13 + Math.sin(t * Math.PI) * 0.04, 0); }); });
  return <group ref={group}>{[0, 1].map(i => <mesh key={i}><sphereGeometry args={[0.012, 10, 8]} /><meshStandardMaterial color="#bca05a" /></mesh>)}</group>;
}
export default function InteractiveLab() {
  const m = useLabMaterials(), { camera, size } = useThree(), accumulator = useRef(0), saveClock = useRef(0);
  const clearGlass = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#e5edda', transparent: true, opacity: 0.22, depthWrite: false, roughness: 0.08, metalness: 0.03, side: THREE.DoubleSide }), []);
  useEffect(() => () => clearGlass.dispose(), [clearGlass]);
  const interactiveMaterials = useMemo(() => ({ ...m, glass: clearGlass }), [m, clearGlass]);
  useEffect(() => { useWorld.getState().restore(); useWorld.setState({ feedback: '' }); }, []);
  useEffect(() => {
    const cancel = (e: KeyboardEvent) => { if (e.key === 'Escape') { useInteraction.getState().cancel();if(useWorld.getState().micro)useWorld.getState().toggleMicro();useWorld.getState().inspect(null); useWorld.getState().setAngle(0); useWorld.getState().setBusy(false); } };
    const save = () => { try { localStorage.setItem('historical-lab-v1', JSON.stringify({ ...snapshot(useWorld.getState()), busy: false, angle: 0, selected: null })); } catch { /* Storage unavailable: the in-memory experiment remains usable. */ } };
    window.addEventListener('keydown', cancel); window.addEventListener('pagehide', save);
    return () => { window.removeEventListener('keydown', cancel); window.removeEventListener('pagehide', save); };
  }, []);
  useFrame((_, delta) => {
    accumulator.current += Math.min(delta, 0.25); saveClock.current += delta;
    while (accumulator.current >= 0.05) { useWorld.getState().tick(0.05); accumulator.current -= 0.05; }
    if (saveClock.current > 3) { saveClock.current = 0; try { localStorage.setItem('historical-lab-v1', JSON.stringify({ ...snapshot(useWorld.getState()), busy: false, angle: 0, selected: null })); } catch { /* Optional persistence. */ } }
    if (import.meta.env.DEV) {
      const projected = Object.fromEntries(Object.entries(useWorld.getState().positions).map(([id, p]) => {
        const point = new THREE.Vector3(p[0], p[1] + (isReagent(id as ItemId) ? 0.2 : id === 'beaker' ? 0.18 : id === 'notebook' ? .20 : 0.04), p[2]).project(camera);
        return [id, [(point.x + 1) * size.width / 2, (1 - point.y) * size.height / 2]];
      }));
      for (const id of Object.keys(reagents) as Reagent[]) {
        const state = useWorld.getState(), p = state.positions[id], angle = state.docked === id ? state.angle : 0;
        const local = state.opened[id] ? new THREE.Vector3(0.19, 0.10, 0) : new THREE.Vector3(0, 0.53, 0);
        local.applyAxisAngle(new THREE.Vector3(0, 0, 1), -angle).add(new THREE.Vector3(...p)).project(camera);
        projected[`${id}Cap`] = [(local.x + 1) * size.width / 2, (1 - local.y) * size.height / 2];
      }
      for (const [id, def] of Object.entries(items)) {
        const point = new THREE.Vector3(def.home[0], def.home[1] + 0.01, def.home[2]).project(camera);
        projected[`${id}Home`] = [(point.x + 1) * size.width / 2, (1 - point.y) * size.height / 2];
      }
      const book=useWorld.getState().positions.notebook;
      const bookPoint=(x:number,y:number)=>{const point=new THREE.Vector3(book[0]+(x/1536-.5)*bookSize.width,book[1]+bookSize.y+.002,book[2]+(y/1024-.5)*bookSize.height).project(camera);return [(point.x+1)*size.width/2,(1-point.y)*size.height/2];};
      for(let i=0;i<6;i++)projected[`notebookExp${i}`]=bookPoint(380,190+i*74);
      projected.notebookSketch=bookPoint(1120,500);projected.notebookClose=bookPoint(1340,956);
      const tray=new THREE.Vector3(-.8,1.49,1.22).project(camera);projected.recovery=[(tray.x+1)*size.width/2,(1-tray.y)*size.height/2];
      const furnace = useWorld.getState().positions.furnace;
      const door = new THREE.Vector3(furnace[0] + 0.135, furnace[1] - 0.87, furnace[2]).project(camera);
      projected.furnaceDoor = [(door.x + 1) * size.width / 2, (1 - door.y) * size.height / 2];
      (window as unknown as { __labEvidence: unknown }).__labEvidence = { projected, get world() { return snapshot(useWorld.getState()); }, get weighingMass(){return weighingMass(useWorld.getState());}, get roomObjects(){return projectRoomObjects(camera,size.width,size.height);}, get roomMechanisms(){return useRoomMechanisms.getState().states;}, get roomFocus(){return useLabStore.getState().roomFocus;}, get interaction(){const {held,bookOpen,completed,observed}=useInteraction.getState();return {held,bookOpen,completed,observed};}, validSnapshot, fps: 1 / Math.max(delta, 1e-6) };
    }
  });
  return <MaterialContext.Provider value={interactiveMaterials}>
    <Box at={[-1.3, 1.36, 1.68]} size={[1.65, 0.18, 0.55]} material={m.wood} />
    <Box at={[0.23, 1.46, 1.04]} size={[0.58, 0.025, 0.55]} material={m.darkBrass} />
    <group onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();placeHeld({id:'recovery',label:''});}}><Box at={[-0.88, 1.465, 1.16]} size={[0.8, 0.018, 0.35]} material={m.wood} /></group>
    <PaperLabel text="金属回收" at={[-0.85, 1.5, 1.34]} width={0.23} />
    {(Object.keys(items) as ItemId[]).map(id => <Movable key={id} id={id} />)}
    <MicroView /><HeldPreview />
    <PourStream />
    <BottleSupport />
    <Tether />
  </MaterialContext.Provider>;
}
function Tether() {
  const positions = useWorld(w => w.positions), m = useLabMaterials();
  return <Rod from={[positions.beaker[0], positions.beaker[1] + 0.32, positions.beaker[2] - 0.18]} to={positions.stopper} radius={0.002} material={m.cord} />;
}
function BottleSupport() {
  const w=useWorld(),m=useLabMaterials();if(!w.docked)return null;
  const p=w.positions[w.docked],base=w.positions.beaker[1];
  return <group>
    <Box at={[p[0],base+.01,p[2]]} size={[.33,.018,.35]} material={m.darkBrass}/>
    {[-1,1].map(sign=><Rod key={sign} from={[p[0],base+.02,p[2]+sign*.16]} to={[p[0],p[1]+.015,p[2]+sign*.16]} radius={.012} material={m.darkBrass}/>)}
    <group position={p} rotation={[0,0,-w.angle]}><Ring at={[0,.018,0]} radius={.143} tube={.009} material={m.darkBrass}/></group>
  </group>;
}
function PourStream() {
  const w = useWorld(), m = useLabMaterials();
  if (!w.docked || w.angle <= 0.45 || !w.opened[w.docked] || w.vessel.closed || w.stock[w.docked] <= 0 || w.vessel.volume >= 100) return null;
  const p = w.positions[w.docked], cup = w.positions.beaker;
  const from: Position = [p[0] + Math.sin(w.angle) * 0.49, p[1] + Math.cos(w.angle) * 0.49, p[2]];
  return <Rod from={from} to={[cup[0], cup[1] + 0.05 + w.vessel.volume / 100 * 0.34, cup[2]]} radius={0.007} material={m.glass} />;
}

function HeldPreview() {
  const held=useInteraction(s=>s.held),root=useRef<THREE.Group>(null);
  const plane=useMemo(()=>new THREE.Plane(new THREE.Vector3(0,1,0),-1.65),[]);
  const ray=useMemo(()=>new THREE.Raycaster(),[]);
  useFrame(({pointer,camera})=>{
    if(!root.current||!held)return;
    ray.setFromCamera(pointer,camera);const hit=ray.ray.intersectPlane(plane,new THREE.Vector3());
    if(hit)root.current.position.set(THREE.MathUtils.clamp(hit.x,-5.6,5.6),1.75,THREE.MathUtils.clamp(hit.z,-4,3));
    root.current.traverse(object=>{object.raycast=()=>{};});
  });
  return held?<group ref={root}><Model id={held}/></group>:null;
}
