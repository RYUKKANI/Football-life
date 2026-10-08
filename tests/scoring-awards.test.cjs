'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),E=require('./load-engine.cjs')();
const advance=require('./advance-career.cjs'),copy=x=>JSON.parse(JSON.stringify(x));
function pro(value=65,seed=81,pos='ST',country='KR'){
 const g=E.create({name:'득점과 수상 검사',number:9,pos,foot:'right',tactic:'attack',focus:[]},E.makeCandidate(pos,seed,'ordinary'),seed);
 Object.assign(g,{stage:'pro',country,clubId:country==='KR'?'KR-daejeon':'EN-southampton',clock:E.tick(2005,country==='KR'?1:7),year:2005,age:20,trust:95,reputation:35,form:60,morale:70,fitness:100,intensity:'light',wage:6000,contract:36,contractTerms:{role:'starter',bonus:0}});
 for(const id of E.activeAttributes(g.player))g.player.details[id]=value;
 E.recalc(g.player);E.newPeriod(g);g.player.axp=4000;E.unlock(g,false);for(const o of E.plusOptions(g.player))if(E.meets(g.player,o.requirements))E.upgradePlus(g,o.id);return g;
}
function sample(value,own=70,opposition=70){
 const base=pro(value),s={goals:0,minutes:0,shots:0,teamGoals:0,oppositionGoals:0};
 for(let i=0;i<1200;i++){
  const g=copy(base);g.seed=88000+i;const m=E.simulateAppearance(g,own,opposition,E.dayAt(g.clock),i%2===0);
  s.goals+=m.goals;s.minutes+=m.minutes;s.shots+=m.shots;s.teamGoals+=m.own;s.oppositionGoals+=m.opp;
 }
 return {...s,goals90:s.goals/s.minutes*90,shots90:s.shots/s.minutes*90};
}
function finishedWorld(ownMatches=20){
 const g=pro(70),w=E.makeWorld(g,'KR',2005);w.complete=true;w.table.forEach(c=>c.p=27);E.rankings(g,'goals',w);
 for(const p of w.players)Object.assign(p,{...E.blankStats(),apps:27,starts:27,minutes:2430,ratingSum:27*6.5,facedOnTarget:p.pos==='GK'?90:0,saves:p.pos==='GK'?58:0,conceded:p.pos==='GK'?32:0});
 g.period.matches=Array.from({length:ownMatches},(_,i)=>({...E.blankStats(),minutes:90,started:true,rating:7.2,goals:1,own:2,opp:1,kind:'pro',country:'KR',league:'2005',clubId:g.clubId,club:E.teamName(g),date:E.tick(2005,3)+i,modelVersion:4}));
 return {g,w};
}
test('moderate and strong strikers have bounded scoring rates while better finishing still matters',()=>{
 const low=sample(55),ordinary=sample(65),strong=sample(85,75,75),elite=sample(95,80,80);
 assert.ok(ordinary.goals90<.65&&ordinary.shots90<4.5,JSON.stringify(ordinary));
 assert.ok(strong.goals90<1&&elite.goals90<1.15,JSON.stringify({strong,elite}));
 assert.ok(ordinary.goals90>low.goals90&&strong.goals90>ordinary.goals90*1.4);
 assert.ok(elite.teamGoals/1200<2,JSON.stringify(elite));
 const weakerOpposition=sample(65,65,45);assert.ok(weakerOpposition.goals90>ordinary.goals90*1.25&&weakerOpposition.goals90<1);
});
test('unlocking many styles does not grant the whole team a separate finishing boost',()=>{
 const base=pro(85),on=copy(base),off=copy(base);off.player.equipped=[];
 const s={onGoals:0,offGoals:0,onMinutes:0,offMinutes:0,onTeam:0,offTeam:0};
 for(let i=0;i<1000;i++)for(const [key,source]of [['on',on],['off',off]]){
  const g=copy(source);g.seed=40000+i;const m=E.simulateAppearance(g,75,75,E.dayAt(g.clock),true,true);s[key+'Goals']+=m.goals;s[key+'Minutes']+=m.minutes;s[key+'Team']+=m.own;
 }
 const boost=(s.onGoals/s.onMinutes)/(s.offGoals/s.offMinutes);assert.ok(boost>1&&boost<1.5,JSON.stringify(s));assert.ok(s.onTeam-s.offTeam<=s.onGoals-s.offGoals+60,JSON.stringify(s));
});
test('an attacking two-footed scorer still gains from PlayStyle+ after unlocking the basic styles',()=>{
 const base=pro(95);base.player.archetypeId=E.eligibleArch('ST').find(([,a])=>E.STYLES[a.style].effect==='goal')[0];base.player.weakFoot=100;base.player.plusChoices=[];
 const upgraded=copy(base),signature=E.plusOptions(upgraded.player)[0];assert.ok(E.upgradePlus(upgraded,signature.id));let normal=0,plus=0;
 for(let i=0;i<1400;i++)for(const [withPlus,source]of [[false,base],[true,upgraded]]){const g=copy(source);g.seed=91000+i;const m=E.simulateAppearance(g,85,80,E.dayAt(g.clock),true,true);if(withPlus)plus+=m.goals;else normal+=m.goals;}
 assert.ok(plus>normal&&plus<normal*1.15,JSON.stringify({normal,plus}));
});
test('AI teams and the user team share the same chance model and keep shot accounting',()=>{
 let user=0,npc=0;const base=pro(65);base.player.tactic='balanced';
 for(let i=0;i<1200;i++){
  const g=copy(base);g.seed=18000+i;const m=E.simulateAppearance(g,65,65,E.dayAt(g.clock),true,true);user+=m.own;
  const n=E.teamPerformance({seed:25000+i},65,65);npc+=n.goals;assert.ok(n.goals<=n.onTarget&&n.onTarget<=n.shots);
 }
 assert.ok(Math.abs(user-npc)/npc<.15,JSON.stringify({user,npc}));
});
test('whole league seasons do not produce 80-goal moderate strikers and totals stay inside team goals',()=>{
 for(const value of [65,85])for(const seed of [321,322,325,329]){
  const g=pro(value,seed,'ST','EN');advance.finish(E,g,{accept:false});assert.ok(E.accept(g,'stay'));advance.finish(E,g,{accept:false});
  const w=g.worlds['EN-2005-pro'],rank=E.rankings(g,'goals',w),rows=E.careerMatches(g).filter(m=>!m.competition&&m.kind==='pro'&&m.country==='EN'&&m.league==='2005/06'),s=E.aggregate(rows);
  assert.equal(s.apps,rows.filter(m=>m.minutes).length);assert.equal(rank.mine.goals,s.goals);assert.ok(s.goals<(value===65?35:55),JSON.stringify({value,seed,apps:s.apps,goals:s.goals}));
  const own=w.table.find(t=>t.id===g.clubId);assert.ok(s.goals<=own.gf);assert.equal(w.players.filter(p=>p.clubId===g.clubId).reduce((n,p)=>n+p.goals,0)+s.goals,own.gf);
 }
});
test('MVP uses the actual average, rather than incorrectly awarding rounded ties',()=>{
 const {g,w}=finishedWorld(),winner=w.players.find(p=>p.pos==='ST'&&p.clubId!==g.clubId);winner.apps=20;winner.minutes=1800;winner.ratingSum=144.04;
 const rankings=E.rankings(g,'rating',w);assert.equal(rankings.rows[0].value,rankings.mine.value);assert.equal(rankings.rows[0].rank,1);assert.equal(rankings.mine.rank,2);
 const seed=g.seed;E.runWorld(g,w,g.clock); // Already complete: no fixture or random-state changes.
 assert.equal(g.seed,seed);
 // Season awards are also used by processLeagues at the normal season boundary.
 E.advance(g);const awards=g.worlds[w.id].awards.filter(a=>a.name==='시즌 최우수 선수');
 assert.equal(awards.length,1);assert.equal(awards[0].playerId,winner.id);assert.equal(awards[0].joint,false);
});
test('true scoring ties share awards, store the actual season performance, and exclude cup goals',()=>{
 const {g,w}=finishedWorld(),winner=w.players.find(p=>p.pos==='ST'&&p.clubId!==g.clubId);winner.goals=20;
 g.period.matches.push({...g.period.matches[0],competition:'국내 컵',goals:90,assists:90});
 const seed=g.seed,r=E.rankings(g,'goals',w);assert.equal(r.mine.goals,20);assert.equal(r.mine.rank,1);assert.equal(g.seed,seed);
 E.advance(g);const awards=w.awards.filter(a=>a.name==='득점왕');assert.equal(awards.length,2);assert.ok(awards.every(a=>a.joint&&a.stats.goals===20));
 const own=g.awards.find(a=>a.name==='득점왕');assert.equal(own.stats.apps,20);assert.equal(own.stats.minutes,1800);assert.equal(own.stats.rating,7.2);
 const snapshot=E.periodAwards(g,g.period).find(s=>s.id===w.id);assert.ok(snapshot);const original=JSON.stringify(snapshot);delete g.worlds[w.id];assert.equal(JSON.stringify(E.awardSeasons(g).find(s=>s.id===w.id)),original);
});
test('short cameos cannot earn season MVP or best eleven even with a high average',()=>{
 const {g,w}=finishedWorld(6);g.period.matches.forEach(m=>m.rating=9.8);E.advance(g);
 assert.ok(!g.awards.some(a=>['시즌 최우수 선수','베스트11'].includes(a.name)));
 assert.ok(w.awards.filter(a=>['시즌 최우수 선수','베스트11'].includes(a.name)).every(a=>a.stats.minutes>=972));
});
test('v3 migration preserves goals, honours, training exposure and the next random state',()=>{
 const {g,w}=finishedWorld();g.simulationVersion=3;g.period.trained=true;g.history=[copy(g.period)];g.awards=[{name:'득점왕',season:'2004',country:'KR',club:'대전 시티즌',playerId:'USER-'+g.id,value:80}];
 const seed=g.seed,history=JSON.stringify(g.history),period=JSON.stringify(g.period),awards=JSON.stringify(g.awards),details=JSON.stringify(g.player.details);assert.ok(E.migrate(g));assert.equal(g.simulationVersion,4);assert.equal(g.seed,seed);assert.equal(JSON.stringify(g.history),history);assert.equal(JSON.stringify(g.period),period);assert.equal(JSON.stringify(g.awards),awards);assert.equal(JSON.stringify(g.player.details),details);assert.equal(E.migrate(g),false);
});
