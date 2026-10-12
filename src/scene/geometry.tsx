import { useEffect, useMemo } from 'react';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as THREE from 'three';

type V3 = [number, number, number];
export function Box({ at = [0, 0, 0], size, material, rotation = [0, 0, 0] }: { at?: V3; size: V3; material: THREE.Material; rotation?: V3 }) {
  const [width, height, depth] = size;
  const geometry = useMemo(() => new RoundedBoxGeometry(width, height, depth, 2, Math.min(width, height, depth) * 0.12), [width, height, depth]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} position={at} rotation={rotation} material={material} castShadow receiveShadow />;
}
export function Turned({ profile, material, at = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }: { profile: [number, number][]; material: THREE.Material; at?: V3; rotation?: V3; scale?: number }) {
  // Callers often pass inline arrays: preserve geometry while their numeric shape is unchanged.
  const profileKey = profile.map(point => point.join(',')).join(';');
  const smooth = material instanceof THREE.MeshPhysicalMaterial;
  const points = useMemo(() => {
    const shape = profileKey.split(';').map(point => point.split(',').map(Number));
    if (smooth) {
      const curve = new THREE.CatmullRomCurve3(shape.map(([r, y]) => new THREE.Vector3(r, y, 0)), false, 'centripetal');
      return curve.getPoints(shape.length * 8).map((point) => new THREE.Vector2(Math.max(0, point.x), point.y));
    }
    return shape.map(([r, y]) => new THREE.Vector2(r, y));
  }, [profileKey, smooth]);
  return <mesh position={at} rotation={rotation} scale={scale} material={material} castShadow={!(material instanceof THREE.MeshPhysicalMaterial)} receiveShadow><latheGeometry args={[points, 80]} /></mesh>;
}
export function Rod({ from, to, radius = 0.009, material }: { from: V3; to: V3; radius?: number; material: THREE.Material }) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
  const middle = a.clone().add(b).multiplyScalar(0.5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return <mesh position={middle} quaternion={quaternion} material={material} castShadow><cylinderGeometry args={[radius, radius, a.distanceTo(b), 12]} /></mesh>;
}
export function CurvedTube({ points, radius, material }: { points: V3[]; radius: number; material: THREE.Material }) {
  const pointKey = points.map(point => point.join(',')).join(';');
  const curve = useMemo(() => new THREE.CatmullRomCurve3(pointKey.split(';').map(point => { const [x, y, z] = point.split(',').map(Number); return new THREE.Vector3(x, y, z); })), [pointKey]);
  return <mesh material={material}><tubeGeometry args={[curve, 64, radius, 16, false]} /></mesh>;
}
export function Ring({ at, radius, tube = 0.008, material, rotation = [Math.PI / 2, 0, 0] }: { at: V3; radius: number; tube?: number; material: THREE.Material; rotation?: V3 }) {
  return <mesh position={at} rotation={rotation} material={material} castShadow><torusGeometry args={[radius, tube, 12, 64]} /></mesh>;
}
