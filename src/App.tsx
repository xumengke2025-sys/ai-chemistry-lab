import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import LabScene from './scene/LabScene';
import { useLabStore } from './store';
import { useWorld } from './lab/world';
import { useInteraction } from './lab/interaction';

export default function App() {
  const select = useLabStore((state) => state.select);
  const exhibit = useLabStore((state) => state.exhibit);
  return <main data-view={exhibit} onDoubleClick={() => {useInteraction.getState().cancel(); useWorld.getState().inspect(null); select('room'); }}>
    <Canvas shadows dpr={[1, 1.5]} camera={{ position: [6.2, 2.95, 7.8], fov: 52, near: 0.05, far: 240 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }} onCreated={({gl})=>{gl.transmissionResolutionScale=.5;gl.toneMappingExposure=1.14;}}>
      <Suspense fallback={null}><LabScene /></Suspense>
    </Canvas>
  </main>;
}
