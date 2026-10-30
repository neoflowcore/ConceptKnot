import * as T from '../vendor/three.module.min.js';
import {makeApple} from './ck-mascot-kit-v33.js';
// Transparent 3D layer only; animation time belongs to the existing paused garden clock.
export function mountRail(host,motion){
 const renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setClearColor(0,0);
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
 const canvas=renderer.domElement;canvas.className='ck42-rail3d';canvas.setAttribute('aria-hidden','true');
 const scene=new T.Scene(),camera=new T.OrthographicCamera();camera.position.set(768,512,1000);camera.lookAt(768,512,0);camera.near=1;camera.far=2000;
 scene.add(new T.HemisphereLight(0xe5f7ff,0x344329,2));
 const key=new T.DirectionalLight(0xfff5de,3.6);key.position.set(250,1000,550);scene.add(key);
 const rim=new T.DirectionalLight(0x95dfff,1.6);rim.position.set(1250,500,200);scene.add(rim);
 const pts=motion.points.filter((_,i)=>i%6===0).slice(0,-1).map(p=>new T.Vector3(p[0],1024-p[1],-p[2]*4));
 const curve=new T.CatmullRomCurve3(pts,true,'centripetal');
 const tube=new T.Mesh(new T.TubeGeometry(curve,480,7.0,18,true),new T.MeshPhysicalMaterial({color:0x1786bf,roughness:.24,metalness:.25,clearcoat:1,clearcoatRoughness:.16}));scene.add(tube);
 const fruit=[0xe43927,0x8fc52d,0xf1c337,0xde3425,0x87bd29,0xf3c637].map(c=>{const apple=makeApple(T,c,26);scene.add(apple);return apple;});
 function resize(){const aspect=host.clientWidth/Math.max(1,host.clientHeight),w=Math.max(1536,1024*aspect),h=w/aspect;camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();renderer.setSize(Math.max(1,host.clientWidth),Math.max(1,host.clientHeight),false);}
 function paint(seconds){fruit.forEach((apple,i)=>{const u=(seconds/motion.lapSeconds+i/6)%1;apple.position.copy(curve.getPointAt(u));apple.rotation.y=seconds*.45+i;apple.rotation.z=.08*Math.sin(seconds*.3+i);});renderer.render(scene,camera);}
 resize();paint(0);host.append(canvas);host.classList.add('ck42-webgl-ready');host.dataset.ck42Renderer='webgl';
 const observer=new ResizeObserver(()=>{if(host.clientHeight>0){resize();paint(lastTime);}});observer.observe(host);let lastTime=0;
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();host.classList.remove('ck42-webgl-ready');host.dataset.ck42Renderer='context-lost';});
 canvas.addEventListener('webglcontextrestored',()=>{paint(lastTime);host.classList.add('ck42-webgl-ready');host.dataset.ck42Renderer='webgl';});
 return {paint(seconds){lastTime=seconds;paint(seconds);},dispose(){observer.disconnect();scene.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});renderer.dispose();canvas.remove();}};
}
