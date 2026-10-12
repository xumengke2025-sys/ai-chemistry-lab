import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { useLabStore, type Exhibit } from '../store';
import { MaterialContext, useMaterials } from './materials';
import Room from './Room';
import InteractiveLab from './InteractiveLab';
import { useWorld } from '../lab/world';

const cameras: Record<Exhibit, { position: [number, number, number]; target: [number, number, number] }> = {
  room: { position: [6.2, 2.95, 7.8], target: [-.9, 2.25, -3.0] },
  bench: { position: [4.5, 3.4, 6], target: [0.5, 1.8, -0.2] },
  balance: { position: [-0.05, 2.85, 2.65], target: [-1.46, 1.94, 0.45] },
  bell: { position: [1.7, 2.8, 2.9], target: [0.08, 2.0, 0.32] },
  retort: { position: [3.3, 2.9, 2.8], target: [1.65, 1.95, 0.45] },
  interactive: { position: [2.6, 3.5, 4], target: [0.3, 1.95, 1] },
  furniture: { position: [6.2,2.95,7.8],target:[-.9,2.25,-3.0] },
};
function Reflections() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const autoUpdate = gl.shadowMap.autoUpdate;
    gl.shadowMap.autoUpdate = false; gl.shadowMap.needsUpdate = true;
    const unsubscribe = useWorld.subscribe(() => { gl.shadowMap.needsUpdate = true; });
    return () => { unsubscribe(); gl.shadowMap.autoUpdate = autoUpdate; };
  }, [gl]);
  useFrame(() => { if (useWorld.getState().busy) gl.shadowMap.needsUpdate = true; });
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl), environment = new RoomEnvironment();
    const result = pmrem.fromScene(environment, 0.04);
    scene.environment = result.texture; scene.environmentIntensity = 0.38;
    return () => { scene.environment = null; result.dispose(); environment.dispose(); pmrem.dispose(); };
  }, [gl, scene]);
  return null;
}
function Camera() {
  const controls = useRef<OrbitControlsImpl>(null), moving = useRef(true);
  const exhibit = useLabStore((state) => state.exhibit), select = useLabStore((state) => state.select);
  const revision = useLabStore((state) => state.revision);
  const selected = useWorld(s => s.selected), busy = useWorld(s => s.busy);
  const micro = useWorld(s => s.micro);
  const saved = useRef<{ position: THREE.Vector3; target: THREE.Vector3; fit: number } | null>(null);
  const previous = useRef<Exhibit>('room');
  const { camera, size } = useThree();
  useEffect(() => { moving.current = true; }, [exhibit, revision, size.width, size.height]);
  useEffect(() => {
    if (exhibit === 'interactive' && previous.current !== 'interactive' && controls.current) saved.current = { position: camera.position.clone(), target: controls.current.target.clone(), fit: Math.min(1.18,Math.max(1, 1.12 / (size.width / size.height))) };
    previous.current = exhibit; moving.current = true;
  }, [exhibit, selected, micro, camera]);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => { if (event.key === 'Escape') select('room'); };
    window.addEventListener('keydown', handle); return () => window.removeEventListener('keydown', handle);
  }, [select]);
  useFrame((_, delta) => {
    if (!moving.current || !controls.current || busy) return;
    let preset = cameras[exhibit];
    if(exhibit==='furniture'&&useLabStore.getState().roomFocus)preset=useLabStore.getState().roomFocus!;
    if (exhibit === 'interactive' && selected) {
      const p = useWorld.getState().positions[selected];
      preset = { target: [p[0] + 0.18, p[1] + 0.45, p[2]], position: [p[0] + 0.95, p[1] + 1.1, p[2] + 1.9] };
      if (selected === 'notebook') preset = { target: [p[0], p[1]+.19, p[2]], position: [p[0], p[1]+1.2, p[2]+1.15] };
      if (selected === 'beaker' && !micro) preset = { target: [p[0],p[1]+.18,p[2]], position: [p[0]-.5,p[1]+.9,p[2]+1.25] };
      if (micro && selected === 'beaker') preset = { target: [p[0] + 0.1, 2.35, p[2]], position: [p[0] + 1.65, 3.55, p[2] + 3.5] };
    }
    const aspect = size.width / size.height;
    if(exhibit==='room'&&!saved.current&&aspect<.7)preset={position:cameras.room.position,target:[-1.5,1.85,.4]};
    const target = exhibit === 'room' && saved.current ? saved.current.target : new THREE.Vector3(...preset.target);
    const fit = exhibit==='room'?Math.min(1.18,Math.max(1,1.12/aspect)):Math.max(1,.9/aspect);
    const position = exhibit === 'room' && saved.current ? saved.current.position.clone().sub(target).multiplyScalar(fit / saved.current.fit).add(target) : new THREE.Vector3(...preset.position).sub(target).multiplyScalar(fit).add(target);
    const t = 1 - Math.exp(-delta * 4);
    camera.position.lerp(position, t); controls.current.target.lerp(target, t); controls.current.update();
    if (camera.position.distanceTo(position) < 0.005) moving.current = false;
  });
  return <OrbitControls ref={controls} makeDefault enabled={!busy} enableDamping dampingFactor={0.08} onStart={() => { moving.current = false; }} minDistance={1.1} maxDistance={100} minPolarAngle={0.18} maxPolarAngle={Math.PI / 2.05} />;
}
export default function LabScene() {
  const materials = useMaterials();
  return <>
    <color attach="background" args={['#555145']} />
    <fog attach="fog" args={['#9b927b', 19, 48]} />
    <ambientLight intensity={0.24} color="#e1d8c5" />
    <hemisphereLight args={['#cbd5d2', '#695344', .9]} />
    <directionalLight position={[-3.6, 5.7, -7.6]} intensity={3.5} color="#ffe2ac" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-normalBias={0.025} shadow-bias={-0.0003} />
    <pointLight position={[3.2, 3.5, 5.1]} intensity={24} color="#ddc59d" distance={16} decay={2} />
    <pointLight position={[-11, 2.8, -4.6]} intensity={12} color="#e9b676" distance={8} decay={2} />
    <Reflections />
    <MaterialContext.Provider value={materials}><Room /><InteractiveLab /></MaterialContext.Provider>
    <Camera />
  </>;
}
