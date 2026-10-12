import { createContext, useContext, useEffect, useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

function metalWear() {
  const size = 256, data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const index = (y * size + x) * 4;
    const scratch = Math.sin(x * 1.73 + Math.sin(y * 0.13)) > 0.985 ? 65 : 0;
    const value = Math.round(130 + 35 * Math.sin(x * 0.023 + y * 0.017) + 15 * Math.sin(x * 0.6 + y * 0.02) + scratch);
    data[index] = data[index + 1] = data[index + 2] = value; data[index + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true; return texture;
}

export function useMaterials() {
  const maps = useTexture([
    '/textures/dark_wood/dark_wood_diff_1k.jpg', '/textures/dark_wood/dark_wood_nor_gl_1k.jpg', '/textures/dark_wood/dark_wood_rough_1k.jpg',
    '/textures/old_wood_floor/old_wood_floor_diff_1k.jpg', '/textures/old_wood_floor/old_wood_floor_nor_gl_1k.jpg', '/textures/old_wood_floor/old_wood_floor_rough_1k.jpg',
    '/textures/plastered_wall/plastered_wall_diff_1k.jpg', '/textures/plastered_wall/plastered_wall_nor_gl_1k.jpg', '/textures/plastered_wall/plastered_wall_rough_1k.jpg',
  ]);
  const materials = useMemo(() => {
    const copies = maps.map((map, i) => {
      const copy = map.clone(); copy.wrapS = copy.wrapT = THREE.RepeatWrapping;
      copy.colorSpace = i % 3 === 0 ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      copy.repeat.set(i < 3 ? 1 : i < 6 ? 5 : 3, i < 3 ? 1 : i < 6 ? 7 : 3);
      copy.needsUpdate = true; return copy;
    });
    const wear = metalWear();
    return {
      wood: new THREE.MeshStandardMaterial({ map: copies[0], normalMap: copies[1], roughnessMap: copies[2], roughness: 0.78, color: '#92795e', normalScale: new THREE.Vector2(0.3, 0.3) }),
      floor: new THREE.MeshStandardMaterial({ map: copies[3], normalMap: copies[4], roughnessMap: copies[5], roughness: 0.85, color: '#b49a7a' }),
      plaster: new THREE.MeshStandardMaterial({ map: copies[6], normalMap: copies[7], roughnessMap: copies[8], color: '#c2bba3', normalScale: new THREE.Vector2(0.3, 0.3) }),
      brass: new THREE.MeshStandardMaterial({ color: '#b99a51', metalness: 0.83, roughness: 0.48, roughnessMap: wear }),
      darkBrass: new THREE.MeshStandardMaterial({ color: '#72542c', metalness: 0.75, roughness: 0.8, roughnessMap: wear }),
      copper: new THREE.MeshStandardMaterial({ color: '#a76442', metalness: 0.8, roughness: 0.75, roughnessMap: wear }),
      iron: new THREE.MeshStandardMaterial({ color: '#32332d', metalness: 0.72, roughness: 0.5 }),
      glass: new THREE.MeshPhysicalMaterial({ color: '#e5f0e0', roughness: 0.06, transmission: 0.98, thickness: 0.035, ior: 1.47, envMapIntensity: 0.4, side: THREE.DoubleSide }),
      greenGlass: new THREE.MeshPhysicalMaterial({ color: '#627751', roughness: 0.15, transmission: 0.65, thickness: 0.1, ior: 1.47 }),
      ceramic: new THREE.MeshStandardMaterial({ color: '#d5c9ad', roughness: 0.38 }),
      paper: new THREE.MeshStandardMaterial({ color: '#d5c198', roughness: 1 }),
      cord: new THREE.MeshStandardMaterial({ color: '#c5b898', roughness: 1 }),
      copies: [...copies, wear],
    };
  }, [maps]);
  useEffect(() => () => {
    Object.values(materials).forEach((value) => { if (value instanceof THREE.Material) value.dispose(); });
    materials.copies.forEach((texture) => texture.dispose());
  }, [materials]);
  return materials;
}
export type LabMaterials = ReturnType<typeof useMaterials>;
export const MaterialContext = createContext<LabMaterials | null>(null);
export function useLabMaterials() { return useContext(MaterialContext)!; }
