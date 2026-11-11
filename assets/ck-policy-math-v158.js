/* ConceptKnot v158: pure policy-price comparison math. Coordinates are schematic, not official exam values. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.CK158PolicyMath=api;
})(typeof window==='object'?window:null,function(){
  'use strict';
  const D=Object.freeze({x1:100,y1:86,x2:485,y2:286});
  const S=Object.freeze({x1:110,y1:300,x2:480,y2:80});
  const limits=Object.freeze({minY:100,maxY:285});
  const mD=(D.y2-D.y1)/(D.x2-D.x1);
  const mS=(S.y2-S.y1)/(S.x2-S.x1);
  const xEq=(S.y1-D.y1+mD*D.x1-mS*S.x1)/(mD-mS);
  const eq=Object.freeze({x:xEq,y:D.y1+mD*(xEq-D.x1)});
  function evaluate(mode,value){
    if(mode!=='ceiling'&&mode!=='floor')throw new RangeError('Invalid policy type');
    if(!Number.isFinite(Number(value)))throw new RangeError('Invalid price-line position');
    const y=Math.min(limits.maxY,Math.max(limits.minY,Number(value)));
    const qDemand=D.x1+(y-D.y1)/mD;
    const qSupply=S.x1+(y-S.y1)/mS;
    const binding=mode==='ceiling'?y>eq.y+0.5:y<eq.y-0.5;
    const size=binding?Math.max(0,mode==='ceiling'?qDemand-qSupply:qSupply-qDemand):0;
    const kind=!binding?'none':mode==='ceiling'?'shortage':'surplus';
    return Object.freeze({mode,y,equilibrium:eq,quantityDemand:qDemand,
      quantitySupply:qSupply,binding,kind,size,
      rangeStart:binding?Math.min(qDemand,qSupply):eq.x,
      rangeEnd:binding?Math.max(qDemand,qSupply):eq.x,
      pricePosition:y>eq.y+0.5?'below':y<eq.y-0.5?'above':'equal',
      schematic:true});
  }
  return Object.freeze({evaluate,limits,equilibrium:eq});
});
