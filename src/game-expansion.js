'use strict';
const FootballExpansion=(()=>{
 const E=FootballEngine,copy=x=>JSON.parse(JSON.stringify(x)),rng=id=>({seed:E.stableSeed(String(id))});
 const NATIONS=[['KR','대한민국',72,'AS'],['JP','일본',71,'AS'],['AU','호주',73,'AS'],['IR','이란',72,'AS'],['SA','사우디아라비아',69,'AS'],['UZ','우즈베키스탄',66,'AS'],['QA','카타르',67,'AS'],['CN','중국',64,'AS'],['EN','잉글랜드',84,'EU'],['IT','이탈리아',83,'EU'],['FR','프랑스',83,'EU'],['DE','독일',84,'EU'],['ES','스페인',84,'EU'],['PT','포르투갈',80,'EU'],['NL','네덜란드',81,'EU'],['HR','크로아티아',77,'EU'],['BE','벨기에',77,'EU'],['DK','덴마크',76,'EU'],['SE','스웨덴',75,'EU'],['PL','폴란드',73,'EU'],['CH','스위스',72,'EU'],['GR','그리스',71,'EU'],['CZ','체코',78,'EU'],['TR','튀르키예',76,'EU'],['BR','브라질',86,'SA'],['AR','아르헨티나',85,'SA'],['UY','우루과이',77,'SA'],['US','미국',72,'NA'],['MX','멕시코',74,'NA'],['NG','나이지리아',74,'AF'],['SN','세네갈',72,'AF'],['CM','카메룬',73,'AF'],['MA','모로코',73,'AF'],['EG','이집트',70,'AF'],['CL','칠레',73,'SA'],['CO','콜롬비아',75,'SA']].map(([id,name,power,region])=>({id,name,power,region}));
 const ASIAN_CLUBS=[['AS-kashima','가시마 앤틀러스',72],['AS-jubilo','주빌로 이와타',73],['AS-gamba','감바 오사카',70],['AS-hilal','알 힐랄',75],['AS-ittihad','알 이티하드',73],['AS-alain','알 아인',69]].map(([id,name,power])=>({id,name,power,country:'AS'}));
 const DOMESTIC={KR:'대한민국 FA컵',EN:'FA컵',IT:'코파 이탈리아',FR:'쿠프 드 프랑스',DE:'DFB 포칼',ES:'코파 델 레이'};
 const state=g=>g.competitionState;
 function initialise(g){g.expansionVersion=1;g.competitionState={entryClock:g.clock,clubs:{},nationals:{},qualifications:{},honours:[]};g.seasonSnapshots=[];}
 function migrate(g){
  if(g.expansionVersion===1)return false;
  initialise(g);
  for(const p of g.history)if(Number.isFinite(p.endOvr))snapshot(g,p,true);
  for(const w of Object.values(g.worlds||{}))if(w.complete)qualification(g,w);
  ensureClubCups(g);
  return true;
 }
 function snapshot(g,p,historical=false){
  const season=p.matches.at(-1)?.league||String(E.date(p.end).year),key=p.country+'|'+p.stage+'|'+season;
  let s=g.seasonSnapshots.find(s=>s.key===key);
  if(!s){s={key,season,country:p.country,stage:p.stage,start:p.start,end:p.end,startOvr:p.startOvr,endOvr:p.endOvr,details:{}};g.seasonSnapshots.push(s);}
  s.end=p.end;s.endOvr=p.endOvr;
  // Old records contain an OVR, but cannot reconstruct individual attributes.
  s.details={...(p.endDetails||(!historical?g.player.details:{}))};
 }
 function seasonTrend(g){
  const rows=E.careerMatches(g),map=new Map();
  for(const m of rows){const key=m.country+'|'+m.kind+'|'+m.league;let s=map.get(key);if(!s){s={key,season:m.league,country:m.country,stage:m.kind,start:m.date,matches:[]};map.set(key,s);}s.matches.push(m);s.start=Math.min(s.start,m.date);}
  return [...map.values()].sort((a,b)=>a.start-b.start).slice(-5).map(s=>{
   const shots=s.matches.reduce((n,m)=>n+(m.facedOnTarget||0),0),snap=g.seasonSnapshots.find(x=>x.key===s.key),stats=E.aggregate(s.matches);
   const current=!['market','retired'].includes(g.phase)&&s.matches.some(m=>m.date>=g.period.start);
   return {key:s.key,season:s.season,country:s.country,stage:s.stage,start:s.start,...stats,rating:stats.apps?stats.ratingSum/stats.apps:0,ovr:current?E.overall(g.player):snap?.endOvr??null,saveRate:shots?Math.round(stats.saves/shots*1000)/10:null};
  });
 }
 function coaching(g,id=g.clubId){const c=E.club(id,g),r=rng('coach-'+id),tactic=['defense','balanced','team','attack'][E.int(r,0,3)];return {tactic,name:E.TACTICS[tactic].name,formation:{defense:'5-3-2',balanced:'4-4-2',team:'4-3-3',attack:'4-2-3-1'}[tactic],power:c?.power||48};}
 function selection(g,id=g.clubId,options={}){
  const c=coaching(g,id),r=rng('competition-'+id+'-'+g.player.pos),count={GK:2,CB:3,FB:3,MF:4,WG:3,ST:3}[g.player.pos];
  const competitors=Array.from({length:count},()=>Math.round(E.clamp(c.power+E.int(r,-12,5),30,96))).sort((a,b)=>b-a);
  const slots={GK:1,CB:c.tactic==='defense'?3:2,FB:2,MF:c.tactic==='team'?3:2,WG:c.tactic==='defense'?0:2,ST:c.tactic==='balanced'?2:1}[g.player.pos];
  const recent=E.careerMatches(g).filter(m=>m.minutes&&m.clubId===id).slice(-5),recentRating=recent.length?recent.reduce((n,m)=>n+m.rating,0)/recent.length:6.4;
  const fit=c.tactic===g.player.tactic?92:c.tactic==='balanced'||g.player.tactic==='balanced'?75:(c.tactic==='defense'&&g.player.tactic==='attack'||c.tactic==='attack'&&g.player.tactic==='defense')?45:65;
  const competitor=competitors[Math.max(0,slots-1)]||competitors[0],bonus=E.clamp((E.overall(g.player)-competitor)*.01+(fit-75)*.002+(recentRating-6.4)*.04-(slots===0?.12:0),-.20,.18);
  const role=options.role||g.period?.role||E.roleFor(g,id),trust=options.trust??g.trust;
  let chance=E.clamp(.67+(E.effective(g)-c.power)*.027+(trust-60)*.006-(g.fitness<60?(60-g.fitness)*.01:0)+(FootballCareerData.ROLES[role]?.chance||0)+bonus,.08,.98);
  let reason=slots===0?'현재 전술에 같은 역할의 자리가 적습니다.':E.overall(g.player)<competitor?'같은 포지션의 경쟁 선수보다 기량을 더 보여줘야 합니다.':fit<60?'감독의 전술과 선수의 성향이 다릅니다.':g.fitness<60?'체력이 떨어져 출전 부담을 줄이고 있습니다.':recent.length&&recentRating<6.2?'최근 경기력이 선발 경쟁에 영향을 줍니다.':'기량과 전술 적합도를 바탕으로 주전 경쟁을 하고 있습니다.';
  if(!options.prospective&&E.injuryAt(g)){chance=0;reason='부상이 회복될 때까지 출전할 수 없습니다.';}
  else if(!options.prospective&&g.health?.suspension>0){chance=0;reason='징계로 다음 경기에 출전할 수 없습니다.';}
  return {...c,fit,competitors,competitor,slots,bonus,chance,recentRating:E.round(recentRating),reason};
 }
 function offerComparison(g,o){
  const id=o.clubId||g.clubId,country=o.country||E.club(id,g)?.country||g.country,role=o.roleId||E.roleFor(g,id);
  const s=selection(g,id,{role,trust:id===g.clubId?g.trust:55,prospective:true}),env=E.environment(g,id);
  const count=o.kind==='loan'&&o.borrowStage==='semipro'?10:o.kind==='loan'&&o.borrowStage==='university'?10:country==='KR'?27:38;
  return {id,role:FootballCareerData.ROLES[role].name,minutes:Math.round((s.chance*76+(1-s.chance)*(g.player.pos==='GK'?1:15))*count),fit:s.fit,tactic:s.name,competition:s.competitor,facility:env.facilities,bonus:env.bonus,wage:o.wage??g.wage,months:o.months??g.contract,reason:s.reason};
 }
 function injuryMultiplier(g,day=E.dayAt(g.clock)){const h=E.health(g);return h.rushUntil>day?2.2:h.safeUntil>day?.65:1;}
 function recoveryPenalty(g){return E.health(g).rushUntil>E.dayAt(g.clock)?-5:0;}
 function maybeRehab(g){const i=E.injuryAt(g);if(g.phase!=='ready'||!i||i.rehabChoice)return false;g.pendingRehab=E.health(g).injuries.indexOf(i);g.phase='rehab';return true;}
 function rehabOptions(g){const i=E.health(g).injuries[g.pendingRehab],remaining=i?Math.max(1,i.until-E.dayAt(g.clock)):0;return [{id:'safe',name:'충분한 재활',days:Math.ceil(remaining*1.2),desc:'회복 후 2주 동안 재부상 위험이 낮아집니다.'},{id:'normal',name:'예정대로 복귀',days:remaining,desc:'기존 회복 일정에 맞춰 몸 상태를 회복합니다.'},{id:'early',name:'빠른 복귀',days:Math.min(remaining,Math.max(1,Math.ceil(remaining*.65))),desc:'복귀가 빨라지지만 회복 기간 중 경기력과 재부상 위험에 불리합니다.'}];}
 function chooseRehab(g,id){if(g.phase!=='rehab')return false;const i=E.health(g).injuries[g.pendingRehab],o=rehabOptions(g).find(o=>o.id===id);if(!i||i.rehabChoice||!o)return false;i.originalUntil=i.until;i.rehabChoice=id;i.until=E.dayAt(g.clock)+o.days;i.days=i.until-i.start;if(id==='early')E.health(g).rushUntil=i.originalUntil+7;if(id==='safe')E.health(g).safeUntil=i.until+14;g.period.events.push(i.name+' · '+o.name+' · '+o.days+'일 뒤 복귀 예정');delete g.pendingRehab;g.phase='ready';return true;}
 function momentOptions(g,shootout=false){if(shootout)return g.player.pos==='GK'?[{id:'pen-read',name:'끝까지 방향 읽기',keys:['reflexes','gkPosition','composure']},{id:'pen-dive',name:'과감하게 먼저 움직이기',keys:['diving','reflexes','composure']}]:[{id:'pen-place',name:'구석으로 정확하게 차기',keys:['finishing','composure','passing']},{id:'pen-power',name:'강하게 밀어 넣기',keys:['finishing','strength','composure']}];return ({GK:[['catch','안정적으로 잡기',['handling','gkPosition','composure']],['punch','적극적으로 쳐내기',['diving','reflexes','strength']]],CB:[['hold','위치 지키기',['marking','interceptions','composure']],['press','앞으로 나가 압박하기',['tackle','reactions','strength']]],FB:[['hold','수비 위치 지키기',['marking','interceptions','composure']],['press','적극적으로 압박하기',['tackle','speed','stamina']]],MF:[['pass','동료에게 기회 만들기',['passing','vision','composure']],['shoot','직접 마무리하기',['finishing','positioning','composure']]],WG:[['pass','동료에게 연결하기',['passing','vision','dribbling']],['shoot','안으로 들어가 슈팅',['finishing','agility','composure']]],ST:[['shoot','직접 슈팅하기',['finishing','positioning','composure']],['pass','동료에게 연결하기',['passing','vision','composure']]]}[g.player.pos]).map(([id,name,keys])=>({id,name,keys}));}
 function chooseMoment(g,id,opponentPower,shootout=false){if(id==='auto')return null;const o=momentOptions(g,shootout).find(o=>o.id===id);if(!o)return undefined;const value=o.keys.reduce((n,k)=>n+g.player.details[k],0)/o.keys.length,chance=E.clamp(.48+(value-opponentPower)*.007+(g.fitness-80)*.002,.15,.88);return {id,name:o.name,keys:o.keys,chance,success:E.rand(g)<chance};}
 function skillAdjustment(g,weights){const m=g.activeMatchChoice;if(!m)return 0;const supported=Object.keys(weights).some(k=>m.keys.includes(k));return supported?(m.success?7:-5):0;}
 function qualification(g,w){if(!w.complete||w.kind!=='pro')return;const key=w.country+'-'+w.year;if(!state(g).qualifications[key])state(g).qualifications[key]=E.sortTable(w).map(t=>t.id);}
 function rankedClubs(g,country,year){const pool=E.clubsFor(g).filter(c=>c.country===country),ranking=state(g).qualifications[country+'-'+(year-1)]||[...pool].sort((a,b)=>b.power-a.power).map(c=>c.id);return ranking.map(id=>pool.find(c=>c.id===id)).filter(Boolean);}
 function roundRobin(ids){return [[[ids[0],ids[3]],[ids[1],ids[2]]],[[ids[0],ids[2]],[ids[3],ids[1]]],[[ids[0],ids[1]],[ids[2],ids[3]]]];}
 function makeTournament(g,id,name,teams,dates,grouped=false,meta={}){const r=rng(g.id+'-'+id),draw=E.shuffle(r,teams.map(t=>t.id)),c={id,name,teams:copy(teams),dates,grouped,rounds:[],table:teams.map(t=>({...t,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0})),complete:false,created:g.clock,playerClubs:[],...meta};if(grouped){for(let n=0;n<draw.length;n+=4){const group=draw.slice(n,n+4);group.forEach(id=>c.table.find(t=>t.id===id).group=n/4);roundRobin(group).forEach((rows,index)=>{const stage=c.rounds[index]||(c.rounds[index]={name:'조별리그 '+(index+1)+'차전',stage:'group',t:dates[index],matches:[]});stage.matches.push(...rows.map(([h,a])=>({h,a,done:false})));});}}else{const size=2**Math.ceil(Math.log2(draw.length));while(draw.length<size)draw.push(null);c.rounds=[{name:E.roundName(size),stage:'knockout',t:dates[0],matches:Array.from({length:size/2},(_,i)=>({h:draw[i],a:draw[size-1-i],done:false}))}];}return c;}
 function finishRound(g,c){const last=c.rounds.at(-1);if(c.complete||!last.matches.every(f=>f.done))return;let ids;if(last.stage==='group'){if(c.rounds.length<3||c.rounds.some(s=>!s.matches.every(f=>f.done)))return;ids=[];for(let k=0;k<c.teams.length/4;k++)ids.push(...E.sortTable({table:c.table.filter(t=>t.group===k)}).slice(0,2).map(t=>t.id));if(c.qualifier){c.complete=true;c.qualified=ids.includes(c.country);c.winner=ids[0];return;}}else ids=last.matches.map(f=>f.winner).filter(Boolean);if(ids.length===1){c.complete=true;c.winner=ids[0];return;}if(ids.length>1){const index=c.rounds.length;c.rounds.push({name:E.roundName(ids.length),stage:'knockout',t:c.dates[Math.min(index,c.dates.length-1)],matches:Array.from({length:ids.length/2},(_,i)=>({h:ids[i],a:ids[ids.length-1-i],done:false}))});}}
 function teamScore(g,a,b){return E.teamGoals(g,a.power,b.power);}
 function setResult(g,c,s,f,x,y){Object.assign(f,{done:true,x,y});const a=c.table.find(t=>t.id===f.h),b=c.table.find(t=>t.id===f.a);if(a&&b){a.p++;b.p++;a.gf+=x;a.ga+=y;b.gf+=y;b.ga+=x;if(x>y){a.w++;a.pts+=3;b.l++;}else if(y>x){b.w++;b.pts+=3;a.l++;}else{a.d++;b.d++;a.pts++;b.pts++;}}if(s.stage==='knockout'&&!f.pendingShootout)f.winner=x>y?f.h:y>x?f.a:null;}
 function penalties(g,c,f,choice=null){
  const ht=c.teams.find(t=>t.id===f.h),at=c.teams.find(t=>t.id===f.a),ownHome=f.h===(c.national?c.country:g.clubId);
  const hp=E.clamp(.69+(ht.power-70)*.002,.55,.85),ap=E.clamp(.69+(at.power-70)*.002,.55,.85);
  let h=0,a=0;
  for(let i=0;i<5;i++){
   let hc=hp,ac=ap;
   if(i===0&&choice){const delta=choice.success?.18:-.12;if(g.player.pos==='GK'){if(ownHome)ac-=delta;else hc-=delta;}else if(ownHome)hc+=delta;else ac+=delta;}
   h+=E.rand(g)<E.clamp(hc,.15,.95)?1:0;a+=E.rand(g)<E.clamp(ac,.15,.95)?1:0;
  }
  for(let i=0;h===a&&i<20;i++){h+=E.rand(g)<hp?1:0;a+=E.rand(g)<ap?1:0;}
  if(h===a){if(E.rand(g)<.5)h++;else a++;}
  f.penH=h;f.penA=a;f.winner=h>a?f.h:f.a;delete f.pendingShootout;
 }
 function autoFixture(g,c,s,f){if(!f.h||!f.a){Object.assign(f,{done:true,x:0,y:0,winner:f.h||f.a});return;}const a=c.teams.find(t=>t.id===f.h),b=c.teams.find(t=>t.id===f.a);setResult(g,c,s,f,teamScore(g,a,b),teamScore(g,b,a));if(s.stage==='knockout'&&f.x===f.y)penalties(g,c,f);}
 function honour(g,c){if(!c.complete||c.recorded||c.qualifier)return;c.recorded=true;const winner=c.teams.find(t=>t.id===c.winner);state(g).honours.push({id:c.id,name:c.name,year:c.year,winner:winner?.name||'',national:!!c.national});const contributed=c.national?g.national.some(m=>m.competitionId===c.id&&m.minutes):E.careerMatches(g).some(m=>m.competitionId===c.id&&m.clubId===c.winner&&m.minutes);if(contributed&&(c.national?c.winner===c.country:true)){g.trophies.push({year:c.year,name:c.name+' 우승',club:winner.name});g.reputation+=c.national?8:5;g.period.events.push(c.name+' 우승!');}}
 function ensureClubCups(g){if(g.stage!=='pro'||g.retired)return [];const d=E.date(g.clock),year=g.country==='KR'?d.year:d.month>=7?d.year:d.year-1;if(year<g.startYear)return[];const cups=state(g).clubs,id='DOM-'+g.country+'-'+year;if(!cups[id]){const dates=g.country==='KR'?[E.tick(year,4),E.tick(year,6),E.tick(year,8),E.tick(year,10),E.tick(year,11)]:[E.tick(year,9),E.tick(year,11),E.tick(year+1,1),E.tick(year+1,3),E.tick(year+1,5)];cups[id]=makeTournament(g,id,DOMESTIC[g.country],E.clubsFor(g).filter(c=>c.country===g.country),dates,false,{year,country:g.country,type:'domestic'});}const region=g.country==='KR'?'AS':'EU',cid=region+'-'+year;if(!cups[cid]){let pool=region==='AS'?[...rankedClubs(g,'KR',year).slice(0,2),...ASIAN_CLUBS]:Object.entries({EN:4,IT:4,ES:4,DE:2,FR:2}).flatMap(([country,n])=>rankedClubs(g,country,year).slice(0,n));const dates=region==='AS'?[E.tick(year,3),E.tick(year,4),E.tick(year,5),E.tick(year,8),E.tick(year,10)]:[E.tick(year,9),E.tick(year,10),E.tick(year,11),E.tick(year+1,2),E.tick(year+1,3),E.tick(year+1,5)];cups[cid]=makeTournament(g,cid,region==='EU'?'UEFA 챔피언스리그':year<2003?'아시안 클럽 챔피언십':'AFC 챔피언스리그',pool,dates,true,{year,country:region,type:'continental',qualification:pool.some(c=>c.id===g.clubId)?'출전권 확보':'출전권 없음'});}return Object.values(cups).filter(c=>!c.complete||c.year===year);}
 function ensureYouthCups(g){
  const season=E.youthSeason(g),store=state(g).clubs;
  for(const source of season.cups)if(!source.complete&&!store[source.id]){
   const c={...copy(source),type:'youth',youth:true,grouped:false,dates:Array(5).fill(source.time),created:g.clock,playerClubs:[],table:source.teams.map(t=>({...t,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}))};
   c.rounds=c.rounds.map(r=>({...r,stage:'knockout',t:source.time,matches:r.matches.map(f=>({...f,done:!!f.done}))}));store[c.id]=c;
  }
  return season.cups.map(c=>store[c.id]).filter(Boolean);
 }
 function syncYouthCup(g,c){
  if(!c.youth)return;
  const source=Object.values(g.youthCups||{}).flatMap(s=>s.cups).find(s=>s.id===c.id);if(!source)return;
  source.rounds=copy(c.rounds);source.complete=c.complete;if(c.winner)source.winner=c.winner;
  if(!c.complete||c.playerRecord)return;
  const played=E.careerMatches(g).filter(m=>m.competitionId===c.id);if(!played.length)return;
  const last=played.at(-1),clubId=last.clubId;
  source.playerClub=clubId;source.playerResult=c.winner===clubId?'우승':last.round==='결승'?'준우승':last.round;
  (g.period.cups||(g.period.cups=[])).push({...copy(source),club:last.club,result:source.playerResult});
  g.period.events.push(c.name+' · '+source.playerResult);c.playerRecord=true;
 }
 function processYouthCups(g){
  if(g.phase!=='ready'||!E.usesYouthCups(g))return false;
  for(const c of ensureYouthCups(g)){
   let guard=0;while(!c.complete&&guard++<10){
    const r=c.rounds.find(r=>r.matches.some(f=>!f.done));if(!r||r.t>g.clock)break;
    for(let fi=0;fi<r.matches.length;fi++){
     const f=r.matches[fi];if(f.done)continue;
     const involved=r.t===g.clock&&r.t>=state(g).entryClock&&r.t>=g.youthKnockoutFrom&&[f.h,f.a].includes(g.clubId);
     if(involved){
      if(!c.playerClubs.includes(g.clubId))c.playerClubs.push(g.clubId);
      g.cupMatch={cupId:c.id,round:c.rounds.indexOf(r),fixture:fi,stage:'preview'};g.phase='cup';syncYouthCup(g,c);
      if(r.name==='4강'||r.name==='결승')return true;
      playCup(g,'auto');if(g.cupMatch.stage==='shootout')return true;continueCup(g);
     }else autoFixture(g,c,r,f);
    }
    finishRound(g,c);honour(g,c);syncYouthCup(g,c);
   }
  }
  return false;
 }
 function processClubCups(g){if(E.usesYouthCups(g))return processYouthCups(g);if(g.phase!=='ready'||g.stage!=='pro')return false;ensureClubCups(g);for(const c of Object.values(state(g).clubs)){let guard=0;while(!c.complete&&guard++<20){const s=c.rounds.find(s=>s.matches.some(f=>!f.done));if(!s){finishRound(g,c);continue;}if(s.t>g.clock)break;for(let i=0;i<s.matches.length;i++){const f=s.matches[i];if(f.done)continue;if(f.h&&f.a&&s.t===g.clock&&s.t>=state(g).entryClock&&[f.h,f.a].includes(g.clubId)){if(!c.playerClubs.includes(g.clubId))c.playerClubs.push(g.clubId);g.cupMatch={cupId:c.id,round:c.rounds.indexOf(s),fixture:i,stage:'preview'};g.phase='cup';return true;}autoFixture(g,c,s,f);}finishRound(g,c);}honour(g,c);}return false;}
 function cupContext(g){const p=g.cupMatch,c=p&&state(g).clubs[p.cupId],s=c?.rounds[p.round],f=s?.matches[p.fixture];if(!f)return null;const home=f.h===g.clubId,opponent=c.teams.find(t=>t.id===(home?f.a:f.h));return {pending:p,cup:c,round:s,fixture:f,opponent,home,important:s.name==='결승'||s.name==='4강'||p.stage==='shootout'};}
 function playCup(g,id='auto'){
  if(g.phase!=='cup')return false;
  const ctx=cupContext(g);if(!ctx||ctx.pending.stage==='result')return false;
  const {pending:p,cup:c,round:s,fixture:f,opponent:o,home}=ctx,shootout=p.stage==='shootout';
  const existing=g.period.matches.find(m=>m.fixtureId===c.id+'-'+p.round+'-'+f.h+'-'+f.a);
  if(shootout&&(!existing||!existing.minutes&&id!=='auto'))return false;
  const choice=chooseMoment(g,id,o.power,shootout);if(choice===undefined)return false;
  if(shootout){
   penalties(g,c,f,choice);existing.shootout={own:home?f.penH:f.penA,opp:home?f.penA:f.penH};existing.won=f.winner===g.clubId;existing.penaltyChoice=choice;
   p.stage='result';finishRound(g,c);honour(g,c);syncYouthCup(g,c);return existing;
  }
  const scheduled=c.youth?E.fixtureDay(g,{t:s.t,month:c.month,day:c.day+p.round*2}):E.dayAt(s.t)+13,day=Math.max(scheduled,(E.health(g).lastMatchDay??-Infinity)+2);
  g.activeMatchChoice=choice;let frame;
  try{frame=E.simulateAppearance(g,E.club(g.clubId,g).power,o.power,day,home,true);}finally{delete g.activeMatchChoice;}
  if(choice)choice.applied=frame.minutes>0;
  const x=home?frame.own:frame.opp,y=home?frame.opp:frame.own;
  if(s.stage==='knockout'&&x===y)f.pendingShootout=true;
  setResult(g,c,s,f,x,y);
  const w={id:c.id,country:g.country,year:c.year,kind:c.youth?c.kind:'pro',teams:c.teams},m=E.recordMatch(g,w,{...f,r:p.round},x,y,frame),d=new Date(day*86400000);
  Object.assign(m,{competitionId:c.id,competition:c.name,round:s.name,groupStage:s.stage==='group',cupMonth:d.getUTCMonth()+1,cupDay:d.getUTCDate(),won:frame.own>frame.opp,moment:choice});
  p.stage=f.pendingShootout?'shootout':'result';if(!f.pendingShootout){finishRound(g,c);honour(g,c);}syncYouthCup(g,c);return m;
 }
 function continueCup(g){if(g.phase!=='cup'||g.cupMatch?.stage!=='result')return false;g.cupMatch=null;g.phase='ready';return true;}
 function nationalDefinitions(year){const defs=[];if((year-2002)%4===0)defs.push({kind:'world',name:'FIFA 월드컵',level:'senior',month:6,region:null});if(year%4===0){defs.push({kind:'euro',name:'UEFA 유로',level:'senior',month:6,region:'EU'},{kind:'olympic',name:'올림픽 축구',level:'U23',month:7,region:null});}if(year<=2004?year%4===0:(year-2007)%4===0)defs.push({kind:'asian',name:'AFC 아시안컵',level:'senior',month:1,region:'AS'});if(year%2===1)defs.push({kind:'u17',name:'FIFA U17 월드컵',level:'U17',month:7,region:null},{kind:'u20',name:'FIFA U20 월드컵',level:'U20',month:7,region:null});return defs;}
 function nationalEligible(g,def){const own=NATIONS.find(t=>t.id===g.internationalCareer.representing);return !!own&&(!def.region||own.region===def.region)&&(def.level==='U17'?g.age<=17:def.level==='U20'?g.age>=18&&g.age<=20:def.level==='U23'?g.age<=23||E.overall(g.player)>=E.NATIONAL_TEAMS[own.id].senior+7:g.age>=18);}
 function nationalTournament(g,def,qualifier=false){const country=g.internationalCareer.representing,id='N-'+country+'-'+def.year+'-'+def.kind+(qualifier?'-Q':''),store=state(g).nationals;if(store[id])return store[id];const own=NATIONS.find(t=>t.id===country),pool=NATIONS.filter(t=>t.id!==country&&(!def.region||t.region===def.region)),r=rng(id),size=qualifier?4:def.region==='AS'?8:16,teams=[own,...E.shuffle(r,pool).slice(0,size-1)],offset=E.NATIONAL_LEVELS[def.level].offset;const dates=qualifier?[E.tick(def.year-1,9,1),E.tick(def.year-1,10,1),E.tick(def.year-1,11,1)]:Array.from({length:6},()=>E.tick(def.year,def.month,1));store[id]=makeTournament(g,id,def.name+(qualifier?' 예선':''),teams.map(t=>({...t,power:t.power+offset})),dates,true,{year:def.year,country,national:true,qualifier,level:def.level,kind:def.kind,wildcard:def.level==='U23'&&g.age>23});return store[id];}
 function dueNational(g){
  const d=E.date(g.clock),defs=[...nationalDefinitions(d.year).map(def=>({...def,year:d.year,qualifier:false})),...nationalDefinitions(d.year+1).map(def=>({...def,year:d.year+1,qualifier:true}))];
  return defs.filter(def=>nationalEligible(g,def)&&(def.qualifier?[9,10,11].includes(d.month):d.month===def.month)&&d.half===1);
 }
 function isNationalWindow(t){const d=E.date(t);return d.half===1&&nationalDefinitions(d.year).some(def=>def.month===d.month);}
 function pastNationalRounds(g,c){
  let guard=0;while(!c.complete&&guard++<10){const s=c.rounds.find(s=>s.matches.some(f=>!f.done));if(!s||s.t>=g.clock)break;s.matches.forEach(f=>{if(!f.done)autoFixture(g,c,s,f);});finishRound(g,c);}honour(g,c);
 }
 function maybeNationalCamp(g){
  if(g.phase!=='ready'||g.retired)return false;
  // Missed windows progress the team without inventing player appearances.
  for(const c of Object.values(state(g).nationals)){pastNationalRounds(g,c);if(!c.complete&&c.country!==g.internationalCareer.representing)autoNationalWindow(g,c,g.clock);}
  for(const def of dueNational(g)){
   const c=nationalTournament(g,def,def.qualifier);pastNationalRounds(g,c);if(c.complete)continue;
   if(!def.qualifier){
    const q=nationalTournament(g,def,true);let guard=0;
    while(!q.complete&&guard++<10){const s=q.rounds.find(s=>s.matches.some(f=>!f.done));if(!s){finishRound(g,q);continue;}s.matches.forEach(f=>{if(!f.done)autoFixture(g,q,s,f);});finishRound(g,q);}
    const hosting=def.kind==='world'&&def.year===2002&&c.country==='KR';
    if(!q.qualified&&!hosting){c.complete=true;c.eliminated=true;c.recorded=true;g.period.events.push(def.name+' · 예선 탈락');continue;}
   }
   const s=c.rounds.find(s=>s.t===g.clock&&s.matches.some(f=>!f.done&&[f.h,f.a].includes(c.country)));if(!s)continue;
   const min=E.NATIONAL_TEAMS[c.country].senior+E.NATIONAL_LEVELS[c.level].selection;
   if(g.stage==='service'||E.injuryAt(g)||!E.canRepresent(g,c.country)||E.overall(g.player)<min){autoNationalWindow(g,c,g.clock);continue;}
   const refs=[];
   for(let ri=0;ri<c.rounds.length;ri++){const rs=c.rounds[ri];if(rs.t!==g.clock)continue;for(let fi=0;fi<rs.matches.length;fi++)if(!rs.matches[fi].done&&[rs.matches[fi].h,rs.matches[fi].a].includes(c.country))refs.push([ri,fi]);}
   const opponents=refs.map(([ri,fi])=>{const f=c.rounds[ri].matches[fi];return c.teams.find(t=>t.id===(f.h===c.country?f.a:f.h)).name;});
   g.camp={date:g.clock,country:c.country,level:c.level,matchType:'official',competition:c.name,seriesId:c.id,fixtureRefs:refs,opponents,matches:[],accepted:false,complete:false,wildcard:c.wildcard};
   g.internationalCareer.lastWindow=g.clock;g.phase='callup';return true;
  }
  return false;
 }
 function autoNationalWindow(g,c,to){let guard=0;while(!c.complete&&guard++<12){const s=c.rounds.find(s=>s.matches.some(f=>!f.done));if(!s){finishRound(g,c);continue;}if(s.t>to)break;s.matches.forEach(f=>{if(!f.done)autoFixture(g,c,s,f);});finishRound(g,c);}honour(g,c);}
 function declinedNational(g,camp){if(camp.seriesId)autoNationalWindow(g,state(g).nationals[camp.seriesId],g.clock);}
 function nationalContext(g){
  const camp=g.camp,c=camp?.seriesId&&state(g).nationals[camp.seriesId],ref=camp?.pendingShootout||camp?.fixtureRefs?.[camp.matches.length];
  const s=ref&&c?.rounds[ref[0]],f=s?.matches[ref[1]];if(!f)return null;
  return {cup:c,round:s,fixture:f,ref,opponent:c.teams.find(t=>t.id===(f.h===c.country?f.a:f.h)),shootout:!!camp.pendingShootout,important:!!camp.pendingShootout||s.name==='결승'||s.name==='4강'};
 }
 function finishNationalMatch(g,c,s){
  const camp=g.camp;
  for(const other of s.matches)if(!other.done)autoFixture(g,c,s,other);
  finishRound(g,c);
  if(camp.matches.length===camp.opponents.length&&!c.complete){
   const next=c.rounds.find(rs=>rs.t===g.clock&&rs.matches.some(x=>!x.done&&[x.h,x.a].includes(c.country)));
   if(next){const ri=c.rounds.indexOf(next),fi=next.matches.findIndex(x=>!x.done&&[x.h,x.a].includes(c.country)),f=next.matches[fi];camp.fixtureRefs.push([ri,fi]);camp.opponents.push(c.teams.find(t=>t.id===(f.h===c.country?f.a:f.h)).name);}
   else if(!c.qualifier){autoNationalWindow(g,c,g.clock);c.eliminated=c.winner!==c.country;}
  }
  camp.complete=!camp.pendingShootout&&camp.matches.length===camp.opponents.length;honour(g,c);
 }
 function playNational(g,id='auto'){
  const ctx=nationalContext(g);if(!ctx||g.phase!=='international'||g.camp.complete)return false;
  const {cup:c,round:s,fixture:f,opponent:o,ref,shootout}=ctx,camp=g.camp,home=f.h===c.country;
  if(shootout&&!camp.matches.at(-1)?.minutes&&id!=='auto')return false;
  const choice=chooseMoment(g,id,o.power,shootout);if(choice===undefined)return false;
  if(shootout){
   penalties(g,c,f,choice);const m=camp.matches.at(-1);m.shootout={own:home?f.penH:f.penA,opp:home?f.penA:f.penH};m.won=f.winner===c.country;m.penaltyChoice=choice;
   const record=g.national.find(n=>n.fixtureId===m.fixtureId);if(record&&record!==m)Object.assign(record,{shootout:copy(m.shootout),won:m.won,penaltyChoice:choice});
   delete camp.pendingShootout;finishNationalMatch(g,c,s);return m;
  }
  const day=Math.max(E.dayAt(camp.date)+camp.matches.length*2,(E.health(g).lastMatchDay??-Infinity)+2);
  g.activeMatchChoice=choice;let frame;try{frame=E.simulateAppearance(g,c.teams.find(t=>t.id===c.country).power,o.power,day,home,true,true);}finally{delete g.activeMatchChoice;}
  if(choice)choice.applied=frame.minutes>0;
  if(s.stage==='knockout'&&frame.own===frame.opp)f.pendingShootout=true;
  setResult(g,c,s,f,home?frame.own:frame.opp,home?frame.opp:frame.own);
  const m={...frame,fixtureId:c.id+'-'+ref[0]+'-'+f.h+'-'+f.a,date:camp.date,opponent:o.name,nationalCountry:c.country,teamLevel:c.level,matchType:'official',isAMatch:c.level==='senior',competition:c.name,competitionId:c.id,round:s.name,groupStage:s.stage==='group',moment:choice,wildcard:camp.wildcard};
  camp.matches.push(m);
  if(m.minutes){g.national.push(m);E.matchDevelopment(g,m,true);g.fitness=E.clamp(g.fitness-9*m.minutes/90,15,100);E.health(g).lastMatchDay=m.matchDay;g.reputation+=c.level==='senior'?1:.5;}
  if(f.pendingShootout){camp.pendingShootout=ref;camp.complete=false;}else finishNationalMatch(g,c,s);
  return m;
 }
 function validate(g){
  const st=state(g),integer=Number.isInteger;
  if(g.expansionVersion!==1||!st||!integer(st.entryClock)||st.entryClock>g.clock||!Array.isArray(st.honours)||st.honours.length>800||!st.qualifications||typeof st.qualifications!=='object'||!Array.isArray(g.seasonSnapshots)||g.seasonSnapshots.length>300)throw Error('Invalid competition state');
  for(const x of g.seasonSnapshots)if(typeof x.key!=='string'||!E.LEAGUES[x.country]||!integer(x.start)||!integer(x.end)||x.end<x.start||!Number.isFinite(x.endOvr)||x.endOvr<0||x.endOvr>99||!x.details||Object.values(x.details).some(v=>!Number.isFinite(v)||v<0||v>99))throw Error('Invalid season snapshot');
  for(const ids of Object.values(st.qualifications))if(!Array.isArray(ids)||ids.length>40||ids.some(id=>typeof id!=='string')||new Set(ids).size!==ids.length)throw Error('Invalid qualification');
  for(const name of ['clubs','nationals']){
   if(!st[name]||typeof st[name]!=='object'||Array.isArray(st[name]))throw Error('Invalid tournaments');
   const list=Object.entries(st[name]);if(list.length>400)throw Error('Too many tournaments');
   for(const [key,c] of list){
    if(c.id!==key||typeof c.name!=='string'||!Array.isArray(c.teams)||c.teams.length<4||c.teams.length>40||!Array.isArray(c.rounds)||!c.rounds.length||c.rounds.length>10||!Array.isArray(c.table)||c.table.length!==c.teams.length||typeof c.complete!=='boolean'||!Array.isArray(c.dates)||c.dates.some(t=>!integer(t))||!Array.isArray(c.playerClubs))throw Error('Invalid tournament');
    const ids=c.teams.map(t=>t.id);if(new Set(ids).size!==ids.length||c.teams.some(t=>typeof t.id!=='string'||typeof t.name!=='string'||!Number.isFinite(t.power)||t.power<10||t.power>100)||c.table.some(t=>!ids.includes(t.id)))throw Error('Invalid team');
    if(c.national&&(!E.NATIONAL_TEAMS[c.country]||!E.NATIONAL_LEVELS[c.level]))throw Error('Invalid national cup');
    for(const s of c.rounds){
     if(!integer(s.t)||!['group','knockout'].includes(s.stage)||typeof s.name!=='string'||!Array.isArray(s.matches)||!s.matches.length||s.matches.length>40)throw Error('Invalid round');
     for(const f of s.matches){
      if(typeof f.done!=='boolean'||f.h!==null&&!ids.includes(f.h)||f.a!==null&&!ids.includes(f.a)||f.h&&f.h===f.a||f.done&&(!integer(f.x)||!integer(f.y)||f.x<0||f.y<0||f.x>30||f.y>30)||f.winner!==undefined&&f.winner!==null&&![f.h,f.a].includes(f.winner))throw Error('Invalid fixture');
      if(f.penH!==undefined&&(!integer(f.penH)||!integer(f.penA)||f.penH<0||f.penA<0||f.penH===f.penA))throw Error('Invalid penalties');
     }
    }
   }
  }
  if(g.phase==='cup'){
   const x=cupContext(g),p=g.cupMatch;if(!x||!x.opponent||![x.fixture.h,x.fixture.a].includes(g.clubId)||!['preview','shootout','result'].includes(p.stage)||p.stage==='preview'&&x.fixture.done||p.stage==='shootout'&&!x.fixture.pendingShootout||p.stage==='result'&&(!x.fixture.done||x.fixture.pendingShootout))throw Error('Invalid cup choice');
   if(p.stage!=='preview'&&!g.period.matches.some(m=>m.fixtureId===x.cup.id+'-'+p.round+'-'+x.fixture.h+'-'+x.fixture.a))throw Error('Missing cup result');
  }
  if(g.phase==='rehab'&&(!integer(g.pendingRehab)||!E.health(g).injuries[g.pendingRehab]||E.health(g).injuries[g.pendingRehab].rehabChoice))throw Error('Invalid rehab choice');
  if(g.camp?.seriesId){
   const c=st.nationals[g.camp.seriesId],refs=g.camp.fixtureRefs;
   if(!c||!Array.isArray(refs)||refs.length!==g.camp.opponents.length||refs.some(ref=>!Array.isArray(ref)||ref.length!==2||ref.some(i=>!integer(i)||i<0)||!c.rounds[ref[0]]?.matches[ref[1]]||![c.rounds[ref[0]].matches[ref[1]].h,c.rounds[ref[0]].matches[ref[1]].a].includes(c.country)))throw Error('Invalid national tournament');
   if(g.camp.pendingShootout&&(!nationalContext(g)?.fixture.pendingShootout||!g.camp.matches.length))throw Error('Invalid national penalties');
  }
  return true;
 }
 const api={coaching,selection,offerComparison,seasonTrend,rehabOptions,chooseRehab,momentOptions,cupContext,playCup,continueCup,nationalContext,playNational,ensureClubCups,nationalDefinitions,nationalTournament};Object.assign(E,api);
 return {initialise,migrate,snapshot,qualification,selection,injuryMultiplier,recoveryPenalty,skillAdjustment,maybeRehab,processClubCups,maybeNationalCamp,declinedNational,isNationalWindow,validate,...api};
})();
