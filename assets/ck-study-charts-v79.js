/* ConceptKnot P6 v79 路 interactive SVG scrubbing across the 17 existing study charts.
 * A diagram is an illustrative direction, never a computed official-exam curve.
 */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const clamp=n=>Math.round(Math.max(0,Math.min(100,Number(n)||0)));
const shifted=c=>c?.type==='demand'||c?.type==='supply';
const direction=c=>Number(c?.shift)<0?-1:1;
const names={ '-1':'臧愳唽 路 膦岇浮', '1':'歃濌皜 路 鞖办浮'};
let gesture=null,lastChart=null,lastValue=0,override=null,schedulePending=false;
function active(){
 const root=$('.ck21-chart-section'),state=window.CK21Charts?.getState?.();
 const chart=window.CK21Charts?.charts?.[state?.selected||0];
 return root&&chart?{root,chart,state}:null;
}
function ensureMarker(root,c){
 const svg=root.querySelector('svg.ck21-chart-svg');
 if(!svg)return;
 const needsMarker=!shifted(c)&&c.type!=='both';
 let node=svg.querySelector('[data-ck79-marker]');
 if(!needsMarker){node?.remove();return;}
 if(!node){
  node=document.createElementNS('http://www.w3.org/2000/svg','g');
  node.setAttribute('data-ck79-marker','');
  node.setAttribute('aria-hidden','true');
  node.innerHTML='<line x1="0" y1="0" x2="0" y2="0" stroke="currentColor" stroke-dasharray="4 6" opacity=".6"/>'+
   '<circle cx="0" cy="0" r="7" stroke="currentColor" stroke-width="2" fill="#f3e2b9"/>';
  svg.append(node);
 }
 return node;
}
function markerPosition(c,p){
 const x=118+360*p;
 const type=c.type;
 if(type==='along')retu痘玘