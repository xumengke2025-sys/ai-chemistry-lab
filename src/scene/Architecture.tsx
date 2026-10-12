import * as THREE from 'three';
import { useEffect, useMemo } from 'react';
import { Box } from './geometry';
import { useLabMaterials } from './materials';
import { RoomObject } from './RoomObject';

// Real depth behind the working area, rather than a distant backdrop plane.
export default function Architecture() {
  const m = useLabMaterials();
  const leftWall = useMemo(()=>{
    const shape=new THREE.Shape();shape.moveTo(-9.1,0);shape.lineTo(9.1,0);shape.lineTo(9.1,6.6);shape.lineTo(-9.1,6.6);shape.closePath();
    const opening=new THREE.Path();opening.moveTo(.65-1.37,0);opening.lineTo(.65-1.37,3.3);opening.absarc(.65,3.3,1.37,Math.PI,0,true);opening.lineTo(.65+1.37,0);opening.closePath();shape.holes.push(opening);
    return new THREE.ExtrudeGeometry(shape,{depth:.18,bevelEnabled:false,curveSegments:24});
  },[]);
  useEffect(()=>()=>leftWall.dispose(),[leftWall]);
  return <>
    <RoomObject id="room-architecture" name="灰泥墙与木护墙" description="高挑的灰泥墙、叠层檐口与木护墙围合工作室；拱门后是较暗的收藏侧廊。">
      <Box at={[0,-.14,.45]} size={[16.8,.28,18.4]} material={m.wood}/>
      <Box at={[0,.008,.45]} size={[16.6,.025,18.2]} material={m.floor}/>
      <Box at={[0,3.3,-8.65]} size={[16.8,6.6,.18]} material={m.plaster}/>
      <Box at={[8.3,3.3,.45]} size={[.18,6.6,18.2]} material={m.plaster}/>
      {/* The left wall has a real opening into the side gallery. */}
      <mesh geometry={leftWall} material={m.plaster} position={[-8.3,0,.45]} rotation={[0,Math.PI/2,0]} castShadow receiveShadow/>
      <mesh position={[0,6.6,.45]} rotation={[Math.PI/2,0,0]} receiveShadow>
        <planeGeometry args={[16.6,18.2]}/><meshStandardMaterial color="#bcb49e" roughness={1} side={THREE.DoubleSide}/>
      </mesh>
      {[.09,1.18,5.95,6.13,6.3].map((y,i)=><group key={y}>
        <Box at={[0,y,-8.48]} size={[16.6,i===1?.14:.09,i>1?.22:.1]} material={i>1?m.plaster:m.wood}/>
        <Box at={[8.17,y,.45]} size={[i>1?.22:.1,i===1?.14:.09,18.2]} material={i>1?m.plaster:m.wood}/>
        {i>1?<Box at={[-8.17,y,.45]} size={[.22,.09,18.2]} material={m.plaster}/>:<>
          <Box at={[-8.17,y,5.4]} size={[.1,i===1?.14:.09,8.3]} material={m.wood}/>
          <Box at={[-8.17,y,-5.025]} size={[.1,i===1?.14:.09,6.85]} material={m.wood}/>
        </>}
      </group>)}
      {Array.from({length:23},(_,i)=><group key={i} position={[-7.92+i*.7,.61,-8.45]}>
        <Box size={[.65,.92,.045]} material={m.wood}/><Box at={[0,0,.035]} size={[.5,.72,.025]} material={m.wood}/>
      </group>)}
      {[-1,1].flatMap(side=>Array.from({length:15},(_,i)=>{const z=-.8+i*.7;if(side===-1&&z>-1.7&&z<1.3)return null;return <group key={`${side}-${i}`} position={[side*8.13,.61,-.8+i*.7]} rotation={[0,side===-1?Math.PI/2:-Math.PI/2,0]}>
        <Box size={[.65,.92,.045]} material={m.wood}/><Box at={[0,0,.035]} size={[.5,.72,.025]} material={m.wood}/>
      </group>;}))}
      {/* Pilasters articulate the rear room without blocking the central aisle. */}
      {[-7.75,-5.4,5.4,7.75].map(x=><group key={x} position={[x,0,-5.65]}>
        <Box at={[0,2.95,0]} size={[.32,5.7,.42]} material={m.plaster}/>
        <Box at={[0,.17,0]} size={[.55,.34,.62]} material={m.plaster}/>
        <Box at={[0,5.7,0]} size={[.64,.2,.65]} material={m.plaster}/>
      </group>)}
      <Box at={[0,5.98,-5.65]} size={[16.45,.32,.6]} material={m.plaster}/>
      <Box at={[0,6.21,-5.65]} size={[16.55,.13,.76]} material={m.plaster}/>
      {[-5.6,-1.6,2.4,6.4].map(z=><Box key={z} at={[0,6.46,z]} size={[16.55,.14,.16]} material={m.plaster}/>)}
      <Box at={[0,.2,-7.15]} size={[16.3,.38,2.65]} material={m.wood}/>
      <Box at={[0,.398,-7.15]} size={[16.3,.025,2.65]} material={m.floor}/>
      <Box at={[0,.09,-5.61]} size={[9.9,.18,.4]} material={m.wood}/>
    </RoomObject>
    <RoomObject id="side-gallery" name="拱门与收藏侧廊" description="拱门连接侧廊，层叠门套与较暗的远墙构成真实空间。拖动画面可转向查看。" viewDirection={[1,0,0]}>
      <Box at={[-10.75,.008,-.2]} size={[5.1,.025,5.5]} material={m.floor}/>
      <Box at={[-13.2,2.65,-.2]} size={[.15,5.3,5.5]} material={m.plaster}/>
      {[-2.9,2.5].map(z=><Box key={z} at={[-10.75,2.65,z]} size={[5.1,5.3,.16]} material={m.plaster}/>)}
      <group position={[-8.12,0,-.2]} rotation={[0,Math.PI/2,0]}>
        {[-1.52,1.52].map(x=><group key={x}>
          <Box at={[x,1.65,0]} size={[.32,3.3,.34]} material={m.plaster}/>
          <Box at={[x,.13,0]} size={[.5,.26,.52]} material={m.plaster}/>
          <Box at={[x,3.27,0]} size={[.48,.14,.46]} material={m.plaster}/>
        </group>)}
        {Array.from({length:20},(_,i)=>{const a=(i+.5)*Math.PI/20;return <Box key={i} at={[Math.cos(a)*1.53,3.3+Math.sin(a)*1.53,0]} size={[.255,.3,.34]} rotation={[0,0,a-Math.PI/2]} material={m.plaster}/>;})}
      </group>
    </RoomObject>
  </>;
}
