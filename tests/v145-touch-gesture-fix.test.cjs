/* ConceptKnot v145 â€” touch/S Pen input and visible explanation tests (manual only).
 * Run manually with: node --test tests/v145-touch-gesture-fix.test.cjs
 */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const geometry=require('../assets/ck-concept-gesture-v145.js');
const model=require('../assets/ck-concept-math-v141.js');
const theory=require('../assets/ck-theory-models-v142.js');
function sandbox(){
 const events={};
 const window={addEventListener(){},requestAnimationFrame(f){f();return 1}};
 const document={hidden:false,addEventListener(type,fn,opts){(events[type]??=[]).push({fn,opts});},
  createElement(){return {dataset:{},isConnected:true,innerHTML:'',setAttribute(){},querySelector(){return null},querySelectorAll(){return []}};}};
 const storage={getItem(){return null},setItem(){},removeItem(){}};
 const ctx={window,document,localStorage:storage};
 for(const f of ['assets/ck-concept-math-v141.js','assets/ck-theory-models-v142.js',
  'assets/ck-concept-coach-v143.js','assets/ck-concept-gesture-v145.js',
  'assets/ck-concept-transition-v144.js','assets/ck-concept-transition-view-v144.js',
  'assets/ck-concept-lab-v141.js','assets/ck-theory-v142.js'])
  vm.runInNewContext(read(f),ctx,{filename:f});
 const fire=(type,e)=>{for(const {fn} of events[type]||[])fn(e);};
 return {window,document,events,fire};
}
function root(){return {dataset:{},is¶»§q«^