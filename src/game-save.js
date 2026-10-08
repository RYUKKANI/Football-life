'use strict';
// Validate portable backups before they reach the live save. No code or HTML is evaluated.
const FootballSave=(()=>{
 const fail=()=>{throw Error('축구 생활의 기록 파일을 선택해 주세요.');};
 const record=g=>{
  if(!g||typeof g!=='object'||!g.player||typeof g.player.name!=='string'||!Array.isArray(g.history))fail();
  if(g.player.name.length>80||g.history.length>300)fail();
  if(g.version===2){
   const E=FootballEngine,p=g.player;
   if(!p.details||typeof p.details!=='object'||Object.values(p.details).some(v=>!Number.isFinite(v)||v<0||v>100))fail();
   try{E.migrate(g);}catch{fail();}
   if(!E.POS[p.pos]||!['left','right'].includes(p.foot)||!E.ARCH[p.archetypeId]?.pos.includes(p.pos))fail();
   if(!p.details||Object.values(E.ATTR).flatMap(a=>a.items).some(([id])=>!Number.isFinite(p.details[id])||p.details[id]<0||p.details[id]>100))fail();
   for(const id of ['potential','weakFoot','axp'])if(!Number.isFinite(p[id])||p[id]<0||p[id]>1000000)fail();
   if(!Number.isFinite(g.seed)||!Number.isFinite(g.clock)||g.clock<E.tick(1900,1)||g.clock>E.tick(2200,1)||!Number.isFinite(g.age)||g.age<10||g.age>100)fail();
   if(!E.LEAGUES[g.country]||!['middle','academy','pro','university','semipro','service'].includes(g.stage)||!['ready','market','international','retired'].includes(g.phase))fail();
   if(!g.period||!Array.isArray(g.period.matches)||!Array.isArray(g.period.events)||!g.worlds||typeof g.worlds!=='object')fail();
   for(const key of ['national','journey','trophies','champions','offers'])if(!Array.isArray(g[key]))fail();
   for(const key of ['awards','scouting','trials'])if(!Array.isArray(g[key])||g[key].length>1000)fail();
   if(!Number.isFinite(p.height)||p.height<140||p.height>220||!Number.isFinite(p.weight)||p.weight<35||p.weight>150)fail();
   if(!g.special||!Number.isFinite(g.special.used)||g.special.used<0||g.special.used>6||!Array.isArray(g.special.periods)||!g.military||!['pending','service','completed'].includes(g.military.status)||!Array.isArray(g.military.applications))fail();
   if(g.loan&&(!E.club(g.loan.parentClubId,g)||!Number.isFinite(g.loan.end)||g.loan.end<g.loan.start))fail();
   for(const s of g.scouting)if(!s.stats||!Array.isArray(s.strengths)||!Array.isArray(s.paragraphs)||!E.POS[s.pos])fail();
   if(g.phase==='international'&&(!g.camp||!Array.isArray(g.camp.opponents)||!Array.isArray(g.camp.matches)))fail();
   for(const r of [...g.history,g.period])if(!Array.isArray(r.matches)||r.matches.length>300)fail();
  }else if(g.version!==1)fail();
  return g;
 };
 function parse(text){
  if(typeof text!=='string'||text.length>15000000)fail();
  let data;try{data=JSON.parse(text,(key,value)=>{if(['__proto__','constructor','prototype'].includes(key))fail();return value;});}catch{fail();}
  if(!data||![1,2].includes(data.version)||data.game!==null&&data.game!==undefined&&typeof data.game!=='object')fail();
  if(!Array.isArray(data.archives)||data.archives.length>100||data.legacy!==undefined&&!Array.isArray(data.legacy))fail();
  const legacy=data.legacy||[];if(legacy.length>100)fail();
  if(data.game)record(data.game);data.archives.forEach(record);legacy.forEach(record);
  if(!data.game&&!data.archives.length&&!legacy.length)throw Error('파일에 불러올 기록이 없습니다.');
  return {version:data.version,game:data.game||null,archives:data.archives,legacy};
 }
 function merge(current,incoming){
  // Preserve the current life when importing a different active life.
  const result={version:2,game:incoming.game?.version===2?incoming.game:current.game,archives:[...current.archives],legacy:[...current.legacy]};
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const archive=g=>{const list=g.version===2?result.archives:result.legacy;if(!same(result.game,g)&&!list.some(r=>same(r,g)))list.push(g);};
  if(result.game!==current.game&&current.game)archive(current.game);
  if(incoming.game?.version===1)archive(incoming.game);
  for(const g of [...incoming.archives,...incoming.legacy])archive(g);
  return result;
 }
 return {parse,merge};
})();
