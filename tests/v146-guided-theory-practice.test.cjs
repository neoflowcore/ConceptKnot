'use strict';const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const math=require('../assets/ck-concept-math-v141.js'),q=require('../assets/ck-concept-practice-v146.js'),g=require('../assets/ck-concept-relation-drag-v146.js');
const read=p=>fs.readFileSync(p,'utf8');
function app(){
 const hooks={};const window={addEventListener(){},requestAnimationFrame(f){f();return 1}};
 const document={hidden:false,addEventListener(k,f){(hooks[k]??=[]).push(f)},createElement(){return {dataset:{},isConnected:true,innerHTML:'',setAttribute(){},querySelector(){return null},querySelectorAll(){return []}}}};
 const ctx={window,document,localStorage:{getItem(){return null},setItem(){throw Error('no consent')},removeItem(){throw Error('no consent')}}};
 for(const p of ['ck-concept-math-v141.js','ck-concept-coach-v143.js','ck-concept-gesture-v145.js','ck-concept-relation-drag-v146.js','ck-concept-transition-v144.js','ck-concept-transition-view-v144.js','ck-concept-practice-v146.js','ck-concept-lab-v141.js'])vm.runInNewContext(read('assets/'+p),ctx,{filename:p});
 const chart={isConnected:true,querySelector(){return null},appendChild(el){this.root=el;el.isConnected=true}};
 A.ok(window.CK141ConceptLab.mount(chart));
 const root=chart.root,fire=(name,e)=>{for(const f of hooks[name]||[])f(e)};
 const click=(selector,ds)=>fire('click',{target:{closest(k){return k==='#ck141-concept-lab'?root:k===selector?{dataset:ds}:null}}});
 return {root,¶»§q«^