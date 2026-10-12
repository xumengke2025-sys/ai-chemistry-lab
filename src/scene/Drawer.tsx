import { Box, Ring } from './geometry';
import { useLabMaterials } from './materials';
import { RoomObject } from './RoomObject';

export function Drawer({id,position,width=1.4,height=.18,depth=.46}:{id:string;position:[number,number,number];width?:number;height?:number;depth?:number}){
  const m=useLabMaterials();
  return <RoomObject id={id} name="木制抽屉" description="点黄铜拉手打开或推回。抽屉与实验材料分开，用于查看工作台的构造。" position={position} anchor={[0,0,.045]} travel={[0,0,depth*.85]}>
    <Box size={[width,height,.04]} material={m.wood}/>
    <Box at={[0,-height/2+.014,-depth/2]} size={[width-.04,.025,depth]} material={m.wood}/>
    {[-1,1].map(side=><Box key={side} at={[side*(width/2-.025),0,-depth/2]} size={[.03,height-.025,depth]} material={m.wood}/>)}
    <Box at={[0,0,-depth]} size={[width-.04,height-.025,.025]} material={m.wood}/>
    <Ring at={[0,0,.047]} radius={.036} tube={.007} material={m.brass} rotation={[0,0,0]}/>
  </RoomObject>;
}
