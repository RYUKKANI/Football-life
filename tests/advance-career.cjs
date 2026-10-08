'use strict';
const active=['ready','callup','international','cup','rehab'];
function step(E,g,{accept=true}={}){
 if(g.phase==='rehab')return E.chooseRehab(g,'normal');
 if(g.phase==='cup')return g.cupMatch.stage==='result'?E.continueCup(g):E.playCup(g,'auto');
 if(g.phase==='callup')return E.respondCallup(g,accept);
 if(g.phase==='international')return g.camp.complete?E.returnFromCamp(g):E.internationalMatch(g,'auto');
 if(g.phase==='ready')return E.advance(g);
 return false;
}
function finish(E,g,options={}){
 for(let guard=0;active.includes(g.phase);guard++){
  if(guard>=200)throw Error('Career period stalled in '+g.phase);
  if(!step(E,g,options))throw Error('Pending career step failed in '+g.phase);
 }
 if(!['market','retired'].includes(g.phase))throw Error('Unexpected period end '+g.phase);
 return g;
}
module.exports={step,finish,active};
