import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { type ThreeEvent } from '@react-three/fiber';
import { experimentSteps } from '../lab/guidance';
import { useInteraction } from '../lab/interaction';
import { experimentNames, items } from '../lab/registry';
import { useWorld, weighingMass } from '../lab/world';
import { mass, pH, reactions } from '../lab/chemistry';
import { useLabStore } from '../store';
import { Box, Rod } from './geometry';
import { useLabMaterials } from './materials';

export const bookSize = { width: .94, height: .64, y: .202 };

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, lineHeight: number, maxLines = 5) {
  let line = '', row = 0;
  for (const char of text) {
    if (ctx.measureText(line + char).width > width) {
      ctx.fillText(line, x, y + row * lineHeight); line = char; row++;
      if (row >= maxLines) return;
    } else line += char;
  }
  ctx.fillText(line, x, y + row * lineHeight);
}

function sketch(ctx: CanvasRenderingContext2D, kind: string) {
  ctx.save(); ctx.translate(1030, 465);ctx.strokeStyle='#39281c';ctx.lineWidth=4;
  const path=(points:number[][])=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();};
  // Instrument drawings printed in ink on the actual page, under the room lighting.
  path([[125,-55],[125,65],[220,65],[220,-55]]);path([[116,-55],[230,-55]]);
  ctx.beginPath();ctx.ellipse(173,-55,57,10,0,0,Math.PI*2);ctx.stroke();
  if(kind==='clamp'){path([[-80,-80],[-15,-15],[50,45]]);path([[-80,-80],[-35,5],[35,65]]);path([[30,65],[65,35]]);}
  else if(kind==='gas'||kind==='seal'){path([[170,-55],[170,-120],[0,-120],[-40,-75],[-40,40]]);ctx.strokeRect(-70,5,60,100);}
  else if(kind==='weigh'){path([[-60,60],[60,60]]);path([[0,60],[0,-110]]);path([[-100,-75],[100,-75]]);path([[-100,-75],[-135,5],[-65,5],[-100,-75]]);path([[100,-75],[65,5],[135,5],[100,-75]]);}
  else {path([[-55,-105],[-5,-105],[-5,-65],[25,-35],[25,85],[-85,85],[-85,-35],[-55,-65],[-55,-105]]);path([[-85,35],[25,35]]);ctx.strokeRect(-60,-20,60,28);}
  ctx.setLineDash([4,7]);path([[45,-30],[78,-42],[113,-20]]);ctx.setLineDash([]);path([[99,-23],[113,-20],[107,-36]]);
  ctx.restore();
}

export default function PhysicalNotebook() {
  const m=useLabMaterials(),w=useWorld(),ui=useInteraction();
  const steps=experimentSteps(w,ui.observed),current=steps[Math.min(ui.completed,steps.length-1)],finished=ui.completed>=steps.length;
  useEffect(()=>{let n=ui.completed;while(n<steps.length&&steps[n].done)n++;if(n>ui.completed)ui.complete(n);},[steps,ui.completed,ui.complete]);
  const reference=ui.roomReference??(ui.reference?items[ui.reference]:null);
  const reaction=reactions.find(r=>r.id===Object.entries(w.vessel.extent).filter(([id])=>id!=='dissolution').sort((a,b)=>b[1]!-a[1]!)[0]?.[0]);
  const readings=ui.reference==='beaker'?`${w.vessel.volume.toFixed(1)} mL · ${w.vessel.temperature.toFixed(0)} °C · pH ${Number.isFinite(pH(w.vessel))?pH(w.vessel).toFixed(2):'不估算'}`:ui.reference==='scale'?`${weighingMass(w).toFixed(3)} g`:'';
  const texture=useMemo(()=>{
    if(!ui.bookOpen)return null;
    const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1024;const c=canvas.getContext('2d')!;
    c.fillStyle='#cfbd95';c.fillRect(0,0,1536,1024);
    const shade=c.createLinearGradient(0,0,1536,0);shade.addColorStop(0,'#71563840');shade.addColorStop(.42,'#00000000');shade.addColorStop(.5,'#624a3770');shade.addColorStop(.58,'#00000000');shade.addColorStop(1,'#71563835');c.fillStyle=shade;c.fillRect(0,0,1536,1024);
    for(let i=0;i<5500;i++){const x=(i*677)%1536,y=(i*347)%1024;c.fillStyle=i%2?'#7359340b':'#f2e2bc16';c.fillRect(x,y,2,1);}
    c.fillStyle='#21170f';c.textBaseline='alphabetic';c.font='48px Georgia, SimSun, serif';c.fillText('实验记录',100,105);
    c.strokeStyle='#886b4860';c.lineWidth=1;c.beginPath();c.moveTo(100,130);c.lineTo(658,130);c.stroke();
    c.font='38px Georgia, SimSun, serif';experimentNames.forEach((name,i)=>{c.fillStyle=i===w.experiment?'#512b18':'#21170f';c.fillText(`${['一','二','三','四','五','六'][i]}   ${name}`,110,204+i*74);if(i===w.experiment){c.beginPath();c.moveTo(105,216+i*74);c.lineTo(600,216+i*74);c.stroke();}});
    c.fillStyle='#332418';c.font='30px Georgia, SimSun, serif';c.fillText('取物与操作',110,720);
    wrap(c,'轻点器物走近，再点一次拿起；点实物放下。也可按住拖动。',110,770,535,37,3);
    wrap(c,'木塞轻点拔开；杯口瓶身向右倾，松手止流。Escape 放回手中器物。',110,888,535,37,3);
    c.font='24px Georgia, SimSun, serif';c.fillText('陈设轻点查看；拉手、帘布、书脊可操作。',110,1000);
    c.fillStyle='#21170f';c.font='38px Georgia, SimSun, serif';c.fillText(experimentNames[w.experiment],855,103);
    c.font='36px Georgia, SimSun, serif';wrap(c,finished?'器具已洗净':current.title,855,180,555,43,2);
    c.font='31px Georgia, SimSun, serif';wrap(c,finished?'本次实验记录完毕。可翻阅左页，重新准备材料。':current.instruction,855,250,555,41,4);
    sketch(c,current.drawing);c.fillStyle='#796346';c.font='23px Georgia, SimSun, serif';c.fillText('点器具素描，走近查看',910,610);
    if(reference){c.fillStyle='#21170f';c.font='32px Georgia, SimSun, serif';c.fillText(reference.name,855,690);c.font='28px Georgia, SimSun, serif';wrap(c,readings||reference.description,855,737,555,36,3);}
    c.fillStyle='#3d2818';c.font='27px Georgia, SimSun, serif';wrap(c,reaction?.equation??w.feedback,855,868,555,36,2);
    c.fillStyle='#6c563d';c.font='23px Georgia, SimSun, serif';c.fillText('合上记录本',1250,968);
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;return map;
  },[ui.bookOpen,w.experiment,w.feedback,current.title,current.instruction,current.drawing,finished,reference,readings,reaction]);
  useEffect(()=>()=>texture?.dispose(),[texture]);
  const cover=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=512;canvas.height=768;const c=canvas.getContext('2d')!;c.fillStyle='#3e3025';c.fillRect(0,0,512,768);c.strokeStyle='#aa885380';c.lineWidth=3;c.strokeRect(36,36,440,696);c.fillStyle='#b99a64';c.font='38px SimSun,serif';c.textAlign='center';c.fillText('实验记录',256,300);c.font='20px Georgia,serif';c.fillText('CAHIER DE LABORATOIRE',256,354);const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;return map;},[]);
  useEffect(()=>()=>cover.dispose(),[cover]);
  const closeBook=()=>{ui.openBook(false);w.inspect(null);useLabStore.getState().select('bench');};
  const readPage=(e:ThreeEvent<MouseEvent>)=>{
    e.stopPropagation();if(!e.uv)return;const x=e.uv.x*1536,y=(1-e.uv.y)*1024;
    if(x<720&&y>=155&&y<640){const index=Math.floor((y-155)/74);if(index>=0&&index<6){w.reset(index);w.inspect('notebook');ui.refer(experimentSteps(useWorld.getState())[0].target);}}
    else if(x>800&&y>920)closeBook();
    else if(x>800&&y>390&&y<650){ui.refer(current.target);w.inspect(current.target);useLabStore.getState().select('interactive');}
  };
  if(!ui.bookOpen)return <group position={[0,.17,0]}>
    <Box size={[.40,.04,.58]} material={m.wood}/><Box at={[0,.023,0]} size={[.37,.035,.55]} material={m.paper}/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.045,0]}><planeGeometry args={[.40,.58]}/><meshStandardMaterial map={cover} roughness={.95}/></mesh>
  </group>;
  return <group>
    <Box at={[0,.17,0]} size={[.97,.025,.67]} material={m.wood}/>
    <Box at={[-.24,.185,0]} size={[.46,.025,.64]} material={m.paper}/><Box at={[.24,.185,0]} size={[.46,.025,.64]} material={m.paper}/>
    <mesh position={[0,bookSize.y,0]} rotation={[-Math.PI/2,0,0]} onPointerDown={e=>e.stopPropagation()} onClick={readPage}>
      <planeGeometry args={[bookSize.width,bookSize.height]}/><meshStandardMaterial map={texture??undefined} color="#b5a681" envMapIntensity={.25} roughness={1}/>
    </mesh>
    <Rod from={[0,.207,-.32]} to={[0,.207,.32]} radius={.003} material={m.wood}/>
    <group onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();closeBook();}}><Box at={[.36,.205,.31]} size={[.03,.003,.16]} material={m.cord}/></group>
  </group>;
}
