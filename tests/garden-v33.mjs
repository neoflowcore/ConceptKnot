import fs from 'node:fs';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const base=process.cwd();
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ck33-'));
fs.copyFileSync('vendor/three.module.min.js',path.join(temp,'three.mjs'));
const T=await import(pathToFileURL(path.join(temp,'three.mjs')));
const kit=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('assets/ck-mascot-kit-v33.js')).toString('base64'));
const {mascotKit,makeApple}=kit;
function moduleFunction(file,name){const src=fs.readFileSync(file,'utf8').replace(/^import .*?;\s*/gm,'').replaceAll('export function','function');return new Function('makeApple','mascotKit',src+'; return '+name)(makeApple,mascotKit);}
const scene=new T.Scene(),h=()=>0;
const main=moduleFunction('assets/ck-pointing-cub-v16.js','buildPencilCub')(T,scene,h,2);
const baby=moduleFunction('assets/ck-sleeping-cub-v9.js','buildSleepingCub')(T,scene,h,2);
const machine=moduleFunction('assets/ck-kinetic-garden-v8.js','buildStudyMachine')(T,scene,h,2);
assert.equal(machine.ballCount,6);assert.equal(machine.trackClosed,true);
for(let i=0;i<100;i++){main.animate(i*.04);baby.animate(i*.2);machine.animate(i*.3);}
let meshes=0,triangles=0;
scene.traverse(o=>{if(o.isMesh){meshes++;const a=o.geometry.attributes.position;for(const v of a.array)assert.ok(Number.isFinite(v));triangles+=(o.geometry.index?.count||a.count)/3;}});
assert.ok(baby.cardboard);assert.equal(main.expression,'golden-baby-open-eyes');
const landscape=fs.readFileSync('assets/ck-landscape3d.js','utf8');
const framing=landscape.slice(landscape.indexOf('function frameMascots'),landscape.indexOf('function replayCub'));
const camera=new T.PerspectiveCamera(43,1,.1,480);camera.position.set(0,11,26);camera.lookAt(0,6,-30);
const scenes={pressCub:main,cub:baby};const win={innerHeight:900};
const fit=new Function('THREE','camera','scenes','window',framing+';return frameMascots')(T,camera,scenes,win);
const results=[];
for(const [width,height] of [[1440,900],[1920,1080],[1280,600],[768,1024],[390,844],[360,640]]){
 win.innerHeight=height;const canvasHeight=Math.max(height,width<=600?760:820);camera.aspect=width/canvasHeight;camera.fov=width<600?56:width<900?49:43;camera.position.z=width<850?30:26;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);fit(width,canvasHeight);scene.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(main.root),points=[];
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])points.push(new T.Vector3(x,y,z).project(camera));
 const xs=points.map(p=>(p.x*.5+.5)*width),ys=points.map(p=>(.5-p.y*.5)*canvasHeight);
 assert.ok(Math.min(...xs)>=0&&Math.max(...xs)<=width,'horizontal clipping '+width);
 assert.ok(Math.min(...ys)>=56&&Math.max(...ys)<height-48,'vertical clipping '+width);
 results.push({width,height,mainBounds:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)].map(Math.round)});
}
console.log(JSON.stringify({meshes,triangles,framing:results}));

fs.rmSync(temp,{recursive:true,force:true});
