'use strict';
const FootballNational=(()=>{
 const E=FootballEngine;
 const TEAMS={KR:{name:'대한민국',flag:'🇰🇷',power:72,senior:69},EN:{name:'잉글랜드',nationality:'영국',flag:'🏴',power:84,senior:78},IT:{name:'이탈리아',flag:'🇮🇹',power:83,senior:77},FR:{name:'프랑스',flag:'🇫🇷',power:83,senior:77},DE:{name:'독일',flag:'🇩🇪',power:84,senior:78},ES:{name:'스페인',flag:'🇪🇸',power:84,senior:78}};
 const LEVELS={U17:{name:'U17 대표팀',short:'U17',max:17,offset:-16,selection:-9},U20:{name:'U20 대표팀',short:'U20',max:20,offset:-10,selection:-4},U23:{name:'U23 대표팀',short:'U23',max:23,offset:-5,selection:0},senior:{name:'성인 대표팀',short:'성인',max:100,offset:0,selection:0}};
 const OPPONENTS=[...Object.entries(TEAMS).map(([country,t])=>({country,name:t.name,power:t.power})),{country:'JP',name:'일본',power:73},{country:'AU',name:'호주',power:71},{country:'IR',name:'이란',power:73},{country:'UZ',name:'우즈베키스탄',power:65},{country:'SA',name:'사우디아라비아',power:69},{country:'IQ',name:'이라크',power:65},{country:'US',name:'미국',power:74},{country:'MX',name:'멕시코',power:76},{country:'PT',name:'포르투갈',power:81}];
 const label=(country,level='senior')=>(TEAMS[country]?.name||'대한민국')+' '+(LEVELS[level]?.name||LEVELS.senior.name);
 const matchLabel=level=>level==='senior'?'A매치 · 친선 경기':(LEVELS[level]?.short||level)+' 친선 경기';
 const nationalityName=country=>TEAMS[country].nationality||TEAMS[country].name;
 function initialise(g){g.nationalityVersion=1;g.internationalCareer={nationalities:['KR'],representing:'KR',residenceCountry:g.country,residenceSince:g.clock,switchUsed:false,previousAssociation:null,lastWindow:null,decisions:[],acquired:[]};}
 function migrate(g){
  if(g.nationalityVersion===1)return false;
  let country=g.startOrigin?.country||g.history?.[0]?.country||'KR',since=E.tick(g.startYear||g.birthYear+15,3);
  const points=[...(g.journey||[]).map(j=>({date:j.date,country:j.country||E.club(j.clubId,g)?.country})),...(g.history||[]).map(r=>({date:r.start,country:r.country})),{date:g.period?.start??g.clock,country:g.period?.country||g.country}].filter(p=>Number.isFinite(p.date)&&p.date<=g.clock&&TEAMS[p.country]).sort((a,b)=>a.date-b.date);
  for(const p of points)if(p.country!==country){country=p.country;since=p.date;}
  if(country!==g.country){country=g.country;since=g.clock;}
  initialise(g);g.internationalCareer.residenceCountry=country;g.internationalCareer.residenceSince=since;
  // Existing releases recorded only Korean senior friendlies. Keep their statistics intact.
  const legacy=(m,country='KR',level='senior')=>{m.nationalCountry=m.nationalCountry||country;m.teamLevel=m.teamLevel||level;m.matchType=m.matchType||'friendly';m.isAMatch=m.teamLevel==='senior';};
  for(const m of g.national||[])legacy(m);
  if(g.camp){g.camp.country=g.camp.country||'KR';g.camp.level=g.camp.level||'senior';g.camp.matchType=g.camp.matchType||'friendly';g.camp.accepted=g.phase==='international';for(const m of g.camp.matches||[])legacy(m,g.camp.country,g.camp.level);}
  return true;
 }
 function trackResidence(g){
  const state=g.internationalCareer;if(!state)return;
  if(state.residenceCountry!==g.country){state.residenceCountry=g.country;state.residenceSince=g.clock;}
 }
 function nationalityStatus(g){
  const s=g.internationalCareer,country=s.residenceCountry,start=Math.max(s.residenceSince,E.tick(g.birthYear+18,1)),eligibleAt=start+5*24,held=s.nationalities.includes(country),months=Math.max(0,Math.floor((g.clock-start)/2));
  return{country,start,eligibleAt,months,remainingMonths:Math.max(0,Math.ceil((eligibleAt-g.clock)/2)),progress:E.clamp(months/60*100,0,100),held,eligible:country!=='KR'&&!held&&g.age>=18&&g.clock>=eligibleAt};
 }
 function acquireNationality(g,country){
  if(!['ready','market'].includes(g.phase)||g.retired)return false;
  const status=nationalityStatus(g);if(!TEAMS[country]||country!==status.country||!status.eligible)return false;
  const s=g.internationalCareer;s.nationalities.push(country);s.acquired.push({country,date:g.clock});g.period.events.push(nationalityName(country)+' 국적 취득');return true;
 }
 function canRepresent(g,country){
  const s=g.internationalCareer;if(!Object.hasOwn(TEAMS,country)||!s.nationalities.includes(country))return false;
  // This mode schedules friendlies; an official cap in an imported future record remains binding.
  if((g.national||[]).some(m=>m.minutes>0&&m.matchType==='official'&&m.nationalCountry!==country))return false;
  if(country===s.representing)return true;
  return !s.switchUsed;
 }
 function chooseRepresentative(g,country){
  if(!['ready','market'].includes(g.phase)||g.retired||country===g.internationalCareer.representing||!canRepresent(g,country))return false;
  const s=g.internationalCareer,previous=s.representing;
  if(g.national.some(m=>m.minutes>0&&m.nationalCountry!==country)){s.switchUsed=true;s.previousAssociation=previous;}
  s.representing=country;g.period.events.push(label(country)+' 선택');return true;
 }
 function representativeLevel(g,country=g.internationalCareer.representing){
  if(g.age>=18&&E.overall(g.player)>=TEAMS[country].senior+7)return'senior';
  return g.age<=17?'U17':g.age<=20?'U20':g.age<=23?'U23':'senior';
 }
 function maybeCamp(g){
  if(g.phase!=='ready'||g.retired||g.stage==='service'||g.age<15||E.injuryAt(g)||![3,6,9,10,11].includes(E.date(g.clock).month)||E.date(g.clock).half!==1)return false;
  const s=g.internationalCareer;if(s.lastWindow===g.clock)return false;s.lastWindow=g.clock;
  const country=s.representing;if(!canRepresent(g,country))return false;
  const level=representativeLevel(g,country),minimum=TEAMS[country].senior+LEVELS[level].selection;
  if(E.overall(g.player)<minimum)return false;
  const chance=E.clamp(.16+(E.effective(g)-minimum)*.037+g.reputation*.004,.10,.92);if(E.rand(g)>chance)return false;
  g.camp={date:g.clock,country,level,matchType:'friendly',opponents:E.shuffle(g,OPPONENTS.filter(o=>o.country!==country)).slice(0,2).map(o=>o.name),matches:[],accepted:false,complete:false};g.phase='callup';return true;
 }
 function respondCallup(g,accept){
  if(g.phase!=='callup'||!g.camp||g.camp.accepted||g.camp.declined||typeof accept!=='boolean')return false;
  const c=g.camp;c.accepted=accept;c.declined=!accept;g.internationalCareer.decisions.push({date:c.date,country:c.country,level:c.level,accepted:accept});
  g.period.events.push(label(c.country,c.level)+' 소집 '+(accept?'수락':'거절'));g.phase=accept?'international':'ready';return true;
 }
 function internationalMatch(g){
  if(g.phase!=='international'||!g.camp||g.camp.complete)return false;
  const c=g.camp;if(!c.country){c.country='KR';c.level='senior';c.matchType='friendly';c.accepted=true;}
  const opponent=c.opponents[c.matches.length],offset=LEVELS[c.level].offset,opponentPower=(OPPONENTS.find(o=>o.name===opponent)?.power||72)+offset;
  const frame=E.simulateAppearance(g,TEAMS[c.country].power+offset,opponentPower,E.dayAt(c.date)+c.matches.length*4,true,false,true);
  const m={...frame,date:c.date,opponent,nationalCountry:c.country,teamLevel:c.level,matchType:c.matchType,isAMatch:c.level==='senior'};c.matches.push(m);
  if(m.minutes){g.national.push(m);E.matchDevelopment(g,m,true);g.fitness=E.clamp(g.fitness-9*m.minutes/90,15,100);E.health(g).lastMatchDay=m.matchDay;g.reputation+=c.level==='senior'?.6:.3;}
  c.complete=c.matches.length===c.opponents.length;return m;
 }
 function returnFromCamp(g){
  if(g.phase!=='international'||!g.camp?.complete)return false;
  const c=g.camp;g.period.events.push(label(c.country,c.level)+' · '+c.matches.filter(m=>m.minutes).length+'경기 출전');g.phase='ready';return true;
 }
 function nationalStats(g,{country,level}={}){
  const result=E.blankStats();for(const m of g.national){if(country&&m.nationalCountry!==country||level&&m.teamLevel!==level||!m.minutes)continue;result.apps++;result.starts+=m.started?1:0;for(const key of Object.keys(result))if(!['apps','starts','ratingSum'].includes(key))result[key]+=m[key]||0;result.ratingSum+=m.rating||0;}
  result.rating=result.apps?E.round(result.ratingSum/result.apps):0;return result;
 }
 const api={NATIONAL_TEAMS:TEAMS,NATIONAL_LEVELS:LEVELS,nationalTeamLabel:label,nationalMatchLabel:matchLabel,nationalityName,nationalityStatus,acquireNationality,canRepresent,chooseRepresentative,representativeLevel,maybeCamp,respondCallup,nationalStats};
 Object.assign(E,api);return{initialise,migrate,trackResidence,maybeCamp,internationalMatch,returnFromCamp,...api};
})();
