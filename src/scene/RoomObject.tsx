import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { create } from 'zustand';
import { labOwnsClick, useInteraction } from '../lab/interaction';
import { useWorld } from '../lab/world';
import { useLabStore } from '../store';

// Room mechanisms are presentation state and never enter chemical inventories.
export const useRoomMechanisms=create<{states:Record<string,boolean>;toggle:(id:string)=>void}>(set=>({states:{},toggle:id=>set(s=>({states:{...s.states,[id]:!s.states[id]}}))}));
const roomObjects=new Map<string,{name:string;object:THREE.Group;probe:THREE.Group;anchor?:[number,number,number]}>();
export function projectRoomObjects(camera:THREE.Camera,width:number,height:number){
  return Object.fromEntries([...roomObjects].map(([id,{name,object,probe,anchor}])=>{
    object.updateWorldMatrix(true,true);
    const box=new THREE.Box3().setFromObject(object),center=(anchor?probe.localToWorld(new THREE.Vector3(...anchor)):box.getCenter(new THREE.Vector3())).project(camera);
    return [id,{name,point:[(center.x+1)*width/2,(1-center.y)*height/2]}];
  }));
}

// A restrained change in reflected light, with no outline or floating label.
export function usePhysicalHover(){
  const touched=useRef<{mesh:THREE.Mesh;original:THREE.Material|THREE.Material[];copies:THREE.Material[]}|null>(null);
  const clear=()=>{const t=touched.current;if(t){const material=t.mesh.material;if(material===t.copies[0]||(Array.isArray(material)&&material.every((m,i)=>m===t.copies[i])))t.mesh.material=t.original;t.copies.forEach(m=>m.dispose());touched.current=null;}document.body.style.cursor='';};
  useEffect(()=>clear,[]);
  return {clear,over:(object:THREE.Object3D,cursor='pointer')=>{
    if(touched.current?.mesh!==object){clear();if(object instanceof THREE.Mesh){
      const original=object.material,copies=(Array.isArray(original)?original:[original]).map(m=>{const c=m.clone();if(c instanceof THREE.MeshStandardMaterial){c.color.lerp(new THREE.Color('#dbbd82'),.055);c.emissive.set('#946f38');c.emissiveIntensity=.045;}return c;});
      object.material=Array.isArray(original)?copies:copies[0];touched.current={mesh:object,original,copies};
    }}document.body.style.cursor=cursor;
  }};
}

export function RoomObject({id:explicitId,name,description,position,rotation,travel,turn,anchor,viewDirection,localViewDirection,children}:{
  id?:string;name:string;description:string;position?:[number,number,number];rotation?:[number,number,number];
  travel?:[number,number,number];turn?:[number,number,number];anchor?:[number,number,number];viewDirection?:[number,number,number];localViewDirection?:[number,number,number];children:ReactNode;
}){
  const generatedId=useId(),id=explicitId??`${name}-${generatedId}`,root=useRef<THREE.Group>(null),moving=useRef<THREE.Group>(null);
  const active=useRoomMechanisms(s=>!!s.states[id]),hover=usePhysicalHover();
  const {gl}=useThree();
  useEffect(()=>{if(root.current&&moving.current)roomObjects.set(id,{name,object:root.current,probe:moving.current,anchor});return()=>{roomObjects.delete(id);};},[id,name,anchor]);
  useFrame((_,delta)=>{
    if(!moving.current||(!travel&&!turn))return;const target=active?travel:undefined,angles=active?turn:undefined,t=1-Math.exp(-delta*9);
    if(travel){const p=moving.current.position,x=target?.[0]??0,y=target?.[1]??0,z=target?.[2]??0;if(Math.abs(p.x-x)+Math.abs(p.y-y)+Math.abs(p.z-z)>.0001){p.set(THREE.MathUtils.lerp(p.x,x,t),THREE.MathUtils.lerp(p.y,y,t),THREE.MathUtils.lerp(p.z,z,t));gl.shadowMap.needsUpdate=true;}}
    if(turn){const r=moving.current.rotation,x=angles?.[0]??0,y=angles?.[1]??0,z=angles?.[2]??0;if(Math.abs(r.x-x)+Math.abs(r.y-y)+Math.abs(r.z-z)>.0001){r.set(THREE.MathUtils.lerp(r.x,x,t),THREE.MathUtils.lerp(r.y,y,t),THREE.MathUtils.lerp(r.z,z,t));gl.shadowMap.needsUpdate=true;}}
  });
  const inspect=()=>{
    if(labOwnsClick()||useWorld.getState().busy||!root.current)return;
    const box=new THREE.Box3().setFromObject(root.current),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
    if(box.isEmpty())return;
    const distance=Math.max(1.2,Math.min(6.5,Math.max(size.x,size.y,size.z)*1.55));
    const sideFacing=size.x<size.z*.6&&size.z>.8;
    const facing=localViewDirection?new THREE.Vector3(...localViewDirection).applyQuaternion(root.current.getWorldQuaternion(new THREE.Quaternion())):viewDirection?new THREE.Vector3(...viewDirection):null;
    const offset=facing?facing.normalize().multiplyScalar(distance):new THREE.Vector3(sideFacing?distance:distance*.28,0,sideFacing?.4:distance);
    offset.y+=size.y<.15?Math.min(4,Math.max(1.2,Math.max(size.x,size.z)*.5)):Math.max(.48,size.y*.15);
    const eye=center.clone().add(offset);
    eye.x=THREE.MathUtils.clamp(eye.x,-12.5,7.5);eye.z=THREE.MathUtils.clamp(eye.z,-8,9);eye.y=Math.max(.9,Math.min(5.8,eye.y));
    useInteraction.getState().referRoom({name,description});useWorld.getState().inspect(null);
    useLabStore.getState().inspectRoom({id,name,description,target:center.toArray() as [number,number,number],position:eye.toArray() as [number,number,number]});
    if(travel||turn)useRoomMechanisms.getState().toggle(id);
  };
  return <group ref={root} position={position} rotation={rotation} userData={{roomObjectId:id}}
    onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();inspect();}}
    onPointerOver={e=>{if(useWorld.getState().busy)return;e.stopPropagation();if(!labOwnsClick())hover.over(e.object,travel||turn?'grab':'pointer');}}
    onPointerOut={()=>hover.clear()}>
    <group ref={moving}>{children}</group>
  </group>;
}
