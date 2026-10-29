import fs from 'node:fs';import assert from 'node:assert/strict';import os from 'node:os';import path from 'node:path';import {pathToFileURL} from 'node:url';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ck-detail-'));fs.copyFileSync('vendor/three.module.min.js',path.join(tmp,'three.mjs'));
const T=await import(pathToFileURL(path.join(tmp,'three.mjs'))),kit=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('assets/ck-mascot-kit-v33.js','utf8').replace("'./ck-face-atlas-v35.js'",JSON.stringify('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('assets/ck-face-atlas-v35.js')).toString('base64')))).toString('base64'));
const source=fs.readFileSync('assets/ck-landscape3d.js','utf8'),chunk=source.slice(source.indexOf('function appleTree('),source.indexOf('function bird()'));
const scene=new T.Scene();let seed=34;const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const pbr=(color,roughness=.87,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra}),mesh=(g,m)=>new T.Mesh(g,m);
const f=new Function('THREE','scene','h','pbr','mesh','rand','makeApple','QUALITY',chunk+';return {appleTree,grass,flowers};')(T,scene,()=>0,pbr,mesh,rand,kit.makeApple,2);
f.appleTree(-27,-23,1.6);f.appleTree(28,-26,1.72);f.grass();f.flowers();
const trees=scene.children.filter(x=>x.name==='detailed-apple-tree');assert.equal(trees.length,2);
for(const tree of trees){assert.equal(tree.children.filter(x=>x.name==='tree-apple').length,24);assert.equal(tree.children.find(x=>x.isInstancedMesh).count,1150);}
let instances=0,drawBatches=0;
scene.traverse(o=>{if(o.isMesh){drawBatches++;if(o.isInstancedMesh){instances+=o.count;for(const x of o.instanceMatrix.array)assert.ok(Number.isFinite(x),'finite instance transform');}for(const x of o.geometry.attributes.position.array)assert.ok(Number.isFinite(x),'finite vertices');}});
assert.ok(scene.children.some(o=>o.isInstancedMesh&&o.count===24000));assert.ok(scene.children.some(o=>o.isInstancedMesh&&o.count===8400));
console.log(JSON.stringify({trees:2,leaves:2300,apples:48,grassBlades:24000,flowers:1050,instances,drawBatches}));fs.rmSync(tmp,{recursive:true,force:true});
