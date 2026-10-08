'use strict';
const FootballEngine=(()=>{
const D=FootballData,{ATTR,TALENTS,POS,ARCH,STYLES,LEAGUES,CLUBS}=D;
const keys=Object.keys(ATTR),clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),round=x=>Math.round(x*10)/10;
const clubsFor=g=>g?.era==='legacy'?D.LEGACY_CLUBS:CLUBS;
const school=id=>[...D.MIDDLE_SCHOOLS,...D.HIGH_SCHOOLS].find(s=>s.id===id);
const club=(id,g)=>{const c=clubsFor(g).find(c=>c.id===id)||D.LEGACY_CLUBS.find(c=>c.id===id)||FootballCareerData.CLUBS.find(c=>c.id===id)||school(id);if(id==='SP-sangmu'&&c){const y=g?.year||2000;return {...c,name:y>=2021?'김천 상무':y>=2011?'상주 상무':y>=2003?'광주 상무 불사조':'상무 축구단'};}if(id==='SP-railway'&&c&&g?.year>=2005)return {...c,name:'대전 한국철도'};return c;};
const career=()=>typeof FootballCareer!=='undefined'?FootballCareer:null;
const schoolName=(s,year)=>s.id==='HS-pocheol'&&year>=2013?'포항제철고등학교':s.name;
const academyParent=g=>{const s=school(g.clubId);return s?(s.parentId&&g.year>=s.affiliatedFrom?club(s.parentId,g):null):club(g.clubId,g)};
const leagueName=(g,country=g.country)=>g.era==='2000'?(country==='KR'?'K리그':country==='FR'?'프랑스 1부':LEAGUES[country].league):LEAGUES[country].league;
function rand(g){let t=g.seed+=0x6D2B79F5;g.seed>>>=0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}
const int=(g,a,b)=>a+Math.floor(rand(g)*(b-a+1));
const pick=(g,a)=>a[int(g,0,a.length-1)];
function shuffle(g,a){a=[...a];for(let i=a.length-1;i>0;i--){let j=int(g,0,i);[a[i],a[j]]=[a[j],a[i]]}return a}
function poisson(g,l){if(l<=0)return 0;let p=1,k=0,L=Math.exp(clamp(-l,-20,0));do{k++;p*=rand(g)}while(p>L&&k<100);return k-1}
const tick=(y,m,h=0)=>y*24+(m-1)*2+h;
const date=t=>({year:Math.floor(t/24),month:Math.floor((t%24)/2)+1,half:t%2});
const dateText=t=>{const d=date(t);return d.year+'년 '+d.month+'월'+(d.half?' 하순':' 상순')};
const nationalTick=t=>[3,6,9,10,11].includes(date(t).month)&&date(t).half===1;
function sync(g){g.year=date(g.clock).year;g.age=g.year-(g.birthYear??2011);g.form=clamp(g.form,15,95);g.fitness=clamp(g.fitness,25,100)}
const level=p=>Math.min(20,1+Math.floor(p.axp/200));
function recalc(p){p.stats={};for(const [k,c]of Object.entries(ATTR))p.stats[k]=round(c.items.reduce((s,[id])=>s+p.details[id],0)/c.items.length)}
function overall(p){
 const weights=D.OVERALL_WEIGHTS[p.pos];
 return Math.round(Object.entries(weights).reduce((sum,[id,weight])=>sum+(Number(p.details[id])||0)*weight,0));
}
const effective=g=>Math.round(clamp(overall(g.player)+(g.form-50)/20+(g.morale-60)/25-(100-g.fitness)/18,20,99));
const groupKeys=p=>p.pos==='GK'?['gk','pace','pass','tech','fit']:keys.filter(k=>k!=='gk');
const eligibleArch=pos=>Object.entries(ARCH).filter(([,a])=>a.pos.includes(pos));
const NAMES=['강우진','류연화','김도윤','이서준','정지호','박시온','한유찬','윤재희'];
function talentBonus(talentId,group,id,pos){
 if(talentId==='dribbler'&&['pass','tech'].includes(group))return 6;
 if(talentId==='physical'&&['pace','fit'].includes(group))return 7;
 if(talentId==='calm'&&(id==='composure'||id===(pos==='GK'?'gkPosition':['CB','FB'].includes(pos)?'tackle':'finishing')))return 4;
 if(talentId==='late')return -4;
 if(talentId==='ready')return 4;
 if(talentId==='tactical'&&(['vision','marking','positioning'].includes(id)||pos==='GK'&&id==='gkPosition'))return 4;
 return 0;
}
function dayAt(t){const d=date(t);return Math.floor(Date.UTC(d.year,d.month-1,d.half?16:1)/86400000)}
function fixtureDay(g,f){const d=date(f.t??g.clock);return f.day!==undefined?Math.floor(Date.UTC(d.year,(f.month??d.month)-1,f.day)/86400000):dayAt(f.t??g.clock)+(f.offset||0)}
function health(g){if(!g.health)g.health={injuries:[],suspension:0,lastMatchDay:null};return g.health}
function injuryAt(g,day=dayAt(g.clock)){return health(g).injuries.find(i=>i.start<=day&&i.until>day)||null}
function injuryDays(g){const i=injuryAt(g);return i?Math.max(0,i.until-dayAt(g.clock)):0}
function recover(g,day){
 const state=health(g),from=state.recoveryDay??dayAt(g.clock),days=Math.max(0,day-from);
 if(day<from)return;
 const load=D.INTENSITIES[g.intensity]?.mult||1,daily=load===2?.35:load===.5?.90:.65;
 const ageRate=clamp(1-Math.max(0,g.age-24)*.018,.64,1);
 g.fitness=clamp(g.fitness+days*daily*ageRate,15,100);state.recoveryDay=day;
}
const matchCondition=g=>clamp((g.form-50)*.08+(g.morale-60)*.035-(100-g.fitness)*.13,-13,5);
const playingSkill=(g,weights)=>clamp(skill(g.player,weights)+matchCondition(g),10,99);
function binomial(g,n,p){let total=0;for(let i=0;i<Math.max(0,Math.floor(n));i++)if(rand(g)<clamp(p,0,1))total++;return total}
function skill(p,weights){const total=Object.values(weights).reduce((s,w)=>s+w,0);return Object.entries(weights).reduce((s,[key,w])=>s+p.details[key]*w,0)/total}
function injuryRisk(g){
 const d=g.player.details,fatigue=clamp((100-g.fitness)/100,0,1),age=1+Math.max(0,g.age-28)*.045;
 const protection=clamp(1.35-(d.stamina*.55+d.balance*.25+d.strength*.20)/135,.55,1.25);
 return clamp(.012*(D.INTENSITIES[g.intensity]?.mult||1)*(1+fatigue*2.2)*age*protection*(talent(g.player).injury||1),.002,.10);
}
function injure(g,day,source){
 const types=[['ankle','발목 염좌',7,24,45],['muscle','근육 부상',10,35,34],['hamstring','햄스트링 부상',21,56,17],['knee','무릎 부상',60,120,4]];
 let roll=rand(g)*100,type=types[0];for(const t of types){roll-=t[4];if(roll<0){type=t;break}}
 const days=int(g,type[2],type[3]),entry={type:type[0],name:type[1],start:day,until:day+days,days,source};
 health(g).injuries.push(entry);g.period.events.push(type[1]+' · '+days+'일 회복');return entry;
}
function trainingLedger(g){
 if(!g.period.development){g.period.development={cursor:g.clock,before:{...g.player.details},training:{},matches:{},national:{},aging:{},injuredDays:0,healthyDays:0};}
 return g.period.development;
}
function injuryOverlap(g,from,to){
 const ranges=health(g).injuries.filter(i=>i.until>from&&i.start<to).map(i=>[Math.max(from,i.start),Math.min(to,i.until)]).sort((a,b)=>a[0]-b[0]);
 let total=0,end=from;for(const [a,b]of ranges){if(b>end){total+=b-Math.max(a,end);end=b}}return total;
}
function addDevelopment(g,id,delta,source){
 if(!delta||!activeAttributes(g.player).includes(id))return;
 const p=g.player,before=p.details[id],limit=99;
 if(delta>0){delta*=career()?.growthScale(g)||1;if(before>=99)return;}
 p.details[id]=Math.round(clamp(before+delta,10,limit)*1000)/1000;
 const ledger=trainingLedger(g),group=ledger[source];group[id]=(group[id]||0)+(p.details[id]-before);
}
function settleDevelopment(g,to){
 const ledger=trainingLedger(g);if(to<=ledger.cursor)return;
 const start=dayAt(ledger.cursor),end=dayAt(to),days=end-start,missed=injuryOverlap(g,start,end),available=days-missed,years=days/365.25;
 ledger.cursor=to;ledger.injuredDays+=missed;ledger.healthyDays+=available;
 const p=g.player,plan=trainingOptions(g).find(t=>t.id===g.training)||trainingOptions(g)[0],phase=agePhase(g.age),mult=D.INTENSITIES[g.intensity].mult;
 const intensity=mult===2?1.65:mult===.5?.6:1,load=clamp(.7+g.fitness/300,.7,1.05);
 for(const id of activeAttributes(p)){
  const type=growthType(id),target=plan.id!=='balanced'&&plan.keys.includes(id),age=g.age;
  let aging=0;
  if(type==='physical'&&age>=30)aging=(.75+(age-30)*.22)*years*(target?.58:1);
  if(type==='technique'&&age>=33)aging=(.22+(age-33)*.15)*years*(target?.8:1);
  if(type==='mental'&&age>=36)aging=(.15+(age-36)*.14)*years;
  if(!g.period.legacyTraining){
   let base=phase[type];if(type==='physical'&&age>=30)base=0;
   if(type==='technique'&&age>=33)base=0;if(type==='mental'&&age>=36)base=0;
   const injuryAvailability=type==='mental'?(available+missed*.65)/days:(available+missed*.08)/days;
   const focus=p.focus.includes(id)?1.25:1,arch=ARCH[p.archetypeId].keys.includes(id)?1.12:1;
   const planRate=plan.id==='weak'?.35:plan.id==='balanced'?1:target?1.65:.65;
   addDevelopment(g,id,base*years*intensity*load*injuryAvailability*planRate*focus*arch*growthMultiplier(p)*(career()?.trainingBuff(g)||1)*(.92+rand(g)*.16),'training');
   if(aging)addDevelopment(g,id,-aging,'aging');
  }
 }
 if(plan.id==='weak'&&!g.period.legacyTraining){p.weakFoot=clamp(p.weakFoot+(available+missed*.08)/365.25*45*intensity,0,100);p.weakFoot=Math.round(p.weakFoot*100)/100;}
 xp(g,Math.round(available/365.25*180));recalc(p);unlock(g);updateTrainingReview(g);
}
function developmentSummary(values){const result={physical:0,technique:0,mental:0};for(const [id,value]of Object.entries(values))result[growthType(id)]+=value;for(const k in result)result[k]=round(result[k]);return result}
function updateTrainingReview(g){
 const ledger=trainingLedger(g),plan=trainingOptions(g).find(t=>t.id===g.training)||trainingOptions(g)[0];
 g.period.trainingReview={phase:agePhase(g.age).name,plan:plan.name,intensity:D.INTENSITIES[g.intensity].name,summary:developmentSummary(ledger.training),experience:developmentSummary(ledger.matches),national:developmentSummary(ledger.national),aging:developmentSummary(ledger.aging),injuredDays:Math.round(ledger.injuredDays),healthyDays:Math.round(ledger.healthyDays),weakGain:round(g.player.weakFoot-(g.period.weakStart??g.player.weakFoot))};
}
function matchDevelopment(g,m,isNational=false){
 if(!m.minutes)return;
 const p=g.player,time=m.minutes/90;
 const units={speed:time*.5,positioning:time*.5+m.shots*.25,finishing:m.shots*.4+m.goals,vision:m.keyPasses*.5+m.assists,passing:m.completed/25,agility:time*.4+m.dribbles*.12,balance:time*.4+m.dribbles*.12,reactions:time*.5,dribbling:m.dribbles*.5,composure:time*.5+Math.min(m.goals+m.assists,.8),marking:time*.6+m.interceptions*.2,tackle:m.tackles*.5,interceptions:m.interceptions*.5,jumping:time*.35,stamina:time*.6,strength:time*.35,aggression:time*.3};
 if(p.pos==='GK')Object.assign(units,{diving:m.saves*.45,reflexes:m.saves*.55,handling:m.claims*.5,gkPosition:time*.7+m.saves*.2,kicking:m.completed/18});
 for(const id of activeAttributes(p)){
  const type=growthType(id);if(type==='physical'&&g.age>=30||type==='technique'&&g.age>=33||type==='mental'&&g.age>=36)continue;
  const ageRate=type==='physical'?(g.age<=21?1:.25):type==='technique'?(g.age<=29?1:.25):(g.age<=35?1:.2);
  addDevelopment(g,id,(units[id]||0)*.022*ageRate*growthMultiplier(p)*(career()?.lateBonus(g)||1),isNational?'national':'matches');
 }
 recalc(p);xp(g,Math.round(8+time*10+m.goals*3+m.assists*2));unlock(g);updateTrainingReview(g);
}
function appearance(g,teamPower,day,national=false){
 const state=health(g),existing=injuryAt(g,day);
 if(existing)return{started:false,from:0,to:0,minutes:0,injured:true,status:'부상 결장',injury:existing};
 if(!national&&state.suspension>0){state.suspension--;return{started:false,from:0,to:0,minutes:0,injured:false,status:'징계 결장'};}
 const startChance=clamp(.67+(effective(g)-teamPower)*.027+(g.trust-60)*.006-(g.fitness<60?(60-g.fitness)*.01:0)+(national?0:career()?.roleEffect(g)||0),.08,.98);
 const started=rand(g)<startChance;
 const substitute=!started&&rand(g)<(g.player.pos==='GK'?.025:.63+(effective(g)-teamPower)*.007);
 let from=started?0:substitute?int(g,52,82):0,to=started||substitute?90:0;
 if(started&&g.player.pos!=='GK'&&rand(g)>.55+g.player.details.stamina/250)to=int(g,58,84);
 let injury=null,red=0,yellow=0;
 if(to>from){
  if(rand(g)<injuryRisk(g)*(to-from)/90){injury=injure(g,day,'경기');to=Math.min(to,int(g,Math.max(from+1,10),Math.max(from+1,to)));}
  const aggression=g.player.details.aggression,composure=g.player.details.composure;
  yellow=rand(g)<clamp(.05+aggression/450-composure/1000,.03,.30)?1:0;
  if(rand(g)<clamp(.006+aggression/10000-composure/15000,.003,.018)){red=1;to=Math.min(to,int(g,from+1,to));if(!national)state.suspension=1;}
 }
 const minutes=Math.max(0,to-from),status=injury?'부상 교체':red?'퇴장':minutes===0?'벤치 대기':started?'선발 출전':'교체 출전';
 return{started,from,to,minutes,injured:!!injury,status,injury,red,yellow};
}
function shootSide(g,attackPower,defensePower,count,context={}){
 const shots=[];for(let i=0;i<count;i++){
  const minute=int(g,1,90),active=context.app&&minute>context.app.from&&minute<=context.app.to;
  const player=active&&!context.opp&&rand(g)<context.share;
  const precision=player?playingSkill(g,{finishing:.60,composure:.25,positioning:.15}):attackPower;
  const onChance=clamp(.22+precision*.005-defensePower*.001,.18,.82);
  let keeper=defensePower;
  if(context.opp&&active&&g.player.pos==='GK')keeper=playingSkill(g,{reflexes:.32,diving:.23,gkPosition:.25,handling:.20});
  const finishing=player?playingSkill(g,{finishing:.65,composure:.20,positioning:.15}):attackPower;
  let goalChance=clamp(.29+(finishing-keeper)*.004,.07,.66);
  if(player)goalChance=clamp(goalChance*context.effects.goal,.05,.8);
  const on=rand(g)<onChance,goal=on&&rand(g)<goalChance;
  shots.push({minute,player,on,goal,xg:onChance*goalChance,active});
 }return shots.sort((a,b)=>a.minute-b.minute);
}
function simulateAppearance(g,ownPower,opponentPower,day,ownHome=true,neutral=false,national=false){
 recover(g,day);
 const app=appearance(g,ownPower,day,national),e=app.minutes?effects(g):{attack:1,defend:1,goal:1,assist:1,fitness:1},p=g.player,time=app.minutes/90;
 const attack=playingSkill(g,{positioning:.22,finishing:.20,dribbling:.20,speed:.12,vision:.14,passing:.12});
 const defense=playingSkill(g,{marking:.25,tackle:.23,interceptions:.25,reactions:.12,strength:.15});
 const ownAttack=ownPower+(attack-ownPower)*time*(['ST','WG','MF'].includes(p.pos)?.20:.08),ownDefense=ownPower+(defense-ownPower)*time*(['CB','FB','MF'].includes(p.pos)?.22:.06);
 const homeBonus=neutral?0:ownHome?1.2:-.4;
 const ownShots=Math.min(32,poisson(g,clamp(9.5+(ownAttack-opponentPower)*.13+homeBonus,3,20)/3)+poisson(g,clamp(9.5+(ownAttack-opponentPower)*.13+homeBonus,3,20)/3)+poisson(g,clamp(9.5+(ownAttack-opponentPower)*.13+homeBonus,3,20)/3));
 const oppositionMean=clamp(9.5+(opponentPower-ownDefense)*.13-homeBonus,3,20)/e.defend;
 const opponentShots=Math.min(32,poisson(g,oppositionMean/3)+poisson(g,oppositionMean/3)+poisson(g,oppositionMean/3));
 const role={ST:.40,WG:.27,MF:.15,CB:.055,FB:.075,GK:0}[p.pos];
 const share=clamp(role*(.5+playingSkill(g,{positioning:.45,speed:.2,dribbling:.2,composure:.15})/100)*(p.tactic==='attack'?1.12:p.tactic==='defense'?.75:1),0,.65);
 const ownEvents=shootSide(g,ownAttack*e.attack,opponentPower,ownShots,{app,share,effects:e});
 const oppEvents=shootSide(g,opponentPower,ownDefense,opponentShots,{app,opp:true,share:0,effects:e});
 const own=ownEvents.filter(s=>s.goal).length,opp=oppEvents.filter(s=>s.goal).length,personal=ownEvents.filter(s=>s.player);
 const assistShare={ST:.17,WG:.33,MF:.43,CB:.075,FB:.24,GK:.008}[p.pos]*(.4+playingSkill(g,{vision:.55,passing:.35,composure:.1})/110)*e.assist;
 let assists=0;for(const s of ownEvents)if(s.goal&&!s.player&&s.active&&rand(g)<assistShare)assists++;
 const goals=personal.filter(s=>s.goal).length,onTarget=personal.filter(s=>s.on).length;
 const passRate={ST:.35,WG:.48,MF:.76,CB:.48,FB:.55,GK:.25}[p.pos];
 const passes=app.minutes?Math.max(assists,Math.round(app.minutes*passRate*(.8+rand(g)*.4))):0;
 const passSkill=p.pos==='GK'?playingSkill(g,{kicking:.5,passing:.3,vision:.2}):playingSkill(g,{passing:.7,composure:.2,vision:.1});
 const completed=Math.max(assists,binomial(g,passes,clamp(.47+passSkill*.005-opponentPower*.0005,.45,.96)));
 const keyPasses=Math.min(completed,Math.max(assists,binomial(g,poisson(g,time*(p.pos==='MF'?3:p.pos==='WG'?2.3:1)),clamp((p.details.vision+matchCondition(g))/110,.1,.9))));
 const dribbleAttempts=p.pos==='GK'?0:poisson(g,time*({ST:3,WG:6,MF:3,CB:.7,FB:2.5}[p.pos]));
 const dribbles=binomial(g,dribbleAttempts,clamp(.25+playingSkill(g,{dribbling:.5,agility:.3,balance:.2})/180-opponentPower/550,.18,.85));
 const tackleAttempts=p.pos==='GK'?0:poisson(g,time*({ST:1,WG:1.4,MF:3.2,CB:5.2,FB:4.3}[p.pos]));
 const tackles=binomial(g,tackleAttempts,clamp(.25+playingSkill(g,{tackle:.5,marking:.2,strength:.15,reactions:.15})/180-opponentPower/500,.15,.9));
 const interceptions=p.pos==='GK'?0:binomial(g,poisson(g,time*(p.pos==='CB'?4:p.pos==='FB'||p.pos==='MF'?3:1.3)),clamp(playingSkill(g,{interceptions:.65,marking:.2,reactions:.15})/130,.15,.85));
 const activeOpp=oppEvents.filter(s=>s.active),conceded=activeOpp.filter(s=>s.goal).length;
 const saves=p.pos==='GK'?activeOpp.filter(s=>s.on&&!s.goal).length:0;
 const claims=p.pos==='GK'?binomial(g,poisson(g,time*2.5),clamp(playingSkill(g,{handling:.65,gkPosition:.25,strength:.1})/110,.2,.94)):0;
 const clean=app.minutes>=60&&conceded===0?1:0;
 let score=6.1+(rand(g)-.5)*.45;
 if(app.minutes){
  if(p.pos==='GK'){const faced=activeOpp.filter(s=>s.on).length;score+=saves*.16+claims*.08-conceded*.48+(faced>=3?(saves/faced-.65)*1.2:0)+clean*.45;}
  else score+=goals*.82+assists*.52+keyPasses*.07+dribbles*.045+tackles*.06+interceptions*.06+(passes?(completed/passes-.75)*.8:0)+(clean&&['CB','FB'].includes(p.pos)?.4:0);
  score+=(own>opp?.12:own<opp?-.15:0)-(app.red?.9:0);
 }
 return{...app,own,opp,goals,assists,shots:personal.length,onTarget,passes,completed,keyPasses,dribbleAttempts,dribbles,tackleAttempts,tackles,interceptions,claims,saves,conceded,clean,rating:app.minutes?round(clamp(score,3,10)):0,teamShots:ownShots,teamOnTarget:ownEvents.filter(s=>s.on).length,opponentShots,opponentOnTarget:oppEvents.filter(s=>s.on).length,facedOnTarget:activeOpp.filter(s=>s.on).length,xg:round(personal.reduce((n,s)=>n+s.xg,0)),matchDay:day,modelVersion:3};
}
function rollCandidate(g,pos,talentId){
 const a=pick(g,eligibleArch(pos)),details={};
 const normal=(lo,hi)=>lo+(hi-lo)*(rand(g)+rand(g)+rand(g))/3;
 const height=Math.round(normal(...FootballCareerData.HEIGHT[pos])),weight=Math.round(height*height/10000*normal(...FootballCareerData.BMI[pos]));
 const quality=normal(-4,5),groupForm=Object.fromEntries(keys.map(k=>[k,normal(-5,5)]));
 const roleBase={ST:{shoot:53},MF:{pass:53},CB:{def:53,fit:48},FB:{pace:50,def:50,pass:48,fit:48}}[pos]||{};
 for(const[k,v]of Object.entries(ATTR)){const base=pos==='GK'?(k==='gk'?48:34):(k==='gk'?22:roleBase[k]??44);for(const[id]of v.items){const body=id==='strength'?(weight-72)*.10:id==='jumping'?(height-178)*.08:id==='agility'||id==='speed'?-(height-178)*.035:0;details[id]=round(clamp(base+quality+groupForm[k]+normal(-7,8)+body+(a[1].keys.includes(id)?5:0)+talentBonus(talentId,k,id,pos),10,75));}}
 const p={pos,details,height,weight,archetypeId:a[0],potential:99,talentId,label:TALENTS[talentId].name,weakFoot:talentId==='ambidextrous'?100:15};recalc(p);return p;
}
function makeCandidate(pos,seed,talentId){if(!POS[pos]||!TALENTS[talentId])throw Error('잘못된 재능 또는 포지션입니다.');return rollCandidate({seed:seed>>>0},pos,talentId)}
function candidates(pos,seed,previous=[]){const g={seed:seed>>>0},types=Object.keys(TALENTS);let order=shuffle(g,types).slice(0,3);if(order.every(t=>previous.some(c=>c.talentId===t||c.label===TALENTS[t].name)))order[0]=types.find(t=>!order.includes(t));return order.map(id=>rollCandidate(g,pos,id))}
const talent=p=>TALENTS[p.talentId]||{name:'기존 선수',short:'기존 능력치 유지',desc:'이전 기록에는 재능 종류가 저장되지 않았습니다. 기존 능력치를 이어서 사용하며, 새로운 재능 선택은 새 선수부터 적용됩니다.'};
const growthMultiplier=p=>talent(p).growth||1;

const activeAttributes=p=>D.POSITION_ATTRIBUTES[p.pos].flatMap(s=>s.keys);
const attributeName=id=>Object.values(ATTR).flatMap(c=>c.items).find(a=>a[0]===id)?.[1]||id;
const growthType=id=>Object.keys(D.GROWTH_TYPES).find(k=>D.GROWTH_TYPES[k].includes(id));
const agePhase=age=>D.AGE_PHASES.find(p=>age<=p.max)||D.AGE_PHASES[2];
const trainingOptions=g=>{
 const p=g.player,all=activeAttributes(p),isOld=g.age>=30;
 return[
  {id:'balanced',name:'맞춤 종합 훈련',desc:'현재 나이에 맞춰 모든 능력을 고르게',keys:all},
  {id:'core',name:p.pos==='GK'?'골키퍼 전용 훈련':POS[p.pos].name+' 핵심 훈련',keys:D.POSITION_ATTRIBUTES[p.pos][0].keys},
  {id:'physical',name:isOld?'피지컬 유지 훈련':'피지컬 훈련',desc:isOld?'성장 없이 신체 능력의 하락을 방지':'속도와 몸의 기본 능력을 집중 강화',keys:all.filter(id=>growthType(id)==='physical')},
  {id:'technique',name:'발밑 기술 훈련',keys:all.filter(id=>['finishing','passing','dribbling','tackle','kicking'].includes(id))},
  {id:'judgement',name:'판단 · 전술 훈련',keys:all.filter(id=>growthType(id)==='mental')},
  {id:'weak',name:'약발 훈련',desc:'주발 반대쪽 발의 숙련도를 높입니다',keys:[]}
 ];
};
const normaliseFocus=(p,values=[])=>{
 const all=activeAttributes(p),out=[];
 for(const value of values){const id=all.includes(value)?value:all.find(k=>ATTR[value]?.items.some(a=>a[0]===k)&&!out.includes(k));if(id&&!out.includes(id))out.push(id);if(out.length===2)break}
 return out;
};
function autoGrow(g,amount){
 const p=g.player,all=activeAttributes(p).filter(id=>g.age<30||growthType(id)!=='physical');
 const preferred=g.age<=21?'physical':g.age<=29?'technique':'mental';
 const focus=normaliseFocus(p,p.focus).filter(id=>all.includes(id));
 const priority=[...focus,...focus,...ARCH[p.archetypeId].keys.filter(id=>all.includes(id)),...all.filter(id=>growthType(id)===preferred),...all];
 let cursor=p.growthCursor||0;
 for(let n=0;n<amount;n++){
  let id;for(let tries=0;tries<priority.length;tries++){const key=priority[cursor++%priority.length];if(p.details[key]<99){id=key;break}}
  if(!id)break;p.details[id]=Math.round(Math.min(99,p.details[id]+growthMultiplier(p)*(career()?.growthScale(g)||1))*100)/100;
 }
 p.growthCursor=cursor;recalc(p);
}
function train(g){
 if(g.period.trained)return;
 g.period.trained=true;trainingLedger(g);g.period.weakStart=g.player.weakFoot;
 updateTrainingReview(g);
}

function migrate(g){
 if(!g||g.version!==2||!g.player)return false;
 const p=g.player;let changed=false,unused=0;
 if(p.pos==='DF'){p.previousPosition='DF';p.pos=p.archetypeId==='marauder'?'FB':'CB';changed=true}
 if(p.attributeVersion!==3){
  const old={...p.details},average=(names,fallback=40)=>{const vals=names.map(k=>old[k]).filter(Number.isFinite);return vals.length?round(vals.reduce((a,b)=>a+b,0)/vals.length):fallback};
  p.previousAttributes={details:old,points:p.points||0};
  const combined={speed:average(['speed','acceleration','sprint']),passing:average(['passing','shortPass','longPass','crossing','freeKick']),dribbling:average(['dribbling','ballControl']),tackle:average(['tackle','slide'])};
  p.details=Object.fromEntries(Object.values(ATTR).flatMap(c=>c.items.map(([id])=>[id,clamp(combined[id]??old[id]??40,10,99)])));
  const aliases={'균형 잡힌 재능':'ordinary','기술 집중형':'dribbler','피지컬 유망주':'physical','침착한 승부사':'calm','대기만성형':'late','즉시 전력형':'ready','빠른 성장형':'fast','전술 이해형':'tactical'};
  p.talentId=TALENTS[p.talentId]?p.talentId:aliases[p.label]||'legacy';p.attributeVersion=3;
  p.equipped=(p.equipped||[]).filter(id=>STYLES[id]);p.unlocked=(p.unlocked||[]).filter(id=>STYLES[id]);
  unused=Math.max(0,Math.floor(p.points||0));delete p.points;recalc(p);changed=true;
 }
 if(g.developmentVersion!==2){
  p.previousFocus=[...(p.focus||[])];p.focus=normaliseFocus(p,p.focus);
  const plans={gk:'core',pace:'physical',fit:'physical',shoot:'technique',pass:'technique',tech:'technique',def:'judgement'};
  g.training=plans[g.training]||g.training;
  if(!trainingOptions(g).some(t=>t.id===g.training))g.training='balanced';
  if(!D.INTENSITIES[g.intensity])g.intensity='normal';
  if(!D.TACTICS[p.tactic])p.tactic='balanced';
  g.birthYear=Number.isFinite(g.birthYear)?g.birthYear:g.year-g.age;
  g.startYear=Number.isFinite(g.startYear)?g.startYear:g.birthYear+15;
  g.era=g.era||'legacy';g.developmentVersion=2;changed=true;
 }
 if(p.styleVersion!==2){p.previousEquipped=[...(p.equipped||[])];p.plusChoices=[];p.styleVersion=2;changed=true}
 if(g.youthVersion!==1){
  g.youthVersion=1;g.youthCups=g.youthCups||{};g.youthKnockoutFrom=g.period?.trained?g.target:g.clock;
  g.startOrigin=g.startOrigin||{kind:g.middleSchoolId?'school':'legacy',id:g.middleSchoolId||null,name:school(g.middleSchoolId)?.name||'기존 시작 기록'};changed=true;
 }
 if(g.simulationVersion!==3){
  health(g);g.simulationVersion=3;changed=true;
  if(g.period?.trained)g.period.legacyTraining=true;
  if(g.period){trainingLedger(g);g.period.weakStart=g.player.weakFoot;g.period.previousStartOvr=g.period.startOvr;g.period.startOvr=overall(p);}
  recalc(p);
 }
 if(career()?.migrate(g))changed=true;
 if(unused)autoGrow(g,Math.min(unused,10000));if(changed)unlock(g,false);return changed;
}
function blankStats(){return{apps:0,starts:0,minutes:0,goals:0,assists:0,clean:0,saves:0,tackles:0,shots:0,onTarget:0,passes:0,completed:0,keyPasses:0,dribbleAttempts:0,dribbles:0,tackleAttempts:0,interceptions:0,claims:0,conceded:0,yellow:0,red:0,injuredGames:0,suspensions:0,ratingSum:0}}
function newPeriod(g){g.target=date(g.clock).month<7?tick(g.year,7):tick(g.year+1,1);g.period={...blankStats(),start:g.clock,end:g.target,club:teamName(g),clubId:g.clubId,stage:g.stage,country:g.country,matches:[],events:[],growth:0,startOvr:overall(g.player),trained:false,activations:{}};g.phase='ready';trainingLedger(g);g.period.weakStart=g.player.weakFoot;delete g.marketStep;delete g.pendingScouting;g.camp=null;g.offers=[];career()?.startPeriod(g);}
function create(data,c,seed){
 if(!data.name.trim()||!POS[data.pos]||!['left','right'].includes(data.foot))throw Error('이름과 주발, 포지션을 확인해 주세요.');
 const aid=ARCH[data.archetypeId]?.pos.includes(data.pos)?data.archetypeId:c.archetypeId;
 const p={name:data.name.trim().slice(0,16),number:clamp(Math.trunc(Number(data.number)||1),1,99),pos:data.pos,foot:data.foot,height:c.height,weight:c.weight,details:{...c.details},archetypeId:aid,potential:99,talentId:c.talentId,attributeVersion:3,axp:0,weakFoot:c.talentId==='ambidextrous'?100:15,equipped:[],unlocked:[],focus:[],tactic:D.TACTICS[data.tactic]?data.tactic:'balanced'};
 p.focus=normaliseFocus(p,data.focus);ARCH[aid].keys.forEach(k=>p.details[k]=clamp(p.details[k]+4,1,99));recalc(p);
 const origin=assignStart(seed),selectedSchool=origin.kind==='school'?school(origin.id):null;
 const g={version:2,developmentVersion:2,era:'2000',startYear:D.START_YEAR,birthYear:D.START_YEAR-15,id:'FC-'+(seed>>>0).toString(36).toUpperCase(),seed:origin.seed,clock:tick(D.START_YEAR,3),year:D.START_YEAR,age:15,stage:selectedSchool?'middle':'academy',country:origin.country,clubId:origin.id,middleSchoolId:selectedSchool?.id||null,academyStart:selectedSchool?null:D.START_YEAR,player:p,training:'balanced',intensity:'normal',form:50,morale:65,fitness:100,trust:60,reputation:0,wage:0,contract:0,income:0,history:[],champions:[],journey:[],national:[],worlds:{},trophies:[],graduationRolled:false,retired:false,youthVersion:1,youthKnockoutFrom:tick(D.START_YEAR,3),youthCups:{},startOrigin:origin};
 p.styleVersion=2;p.plusChoices=[];g.simulationVersion=3;health(g);
 career()?.initialise(g);newPeriod(g);unlock(g);return g;
}
function assignStart(seed){
 const rng={seed:seed>>>0},abroad=rand(rng)<D.START_ABROAD_CHANCE;
 const team=abroad?club(pick(rng,D.FOREIGN_ACADEMIES)):pick(rng,D.START_SCHOOLS);
 return{kind:abroad?'abroad':'school',id:team.id,name:team.name+(abroad?' 유스':''),country:team.country,basis:team.basis||'',rare:abroad,seed:rng.seed};
}
function teamName(g){
 if(g.stage==='service')return '현역 복무';
 const s=school(g.clubId);
 if(s){const parent=g.stage==='academy'?academyParent(g):null;return schoolName(s,g.year)+(parent?' · '+parent.name+' U18':' 축구부')}
 if(g.stage==='middle')return'지역 중학교 U15';
 const c=club(g.clubId,g);if(!c)return'소속팀 없음';
 return g.stage==='academy'?(c.school?c.school+' · '+c.name+' U18':c.name+' U18'):c.name;
}
function stageName(g){return g.stage==='university'?'대학교 '+clamp(g.year-(g.routeStart??g.year)+1,1,4)+'학년':g.stage==='semipro'?(g.military?.status==='service'?'상무 선수':'실업 선수'):g.stage==='service'?'현역 복무':g.stage==='middle'?'중학교 3학년':g.stage==='academy'?(g.country==='KR'?'고등학교 '+clamp(g.year-g.academyStart+1,1,3)+'학년':'해외 유스'):'프로 선수'}
function xp(g,n){const before=level(g.player);g.player.axp+=n;if(level(g.player)>before&&g.period)g.period.events.push('아키타입 Lv.'+level(g.player));unlock(g)}
const availableStyles=p=>Object.values(STYLES).filter(s=>p.pos==='GK'?s.category==='골키퍼'||['패스','피지컬','볼 컨트롤'].includes(s.category):s.category!=='골키퍼');
const meets=(p,requirements)=>requirements.every(([key,min])=>Number(p.details[key])>=min);
const styleProgress=(p,id)=>STYLES[id].requirements.reduce((sum,[key,min])=>sum+Math.min(1,p.details[key]/min),0)/STYLES[id].requirements.length;
const plusOptions=p=>{
 const a=ARCH[p.archetypeId],s=STYLES[a.style];
 return[{id:p.archetypeId+'-signature',name:'아키타입 대표 특성',style:a.style,level:5,requirements:FootballStyleRules.normalise([...s.requirements.map(([key,min])=>[key,Math.min(95,min+5)]),...a.keys.map(key=>[key,80])])},...D.PLUS_BRANCHES[p.archetypeId]];
};
const plusCapacity=p=>level(p)>=10?2:level(p)>=5?1:0;
const slots=p=>p.unlocked.length;
const plus=(p,id)=>plusOptions(p).some(o=>o.style===id&&(p.plusChoices||[]).includes(o.id));
function unlock(g,notify=true){
 const p=g.player;p.unlocked=p.unlocked||[];p.plusChoices=p.plusChoices||[];
 for(const s of availableStyles(p))if(!p.unlocked.includes(s.id)&&meets(p,s.requirements)){
  p.unlocked.push(s.id);
  if(notify&&g.period)g.period.events.push('플레이스타일 획득 · '+s.name+' · 경기 자동 적용');
 }
 p.unlocked=[...new Set(p.unlocked)].filter(id=>availableStyles(p).some(s=>s.id===id));p.equipped=[...p.unlocked];
}
function upgradePlus(g,id){
 if(!['ready','market'].includes(g.phase)||g.retired)return false;
 const p=g.player,option=plusOptions(p).find(o=>o.id===id);if(!option)return false;
 if(p.plusChoices.includes(id)){p.plusChoices=p.plusChoices.filter(v=>v!==id);return true}
 if(p.plusChoices.length>=plusCapacity(p)||level(p)<option.level||!p.unlocked.includes(option.style)||!meets(p,option.requirements)||plus(p,option.style))return false;
 p.plusChoices.push(id);return true;
}
function equip(){return false}
function effects(g){
 const e={goal:1,assist:1,attack:1,defend:1,fitness:1},sum={goal:0,assist:0,attack:0,defend:0,fitness:0};
 for(const id of g.player.equipped){const s=STYLES[id];sum[s.effect]+=s.value}
 const caps={goal:.45,assist:.55,attack:.20,defend:.30,fitness:.5};
 for(const key in sum)e[key]+=Math.min(sum[key],caps[key]);
 // Plus benefits are added after the basic-style cap; an upgrade always makes a difference.
 for(const id of g.player.equipped)if(plus(g.player,id)){const s=STYLES[id];e[s.effect]+=s.value*.7}
 if(g.player.weakFoot>=85){e.goal+=.05;e.assist+=.05}if(g.player.tactic==='attack'){e.goal+=.10;e.defend-=.025}if(g.player.tactic==='defense'){e.defend+=.06;e.goal-=.08}if(g.player.tactic==='team'){e.assist+=.12;e.goal-=.04}return e;
}

const usesYouthCups=g=>['middle','academy'].includes(g.stage)&&g.youthVersion===1&&g.clock>=g.youthKnockoutFrom;
const roundName=n=>n===2?'결승':n===4?'4강':n+'강';
const stableSeed=text=>{let value=2166136261;for(const ch of text)value=Math.imul(value^ch.charCodeAt(0),16777619);return value>>>0};
function youthSeason(g){
 const year=g.year,id=g.country+'-'+year+'-'+g.stage;
 g.youthCups=g.youthCups||{};if(g.youthCups[id])return g.youthCups[id];
 const rng={seed:stableSeed(g.id+'-'+id)};
 let pool=g.country==='KR'?(g.stage==='middle'?D.MIDDLE_SCHOOLS:D.HIGH_SCHOOLS).map(s=>({id:s.id,name:schoolName(s,year)+' 축구부',power:s.power})):
  clubsFor(g).filter(c=>c.country===g.country).map(c=>({id:c.id,name:c.name+' U18',power:55+(c.power-65)*.8}));
 // Preserve an existing team's identity when migrating old careers, including old school aliases.
 if(!pool.some(c=>c.id===g.clubId))pool.push({id:g.clubId,name:teamName(g),power:48});
 const size=pool.length>=16?16:8,teams=shuffle(rng,pool).slice(0,size);
 if(!teams.some(c=>c.id===g.clubId))teams[size-1]=pool.find(c=>c.id===g.clubId);
 const cups=(g.country==='KR'?D.YOUTH_CUPS[g.stage]:D.YOUTH_CUPS.foreign).map(def=>{
  const draw=shuffle(rng,teams.map(c=>c.id));
  return{...def,id:id+'-'+def.id,year,country:g.country,kind:g.stage,time:tick(year,def.month,def.day>=16?1:0),size,complete:false,rounds:[{name:roundName(size),matches:Array.from({length:size/2},(_,i)=>({h:draw[i*2],a:draw[i*2+1],done:false}))}],teams};
 });
 return g.youthCups[id]={id,year,country:g.country,kind:g.stage,teams,cups};
}
function playYouthCup(g,cup,allowPlayer){
 const w={country:cup.country,year:cup.year,kind:cup.kind,neutral:true,teams:cup.teams,table:cup.teams.map(c=>({...c,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}))};
 const own=allowPlayer&&cup.teams.some(c=>c.id===g.clubId),played=[];
 for(let round=0;round<cup.rounds.length;round++){
  const stage=cup.rounds[round],winners=[];
  for(const f of stage.matches){
   f.t=cup.time;f.round=stage.name;f.day=cup.day+round*2;f.month=cup.month;const before=g.period.matches.length;
   runFixture(g,w,f,allowPlayer);
   if(f.x===f.y){
    f.penH=int(g,2,5);f.penA=int(g,2,5);if(f.penH===f.penA){if(rand(g)<.5)f.penH++;else f.penA++}
   }
   f.winner=f.x===f.y?(f.penH>f.penA?f.h:f.a):(f.x>f.y?f.h:f.a);winners.push(f.winner);
   if(g.period.matches.length>before){
    const m=g.period.matches.at(-1);m.competitionId=cup.id;m.competition=cup.name;m.round=stage.name;m.league=String(cup.year);
    m.cupDay=cup.day+round*2;m.cupMonth=cup.month;m.won=f.winner===g.clubId;
    if(f.x===f.y)m.shootout={own:m.home?f.penH:f.penA,opp:m.home?f.penA:f.penH};played.push(m);
   }
  }
  if(winners.length>1)cup.rounds.push({name:roundName(winners.length),matches:Array.from({length:winners.length/2},(_,i)=>({h:winners[i*2],a:winners[i*2+1],done:false}))});
  else cup.winner=winners[0];
 }
 cup.complete=true;
 if(own){
  const last=played.at(-1);cup.playerClub=g.clubId;cup.playerResult=cup.winner===g.clubId?'우승':last?.round==='결승'?'준우승':last?.round||'미출전';
  const record={...cup,club:teamName(g),result:cup.playerResult};
  (g.period.cups||(g.period.cups=[])).push(JSON.parse(JSON.stringify(record)));
  g.period.events.push(cup.name+' · '+cup.playerResult);
  if(cup.winner===g.clubId){g.trophies.push({year:cup.year,name:cup.name+' 우승',club:teamName(g)});g.reputation+=1}
 }
}
function processYouthCups(g){
 const season=youthSeason(g);
 for(const cup of season.cups)if(!cup.complete&&cup.time<=g.clock)playYouthCup(g,cup,cup.time===g.clock&&cup.time>=g.youthKnockoutFrom);
}
function rr(ids){let a=[...ids],rounds=[];for(let r=0;r<a.length-1;r++){let row=[];for(let i=0;i<a.length/2;i++)row.push(r%2?[a[a.length-1-i],a[i]]:[a[i],a[a.length-1-i]]);rounds.push(row);a=[a[0],a[a.length-1],...a.slice(1,-1)]}return rounds}
function leagueYear(country,t){const d=date(t);return country==='KR'?d.year:(d.month>=8?d.year:d.year-1)}
function leagueLabel(w){return w.country==='KR'?String(w.year):w.year+'/'+String(w.year+1).slice(-2)}
function makeWorld(g,country,year,kind='pro'){
 const id=country+'-'+year+'-'+kind;if(g.worlds[id])return g.worlds[id];
 const historical=g.era==='2000';let teams=clubsFor(g).filter(c=>c.country===country).map(c=>({id:c.id,name:c.name,power:c.power}));
 if(['university','semipro'].includes(kind))teams=FootballCareerData.CLUBS.filter(c=>c.kind===kind).map(c=>({...c,name:club(c.id,{...g,year}).name}));
 else if(historical&&kind==='middle')teams=D.MIDDLE_SCHOOLS.map(s=>({id:s.id,name:s.name+' 축구부',power:s.power}));
 else if(historical&&kind==='academy'&&country==='KR')teams=D.HIGH_SCHOOLS.map(s=>({id:s.id,name:schoolName(s,year)+' 축구부',power:s.power}));
 else if(kind!=='pro')teams=teams.slice(0,12).map(c=>({...c,name:(kind==='middle'?c.name:(club(c.id,g).school||c.name))+(kind==='middle'?' U15':' U18'),power:kind==='middle'?46+(c.power-65)*.55:55+(c.power-65)*.8}));
 if(!historical&&kind==='middle')teams[teams.length-1]={id:'MIDDLE',name:'지역 중학교 U15',power:48};
 const rounds=rr(teams.map(c=>c.id)),korean=country==='KR'&&kind==='pro',isK=korean&&!historical;
 let games=[...rounds,...rounds.map(r=>r.map(([h,a])=>[a,h]))];if(korean)games.push(...rounds);
 const start=country==='KR'?tick(year,3):tick(year,8),end=country==='KR'?tick(year,11,1):tick(year+1,5,1);let times=[];
 for(let t=start;t<=end;t++)if(!nationalTick(t))times.push(t);
 const regularTimes=isK?times.slice(0,-2):times;
 const fixtures=games.flatMap((r,i)=>r.map(([h,a])=>({t:regularTimes[Math.floor(i*regularTimes.length/games.length)],h,a,r:i+1,done:false})));
 const roundOffsets={};for(const fixture of fixtures){if(!(fixture.r in roundOffsets)){const prior=Object.keys(roundOffsets).filter(r=>fixtures.find(f=>f.r===Number(r)).t===fixture.t).length;roundOffsets[fixture.r]=Math.min(12,prior*7);}fixture.offset=roundOffsets[fixture.r];}
 const w={id,country,year,kind,teams,fixtures,table:teams.map(c=>({...c,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0})),isK,format:korean&&historical?'27-round-league':'league',split:false,splitTimes:times.slice(-2),complete:false,end};g.worlds[id]=w;return w;
}
function sortTable(w){return[...w.table].sort((a,b)=>(a.group||0)-(b.group||0)||b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf||a.name.localeCompare(b.name))}
function seasonWorld(g,country=g.country,kind=g.stage==='pro'?'pro':g.stage){const d=date(g.clock),year=country==='KR'&&d.month<=2?d.year-1:leagueYear(country,g.clock);return makeWorld(g,country,g.era==='2000'?Math.max(g.startYear,year):year,kind)}
function recordMatch(g,w,f,home,away,frame){
 const ownHome=f.h===g.clubId,oppId=ownHome?f.a:f.h;
 const m={...frame,fixtureId:w.id+'-'+f.r+'-'+f.h+'-'+f.a,date:g.clock,league:leagueLabel(w),country:w.country,clubId:g.clubId,kind:w.kind,club:teamName(g),opponentId:oppId,opponent:w.teams.find(c=>c.id===oppId).name,home:ownHome,own:ownHome?home:away,opp:ownHome?away:home};
 g.period.matches.push(m);
 const values={...m,apps:m.minutes?1:0,starts:m.started?1:0,ratingSum:m.rating,injuredGames:m.injured&&m.minutes===0?1:0,suspensions:m.status==='징계 결장'?1:0};
 for(const k of Object.keys(blankStats()))g.period[k]=(g.period[k]||0)+(Number(values[k])||0);
 if(m.minutes){
  matchDevelopment(g,m);g.trust=clamp(g.trust+(m.rating-6.4)*1.2,20,95);g.form=clamp(g.form+(m.rating-6.5)*1.8,20,95);g.reputation+=Math.max(0,(m.rating-6)*.12);
  const stamina=g.player.details.stamina,load=(m.minutes/90)*(8+(100-stamina)*.10)/effects(g).fitness;g.fitness=clamp(g.fitness-load,15,100);health(g).lastMatchDay=m.matchDay;
  for(const id of g.player.equipped)g.period.activations[id]=(g.period.activations[id]||0)+1;
 }return m;
}
function runFixture(g,w,f,allowPlayer=true){
 const a=w.table.find(c=>c.id===f.h),b=w.table.find(c=>c.id===f.a);
 const involved=allowPlayer&&g.country===w.country&&(g.stage==='pro'?'pro':g.stage)===w.kind&&(f.h===g.clubId||f.a===g.clubId);
 let x,y,frame;
 if(involved){const ownHome=f.h===g.clubId;frame=simulateAppearance(g,ownHome?a.power:b.power,ownHome?b.power:a.power,fixtureDay(g,f),ownHome,!!w.neutral);x=ownHome?frame.own:frame.opp;y=ownHome?frame.opp:frame.own;}
 else{x=poisson(g,clamp((w.neutral?1.3:1.4)+(a.power-b.power)*.045,.25,3.5));y=poisson(g,clamp((w.neutral?1.3:1.13)+(b.power-a.power)*.045,.2,3.3));}
 Object.assign(f,{done:true,x,y});a.p++;b.p++;a.gf+=x;a.ga+=y;b.gf+=y;b.ga+=x;
 if(x>y){a.w++;a.pts+=3;b.l++;}else if(x<y){b.w++;b.pts+=3;a.l++;}else{a.d++;b.d++;a.pts++;b.pts++;}
 if(involved)recordMatch(g,w,f,x,y,frame);
 if(w.kind==='pro')career()?.recordLeague(g,w,f,involved?frame:null);
}
function contributed(g,w,id){return [...g.history,g.period].some(r=>r.matches.some(m=>m.clubId===id&&m.kind===w.kind&&m.country===w.country&&m.league===leagueLabel(w)&&m.minutes>0))}
function runWorld(g,w,t){if(w.complete)return;for(const f of w.fixtures)if(!f.done&&f.t<=t)runFixture(g,w,f,f.t===t);if(w.isK&&!w.split&&w.fixtures.every(f=>f.done)){w.split=true;const sorted=sortTable(w);sorted.forEach((c,i)=>w.table.find(v=>v.id===c.id).group=i<6?0:1);for(let group=0;group<2;group++){const rs=rr(sorted.slice(group*6,group*6+6).map(c=>c.id));rs.forEach((r,i)=>r.forEach(([h,a])=>w.fixtures.push({t:w.splitTimes[Math.floor(i*w.splitTimes.length/5)],h,a,r:34+i,done:false})))}}
 if(w.fixtures.every(f=>f.done)&&(!w.isK||w.split)){w.complete=true;const tab=sortTable(w);if(w.kind==='pro'){g.champions.push({season:leagueLabel(w),country:w.country,year:w.year,winner:tab[0].name,runner:tab[1].name});if(g.stage==='pro'&&g.country===w.country&&g.clubId===tab[0].id&&contributed(g,w,tab[0].id)){g.trophies.push({year:date(t).year,name:leagueName(g,w.country)+' 우승',club:teamName(g)});g.period.events.push(leagueName(g,w.country)+' 우승!')}}else if(g.stage===w.kind&&g.clubId===tab[0].id&&contributed(g,w,tab[0].id)){g.trophies.push({year:date(t).year,name:w.kind==='middle'?'U15 리그 우승':'U18 리그 우승',club:teamName(g)});g.period.events.push('유스 리그 우승!')}}}
function processLeagues(g){for(const country of Object.keys(LEAGUES)){const y=leagueYear(country,g.clock);if(g.era==='2000'&&y<g.startYear)continue;const w=makeWorld(g,country,y);runWorld(g,w,g.clock);if(w.complete)career()?.awardSeason(g,w);}if(usesYouthCups(g))processYouthCups(g);else if(!['pro','service'].includes(g.stage))runWorld(g,seasonWorld(g),g.clock);for(const[id,w]of Object.entries(g.worlds))if(w.complete&&g.clock-w.end>24)delete g.worlds[id]}
const countryOpponents=['일본','호주','이란','우즈베키스탄','사우디아라비아','이라크','미국','멕시코','포르투갈','독일'];
function maybeCamp(g){
 if(!nationalTick(g.clock)||g.stage!=='pro'||g.age<17||overall(g.player)<69||injuryAt(g))return false;
 const chance=clamp(.18+(effective(g)-69)*.037+g.reputation*.004,.18,.92);if(rand(g)>chance)return false;
 g.phase='international';g.camp={date:g.clock,opponents:shuffle(g,countryOpponents).slice(0,2),matches:[],complete:false};return true;
}
function internationalMatch(g){
 if(g.phase!=='international'||g.camp.complete)return false;
 const opponent=g.camp.opponents[g.camp.matches.length],opponentPower={일본:73,호주:71,이란:73,우즈베키스탄:65,사우디아라비아:69,이라크:65,미국:74,멕시코:76,포르투갈:81,독일:84}[opponent]||72;
 const frame=simulateAppearance(g,72,opponentPower,dayAt(g.camp.date)+g.camp.matches.length*4,true,false,true),m={...frame,date:g.clock,opponent};
 g.camp.matches.push(m);
 if(m.minutes){g.national.push(m);matchDevelopment(g,m,true);g.fitness=clamp(g.fitness-9*m.minutes/90,15,100);health(g).lastMatchDay=m.matchDay;g.reputation+=.6;}
 g.camp.complete=g.camp.matches.length===2;return m;
}
function returnFromCamp(g){if(g.phase!=='international'||!g.camp.complete)return false;const appearances=g.camp.matches.filter(m=>m.minutes).length;g.period.events.push('대한민국 대표팀 · '+appearances+'경기 출전');g.phase='ready';return true}
function makeOffer(g,c,kind){
 const s=school(c.id),wage=kind==='pro'?Math.round(Math.max(1800,(overall(g.player)-48)**2*(c.country==='KR'?13:65))):0;
 const name=kind==='academy'?(s?teamName({...g,clubId:s.id,stage:'academy'}):c.school?c.school+' · '+c.name+' U18':c.name+' U18'):c.name;
 return{id:c.id+'-'+kind,clubId:c.id,kind,country:c.country,name,schoolTeam:!!s,wage,months:kind==='pro'?int(g,2,4)*12:36,role:overall(g.player)>=c.power?'주전 경쟁':'성장 기대주'};
}
function offers(g){
 const out=[],pool=clubsFor(g);
 if(g.stage==='middle'){
  if(date(g.clock).month===1){
   g.graduationRolled=true;
   const domestic=shuffle(g,g.era==='2000'?D.HIGH_SCHOOLS:pool.filter(c=>c.country==='KR'&&c.school&&c.id!=='KR-김천')).slice(0,3);
   domestic.forEach(c=>out.push(makeOffer(g,c,'academy')));g.overseasYouthOffer=rand(g)<.01;
   if(g.overseasYouthOffer){const candidates=pool.filter(c=>c.country!=='KR'&&(g.era!=='2000'||D.FOREIGN_ACADEMIES.includes(c.id))),foreign=pick(g,candidates).id;out.push({...makeOffer(g,club(foreign,g),'academy'),rare:true})}
  }else out.push({id:'stay',name:teamName(g)+'에서 하반기 계속하기',kind:'stay'});
 }else if(g.stage==='academy'){
  const graduated=g.year>=g.academyStart+3,early=g.age>=17&&overall(g.player)>=62,parent=academyParent(g);
  if(!graduated)out.push({id:'stay',name:teamName(g)+' 잔류',kind:'stay'});
  if(graduated||early){
   if(parent&&parent.id!=='KR-김천')out.push(makeOffer(g,parent,'pro'));
   const options=pool.filter(c=>c.id!=='KR-김천'&&c.id!==parent?.id&&(c.country==='KR'||(overall(g.player)>=68&&c.power<=overall(g.player)+12)));
   shuffle(g,options).slice(0,3).forEach(c=>out.push(makeOffer(g,c,'pro')));
  }
 }else{
  out.push({id:'stay',kind:'stay',name:club(g.clubId,g).name+(g.contract<=6?' · 재계약':' · 잔류'),wage:g.wage,months:g.contract<=6?24:g.contract});
  const options=pool.filter(c=>c.id!=='KR-김천'&&c.id!==g.clubId&&c.power<=overall(g.player)+12&&(c.country===g.country||c.country==='KR'||(overall(g.player)>=67&&g.reputation>=8)));
  shuffle(g,options).slice(0,4).forEach(c=>out.push(makeOffer(g,c,'pro')));
 }
 g.offers=career()?.extendOffers(g,out)||out;
}
function advance(g){
 if(g.phase!=='ready'||g.retired)return false;train(g);
 while(g.clock<g.target){
  if(g.lastProcessedClock!==g.clock){
   recover(g,dayAt(g.clock));
   if(!injuryAt(g)&&rand(g)<injuryRisk(g)*.22)injure(g,dayAt(g.clock),'훈련');
   processLeagues(g);g.lastProcessedClock=g.clock;
   if(maybeCamp(g))return 'international';
  }
  g.clock++;settleDevelopment(g,g.clock);sync(g);
 }
 const p=g.period;p.end=g.clock;p.endOvr=overall(g.player);p.growth=p.endOvr-p.startOvr;p.rating=p.apps?round(p.ratingSum/p.apps):0;
 p.rank=g.stage!=='pro'&&g.youthVersion===1?null:sortTable(seasonWorld(g)).findIndex(c=>c.id===g.clubId)+1;
 p.wage=Math.round(g.wage*(g.clock-p.start)/24);g.income+=p.wage;if(g.stage==='pro'||g.loan||g.military?.status==='service')g.contract=Math.max(0,g.contract-(g.clock-p.start)/2);
 career()?.finishPeriod(g,p);updateTrainingReview(g);g.history.push(JSON.parse(JSON.stringify(p)));g.phase='market';g.marketStep='review';career()?.beforeMarket(g);offers(g);
 if(g.age>=(g.player.pos==='GK'?40:38)){g.retired=true;g.phase='retired';}return g.phase;
}
function accept(g,id){if(g.phase!=='market')return false;const o=g.offers.find(v=>v.id===id);if(!o||o.kind==='trial')return false;if(o.kind==='loan'){if(!career()?.acceptLoan(g,o))return false;}else if(o.kind==='stay'){if(g.stage==='pro'&&!g.loan&&g.military?.status!=='service'){g.contract=o.months;g.wage=o.wage;g.contractTerms={role:o.roleId||g.contractTerms?.role||'rotation',bonus:o.bonus||0};}}else{g.clubId=o.clubId;g.country=o.country;g.stage=o.kind;g.wage=o.wage;g.contract=o.months;g.trust=55;g.contractTerms={role:o.roleId||'prospect',bonus:o.bonus||0};if(o.kind==='academy')g.academyStart=g.year;if(['university','semipro'].includes(o.kind))g.routeStart=g.year;g.journey.push({date:g.clock,clubId:o.clubId,name:o.name,kind:o.kind,wage:o.wage,rare:!!o.rare});}g.fitness=clamp(g.fitness+18,30,100);g.morale=70;newPeriod(g);return true}
function totals(g){const result=blankStats();const rows=[...g.history];if(g.period&&g.phase!=='market'&&g.phase!=='retired')rows.push(g.period);for(const r of rows)for(const k of Object.keys(result))result[k]+=r[k]||0;result.rating=result.apps?round(result.ratingSum/result.apps):0;return result}
function retire(g){if(g.age<30||g.phase==='international')return false;if(g.phase==='ready'&&g.period.matches.length){g.period.end=g.clock;g.history.push(JSON.parse(JSON.stringify(g.period)))}g.retired=true;g.phase='retired';return true}
return{...D,NAMES,dayAt,fixtureDay,health,injuryAt,injuryDays,injure,settleDevelopment,simulateAppearance,matchDevelopment,developmentSummary,assignStart,usesYouthCups,youthSeason,roundName,meets,styleProgress,plusOptions,plusCapacity,upgradePlus,clubsFor,school,leagueName,activeAttributes,attributeName,growthType,agePhase,trainingOptions,normaliseFocus,clamp,round,rand,int,shuffle,tick,date,dateText,club,level,overall,effective,recalc,groupKeys,eligibleArch,candidates,makeCandidate,talent,talentBonus,growthMultiplier,injuryRisk,migrate,create,teamName,stageName,slots,availableStyles,equip,plus,effects,xp,unlock,advance,internationalMatch,returnFromCamp,accept,totals,retire,sortTable,seasonWorld,leagueLabel,makeWorld,runWorld,offers,blankStats,train,newPeriod,stableSeed,addDevelopment};
})();
