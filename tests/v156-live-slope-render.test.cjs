/* v156 DOM model: verify path geometry and labels with a minimal real-style SVG fixture. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../assets/ck-graph-motion-v149.js');
const source=fs.readFileSync('assets/ck-graph-direct-v149.js','utf8');
const syncSource=source.slice(source.indexOf('function sync(root,c,state){'),source.indexOf('function mount(root,c){'));
const noop=()=>{};
function element(){
 return {attrs:{},style:{props:{},setProperty(k,v){this.props[k]=v}},
 classList:{data:{},add(k){this.data[k]=true},remove(k){delete this.data[k]},toggle(k,v){this.data[k]=!!v}},
 setAttribute(k,v){this.attrs[k]=String(v)},textContent:'',disabled:false};
}
function fixture(){
 const pathD=element(),pathS=element(),corridorD=element(),corridorS=element(),
  endpointD=element(),endpointS=element(),moving=element(),
  panel=['[data-ck156-action]','[data-ck156-easy]','[data-ck156-advanced]',
   '[data-ck156-exam]','[data-ck156-status]']
   .reduce((map,key)=>(map[key]=element(),map),{});
 const pair=(key,path,corridor,endpoint)=>({
  dataset:{ck149Target:key},style:element().style,classList:element().classList,
  querySelector(k){
   if(k==='.ck21-curve')return path;
   if(k==='[data-ck155-grip]')return {querySelector(q){
    if(q==='.ck155-grip-corridor')return corridor;
    if(q==='[data-ck156-slope-handle]')return endpoint;
    return null
   }};
   return null;
  }
 });
 const groups=[pair('demand',pathD,corridorD,endpointD),
               pair('supply',pathS,corridorS,endpointS)];
 const canvas={
  attrs:{},setAttribute(k,v){this.attrs[k]=String(v)},
  querySelectorAll(q){if(q==='[data-ck149-target]')return groups;
   if(q==='.ck21-curve')return [];return []},
  querySelector(q){return q==='.ck21-equilibrium-moving'?moving:null}
 };
 const root={classes:element().classList,
  querySelector(k){if(k==='svg.ck21-chart-svg')return canvas;
   return panel[k]||null},
  querySelectorAll(){return []},
  get classList(){return this.classes}
 };
 const ctx={math:()=>M,fmt:n=>Number(n).toFixed(1),ensureGrips:noop,
  markerArrow:noop,overlayMarker:noop,trackFor:()=>null,
  window:{CK150ScenarioUI:{mountLegacy:noop}},
  selectedCurve:'demand',root,c:{id:'both-shift',type:'both',shift:65},
  state:M.adjustSlope(M.defaultSnapshot({type:'both',shift:65}),{type:'both',shift:65},'demand',30)};
 vm.runInNewContext(syncSource+'\nsync(root,c,state)',ctx);
 return {canvas,groups,pathD,pathS,corridorD,corridorS,endpointD,endpointS,panel,moving,root};
}
test('live SVG demand slope tilts D path and grip corridor together; S remains baseline',()=>{
 const f=fixture();
 A.equal(f.pathD.attrs.d,'M 100 56.00 L 485 316.00');
 A.equal(f.corridorD.attrs.d,f.pathD.attrs.d);
 A.equal(f.pathS.attrs.d,'M 110 300.00 L 480 80.00');
 A.equal(f.endpointD.attrs.cx,'485');
 A.equal(f.endpointD.attrs.cy,'316');
 A.equal(f.endpointS.attrs.cy,'80');
 A.equal(f.groups[0].style.props['--ck21-dx'],'0.0px');
 A.equal(f.groups[1].style.props['--ck21-dx'],'0.0px');
 A.equal(f.root.classes.data['ck149-moved'],true);
});
test('live summary, easy/advanced and exam labels use textContent (no executable markup)',()=>{
 const f=fixture();
 A.match(f.panel['[data-ck156-action]'].textContent,/기울기 변경/);
 A.match(f.panel['[data-ck156-easy]'].textContent,/기울기/);
 A.match(f.panel['[data-ck156-advanced]'].textContent,/가격탄력성/);
 A.match(f.panel['[data-ck156-exam]'].textContent,/곡선 위 이동/);
 A.match(f.panel['[data-ck156-status]'].textContent,/수요/);
});

