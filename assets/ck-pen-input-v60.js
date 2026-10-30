/* S Pen is a chorded pointer: barrel press/release is not tip down/up. */
(function(){
 'use strict';
 const buttons=new Map(),hoverHeld=new Set();
 function observe(e){
  if(e.pointerType!=='pen')return;
  const id=e.pointerId??'pen',bits=Number(e.buttons)||0;
  if(e.type==='pointercancel'||e.type==='lostpointercapture'){buttons.delete(id);hoverHeld.delete(id);return;}
  if(bits&34){buttons.set(id,true);if(e.pressure>0||bits&1)hoverHeld.delete(id);else hoverHeld.add(id);}
  else if(e.button===2||e.button===5){
   const pressed=e.type==='pointerdown'||e.type==='mousedown'||e.type==='contextmenu';
   buttons.set(id,pressed);if(!pressed)hoverHeld.delete(id);
  }else if(bits===0&&!(e.pressure>0)){buttons.delete(id);hoverHeld.delete(id);}
  else if(bits&1&&!hoverHeld.has(id))buttons.set(id,false);
 }
 function eraser(e){
  if(e.pointerType!=='pen')return false;
  return !!((Number(e.buttons)||0)&34)||buttons.get(e.pointerId??'pen')===true||
   (e.button===5&&e.type!=='pointerup')||
   (e.button===2&&e.type==='pointerdown');
 }
 function contact(e){
  return e.pointerType==='pen'&&(e.pressure>0||!!((Number(e.buttons)||0)&33));
 }
 for(const type of ['pointerdown','pointermove','pointerrawupdate','pointerup','pointercancel','lostpointercapture','contextmenu'])
  document.addEventListener(type,observe,true);
 window.addEventListener('blur',()=>{buttons.clear();hoverHeld.clear()});
 window.CKPen60=Object.freeze({observe,eraser,contact,reset:()=>{buttons.clear();hoverHeld.clear()}});
})();
