import './styles.css';
import { Simulation } from './physics/simulation.ts';
import { createWorld } from './scene/world.ts';
import type { Flavor, World } from './scene/world.ts';
import { installGrab } from './interaction/grab.ts';
import { installSpoon } from './interaction/spoon.ts';
import { mountPanel, element } from './ui/panel.ts';

mountPanel();
const sim=new Simulation(),canvas=element<HTMLCanvasElement>('#scene');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const inspect=new URLSearchParams(location.search).has('inspect');
const abort=new AbortController(),opts={signal:abort.signal};
let world:World|undefined,grab:ReturnType<typeof installGrab>|undefined,spoon:ReturnType<typeof installSpoon>|undefined;
let squishUntil=0;
let last=0,lastRead=0,selectedFlavor:Flavor='vanilla',disposed=false;
let benchmark:{start:number;frames:number[];cpu:number[];lastNudge:number}|null=null;
const status=element('#gpu-status'),message=element('#scene-message');
const enableControls=(enabled:boolean)=>document.querySelectorAll<HTMLButtonElement|HTMLInputElement>('.controls button,.controls input').forEach(el=>{el.disabled=!enabled;});
enableControls(false);
element('#diagnostics').hidden=!inspect;
element('#inspector-toggle').hidden=!inspect;
element('#inspector-toggle').addEventListener('click',()=>{element('#diagnostics').hidden=!element('#diagnostics').hidden;},opts);
function setFlavor(name:Flavor) {
  selectedFlavor=name;world?.flavor(name);
  document.querySelectorAll<HTMLButtonElement>('[data-flavor]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.flavor===name)));
  element('#flavor-number').textContent={vanilla:'01 / 03',berry:'02 / 03',matcha:'03 / 03'}[name];
}
function setTool(tool:'grab'|'spoon') {
  squishUntil=0;grab?.cancel();spoon?.cancel();sim.body.release();sim.tool=tool;
  if(world)world.spoon.visible=tool==='spoon';canvas.classList.toggle('spoon',tool==='spoon');
  document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===tool)));
}
function sliders() {
  const firmness=element<HTMLInputElement>('#firmness'),damping=element<HTMLInputElement>('#damping');
  sim.body.firmness=Number(firmness.value)/100;sim.body.damping=Number(damping.value)/100*8;
  element('#firmness-value').textContent=sim.body.firmness<.3?'软糯':sim.body.firmness<.7?'柔弹':'弹弹的';
  element('#damping-value').textContent=sim.body.damping<2?'慢慢晃':sim.body.damping<5?'轻轻收住':'很快停下';
  for(const el of [firmness,damping])el.style.background=`linear-gradient(to right,#2d3830 ${el.value}%,#d7dcd1 ${el.value}%)`;
}
function reset() {
  grab?.cancel();spoon?.cancel();sim.reset();setFlavor('vanilla');setTool('grab');
  element<HTMLInputElement>('#firmness').value='45';element<HTMLInputElement>('#damping').value='38';sliders();
  element<HTMLInputElement>('#slow').checked=false;element<HTMLInputElement>('#mesh').checked=false;if(world)world.mesh=false;
  element('#pause').textContent='暂停';element('#pause').setAttribute('aria-pressed','false');
}
document.querySelectorAll<HTMLButtonElement>('[data-flavor]').forEach(b=>b.addEventListener('click',()=>setFlavor(b.dataset.flavor as Flavor),opts));
document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(b=>b.addEventListener('click',()=>setTool(b.dataset.tool as 'grab'|'spoon'),opts));
element('#squish').addEventListener('click',()=>{
  if(!world||sim.body.empty)return;
  setTool('grab');sim.pause(false);
  element('#pause').textContent='暂停';element('#pause').setAttribute('aria-pressed','false');
  let best=0,dist=Infinity;
  for(let i=0;i<world.skin.count;i++) {
    const p=world.skin.rest,d=Math.hypot(p[i*3],p[i*3+1]-1.65,p[i*3+2]);
    if(d<dist){dist=d;best=i;}
  }
  sim.body.beginGrab(world.skin.hitWeights([best],[1]));
  if(sim.body.grab){const p=sim.body.grab.anchor;sim.body.moveGrab([p[0],p[1]-.48,p[2]]);squishUntil=sim.time+.46;}
},opts);
canvas.addEventListener('pointerdown',()=>{if(squishUntil){sim.body.release();squishUntil=0;}},opts);
element('#bite').addEventListener('click',()=>{setTool('spoon');spoon?.bite();},opts);
element('#firmness').addEventListener('input',sliders,opts);element('#damping').addEventListener('input',sliders,opts);
element('#nudge').addEventListener('click',()=>sim.nudge(),opts);element('#reset').addEventListener('click',reset,opts);
element('#pause').addEventListener('click',()=>{
  grab?.cancel();spoon?.cancel();sim.pause(!sim.paused);element('#pause').textContent=sim.paused?'继续':'暂停';element('#pause').setAttribute('aria-pressed',String(sim.paused));
},opts);
element('#slow').addEventListener('change',()=>{sim.slow=element<HTMLInputElement>('#slow').checked;},opts);
element('#mesh').addEventListener('change',()=>{if(world)world.mesh=element<HTMLInputElement>('#mesh').checked;},opts);
document.addEventListener('visibilitychange',()=>{grab?.cancel();spoon?.cancel();sim.visibility(document.hidden);last=0;},opts);
function fail(error:unknown) {
  if(disposed)return;
  world?.renderer.setAnimationLoop(null);grab?.cancel();spoon?.cancel();
  enableControls(false);
  status.className='status failed';status.innerHTML='<b></b> WEBGPU UNAVAILABLE';
  message.hidden=false;message.textContent=error instanceof Error?error.message:String(error);
  element('#retry').hidden=false;console.error(error);
}
element('#retry').addEventListener('click',()=>location.reload(),opts);
element('#benchmark').addEventListener('click',()=>{
  reset();benchmark={start:performance.now(),frames:[],cpu:[],lastNudge:0};
  element('#benchmark-result').textContent='';element<HTMLButtonElement>('#benchmark').disabled=true;
  element('#diagnostics').hidden=true;
},opts);
element('#compression-check').addEventListener('click',()=>{
  if(!world)return;sim.pause(false);
  let best=0,dist=Infinity;
  for(let i=0;i<world.skin.count;i++) {
    const p=world.skin.rest,d=Math.hypot(p[i*3],p[i*3+1]-sim.body.mesh.height,p[i*3+2]);if(d<dist){dist=d;best=i;}
  }
  sim.body.beginGrab(world.skin.hitWeights([best],[1]));
  const p=sim.body.grab!.anchor;sim.body.moveGrab([p[0],p[1]-.405,p[2]]);
},opts);
element('#release-check').addEventListener('click',()=>sim.body.release(),opts);
function sampleBenchmark(now:number,dt:number,cpu:number) {
  if(!benchmark)return;
  const seconds=(now-benchmark.start)/1000;
  if(seconds>2){benchmark.frames.push(dt*1000);benchmark.cpu.push(cpu);}
  if(seconds-benchmark.lastNudge>3){sim.body.nudge(Math.floor(seconds/3)%2?1:-1);benchmark.lastNudge=seconds;}
  element('#benchmark-status').textContent=`Recording ${Math.min(60,Math.floor(seconds))} / 60 s`;
  element('#inspector-toggle').textContent=`Recording ${Math.min(60,Math.floor(seconds))} / 60 s`;
  if(seconds>=62) {
    const values=benchmark.frames.slice().sort((a,b)=>a-b),sum=values.reduce((a,b)=>a+b,0);
    const result={measuredSeconds:sum/1000,frames:values.length,averageFps:values.length*1000/sum,p95FrameMs:values[Math.floor(values.length*.95)],maxFrameMs:values.at(-1),meanCpuUpdateMs:benchmark.cpu.reduce((a,b)=>a+b,0)/values.length,viewport:{width:canvas.clientWidth,height:canvas.clientHeight},scenario:'Alternating nudge every 3 seconds; 2-second warmup excluded',...world!.deviceInfo};
    element('#benchmark-result').textContent=JSON.stringify(result,null,2);element('#benchmark-status').textContent='Complete';element<HTMLButtonElement>('#benchmark').disabled=false;element('#inspector-toggle').textContent='Diagnostics · results';benchmark=null;
  }
}
async function start() {
  try {
    world=await createWorld(canvas,sim);if(disposed){world.dispose();return;}
    world.renderer.onDeviceLost=()=>fail(new Error('The graphics device was disconnected. Try again to resume.'));
    world.renderer.onError=error=>fail(new Error(typeof error==='string'?error:JSON.stringify(error)));
    grab=installGrab(canvas,world,sim);spoon=installSpoon(canvas,world,sim,bite=>world!.serve(bite));
    sim.reset(reduced?0:.1);sliders();setTool('grab');
    enableControls(true);
    if(reduced)for(let i=0;i<480;i++)sim.body.step(sim.stepSize);
    sim.body.previous.set(sim.body.position);
    status.className='status live';status.innerHTML='<b></b> 新鲜出炉';message.hidden=true;
    element('#device-info').textContent=JSON.stringify({...world.deviceInfo,mesh:{nodes:sim.body.mesh.mass.length,tetrahedra:sim.body.mesh.volumes.length,triangles:world.skin.indices.length/3,quality:sim.body.mesh.quality}},null,2);
    world.renderer.setAnimationLoop((now:number)=>{
      const elapsed=last?(now-last)/1000:1/60,dt=Math.min(.25,elapsed);last=now;
      if(squishUntil&&sim.time>=squishUntil){sim.body.release();squishUntil=0;}
      const begin=performance.now();sim.advance(dt);world!.update(dt);const cpu=performance.now()-begin;
      world!.renderer.render(world!.scene,world!.camera);
      sampleBenchmark(now,elapsed,cpu);
      if(now-lastRead>150) {
        const m=sim.body.metrics();element('#volume').textContent=`${(m.volumeRatio*100).toFixed(1)}%`;
        element('#motion').textContent=Math.min(9.99,Math.sqrt(m.energy)).toFixed(2);
        element('#eaten').textContent=`${Math.round(m.eatenRatio*100)}%`;
        element('#state').textContent=sim.paused?'暂停中':sim.body.empty?'吃光啦':sim.body.grab?'捏住啦':sim.body.spoon?'按下去':world!.serving?'尝一口':m.energy>.0002?'颤悠悠':'乖乖待着';
        if(inspect)element('#physics-info').textContent=JSON.stringify({...m,flavor:selectedFlavor,tool:sim.tool,paused:sim.paused,slow:sim.slow,grabbed:!!sim.body.grab,cells:sim.body.mesh.cells.length,nodes:sim.body.mesh.mass.length,simulationTime:sim.time,pointer:grab?.stats,spoon:spoon?.stats},null,2);
        lastRead=now;
      }
    });
  }catch(error){fail(error);}
}
function dispose(){if(disposed)return;disposed=true;abort.abort();grab?.dispose();spoon?.dispose();world?.dispose();}
window.addEventListener('pagehide',dispose,{once:true,signal:abort.signal});if(import.meta.hot)import.meta.hot.dispose(dispose);
void start();
