const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
test('smiling cub has visible face marks and a continuous complete replay cycle',async()=>{
 const THREE=await import(pathToFileURL(path.join(root,'vendor/three.module.min.js')).href);
 const {buildPencilCub}=await import('data:text/javascript;base64,'+Buffer.from(read('assets/ck-pointing-cub-v16.js')).toString('base64'));
 const cub=buildPencilCub(THREE,new THREE.Scene(),()=>0);
 assert.equal(cub.expression,'smiling-freckled-pencil-cub');
 const pose=()=>[cub.stub.position.y,cub.head.rotation.x,cub.head.rotation.z];
 cub.animate(0);const start=pose();assert.equal(cub.getPush(),1);
 cub.animate(.9);assert.ok(cub.getPush()<.7);
 cub.animate(3.6);const end=pose();
 end.forEach((n,i)=>assert.ok(Math.abs(n-start[i])<1e-8));
 cub.animate(3.599);const near=pose();
 near.forEach((n,i)=>assert.ok(Math.abs(n-end[i])<.00001));
 cub.animate(0);assert.deepEqual(pose(),start);
});
test('click replay resets only cub clock and retains idle GPU stop',()=>{
 const s=read('assets/ck-landscape3d.js');
 assert.match(s,/cubButton.addEventListener\('click',replayCub\)/);
 assert.match(s,/cubTime=0;introDone=false;last=0/);
 assert.match(s,/scenes.pressCub\?\.animate\(cubTime\)/);
 assert.match(s,/if\(cubTime>=INTRO_SECONDS\)/);
 assert.doesNotMatch(s.slice(s.indexOf('function replayCub'),s.indexOf('function createScrollCue')),/playTime=0/);
 new vm.Script(s.replace(/^import .*;$/gm,''));
});
