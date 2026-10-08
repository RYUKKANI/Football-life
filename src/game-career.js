'use strict';
const FootballCareer=(()=>{
 const E=FootballEngine,D=FootballCareerData,clamp=E.clamp,round=E.round;
 const copy=x=>JSON.parse(JSON.stringify(x));
 const rng=text=>({seed:E.stableSeed(String(text))});
 const choose=(r,a)=>a[E.int(r,0,a.length-1)];
 const normal=(r,a,b)=>a+(b-a)*(E.rand(r)+E.rand(r)+E.rand(r))/3;
 function randomName(r,country='KR'){
  if(country==='KR')return choose(r,D.surnames)+choose(r,D.given);
  const parts=D.foreign[country]||D.foreign.EN;return choose(r,parts[0])+' '+choose(r,parts[1]);
 }
 function environment(g,id=g.clubId){
  const c=E.club(id,g),power=c?.power||50,school=!!E.school(id),university=c?.kind==='university';
  const facilities=clamp(Math.ceil((power-(school?42:university?49:59))/6),1,5);
  const coaching=clamp(Math.ceil((power-(school?43:university?50:61))/6),1,5);
  return {facilities,coaching,bonus:round((facilities*.035+coaching*.025)*100),mult:1+facilities*.035+coaching*.025};
 }
 function growthScale(g){
  const ovr=Object.entries(E.OVERALL_WEIGHTS[g.player.pos]).reduce((s,[id,w])=>s+g.player.details[id]*w,0);
  return ovr<90?1:clamp((99-ovr)/9,.08,1);
 }
 const lateBonus=g=>g.player.talentId==='late'&&g.age>=22?1.20:1;
 function trainingBuff(g){return environment(g).mult*lateBonus(g)*(g.military?.status==='service'&&g.military.branch==='regular'?.12:1);}
 function roleFor(g,id=g.clubId){
  const diff=E.overall(g.player)-(E.club(id,g)?.power||48);
  return diff>=-3?'starter':diff>=-11?'rotation':'prospect';
 }
 function roleEffect(g){return D.ROLES[g.period?.role||roleFor(g)].chance;}
 function body(g){
  const p=g.player,r=rng(g.id+'-body-'+p.pos);
  if(!Number.isFinite(p.height))p.height=Math.round(normal(r,...D.HEIGHT[p.pos]));
  if(!Number.isFinite(p.weight))p.weight=Math.round(p.height*p.height/10000*normal(r,...D.BMI[p.pos]));
 }
 function initialise(g){
  g.careerVersion=1;g.awards=[];g.scouting=[];g.trials=[];g.special={used:0,periods:[],active:null};g.military={status:'pending',applications:[]};g.contractTerms={role:'prospect',bonus:0};g.loan=null;body(g);
 }
 function migrate(g){
  if(g.careerVersion===1)return false;
  g.careerVersion=1;g.previousPotential=g.player.potential;g.player.potential=99;body(g);
  g.awards=g.awards||[];g.scouting=g.scouting||[];g.trials=g.trials||[];g.special=g.special||{used:0,periods:[],active:null};g.military=g.military||{status:'pending',applications:[]};g.contractTerms=g.contractTerms||{role:roleFor(g),bonus:0};g.loan=g.loan||null;
  if(g.period&&!g.period.trained)startPeriod(g);
  else if(g.period){g.period.role=g.period.role||roleFor(g);g.period.objectives=g.period.objectives||[];g.period.managerChoice=g.period.managerChoice||null;g.period.trainingEnvironment=g.period.trainingEnvironment||environment(g);g.period.startDetails=g.period.startDetails||{...(g.period.development?.before||g.player.details)};}
  return true;
 }
 function objectives(g,role){
  const days=E.dayAt(g.target)-E.dayAt(g.clock),youth=['middle','academy'].includes(g.stage);
  const games=youth?4:g.stage==='university'||g.stage==='semipro'?6:Math.round((g.country==='KR'?27:38)*days/365.25);
  const expected=games*90*D.ROLES[role].share;
  const minutes=Math.max(90,Math.round(expected/90)*90);
  const p=g.player.pos,level=role==='starter'?2:1;
  const target={ST:['goals','득점',level],WG:['assists','도움',level],MF:['keyPasses','기회 창출',level*4],CB:['ballWins','태클·가로채기',level*8],FB:['ballWins','태클·가로채기',level*6],GK:['saves','선방',level*4]}[p];
  return [{id:'minutes',name:'출전 시간',target:minutes,unit:'분'},{id:target[0],name:target[1],target:target[2],unit:target[0]==='goals'||target[0]==='assists'?'개':'회'}];
 }
 function startPeriod(g){
  const p=g.period;
  p.role=g.military?.status==='service'?'rotation':g.stage==='pro'&&!g.loan?g.contractTerms?.role||roleFor(g):roleFor(g);
  if(!D.ROLES[p.role])p.role=roleFor(g);
  p.objectives=g.stage==='service'?[]:objectives(g,p.role);p.managerChoice=null;
  p.startDetails={...g.player.details};p.trainingEnvironment=environment(g);
 }
 const objectiveValue=(r,id)=>id==='ballWins'?(r.tackles||0)+(r.interceptions||0):r[id]||0;
 function manager(g,request){
  if(g.phase!=='ready'||g.period.trained||g.period.managerChoice||g.stage==='service')return null;
  const p=g.period;let accepted=false,text='';
  if(request==='rest'){g.fitness=clamp(g.fitness+8,15,100);g.training='balanced';g.intensity='light';g.morale=clamp(g.morale+3,0,100);accepted=true;text='회복을 먼저 챙기기로 했습니다. 이번 반기는 최소 강도로 훈련합니다.';}
  else if(request==='minutes'){
   accepted=E.overall(g.player)>=(E.club(g.clubId,g)?.power||48)-10&&g.trust>=45&&!E.injuryAt(g);
   if(accepted){p.role=p.role==='prospect'?'rotation':'starter';p.objectives=objectives(g,p.role);g.trust=clamp(g.trust+2,0,100);text='더 많은 출전 기회를 받기로 했습니다. 새 역할에 맞는 반기 목표를 확인하세요.';}
   else {g.trust=clamp(g.trust-1,0,100);text=E.injuryAt(g)?'먼저 부상에서 회복한 뒤 출전 계획을 다시 세우기로 했습니다.':'지금은 경기력과 훈련 태도를 더 보여줘야 합니다. 기존 역할로 반기를 시작합니다.';}
  }else return null;
  return p.managerChoice={request,accepted,text};
 }
 function finishPeriod(g,p){
  const days=Math.max(1,E.dayAt(p.end)-E.dayAt(p.start)),missed=p.development?.injuredDays||0,available=clamp((days-missed)/days,.15,1);
  p.objectives=(p.objectives||[]).map(o=>{const target=Math.max(o.id==='minutes'?30:1,Math.ceil(o.target*available)),value=objectiveValue(p,o.id),met=value>=target;return {...o,target,value,met,adjusted:target!==o.target};});
  if(p.objectives.length){const met=p.objectives.filter(o=>o.met).length;g.trust=clamp(g.trust+met*3-(missed?0:(p.objectives.length-met)),20,95);p.objectiveResult=met+' / '+p.objectives.length+'개 달성';}
  p.bonus=g.stage==='pro'&&p.objectives.every(o=>o.met)&&p.apps?Math.round(g.wage*(g.contractTerms?.bonus||0)*(p.end-p.start)/24):0;g.income+=p.bonus;
  p.reactions=reactions(g,p);
  const value=E.overall(g.player);
  if(!g.prime||value>g.prime.ovr)g.prime={ovr:value,age:g.age,season:p.matches.at(-1)?.league||String(g.year),details:{...g.player.details},club:p.club,clubId:p.clubId};
 }
 function reactions(g,p){
  if(!p.apps)return p.matches.some(m=>m.injured)?['부상으로 출전 기회를 놓쳤다. 다음 반기는 회복이 먼저다.']:['출전 기록은 없지만 훈련은 이어졌다. 다음 기회를 준비한다.'];
  const out=[],best=[...p.matches].filter(m=>m.minutes).sort((a,b)=>b.rating-a.rating)[0];
  if(best?.rating>=7.5)out.push(best.opponent+'전 평점 '+best.rating+'. '+(g.player.pos==='GK'?best.saves+'개의 선방으로 골문을 지켰다.':best.goals?best.goals+'골을 넣으며 존재감을 보였다.':best.assists?best.assists+'개의 도움으로 공격을 이끌었다.':'맡은 역할을 끝까지 해냈다.'));
  if(g.player.pos==='GK'&&p.clean)out.push(p.apps+'경기 중 '+p.clean+'경기를 무실점으로 마쳤다.');
  else if(['CB','FB'].includes(g.player.pos))out.push('태클 '+p.tackles+'회, 가로채기 '+p.interceptions+'회. 수비에서 쌓은 기록이다.');
  else if(g.player.pos==='MF'&&p.keyPasses)out.push('득점 기회를 '+p.keyPasses+'번 만들었다. 패스가 공격의 출발점이 됐다.');
  else if(p.goals+p.assists)out.push(p.apps+'경기에서 '+p.goals+'골 '+p.assists+'도움을 기록했다.');
  if(p.objectives?.every(o=>o.met))out.push('반기 목표를 모두 달성했다. 감독에게 다음 출전 기회를 기대할 만하다.');
  else if(p.rating<6.3)out.push('평균 평점 '+p.rating+'. 다음 반기에는 경기력을 더 안정적으로 보여줄 필요가 있다.');
  if(!out.length)out.push(p.minutes+'분을 뛰었다. 다음 반기에는 더 많은 기회를 노린다.');
  return [...new Set(out)].slice(0,3);
 }
 function makeRouteOffer(g,c){
  return {id:c.id+'-'+c.kind,kind:c.kind,clubId:c.id,country:c.country,name:E.club(c.id,g).name,wage:c.kind==='semipro'?1200:0,months:c.kind==='university'?48:24,roleId:roleFor(g,c.id),role:D.ROLES[roleFor(g,c.id)].name};
 }
 function extendOffers(g,base){
  if(g.stage==='service'||g.military?.status==='service')return [{id:'stay',kind:'stay',name:g.military.branch==='sangmu'?E.teamName(g)+' · 복무 계속':'복무 계속'}];
  if(g.loan)return [{id:'stay',kind:'stay',name:E.teamName(g)+' · 임대 계속',months:Math.ceil((g.loan.end-g.clock)/2),wage:g.wage,roleId:roleFor(g)}];
  let out=base.map(o=>({...o,roleId:o.kind==='stay'?g.contractTerms?.role||roleFor(g):roleFor(g,o.clubId),bonus:o.kind==='stay'?g.contractTerms?.bonus||0:0}));
  if(g.stage==='academy'&&g.year>=g.academyStart+3){
   E.shuffle(g,D.CLUBS.filter(c=>c.kind==='university')).slice(0,2).forEach(c=>out.push(makeRouteOffer(g,c)));
   out.push(makeRouteOffer(g,choose(g,D.CLUBS.filter(c=>c.kind==='semipro'&&c.id!=='SP-sangmu'))));
  }
  if(g.stage==='university'){
   out=[{id:'stay',kind:'stay',name:E.teamName(g)+' · 재학 계속'}];
   if(g.year>=g.routeStart+2||E.overall(g.player)>=65)out.push(...E.shuffle(g,E.clubsFor(g).filter(c=>c.country==='KR'&&c.id!=='KR-김천')).slice(0,3).map(c=>proOffer(g,c)));
   if(g.year>=g.routeStart+4){out=out.filter(o=>o.kind!=='stay');out.push(makeRouteOffer(g,choose(g,D.CLUBS.filter(c=>c.kind==='semipro'&&c.id!=='SP-sangmu'))));}
  }
  if(g.stage==='semipro'){
   out=[{id:'stay',kind:'stay',name:E.teamName(g)+' · 잔류'}];
   if(E.overall(g.player)>=57)out.push(...E.shuffle(g,E.clubsFor(g).filter(c=>c.country==='KR'&&c.id!=='KR-김천')).slice(0,3).map(c=>proOffer(g,c)));
  }
  if(g.age>=18&&g.age<=25&&(['university','semipro'].includes(g.stage)||g.stage==='academy'&&g.year>=g.academyStart+3)){
   const candidates=E.clubsFor(g).filter(c=>c.country!=='KR'&&c.power<=E.overall(g.player)+24&&c.power>=E.overall(g.player)+8);
   if(candidates.length){const c=choose(g,candidates);out.push({id:c.id+'-trial',kind:'trial',clubId:c.id,country:c.country,name:c.name+' · 입단 테스트',roleId:roleFor(g,c.id),months:24,wage:0});}
  }
  if(g.stage==='pro'&&g.contract>=6){
   const owner=E.club(g.clubId,g),candidates=[...E.clubsFor(g),...D.CLUBS.filter(c=>c.kind==='semipro')].filter(c=>c.country===g.country&&c.id!==g.clubId&&c.id!=='SP-sangmu'&&c.id!=='KR-김천'&&c.power<owner.power&&c.power<=E.overall(g.player)+12);
   for(const c of E.shuffle(g,candidates).slice(0,2)){const months=g.contract>=12&&E.rand(g)<.4?12:6;out.push({id:c.id+'-loan',kind:'loan',borrowStage:c.kind||'pro',clubId:c.id,country:c.country,name:c.name,months,wage:g.wage,roleId:roleFor(g,c.id),role:D.ROLES[roleFor(g,c.id)].name});}
  }
  return out;
 }
 function proOffer(g,c){
  const wage=Math.round(Math.max(1800,(E.overall(g.player)-48)**2*(c.country==='KR'?13:65)));
  return {id:c.id+'-pro',kind:'pro',clubId:c.id,country:c.country,name:c.name,wage,months:24,roleId:roleFor(g,c.id),role:D.ROLES[roleFor(g,c.id)].name,bonus:0};
 }
 function trial(g,id){
  const o=g.offers.find(o=>o.id===id&&o.kind==='trial');if(g.phase!=='market'||!o||o.trialResult)return null;
  const c=E.club(o.clubId,g),r=rng(g.id+'-'+g.clock+'-'+id),score=round(E.effective(g)+normal(r,-7,10)),cutoff=c.power-9,passed=score>=cutoff;
  const result={date:g.clock,clubId:c.id,club:c.name,score,cutoff,passed};g.trials.push(result);o.trialResult=result;
  if(passed)Object.assign(o,proOffer(g,c),{id,trialResult:result});return result;
 }
 function acceptLoan(g,o){
  if(g.stage!=='pro'||g.loan||g.military?.status==='service'||g.contract<o.months||![6,12].includes(o.months))return false;
  g.loan={parentClubId:g.clubId,parentCountry:g.country,parentStage:g.stage,parentWage:g.wage,parentTerms:copy(g.contractTerms),parentTrust:g.trust,start:g.clock,end:g.clock+o.months*2,months:o.months,borrowClubId:o.clubId};
  g.clubId=o.clubId;g.country=o.country;g.stage=o.borrowStage||'pro';g.trust=55;
  g.journey.push({date:g.clock,clubId:o.clubId,name:o.name,kind:'loan',months:o.months});return true;
 }
 function restoreParent(g,state,kind){
  g.clubId=state.parentClubId;g.country=state.parentCountry;g.stage=state.parentStage;g.wage=state.parentWage;g.contractTerms=state.parentTerms;g.trust=clamp(state.parentTrust+2,20,95);
  const event=kind==='loan-return'?'임대 종료 · '+E.teamName(g)+' 복귀':'전역 · '+E.teamName(g)+' 복귀';
  g.journey.push({date:g.clock,clubId:g.clubId,name:E.teamName(g),kind});g.period.events.push(event);g.history.at(-1)?.events.push(event);
 }
 function beforeMarket(g){
  const r=g.history.at(-1),month=E.date(g.clock).month;
  if(r&&month===(r.country==='KR'?1:7))scouting(g,r);
  if(g.loan&&g.clock>=g.loan.end){restoreParent(g,g.loan,'loan-return');g.loan=null;}
  if(g.military?.status==='service'&&g.clock>=g.military.end){restoreParent(g,g.military,'military-return');g.military.status='completed';}
 }
 function negotiate(g,id,proposal){
  const o=g.offers.find(o=>o.id===id);if(g.phase!=='market'||!o||!['pro','stay'].includes(o.kind)||g.stage!=='pro'||g.loan||o.negotiation)return null;
  const raise=Number(proposal.raise),months=Number(proposal.months),role=proposal.role;
  if(![10,20].includes(raise)||![24,36,48].includes(months)||!D.ROLES[role])return null;
  const base=Math.max(1800,o.wage||g.wage),targetId=o.clubId||g.clubId,power=E.club(targetId,g)?.power||65,diff=E.overall(g.player)-power;
  const roleDemand=role==='starter'?Math.max(0,-diff)*.023:role==='rotation'?Math.max(0,-diff-8)*.012:0;
  const recent=g.history.at(-1),performance=(recent?.rating||6.2)-6.3,r=rng(g.id+'-contract-'+g.clock+'-'+id);
  const chance=clamp(.60+diff*.015+performance*.12+(g.trust-60)*.004-raise*.009-roleDemand-(months===48?.08:0),.12,.90);
  const success=E.rand(r)<chance;
  const result={success,raise,months,role,text:success?'협상이 성사됐습니다. 새 조건을 확인한 뒤 계약을 선택하세요.':'제안한 조건이 받아들여지지 않았습니다. 구단의 원래 제안은 유지됩니다.'};
  o.negotiation=result;
  if(success){o.wage=Math.round(base*(1+raise/100));o.months=months;o.roleId=role;o.bonus=.08;o.role=D.ROLES[role].name;}
  else {if(targetId===g.clubId)g.trust=clamp(g.trust-3,20,95);g.morale=clamp(g.morale-3,0,100);}
  return result;
 }
 function canMilitary(g){
  return g.phase==='ready'&&!g.period.trained&&!g.loan&&g.military?.status==='pending'&&g.age>=18&&g.age<=28&&['pro','semipro'].includes(g.stage)&&g.country==='KR';
 }
 function enlist(g,branch){
  if(!canMilitary(g)||!['regular','sangmu'].includes(branch))return null;
  const m=g.military;
  if(branch==='sangmu'){
   if(m.applications.some(a=>a.year===g.year))return null;
   const r=rng(g.id+'-sangmu-'+g.year),score=round(E.overall(g.player)+(g.history.at(-1)?.rating||6.3)*2+g.reputation*.2),others=Array.from({length:11},()=>round(normal(r,67,97))),rank=1+others.filter(n=>n>score).length,passed=rank<=4;
   const result={year:g.year,rank,total:12,cutoff:4,score,passed};m.applications.push(result);if(!passed)return result;
  }
  Object.assign(m,{status:'service',branch,start:g.clock,end:g.clock+36,parentClubId:g.clubId,parentCountry:g.country,parentStage:g.stage,parentWage:g.wage,parentTerms:copy(g.contractTerms),parentTrust:g.trust});
  if(branch==='sangmu'){g.clubId='SP-sangmu';g.stage='semipro';g.wage=900;}else {g.stage='service';g.wage=0;}
  g.journey.push({date:g.clock,clubId:branch==='sangmu'?'SP-sangmu':null,name:branch==='sangmu'?E.teamName(g):'현역 입대',kind:'military'});E.newPeriod(g);
  return {passed:true,branch,end:m.end};
 }
 function availableSpecial(g){return g.phase==='ready'&&!g.period.trained&&!g.retired&&g.stage!=='service'&&!E.injuryAt(g)&&g.special.used<6&&!g.special.periods.includes(g.period.start);}
 function startSpecial(g,kind){
  if(!availableSpecial(g)||!['shoot','pass','reflex','mentor'].includes(kind)||kind==='reflex'&&g.player.pos!=='GK')return null;
  const key=kind==='shoot'?'finishing':kind==='pass'?'passing':kind==='reflex'?'reflexes':null;
  if(key&&!E.activeAttributes(g.player).includes(key))return null;
  g.special.used++;g.special.periods.push(g.period.start);
  const r=rng(g.id+'-special-'+g.period.start+'-'+kind),target=E.int(r,35,75);
  return g.special.active={kind,target,period:g.period.start,complete:false};
 }
 function finishSpecial(g,accuracy){
  const s=g.special.active;if(!s||s.complete||g.phase!=='ready'||s.period!==g.period.start)return null;
  const abandoned=accuracy===null;s.complete=true;s.accuracy=clamp(Number(accuracy)||0,0,1);s.abandoned=abandoned;
  const p=g.player,core=E.POSITION_ATTRIBUTES[p.pos][0].keys,allowed=core.filter(id=>!(E.growthType(id)==='physical'&&g.age>=30||E.growthType(id)==='technique'&&g.age>=33||E.growthType(id)==='mental'&&g.age>=36));
  const id=s.kind==='mentor'?[...allowed].sort((a,b)=>p.details[a]-p.details[b])[0]:{shoot:'finishing',pass:'passing',reflex:'reflexes'}[s.kind];
  const before=id?p.details[id]:0,old=id&&(E.growthType(id)==='physical'&&g.age>=30||E.growthType(id)==='technique'&&g.age>=33||E.growthType(id)==='mental'&&g.age>=36);
  if(id&&!old&&!abandoned)E.addDevelopment(g,id,s.kind==='mentor'?.40:.10+s.accuracy*.50,'training');
  E.recalc(p);E.unlock(g);s.attribute=id||null;s.gain=id?round(p.details[id]-before):0;
  g.period.events.push((s.kind==='mentor'?'멘토 지도':'특별훈련')+' · '+(id?E.attributeName(id)+' +'+s.gain:'유지 훈련'));return s;
 }
 function matches(g){
  const rows=[...g.history];if(g.period&&!['market','retired'].includes(g.phase))rows.push(g.period);
  return rows.flatMap(r=>r.matches||[]);
 }
 function scouting(g,period){
  const season=period.matches.at(-1)?.league||String(E.date(g.clock).year-1),id=period.country+'-'+season+'-'+period.stage;
  if(g.scouting.some(s=>s.id===id))return g.scouting.find(s=>s.id===id);
  const rows=matches(g).filter(m=>m.country===period.country&&m.league===season&&m.kind===period.stage),stats=aggregate(rows);
  const p=g.player,core=E.POSITION_ATTRIBUTES[p.pos][0].keys,strengths=[...core].sort((a,b)=>p.details[b]-p.details[a]).slice(0,3),weakest=[...core].sort((a,b)=>p.details[a]-p.details[b])[0];
  const before=period.startDetails||period.development?.before||{},progress=core.map(id=>[id,round(p.details[id]-(before[id]??p.details[id]))]).sort((a,b)=>b[1]-a[1])[0];
  const line=p.pos==='GK'?stats.saves+'개의 선방과 '+stats.clean+'경기 무실점을 기록했습니다.':p.pos==='CB'||p.pos==='FB'?'태클 '+stats.tackles+'회와 가로채기 '+stats.interceptions+'회를 기록했습니다.':p.pos==='MF'?'득점 기회를 '+stats.keyPasses+'번 만들고 '+stats.assists+'개의 도움을 기록했습니다.':stats.goals+'골 '+stats.assists+'도움으로 공격에 기여했습니다.';
  const report={id,season,date:g.clock,name:p.name,pos:p.pos,height:p.height,weight:p.weight,club:period.club,clubId:period.clubId,stats,ovr:E.overall(p),strengths:strengths.map(id=>({id,value:Math.floor(p.details[id])})),weakest,paragraphs:[
   p.height+'cm, '+p.weight+'kg의 '+E.POS[p.pos].name+'입니다. 핵심 강점은 '+strengths.slice(0,2).map(E.attributeName).join(' / ')+'입니다.',
   stats.apps?'이번 시즌 '+stats.apps+'경기, '+stats.minutes+'분을 뛰었습니다. '+line+' 평균 평점은 '+stats.rating.toFixed(2)+'입니다.':'이번 시즌은 출전 기록이 없습니다. 훈련에서 쌓은 기량을 경기에서 보여줄 기회를 확보해야 합니다.',
   (progress?.[1]>0?'이번 반기 '+E.attributeName(progress[0])+' 능력이 '+progress[1]+' 올랐습니다. ':'')+E.attributeName(weakest)+' 능력을 보완하면 현재 역할을 더 안정적으로 수행할 수 있습니다. '+(g.age>=30?'피지컬 유지와 판단 훈련을 함께 가져가는 편이 좋습니다.':g.age<=21?'신체 성장기에 맞춰 기초 체력과 포지션 기술을 함께 다듬을 시기입니다.':'발밑 기술과 경기 판단을 꾸준히 다듬을 시기입니다.')
  ]};g.scouting.push(report);g.pendingScouting=id;return report;
 }
 function aggregate(rows){
  const s=E.blankStats();for(const m of rows){for(const k in s)if(!['apps','starts','ratingSum'].includes(k))s[k]+=Number(m[k])||0;s.apps+=m.minutes>0?1:0;s.starts+=m.started?1:0;s.ratingSum+=m.minutes?m.rating||0:0;}s.rating=s.apps?round(s.ratingSum/s.apps):0;return s;
 }
 function rosters(g,w){
  if(w.players)return;
  const positions=['GK','GK','CB','CB','CB','FB','FB','FB','MF','MF','MF','MF','WG','WG','WG','ST','ST','ST'];
  w.players=w.teams.flatMap(c=>positions.map((pos,i)=>{const r=rng(w.id+'-'+c.id+'-'+i);return {id:c.id+'-P'+i,name:randomName(r,w.country),clubId:c.id,club:c.name,pos,ovr:round(clamp(c.power+normal(r,-14,8),35,96)),...E.blankStats()};}));w.playerFixtures={};
 }
 function recordLeague(g,w,f,frame){
  rosters(g,w);const fid=w.id+'-'+f.r+'-'+f.h+'-'+f.a;if(w.playerFixtures[fid])return;w.playerFixtures[fid]=true;
  const r=rng(fid+'-players'),userClub=frame?.userClubId||g.clubId;
  for(const [clubId,goals,conceded,home] of [[f.h,f.x,f.y,true],[f.a,f.y,f.x,false]]){
   const pool=w.players.filter(p=>p.clubId===clubId),indices=[0,2,3,5,6,8,9,10,12,15,16],own=frame&&clubId===userClub;
   const active=indices.map(i=>({p:pool[i],minutes:90,goals:0,assists:0}));
   if(own&&frame.minutes){const sub=active.find(a=>a.p.pos===g.player.pos);if(sub)sub.minutes-=frame.minutes;}
   const fields=active.filter(a=>a.minutes&&a.p.pos!=='GK');
   const pickField=exclude=>{const candidates=fields.filter(a=>a.p.id!==exclude),weights=candidates.map(a=>({ST:5,WG:3,MF:1.7,FB:.5,CB:.35}[a.p.pos]*(.5+a.p.ovr/100)*a.minutes/90));let n=E.rand(r)*weights.reduce((s,n)=>s+n,0);for(let i=0;i<candidates.length;i++){n-=weights[i];if(n<=0)return candidates[i];}return candidates.at(-1);};
   let remaining=Math.max(0,goals-(own?frame.goals:0)),assistBudget=Math.max(0,goals-(own?frame.assists:0));
   for(let i=0;i<remaining;i++){const scorer=pickField();if(scorer)scorer.goals++;if(assistBudget&&E.rand(r)<.72){const helper=pickField(scorer?.p.id);if(helper){helper.assists++;assistBudget--;}}}
   if(own&&frame.goals&&assistBudget&&E.rand(r)<.72){const helper=pickField();if(helper){helper.assists++;assistBudget--;}}
   const totalFaced=frame?(home?f.h===userClub?frame.opponentOnTarget:frame.teamOnTarget:f.a===userClub?frame.opponentOnTarget:frame.teamOnTarget):conceded+E.int(r,1,7);
   for(const a of active){
    if(!a.minutes)continue;const p=a.p,time=a.minutes/90;p.apps++;p.starts++;p.minutes+=a.minutes;p.goals+=a.goals;p.assists+=a.assists;
    const passes=Math.round(time*({GK:22,CB:36,FB:44,MF:58,WG:34,ST:24}[p.pos])),completed=Math.round(passes*clamp(.52+p.ovr*.004,.60,.96));
    p.passes+=passes;p.completed+=completed;
    const kp=p.pos==='MF'||p.pos==='WG'?Math.round(E.rand(r)*time*3):0;p.keyPasses+=Math.max(kp,a.assists);
    const tackles=['CB','FB','MF'].includes(p.pos)?Math.round(time*(.6+E.rand(r)*3)*p.ovr/70):0,intercepts=['CB','FB','MF'].includes(p.pos)?Math.round(time*E.rand(r)*3*p.ovr/70):0;
    p.tackles+=tackles;p.interceptions+=intercepts;if(a.minutes>=60&&!conceded)p.clean++;
    let rating=6.1+normal(r,-.35,.5)+a.goals*.82+a.assists*.52+kp*.07+tackles*.06+intercepts*.06+(goals>conceded?.12:-.05);
    if(p.pos==='GK'){const ownKeeper=own&&g.player.pos==='GK';const faced=Math.max(0,totalFaced-(ownKeeper?frame.facedOnTarget:0)),allowed=Math.max(0,conceded-(ownKeeper?frame.conceded:0)),saves=Math.max(0,faced-allowed);p.saves+=saves;p.conceded+=allowed;p.facedOnTarget=(p.facedOnTarget||0)+faced;rating=6.2+saves*.14-allowed*.4+(!allowed?.4:0);}
    p.ratingSum+=round(clamp(rating,3,10));
   }
  }
 }
 function ensureLeague(g,w){
  rosters(g,w);const history=matches(g);
  for(const f of w.fixtures)if(f.done&&!w.playerFixtures[w.id+'-'+f.r+'-'+f.h+'-'+f.a]){
   const fid=w.id+'-'+f.r+'-'+f.h+'-'+f.a,m=history.find(m=>m.fixtureId===fid||!m.fixtureId&&m.kind==='pro'&&m.country===w.country&&m.league===E.leagueLabel(w)&&m.matchDay===E.fixtureDay(g,f)&&[f.h,f.a].includes(m.clubId));
   recordLeague(g,w,f,m?.modelVersion>=3?{...m,userClubId:m.clubId}:null);
  }
 }
 function leagueRows(g,w){
  ensureLeague(g,w);const ownRows=matches(g).filter(m=>m.kind==='pro'&&m.country===w.country&&m.league===E.leagueLabel(w)),own=aggregate(ownRows);
  return [...w.players.map(p=>({...p,rating:p.apps?round(p.ratingSum/p.apps):0})),{...own,id:'USER-'+g.id,name:g.player.name,pos:g.player.pos,clubId:ownRows.at(-1)?.clubId||g.clubId,club:ownRows.at(-1)?.club||E.teamName(g),ovr:E.overall(g.player),mine:true,facedOnTarget:ownRows.reduce((s,m)=>s+(m.facedOnTarget||0),0)}];
 }
 function rankings(g,metric='goals',world=null){
  const w=world||E.seasonWorld(g,g.country,'pro'),rows=leagueRows(g,w),played=Math.max(0,...w.table.map(t=>t.p)),minimum=Math.min(900,Math.max(90,Math.floor(played*90*.30))),rate=['rating','saveRate'].includes(metric);
  let list=rows.filter(p=>p.minutes>0&&(!['saves','clean','saveRate'].includes(metric)||p.pos==='GK'));
  const value=p=>metric==='saveRate'?(p.facedOnTarget?p.saves/p.facedOnTarget*100:0):p[metric]||0;
  if(rate)list=list.filter(p=>p.minutes>=minimum&&(metric!=='saveRate'||p.facedOnTarget>=Math.min(30,Math.max(6,played))));
  list.sort((a,b)=>value(b)-value(a)||b.minutes-a.minutes||a.id.localeCompare(b.id));
  let last=null,rank=0;list=list.map((p,i)=>{const v=round(value(p));if(v!==last)rank=i+1;last=v;return {...p,value:v,rank};});
  const mine=list.find(p=>p.mine),own=rows.find(p=>p.mine);
  return {metric,worldId:w.id,season:E.leagueLabel(w),country:w.country,minimum,rows:list,mine:mine||{...own,value:round(value(own)),rank:null},complete:w.complete};
 }
 function awardSeason(g,w){
  if(w.kind!=='pro'||w.awardsDone)return;ensureLeague(g,w);w.awardsDone=true;
  const categories=[['goals','득점왕'],['assists','도움왕'],['rating','시즌 최우수 선수'],['saveRate','최우수 골키퍼']];
  w.awards=categories.flatMap(([metric,name])=>{const r=rankings(g,metric,w),first=r.rows[0];if(!first||first.value<=0)return [];return r.rows.filter(p=>p.value===first.value).map(p=>({name,metric,playerId:p.id,player:p.name,club:p.club,clubId:p.clubId,value:p.value,season:E.leagueLabel(w),country:w.country,year:w.year}));});
  const all=leagueRows(g,w),minimum=Math.min(900,Math.max(90,...w.table.map(t=>t.p*90*.30))),formation={GK:1,CB:2,FB:2,MF:3,WG:2,ST:1};
  for(const [pos,count] of Object.entries(formation)){const eligible=all.filter(p=>p.pos===pos&&p.minutes>=minimum).sort((a,b)=>b.rating-a.rating||b.minutes-a.minutes||a.id.localeCompare(b.id));for(const p of eligible.slice(0,count))w.awards.push({name:'베스트11',playerId:p.id,player:p.name,club:p.club,clubId:p.clubId,season:E.leagueLabel(w),country:w.country,year:w.year,pos});}
  for(const a of w.awards.filter(a=>a.playerId==='USER-'+g.id))if(!g.awards.some(v=>v.country===a.country&&v.season===a.season&&v.name===a.name)){g.awards.push(a);g.reputation+=3;g.period.events.push(a.season+' · '+a.name);}
 }
 function legacy(g){
  const s=E.totals(g),pos=g.player.pos,prime=g.prime||{ovr:E.overall(g.player),details:g.player.details,age:g.age,season:String(g.year),club:E.teamName(g),clubId:g.clubId};
  const minutes=Math.max(90,s.minutes),impact=pos==='GK'?(s.saves*1.5+s.clean*5):['CB','FB'].includes(pos)?(s.tackles+s.interceptions+s.clean*5):pos==='MF'?(s.keyPasses*2+s.assists*8):(s.goals*10+s.assists*8);
  const components={value:Math.round(clamp(prime.ovr-45,0,40)),records:Math.round(clamp(s.apps*.055+impact/minutes*900*1.2+s.rating*2,0,80)),awards:Math.min(50,g.awards.length*5),titles:Math.min(30,g.trophies.length*5),national:Math.min(30,g.national.length*.4)};
  const score=Object.values(components).reduce((n,v)=>n+v,0),top=[...matches(g)].filter(m=>m.minutes).sort((a,b)=>b.rating-a.rating)[0];
  return {score,components,prime,stats:s,top,caption:score>=150?'한 시대를 대표한 선수':score>=100?'오래 기억될 이름':score>=50?'자신의 자리를 만든 선수':'첫 유니폼부터 마지막 휘슬까지'};
 }
 Object.assign(E,{randomName,environment,growthScale,roleFor,manager,objectiveValue,negotiate,trial,enlist,canMilitary,availableSpecial,startSpecial,finishSpecial,rankings,legacy,careerMatches:matches,aggregate});
 return {initialise,migrate,startPeriod,finishPeriod,beforeMarket,extendOffers,acceptLoan,recordLeague,awardSeason,growthScale,trainingBuff,lateBonus,roleEffect,scouting};
})();
