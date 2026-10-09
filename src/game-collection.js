'use strict';
// Read saved careers without advancing them. Exhibition matches use a separate seed and save.
const FootballCollection=(()=>{
 const E=FootballEngine,copy=x=>JSON.parse(JSON.stringify(x)),positions=Object.keys(E.POS);
 const keys=Object.values(E.ATTR).flatMap(a=>a.items.map(([id])=>id));
 const validDetails=d=>!!d&&keys.every(k=>Number.isFinite(d[k])&&d[k]>=1&&d[k]<=99);
 const identity=g=>'p-'+E.stableSeed([g.id||'',g.player?.name||'',g.player?.pos||'',g.birthYear||'',g.player?.number||''].join('|')).toString(36);
 function prime(g){
  const p=g.player,candidates=[];
  if(validDetails(g.prime?.details))candidates.push({...g.prime,details:{...g.prime.details},stored:true});
  for(const r of g.history||[])if(validDetails(r.endDetails))candidates.push({details:{...r.endDetails},age:E.date(r.end).year-(g.birthYear||1985),season:r.matches.at(-1)?.league||String(E.date(r.end).year),club:r.club,clubId:r.clubId,stored:true});
  candidates.push({details:{...p.details},age:g.age,season:String(g.year),club:E.teamName(g),clubId:g.clubId,stored:false});
  for(const c of candidates)c.ovr=E.overall({...p,details:c.details});
  candidates.sort((a,b)=>b.ovr-a.ovr||Number(b.stored)-Number(a.stored));
  return candidates[0];
 }
 function entries(game,archives=[],legacy=[]){
  const rows=[...(game?[{g:game,source:'active',index:0}]:[]),...archives.map((g,index)=>({g,source:'archives',index})),...legacy.map((g,index)=>({g,source:'legacy',index}))];
  return rows.map(r=>({...r,key:identity(r.g),modern:r.g.version===2,...(r.g.version===2?{prime:prime(r.g),stats:E.totals(r.g)}:{prime:null,stats:{apps:(r.g.history||[]).reduce((n,s)=>n+(s.apps||0),0)}})}));
 }
 function roster(rows){
  const unique=new Map();for(const row of rows.filter(r=>r.modern)){
   const previous=unique.get(row.key);
   if(!previous||row.g.clock>previous.g.clock||row.g.clock===previous.g.clock&&row.stats.apps>previous.stats.apps)unique.set(row.key,row);
  }return [...unique.values()];
 }
 const sum=(matches,key)=>matches.reduce((n,m)=>n+(Number(m[key])||0),0);
 function representatives(g){
  const s=E.totals(g),p=g.player.pos;
  if(p==='GK')return [['선방',s.saves],['무실점',s.clean]];
  if(p==='CB')return [['태클',s.tackles],['가로채기',s.interceptions]];
  if(p==='FB')return [['도움',s.assists],['태클',s.tackles]];
  if(p==='MF')return [['키패스',s.keyPasses],['도움',s.assists]];
  return [['골',s.goals],['도움',s.assists]];
 }
 function milestones(g){
  if(g?.version!==2)return [];
  const matches=E.careerMatches(g).filter(m=>m.minutes>0).slice().sort((a,b)=>a.date-b.date||(a.matchDay||0)-(b.matchDay||0)),out=[];
  const add=(id,name,description,m,icon='star')=>{if(m)out.push({id,name,description,date:Number.isFinite(m.date)?m.date:null,year:m.year||(/^\d{4}/.test(m.season||'')?Number(String(m.season).slice(0,4)):null),clubId:m.clubId||null,club:m.club||m.opponent||'',icon});};
  add('debut','첫 출전','처음으로 그라운드에 나섰습니다.',matches[0],'boot');
  add('first-goal','첫 골','자신의 이름으로 첫 골을 기록했습니다.',matches.find(m=>m.goals),'ball');
  add('first-assist','첫 도움','동료의 득점을 처음으로 도왔습니다.',matches.find(m=>m.assists),'pass');
  add('pro-debut','프로 데뷔','프로 무대에서 첫 출전을 기록했습니다.',matches.find(m=>m.kind==='pro'),'boot');
  add('overseas-debut','해외 무대 첫 출전','새로운 나라의 그라운드에 나섰습니다.',matches.find(m=>m.country&&m.country!=='KR'),'globe');
  if(['GK','CB','FB'].includes(g.player.pos))add('first-clean','첫 무실점','60분 이상 뛰며 실점 없이 경기를 마쳤습니다.',matches.find(m=>m.clean),'shield');
  const senior=(g.national||[]).filter(m=>m.teamLevel==='senior'&&m.minutes>0).slice().sort((a,b)=>a.date-b.date);
  add('senior-debut','첫 성인 A매치','성인 국가대표로 첫 경기를 뛰었습니다.',senior[0],'flag');
  for(const n of [100,250,500])add('apps-'+n,n+'경기 출전','소속팀에서 '+n+'번째 출전을 기록했습니다.',matches[n-1],'boot');
  for(const n of [25,50,100])add('caps-'+n,'A매치 '+n+'경기','성인 국가대표 '+n+'번째 출전입니다.',senior[n-1],'flag');
  for(const [stat,levels,label]of [['goals',[50,100,200],'골'],['assists',[50,100],'도움'],['saves',[100,500,1000],'선방'],['clean',[50,100],'무실점']]){
   if(['saves','clean'].includes(stat)&&g.player.pos!=='GK')continue;
   let total=0,at=0;for(const m of matches){total+=m[stat]||0;while(at<levels.length&&total>=levels[at]){const n=levels[at++];add(stat+'-'+n,n+(stat==='clean'?'경기 ':'')+label,'소속팀 통산 '+n+(stat==='clean'?'경기 ':'')+label+'을 달성했습니다.',m,stat==='clean'?'shield':'ball');}}
  }
  const trophy=g.trophies?.[0],award=g.awards?.[0];
  add('first-title','첫 우승',trophy?.name||'',trophy,'cup');
  add('first-award','첫 개인 수상',award?.name||'',award,'cup');
  if(g.retired)add('retired','마지막 휘슬','축구 인생을 기록으로 남겼습니다.',{date:g.clock,club:E.teamName(g),clubId:g.clubId},'flag');
  return out.sort((a,b)=>(a.date??(a.year?E.tick(a.year,12):g.clock))-(b.date??(b.year?E.tick(b.year,12):g.clock)));
 }
 function capture(g,before){
  if(!g||!before||g.version!==2||identity(g)!==identity(before))return;
  const known=new Set([...milestones(before).map(m=>m.id),...(g.milestoneAcknowledged||[]),...(g.milestoneNotices||[])]);
  const newIds=milestones(g).filter(m=>!known.has(m.id)).map(m=>m.id);
  if(newIds.length)g.milestoneNotices=[...(g.milestoneNotices||[]),...newIds].slice(-40);
 }
 function dismiss(g){if(!g?.milestoneNotices?.length)return false;g.milestoneAcknowledged=[...new Set([...(g.milestoneAcknowledged||[]),...g.milestoneNotices])];g.milestoneNotices=[];return true;}
 const FORMATIONS={
  '433':{name:'4-3-3',rows:[['WG','ST','WG'],['MF','MF','MF'],['FB','CB','CB','FB'],['GK']]},
  '442':{name:'4-4-2',rows:[['ST','ST'],['WG','MF','MF','WG'],['FB','CB','CB','FB'],['GK']]},
  '343':{name:'3-4-3',rows:[['WG','ST','WG'],['FB','MF','MF','FB'],['CB','CB','CB'],['GK']]}
 };
 const slots=id=>FORMATIONS[id].rows.flatMap((row,r)=>row.map((pos,i)=>({id:r+'-'+i,pos,row:r,column:i})));
 function empty(seed=1){return {version:1,seed:seed>>>0,formation:'433',lineup:{},counter:0,results:[]};}
 function clean(state,rows){
  const s=state?copy(state):empty(),players=roster(rows),used=new Set(),lineup={};
  for(const slot of slots(s.formation)){const key=s.lineup[slot.id],p=players.find(p=>p.key===key&&p.g.player.pos===slot.pos);if(p&&!used.has(key)){lineup[slot.id]=key;used.add(key);}}
  s.lineup=lineup;return s;
 }
 function changeFormation(state,id,rows){
  if(!Object.hasOwn(FORMATIONS,id))return null;
  const s=clean(state,rows),old=Object.values(s.lineup);s.formation=id;s.lineup={};
  for(const slot of slots(id)){const i=old.findIndex(key=>rows.find(r=>r.key===key)?.g.player.pos===slot.pos);if(i>=0)s.lineup[slot.id]=old.splice(i,1)[0];}
  return s;
 }
 function assign(state,slotId,key,rows){
  const s=clean(state,rows),slot=slots(s.formation).find(t=>t.id===slotId);
  if(!slot)return null;if(!key){delete s.lineup[slotId];return s;}
  const p=roster(rows).find(p=>p.key===key&&p.g.player.pos===slot.pos);if(!p)return null;
  for(const [id,value]of Object.entries(s.lineup))if(value===key)delete s.lineup[id];s.lineup[slotId]=key;return s;
 }
 function autoSelect(state,rows){
  const s=clean(state,rows),available=roster(rows).sort((a,b)=>b.prime.ovr-a.prime.ovr||a.key.localeCompare(b.key));s.lineup={};
  for(const slot of slots(s.formation)){const i=available.findIndex(r=>r.g.player.pos===slot.pos);if(i>=0)s.lineup[slot.id]=available.splice(i,1)[0].key;}return s;
 }
 function lineup(state,rows){
  const s=clean(state,rows),players=roster(rows);
  return slots(s.formation).map((slot,i)=>{
   const r=players.find(r=>r.key===s.lineup[slot.id]);
   if(r)return {...slot,key:r.key,name:r.g.player.name,number:r.g.player.number,ovr:r.prime.ovr,details:{...r.prime.details},clubId:r.prime.clubId,club:r.prime.club,saved:true};
   const details=Object.fromEntries(keys.map(k=>[k,60]));return {...slot,key:'default-'+slot.id,name:'기본 '+E.POS[slot.pos].name,number:i+1,ovr:60,details,clubId:null,club:'클럽하우스',saved:false};
  });
 }
 const skill=(p,weights)=>Object.entries(weights).reduce((n,[id,w])=>n+p.details[id]*w,0);
 function teamStrength(players){
  const mean=ps=>ps.reduce((n,p)=>n+p.ovr,0)/ps.length;
  const attackers=players.filter(p=>['ST','WG'].includes(p.pos)),mid=players.filter(p=>p.pos==='MF'),defenders=players.filter(p=>['CB','FB'].includes(p.pos)),keeper=players.find(p=>p.pos==='GK');
  return {ovr:Math.round(mean(players)),attack:E.round(mean(attackers)*.65+mean(mid)*.25+mean(defenders)*.10),defense:E.round(mean(defenders)*.55+skill(keeper,{diving:.25,reflexes:.3,gkPosition:.25,handling:.2})*.45)};
 }
 const weighted=(rng,players,weight)=>{const values=players.map(weight),total=values.reduce((n,v)=>n+v,0);let target=E.rand(rng)*total;for(let i=0;i<players.length;i++){target-=values[i];if(target<=0)return players[i];}return players.at(-1);};
 function friendly(state,rows,opponentId){
  const s=clean(state,rows),opponent=E.clubsFor({era:'2000'}).find(c=>c.id===opponentId);if(!opponent)return null;
  const players=lineup(s,rows),strength=teamStrength(players),rng={seed:E.stableSeed([s.seed,s.counter,opponentId,...players.map(p=>p.key+':'+p.ovr)].join('|'))};
  const own=E.teamPerformance(rng,strength.attack,opponent.power,0,true),opp=E.teamPerformance(rng,opponent.power,strength.defense,0,true);
  const performance=players.map(p=>({key:p.key,name:p.name,pos:p.pos,number:p.number,ovr:p.ovr,clubId:p.clubId,saved:p.saved,minutes:90,goals:0,assists:0,saves:p.pos==='GK'?opp.onTarget-opp.goals:0,conceded:opp.goals,clean:opp.goals===0?1:0,passes:0,completed:0,keyPasses:0,dribbles:0,tackles:0,interceptions:0,shots:0,onTarget:0}));
  const byKey=key=>performance.find(p=>p.key===key),timeline=[];
  for(const shot of own.events){
   const shooter=weighted(rng,players,p=>({ST:7,WG:4,MF:2,CB:.4,FB:.6,GK:0}[p.pos])*(.3+skill(p,{finishing:.6,positioning:.4})/100)),stat=byKey(shooter.key);stat.shots++;if(shot.on)stat.onTarget++;
   if(!shot.goal)continue;stat.goals++;
   let assist=null;if(E.rand(rng)<.72){assist=weighted(rng,players.filter(p=>p.key!==shooter.key),p=>({ST:2,WG:5,MF:7,CB:1,FB:3,GK:.1}[p.pos])*(.3+skill(p,{passing:.6,vision:.4})/100));byKey(assist.key).assists++;}
   timeline.push({minute:shot.minute,side:'own',type:'goal',player:shooter.name,assist:assist?.name||null});
  }
  for(const shot of opp.events)if(shot.goal)timeline.push({minute:shot.minute,side:'opp',type:'goal',player:opponent.name,assist:null});
  for(const [i,p]of players.entries()){
   const m=performance[i];m.passes=Math.max(m.assists,Math.round(({ST:26,WG:36,MF:60,CB:40,FB:44,GK:22}[p.pos])*(.85+E.rand(rng)*.30)));m.completed=Math.max(m.assists,Math.round(m.passes*E.clamp(.45+skill(p,{passing:.75,composure:.25})/200,.45,.95)));
   m.keyPasses=Math.max(m.assists,Math.round(E.rand(rng)*skill(p,{vision:.6,passing:.4})/18*(p.pos==='MF'?1.5:1)));
   m.dribbles=p.pos==='GK'?0:Math.round(E.rand(rng)*p.details.dribbling/16*(p.pos==='WG'?1.6:.6));
   m.tackles=p.pos==='GK'?0:Math.round(E.rand(rng)*p.details.tackle/14*(['CB','FB'].includes(p.pos)?1:.4));
   m.interceptions=p.pos==='GK'?0:Math.round(E.rand(rng)*p.details.interceptions/18*(['CB','FB','MF'].includes(p.pos)?1:.3));
   m.facedOnTarget=p.pos==='GK'?opp.onTarget:0;m.rating=E.matchRating(p.pos,{...m,own:own.goals,opp:opp.goals},(E.rand(rng)-.5)*.3);
  }
  timeline.sort((a,b)=>a.minute-b.minute);
  const match={id:'friendly-'+(s.counter+1),number:s.counter+1,formation:s.formation,opponentId,opponent:opponent.name,opponentPower:opponent.power,own:own.goals,opp:opp.goals,strength,teamShots:own.shots,teamOnTarget:own.onTarget,opponentShots:opp.shots,opponentOnTarget:opp.onTarget,timeline,players:performance,mvp:[...performance].sort((a,b)=>b.rating-a.rating)[0].key};
  s.counter++;s.results=[...s.results,match].slice(-20);return {state:s,match};
 }
 function validate(state){
  if(state===null||state===undefined)return;
  const fail=()=>{throw Error('클럽하우스 기록이 올바르지 않습니다.');},text=(v,max=100)=>typeof v==='string'&&v.length<=max,number=(v,min=0,max=100000)=>Number.isFinite(v)&&v>=min&&v<=max;
  if(!state||state.version!==1||!Object.hasOwn(FORMATIONS,state.formation)||!number(state.seed,0,4294967295)||!Number.isInteger(state.counter)||!number(state.counter)||!state.lineup||Array.isArray(state.lineup)||typeof state.lineup!=='object'||!Array.isArray(state.results)||state.results.length>20)fail();
  for(const [id,key]of Object.entries(state.lineup))if(!slots(state.formation).some(s=>s.id===id)||!text(key,60))fail();
  if(new Set(Object.values(state.lineup)).size!==Object.values(state.lineup).length)fail();
  const ids=new Set();for(const r of state.results){
   if(!r||!text(r.id)||ids.has(r.id)||!Number.isInteger(r.number)||!number(r.number,1,state.counter)||!Object.hasOwn(FORMATIONS,r.formation)||!E.clubsFor({era:'2000'}).some(c=>c.id===r.opponentId)||!text(r.opponent)||!Number.isInteger(r.own)||!number(r.own,0,30)||!Number.isInteger(r.opp)||!number(r.opp,0,30)||!number(r.opponentPower,1,99)||!['teamShots','teamOnTarget','opponentShots','opponentOnTarget'].every(k=>Number.isInteger(r[k])&&number(r[k],0,100))||r.teamOnTarget>r.teamShots||r.own>r.teamOnTarget||r.opponentOnTarget>r.opponentShots||r.opp>r.opponentOnTarget||!r.strength||!['ovr','attack','defense'].every(k=>number(r.strength[k],1,99))||!Array.isArray(r.players)||r.players.length!==11||!Array.isArray(r.timeline)||r.timeline.length>60)fail();ids.add(r.id);
   for(const p of r.players)if(!text(p.key,60)||!text(p.name,80)||!positions.includes(p.pos)||!number(p.ovr,1,99)||!number(p.rating,0,10)||!['goals','assists','saves','conceded','clean','passes','completed','keyPasses','dribbles','tackles','interceptions','shots','onTarget','minutes'].every(k=>number(p[k],0,k==='minutes'?90:1000))||p.completed>p.passes||p.onTarget>p.shots||p.goals>p.onTarget||typeof p.saved!=='boolean')fail();
   for(const e of r.timeline)if(!Number.isInteger(e.minute)||!number(e.minute,1,90)||!['own','opp'].includes(e.side)||e.type!=='goal'||!text(e.player,100)||e.assist!==null&&!text(e.assist,80))fail();
   if(r.timeline.filter(e=>e.side==='own').length!==r.own||r.timeline.filter(e=>e.side==='opp').length!==r.opp||sum(r.players,'goals')!==r.own||!r.players.some(p=>p.key===r.mvp))fail();
  }
 }
 // Club crest colours are the basis for cards; no official shirt likeness is implied.
 const THEMES={"KR-anyang-lg":{"primary":"#952c31","accent":"#f3cc68"},"KR-jeonbuk":{"primary":"#207850","accent":"#f3cc68"},"KR-bucheon-sk":{"primary":"#a82d4c","accent":"#f3cc68"},"KR-suwon":{"primary":"#2358ac","accent":"#f3cc68"},"KR-busan":{"primary":"#a82d2d","accent":"#f3cc68"},"KR-jeonnam":{"primary":"#a88a2d","accent":"#f3cc68"},"KR-pohang":{"primary":"#ac2634","accent":"#f3cc68"},"KR-ulsan":{"primary":"#255996","accent":"#f3cc68"},"KR-daejeon":{"primary":"#2d6ba8","accent":"#f3cc68"},"EN-united":{"primary":"#c52431","accent":"#f3cc68"},"EN-arsenal":{"primary":"#bd2637","accent":"#f3cc68"},"EN-liverpool":{"primary":"#b51e2d","accent":"#f3cc68"},"EN-leeds":{"primary":"#a88a2d","accent":"#f3cc68"},"EN-ipswich":{"primary":"#a82d2d","accent":"#f3cc68"},"EN-chelsea":{"primary":"#254fb2","accent":"#f3cc68"},"EN-sunderland":{"primary":"#a82d2d","accent":"#f3cc68"},"EN-villa":{"primary":"#a8a82d","accent":"#f3cc68"},"EN-charlton":{"primary":"#ec1c24","accent":"#f3cc68"},"EN-southampton":{"primary":"#a82d2d","accent":"#f3cc68"},"EN-newcastle":{"primary":"#a88a2d","accent":"#f3cc68"},"EN-spurs":{"primary":"#2d6ba8","accent":"#f3cc68"},"EN-leicester":{"primary":"#2d6ba8","accent":"#f3cc68"},"EN-middlesbrough":{"primary":"#c8102e","accent":"#f3cc68"},"EN-westham":{"primary":"#a82d6b","accent":"#f3cc68"},"EN-everton":{"primary":"#2d4ca8","accent":"#f3cc68"},"EN-city":{"primary":"#478eb6","accent":"#f3cc68"},"EN-coventry":{"primary":"#a88a2d","accent":"#f3cc68"},"EN-bradford":{"primary":"#F9B021","accent":"#f3cc68"},"IT-roma":{"primary":"#a86b2d","accent":"#f3cc68"},"IT-juventus":{"primary":"#292c32","accent":"#f3cc68"},"IT-lazio":{"primary":"#a88a2d","accent":"#f3cc68"},"IT-parma":{"primary":"#a88a2d","accent":"#f3cc68"},"IT-inter":{"primary":"#234998","accent":"#f3cc68"},"IT-milan":{"primary":"#b8212c","accent":"#f3cc68"},"IT-atalanta":{"primary":"#2d6ba8","accent":"#f3cc68"},"IT-brescia":{"primary":"#cdab34","accent":"#f3cc68"},"IT-fiorentina":{"primary":"#a82d2d","accent":"#f3cc68"},"IT-bologna":{"primary":"#2d6ba8","accent":"#f3cc68"},"IT-perugia":{"primary":"#e20613","accent":"#f3cc68"},"IT-udinese":{"primary":"#a88a2d","accent":"#f3cc68"},"IT-lecce":{"primary":"#2d6ba8","accent":"#f3cc68"},"IT-reggina":{"primary":"#deb465","accent":"#f3cc68"},"IT-verona":{"primary":"#a88a2d","accent":"#f3cc68"},"IT-vicenza":{"primary":"#ff0003","accent":"#f3cc68"},"IT-napoli":{"primary":"#2d6ba8","accent":"#f3cc68"},"IT-bari":{"primary":"#ce282a","accent":"#f3cc68"},"FR-nantes":{"primary":"#a8a82d","accent":"#f3cc68"},"FR-lyon":{"primary":"#2d6ba8","accent":"#f3cc68"},"FR-lille":{"primary":"#a82d2d","accent":"#f3cc68"},"FR-bordeaux":{"primary":"#2d4ca8","accent":"#f3cc68"},"FR-sedan":{"primary":"#ba1f3b","accent":"#f3cc68"},"FR-rennes":{"primary":"#a82d2d","accent":"#f3cc68"},"FR-troyes":{"primary":"#2d6ba8","accent":"#f3cc68"},"FR-bastia":{"primary":"#2d6ba8","accent":"#f3cc68"},"FR-psg":{"primary":"#2d6ba8","accent":"#f3cc68"},"FR-guingamp":{"primary":"#a82d2d","accent":"#f3cc68"},"FR-monaco":{"primary":"#a82d2d","accent":"#f3cc68"},"FR-metz":{"primary":"#a82d2d","accent":"#f3cc68"},"FR-auxerre":{"primary":"#2d6ba8","accent":"#f3cc68"},"FR-lens":{"primary":"#a82d2d","accent":"#f3cc68"},"FR-marseille":{"primary":"#2d8aa8","accent":"#f3cc68"},"FR-toulouse":{"primary":"#4c2da8","accent":"#f3cc68"},"FR-saintetienne":{"primary":"#2da86b","accent":"#f3cc68"},"FR-strasbourg":{"primary":"#2d8aa8","accent":"#f3cc68"},"DE-bayern":{"primary":"#b82132","accent":"#f3cc68"},"DE-schalke":{"primary":"#2d6ba8","accent":"#f3cc68"},"DE-dortmund":{"primary":"#8a700b","accent":"#f3cc68"},"DE-leverkusen":{"primary":"#a82d2d","accent":"#f3cc68"},"DE-hertha":{"primary":"#2d6ba8","accent":"#f3cc68"},"DE-bremen":{"primary":"#2da84c","accent":"#f3cc68"},"DE-kaiserslautern":{"primary":"#a82d2d","accent":"#f3cc68"},"DE-wolfsburg":{"primary":"#8aa82d","accent":"#f3cc68"},"DE-koln":{"primary":"#a82d2d","accent":"#f3cc68"},"DE-rostock":{"primary":"#0080c9","accent":"#f3cc68"},"DE-hamburg":{"primary":"#2d6ba8","accent":"#f3cc68"},"DE-cottbus":{"primary":"#a82d2d","accent":"#f3cc68"},"DE-stuttgart":{"primary":"#a82d2d","accent":"#f3cc68"},"DE-unterhaching":{"primary":"#e20613","accent":"#f3cc68"},"DE-frankfurt":{"primary":"#a82d2d","accent":"#f3cc68"},"DE-bochum":{"primary":"#2d6ba8","accent":"#f3cc68"},"ES-real":{"primary":"#665b9c","accent":"#f3cc68"},"ES-deportivo":{"primary":"#2d4ca8","accent":"#f3cc68"},"ES-mallorca":{"primary":"#a8a82d","accent":"#f3cc68"},"ES-barcelona":{"primary":"#213d86","accent":"#f3cc68"},"ES-valencia":{"primary":"#a54b19","accent":"#f3cc68"},"ES-celta":{"primary":"#a82d4c","accent":"#f3cc68"},"ES-villarreal":{"primary":"#2d6ba8","accent":"#f3cc68"},"ES-malaga":{"primary":"#a88a2d","accent":"#f3cc68"},"ES-espanyol":{"primary":"#2d6ba8","accent":"#f3cc68"},"ES-alaves":{"primary":"#2d4ca8","accent":"#f3cc68"},"ES-laspalmas":{"primary":"#a8a82d","accent":"#f3cc68"},"ES-athletic":{"primary":"#a82d2d","accent":"#f3cc68"},"ES-sociedad":{"primary":"#2d2da8","accent":"#f3cc68"},"ES-rayo":{"primary":"#a88a2d","accent":"#f3cc68"},"ES-osasuna":{"primary":"#a82d2d","accent":"#f3cc68"},"ES-valladolid":{"primary":"#2da84c","accent":"#f3cc68"},"ES-zaragoza":{"primary":"#ff0010","accent":"#f3cc68"},"ES-oviedo":{"primary":"#a88a2d","accent":"#f3cc68"},"ES-racing":{"primary":"#2da82d","accent":"#f3cc68"},"ES-numancia":{"primary":"#126ccd","accent":"#f3cc68"},"MS-anyong":{"primary":"#2da88a","accent":"#f3cc68"},"MS-gwangcheol":{"primary":"#2d2da8","accent":"#f3cc68"},"MS-hanyang":{"primary":"#2d4ca8","accent":"#f3cc68"},"MS-masan":{"primary":"#2d4ca8","accent":"#f3cc68"},"MS-anyang":{"primary":"#a88a2d","accent":"#f3cc68"},"MS-poongsaeng":{"primary":"#4ca82d","accent":"#f3cc68"},"MS-iridong":{"primary":"#2d4ca8","accent":"#f3cc68"},"MS-namsuwon":{"primary":"#a8a82d","accent":"#f3cc68"},"KR-서울":{"primary":"#a82d2d","accent":"#f3cc68"},"KR-울산":{"primary":"#2d6ba8","accent":"#f3cc68"},"KR-전북":{"primary":"#2da86b","accent":"#f3cc68"},"KR-포항":{"primary":"#a82d2d","accent":"#f3cc68"},"KR-대전":{"primary":"#2d6ba8","accent":"#f3cc68"},"KR-김천":{"primary":"#2d6ba8","accent":"#f3cc68"},"KR-제주":{"primary":"#a82d4c","accent":"#f3cc68"},"EN-tottenham":{"primary":"#253353","accent":"#f3cc68"}};
 function theme(id){const parent=String(id||'').replace(/-U(?:15|18|19)$/,'');return THEMES[id]||THEMES[parent]||{primary:'#173f66',accent:'#f3cc68'};}
 function matchEvents(m){
  if(!Array.isArray(m.timeline))return [];
  return m.timeline.filter(e=>Number.isFinite(e.minute)&&e.minute>=0&&e.minute<=90).slice().sort((a,b)=>a.minute-b.minute);
 }
 function liveScore(m,minute){
  const events=matchEvents(m);if(!Array.isArray(m.timeline))return {own:minute>=90?m.own:null,opp:minute>=90?m.opp:null};
  return {own:events.filter(e=>e.type==='goal'&&e.side==='own'&&e.minute<=minute).length,opp:events.filter(e=>e.type==='goal'&&e.side==='opp'&&e.minute<=minute).length};
 }
 return {identity,prime,entries,roster,representatives,milestones,capture,dismiss,FORMATIONS,slots,empty,clean,changeFormation,assign,autoSelect,lineup,teamStrength,friendly,validate,theme,matchEvents,liveScore};
})();
