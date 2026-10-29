// Authored vector landmarks on a shared face plane; the two siblings use the
// same nose/muzzle coordinates. No per-feature mesh depths or floating eyeballs.
export const FACE_LANDMARKS=Object.freeze({leftEye:[335,443],rightEye:[689,443],nose:[512,670],mouth:[512,807],leftPaw:[335,825],rightPaw:[689,825]});
export function faceSVG(sleeping=false){
 const defs=`<defs><radialGradient id="muzzle"><stop stop-color="#fff5dd"/><stop offset=".8" stop-color="#ffeac3"/><stop offset="1" stop-color="#edc887"/></radialGradient><radialGradient id="iris" cx=".4" cy=".3"><stop stop-color="#6c4026"/><stop offset=".67" stop-color="#653a24"/><stop offset=".88" stop-color="#9f6534"/><stop offset="1" stop-color="#34241d"/></radialGradient><linearGradient id="nose" x2="0" y2="1"><stop stop-color="#ac6340"/><stop offset="1" stop-color="#603424"/></linearGradient><radialGradient id="blush"><stop stop-color="#f2a66f" stop-opacity=".6"/><stop offset="1" stop-color="#f2a66f" stop-opacity="0"/></radialGradient></defs>`;
 let eyes='';
 for(const [x,sign] of [[335,-1],[689,1]]){
  eyes+=`<path d="M ${x-85} 280 Q ${x} 236 ${x+75} 272" fill="none" stroke="#bc7d35" stroke-width="24" stroke-linecap="round"/>`;
  if(sleeping){eyes+=`<path d="M ${x-102} 446 Q ${x-10} 526 ${x+95} 444" fill="none" stroke="#63412a" stroke-width="19" stroke-linecap="round"/><path d="M ${x+sign*89} 457 l ${sign*21} -13" stroke="#63412a" stroke-width="12" stroke-linecap="round"/>`;}
  else{eyes+=`<ellipse cx="${x}" cy="443" rx="126" ry="153" fill="#e5ba79"/><ellipse cx="${x}" cy="438" rx="118" ry="143" fill="#fff6dc"/><ellipse cx="${x-sign*10}" cy="449" rx="103" ry="128" fill="url(#iris)"/><ellipse cx="${x-sign*14}" cy="440" rx="78" ry="104" fill="#1d1c21"/><ellipse cx="${x-37}" cy="382" rx="34" ry="42" fill="#fffef4"/><ellipse cx="${x+42}" cy="504" rx="14" ry="17" fill="#fff6df"/><path d="M ${x-112} 399 Q ${x-67} 281 ${x+33} 299" fill="none" stroke="#70482a" stroke-width="11" stroke-linecap="round"/>`;}
 }
 const mouth=sleeping?'<path d="M 436 778 Q 512 838 588 778" fill="none" stroke="#885136" stroke-width="11" stroke-linecap="round"/>':'<path d="M 408 765 Q 512 828 616 765 C 612 931 416 931 408 765" fill="#553020"/><ellipse cx="512" cy="864" rx="58" ry="28" fill="#e99488"/><path d="M 461 796 Q 479 806 496 803 L 494 826 Q 475 838 464 820 Z M 528 803 Q 545 806 563 796 L 560 820 Q 547 838 530 826 Z" fill="#fff2d8"/>';
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${defs}${eyes}<ellipse cx="220" cy="628" rx="107" ry="71" fill="url(#blush)"/><ellipse cx="804" cy="628" rx="107" ry="71" fill="url(#blush)"/><ellipse cx="512" cy="771" rx="222" ry="170" fill="url(#muzzle)"/>${mouth}<ellipse cx="423" cy="704" rx="128" ry="91" fill="url(#muzzle)"/><ellipse cx="601" cy="704" rx="128" ry="91" fill="url(#muzzle)"/><path d="M 456 664 Q 512 634 568 664 Q 557 705 512 722 Q 467 705 456 664" fill="url(#nose)"/><ellipse cx="492" cy="661" rx="18" ry="7" fill="#e0a07b"/><path d="M512 719v41" stroke="#885136" stroke-width="10" stroke-linecap="round"/>${[[-1,388],[1,636]].map(([sign,x])=>[[0,695],[35,704],[12,737]].map(([dx,y])=>`<circle cx="${x+sign*dx}" cy="${y}" r="7" fill="#a96b40"/>`).join('')).join('')}</svg>`;
}
const cache=new Map();
export function faceTexture(T,sleeping){
 if(typeof document==='undefined')return null;
 const key=String(sleeping);if(cache.has(key))return cache.get(key);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const image=new Image();image.onload=()=>{canvas.getContext('2d').drawImage(image,0,0);texture.needsUpdate=true;window.dispatchEvent(new Event('ck:scene-texture-ready'));};image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(faceSVG(sleeping));
 cache.set(key,texture);return texture;
}
export function attachFace(T,head,sleeping=false){
 const g=new T.PlaneGeometry(1.88,1.46,32,32),pos=g.attributes.position;
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i);pos.setZ(i,.74*Math.sqrt(Math.max(.07,1-(x/1.02)**2-(y/.91)**2))+.022);}
 g.computeVertexNormals();
 const material=new T.MeshStandardMaterial({map:faceTexture(T,sleeping),transparent:true,roughness:.85,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,emissive:0xffe7ba,emissiveIntensity:.10});
 const patch=new T.Mesh(g,material);patch.name='registered-vector-face';head.add(patch);
 if(!sleeping){const closed=new T.Mesh(g.clone(),material.clone());closed.material.map=faceTexture(T,true);closed.visible=false;closed.name='blink-vector-face';head.add(closed);return {patch,closed};}
 return {patch};
}
