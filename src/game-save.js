'use strict';
// Validate portable backups before they reach the live save. No code or HTML is evaluated.
const FootballSave=(()=>{
 const fail=()=>{throw Error('축구 생활의 기록 파일을 선택해 주세요.');};
 // UTF-8 gzip bytes are packed into safe 15-bit UTF-16 characters for local storage.
 const MAX_RECORD_BYTES=80000000,crcTable=new Uint32Array(256);
 for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;crcTable[n]=c>>>0;}
 function encodeBytes(bytes){
  let bits=0,word=0,codes=[],chunks=[];
  for(const byte of bytes){word=(word<<8)|byte;bits+=8;if(bits>=15){bits-=15;codes.push(((word>>>bits)&32767)+32);if(codes.length===8192){chunks.push(String.fromCharCode(...codes));codes=[];}}}
  if(bits)codes.push(((word<<(15-bits))&32767)+32);chunks.push(String.fromCharCode(...codes));return chunks.join('');
 }
 function decodeBytes(payload,length){
  if(typeof payload!=='string'||!Number.isInteger(length)||length<20||length>15000000||payload.length!==Math.ceil(length*8/15))fail();
  const bytes=new Uint8Array(length);let bits=0,word=0,index=0;
  for(let i=0;i<payload.length;i++){const code=payload.charCodeAt(i)-32;if(code<0||code>32767)fail();word=(word<<15)|code;bits+=15;while(bits>=8&&index<length){bits-=8;bytes[index++]=(word>>>bits)&255;}}
  if(index!==length||bits&&(word&((1<<bits)-1)))fail();return bytes;
 }
 const u32=(bytes,offset)=>(bytes[offset]|bytes[offset+1]<<8|bytes[offset+2]<<16|bytes[offset+3]<<24)>>>0;
 function decompress(payload,length){
  const bytes=decodeBytes(payload,length),size=u32(bytes,bytes.length-4),expectedCRC=u32(bytes,bytes.length-8);
  if(bytes[0]!==31||bytes[1]!==139||bytes[2]!==8||size>MAX_RECORD_BYTES)fail();
  let total=0,crc=0xffffffff,ended=false;const chunks=[],decoder=new TextDecoder('utf-8',{fatal:true});
  const stream=new fflate.Gunzip((chunk,final)=>{total+=chunk.length;if(total>MAX_RECORD_BYTES||total>size)fail();for(const byte of chunk)crc=crcTable[(crc^byte)&255]^(crc>>>8);chunks.push(decoder.decode(chunk,{stream:!final}));if(final)ended=true;});
  for(let i=0;i<bytes.length;i+=32768)stream.push(bytes.subarray(i,Math.min(i+32768,bytes.length)),i+32768>=bytes.length);
  if(!ended||total!==size||((crc^0xffffffff)>>>0)!==expectedCRC)fail();return chunks.join('');
 }
 const reviver=(key,value)=>{if(['__proto__','constructor','prototype'].includes(key))fail();return value;};
 function decode(text){
  let data=JSON.parse(text,reviver);if(data?.encoding==='fgz1'){if(data.version!==2)fail();data=JSON.parse(decompress(data.payload,data.bytes),reviver);}return data;
 }
 function serialize(data,threshold=1200000){
  const raw=JSON.stringify(data);if(raw.length<threshold)return raw;
  const bytes=new TextEncoder().encode(raw);if(bytes.length>MAX_RECORD_BYTES)throw Error('기록이 너무 큽니다.');
  const compressed=fflate.gzipSync(bytes,{level:6,mtime:0}),packed=JSON.stringify({version:2,encoding:'fgz1',bytes:compressed.length,payload:encodeBytes(compressed)});return packed.length<raw.length?packed:raw;
 }
 const award=a=>{
  if(!a||typeof a.name!=='string'||a.name.length>100||typeof a.player!=='string'||typeof a.club!=='string')fail();
  if(a.pos!==undefined&&!Object.hasOwn(FootballEngine.POS,a.pos))fail();
  if(a.stats){for(const [key,value]of Object.entries(a.stats))if(key==='saveRate'&&value===null)continue;else if(!Number.isFinite(value)||value<0||value>1000000)fail();if(a.stats.rating>10||a.stats.saveRate>100)fail();}
 };
 const record=g=>{
  if(!g||typeof g!=='object'||!g.player||typeof g.player.name!=='string'||!Array.isArray(g.history))fail();
  if(g.player.name.length>80||g.history.length>300)fail();
  if(g.version===2){
   const E=FootballEngine,p=g.player;
   if(!p.details||typeof p.details!=='object'||Object.values(p.details).some(v=>!Number.isFinite(v)||v<0||v>100))fail();
   if(g.nationalityVersion!==undefined&&g.nationalityVersion!==1)fail();
   if(g.expansionVersion!==undefined&&g.expansionVersion!==1)fail();
   try{E.migrate(g);}catch{fail();}
   if(!E.POS[p.pos]||!['left','right'].includes(p.foot)||!E.ARCH[p.archetypeId]?.pos.includes(p.pos))fail();
   if(p.number!==undefined&&(!Number.isInteger(p.number)||p.number<1||p.number>99))fail();
   if(!p.details||Object.values(E.ATTR).flatMap(a=>a.items).some(([id])=>!Number.isFinite(p.details[id])||p.details[id]<0||p.details[id]>100))fail();
   for(const id of ['potential','weakFoot','axp'])if(!Number.isFinite(p[id])||p[id]<0||p[id]>1000000)fail();
   if(!Number.isFinite(g.seed)||!Number.isFinite(g.clock)||g.clock<E.tick(1900,1)||g.clock>E.tick(2200,1)||!Number.isFinite(g.age)||g.age<10||g.age>100)fail();
   if(!E.LEAGUES[g.country]||!['middle','academy','pro','university','semipro','service'].includes(g.stage)||!['ready','market','callup','international','cup','rehab','retired'].includes(g.phase))fail();
   if(!g.period||!Array.isArray(g.period.matches)||!Array.isArray(g.period.events)||!g.worlds||typeof g.worlds!=='object')fail();
   for(const key of ['national','journey','trophies','champions','offers'])if(!Array.isArray(g[key]))fail();
   for(const key of ['awards','scouting','trials'])if(!Array.isArray(g[key])||g[key].length>1000)fail();
   if(!Number.isFinite(p.height)||p.height<140||p.height>220||!Number.isFinite(p.weight)||p.weight<35||p.weight>150)fail();
   if(!g.special||!Number.isFinite(g.special.used)||g.special.used<0||g.special.used>6||!Array.isArray(g.special.periods)||!g.military||!['pending','service','completed'].includes(g.military.status)||!Array.isArray(g.military.applications))fail();
   if(g.loan&&(!E.club(g.loan.parentClubId,g)||!Number.isFinite(g.loan.end)||g.loan.end<g.loan.start))fail();
   for(const s of g.scouting)if(!s.stats||!Array.isArray(s.strengths)||!Array.isArray(s.paragraphs)||!E.POS[s.pos])fail();
   const nt=g.internationalCareer,teams=E.NATIONAL_TEAMS,levels=E.NATIONAL_LEVELS,validTeam=id=>Object.hasOwn(teams,id),validLevel=id=>Object.hasOwn(levels,id);
   if(g.nationalityVersion!==1||!nt||!Array.isArray(nt.nationalities)||!nt.nationalities.length||nt.nationalities.length>6||new Set(nt.nationalities).size!==nt.nationalities.length||nt.nationalities.some(id=>!validTeam(id))||!nt.nationalities.includes(nt.representing)||!validTeam(nt.residenceCountry)||!Number.isFinite(nt.residenceSince)||nt.residenceSince>g.clock||nt.residenceSince<E.tick(1900,1)||typeof nt.switchUsed!=='boolean'||!Array.isArray(nt.decisions)||nt.decisions.length>5000||!Array.isArray(nt.acquired)||nt.acquired.length>5||nt.previousAssociation!==null&&!validTeam(nt.previousAssociation)||nt.lastWindow!==null&&(!Number.isFinite(nt.lastWindow)||nt.lastWindow>g.clock))fail();
   for(const d of nt.decisions)if(!validTeam(d.country)||!validLevel(d.level)||typeof d.accepted!=='boolean'||!Number.isFinite(d.date)||d.date>g.clock)fail();
   for(const a of nt.acquired)if(!validTeam(a.country)||!nt.nationalities.includes(a.country)||!Number.isFinite(a.date)||a.date>g.clock)fail();
   for(const m of g.national)if(!validTeam(m.nationalCountry)||!validLevel(m.teamLevel)||!['friendly','official'].includes(m.matchType)||m.isAMatch!==(m.teamLevel==='senior'))fail();
   if(['callup','international'].includes(g.phase)){
    const c=g.camp;if(!c||!Array.isArray(c.opponents)||(c.seriesId?c.opponents.length<1||c.opponents.length>9:c.opponents.length!==2)||c.opponents.some(n=>typeof n!=='string'||n.length>60)||!Array.isArray(c.matches)||c.matches.length>c.opponents.length||!validTeam(c.country)||c.country!==nt.representing||!nt.nationalities.includes(c.country)||!validLevel(c.level)||(c.seriesId?c.matchType!=='official':c.matchType!=='friendly')||!Number.isFinite(c.date)||c.date>g.clock||typeof c.complete!=='boolean'||c.complete!==(!c.pendingShootout&&c.matches.length===c.opponents.length))fail();
    if(!E.canRepresent(g,c.country)||g.phase==='callup'&&(c.accepted!==false||c.complete||c.matches.length)||g.phase==='international'&&c.accepted!==true)fail();
   }
   try{FootballExpansion.validate(g);}catch{fail();}
   for(const key of ['milestoneNotices','milestoneAcknowledged'])if(g[key]!==undefined&&(!Array.isArray(g[key])||g[key].length>100||g[key].some(id=>typeof id!=='string'||id.length>40)||new Set(g[key]).size!==g[key].length))fail();
   for(const m of [...FootballEngine.careerMatches(g),...g.national,...(g.camp?.matches||[])]){
    if(m.timeline!==undefined){
     if(!Array.isArray(m.timeline)||m.timeline.length>90)fail();
     for(const e of m.timeline)if(!Number.isInteger(e.minute)||e.minute<1||e.minute>90||!['goal','save'].includes(e.type)||!['own','opp'].includes(e.side)||typeof e.player!=='boolean'||typeof e.assist!=='boolean')fail();
     if(m.timeline.filter(e=>e.type==='goal'&&e.side==='own').length!==m.own||m.timeline.filter(e=>e.type==='goal'&&e.side==='opp').length!==m.opp)fail();
    }
    if(m.development!==undefined){const d=m.development;if(!d||!['matches','national'].includes(d.source)||!Number.isFinite(d.startOvr)||d.startOvr<1||d.startOvr>99||!Number.isFinite(d.endOvr)||d.endOvr<1||d.endOvr>99||!d.changes||typeof d.changes!=='object'||Array.isArray(d.changes))fail();for(const [id,v]of Object.entries(d.changes))if(!Object.values(E.ATTR).some(a=>a.items.some(([key])=>key===id))||!Number.isFinite(v)||v<0||v>99)fail();}
   }
   for(const r of [...g.history,g.period]){
    if(!Array.isArray(r.matches)||r.matches.length>300)fail();
    if(r.awardSeasons!==undefined){
     if(!Array.isArray(r.awardSeasons)||r.awardSeasons.length>6)fail();
     for(const s of r.awardSeasons){if(!s||typeof s.id!=='string'||typeof s.season!=='string'||!Object.hasOwn(E.LEAGUES,s.country)||!Array.isArray(s.awards)||s.awards.length>1000)fail();s.awards.forEach(award);}
    }
   }
   // Older honours did not store the full performance snapshot.
   g.awards.filter(a=>a.stats).forEach(award);
  }else if(g.version!==1)fail();
  return g;
 };
 function parse(text){
  if(typeof text!=='string'||text.length>15000000)fail();
  let data;try{data=decode(text);}catch{fail();}
  if(!data||![1,2].includes(data.version)||data.game!==null&&data.game!==undefined&&typeof data.game!=='object')fail();
  if(!Array.isArray(data.archives)||data.archives.length>100||data.legacy!==undefined&&!Array.isArray(data.legacy))fail();
  const legacy=data.legacy||[];if(legacy.length>100)fail();
  if(data.game)record(data.game);data.archives.forEach(record);legacy.forEach(record);
  try{FootballCollection.validate(data.clubhouse);}catch{fail();}
  if(!data.game&&!data.archives.length&&!legacy.length&&!data.clubhouse)throw Error('파일에 불러올 기록이 없습니다.');
  return {version:data.version,game:data.game||null,archives:data.archives,legacy,...(data.clubhouse?{clubhouse:data.clubhouse}:{})};
 }
 function merge(current,incoming){
  // Preserve the current life when importing a different active life.
  const result={version:2,game:incoming.game?.version===2?incoming.game:current.game,archives:[...current.archives],legacy:[...current.legacy]};
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const archive=g=>{const list=g.version===2?result.archives:result.legacy;if(!same(result.game,g)&&!list.some(r=>same(r,g)))list.push(g);};
  if(result.game!==current.game&&current.game)archive(current.game);
  if(incoming.game?.version===1)archive(incoming.game);
  for(const g of [...incoming.archives,...incoming.legacy])archive(g);
  if(incoming.clubhouse||current.clubhouse)result.clubhouse=incoming.clubhouse||current.clubhouse;
  return result;
 }
 return {parse,merge,serialize,decode};
})();
