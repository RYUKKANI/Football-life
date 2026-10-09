'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),E=require('./load-engine.cjs')(),C=E.collection;
const clone=x=>JSON.parse(JSON.stringify(x));
function player(pos='ST',seed=9,name='보관 선수',ability=65){const g=E.create({name,number:9,pos,foot:'right',focus:[]},E.makeCandidate(pos,seed,'ordinary'),seed);for(const id of Object.keys(g.player.details))g.player.details[id]=ability;E.recalc(g.player);return g;}
function match(g,n,extra={}){return {date:g.clock+n,matchDay:n,fixtureId:'fixture-'+n,kind:'pro',clubId:g.clubId,club:E.teamName(g),country:'KR',opponent:'상대팀',minutes:90,started:true,goals:0,assists:0,saves:0,clean:0,rating:6.5,...extra};}
test('saved prime attributes remain intact after decline, with real fallback for incomplete older snapshots',()=>{
 const g=player('GK'),stored=clone(g.player.details);for(const id of Object.keys(stored))stored[id]=83;
 g.prime={details:stored,ovr:83,age:26,season:'2011',club:'수원 삼성',clubId:'KR-suwon'};const before=clone(g),peak=C.prime(g);
 assert.equal(peak.ovr,83);assert.equal(peak.details.reflexes,83);assert.equal(peak.clubId,'KR-suwon');assert.equal(peak.age,26);assert.deepEqual(clone(g),before);
 delete g.prime.details;assert.equal(C.prime(g).ovr,65);assert.equal(C.prime(g).stored,false);assert.equal(C.prime(g).details.reflexes,65);
 g.player.details.reflexes=98;assert.equal(C.prime(g).details.reflexes,98,'later real attributes are used instead of scaling an old score');
});
test('milestones use actual appearances and preserve senior versus youth caps',()=>{
 const g=player('GK');g.period.apps=500;assert.equal(C.milestones(g).length,0,'aggregate numbers alone do not create milestones');
 g.period.matches=[match(g,0,{minutes:0}),...Array.from({length:100},(_,n)=>match(g,n+1,{saves:5,clean:n<50?1:0}))];
 g.national=[match(g,1,{teamLevel:'U23'}),match(g,101,{teamLevel:'senior'}),match(g,102,{teamLevel:'senior',minutes:0})];
 const list=C.milestones(g),ids=list.map(m=>m.id);assert.ok(ids.includes('apps-100'));assert.ok(ids.includes('saves-500'));assert.ok(ids.includes('clean-50'));assert.ok(ids.includes('senior-debut'));assert.ok(!ids.includes('caps-25'));assert.equal(list.find(m=>m.id==='debut').date,g.clock+1);assert.equal(list.find(m=>m.id==='senior-debut').date,g.clock+101);
 const before=clone(g);C.milestones(g);assert.deepEqual(clone(g),before);
});
test('milestone notifications survive reload, acknowledge a batch once, and do not replay historical achievements',()=>{
 const old=player();old.period.matches=[match(old,0)];const next=clone(old);next.period.matches.push(match(next,1,{goals:2,assists:1}));const seed=next.seed;
 C.capture(next,old);assert.deepEqual(clone(next.milestoneNotices),['first-goal','first-assist']);assert.equal(next.seed,seed);assert.ok(!next.milestoneNotices.includes('debut'));
 const restored=clone(next);C.capture(restored,next);assert.equal(restored.milestoneNotices.length,2);C.dismiss(restored);C.capture(restored,next);assert.equal(restored.milestoneNotices.length,0);assert.ok(restored.milestoneAcknowledged.includes('first-goal'));
});
test('formations enforce position and unique players while default players fill every missing slot',()=>{
 const gk=player('GK',1,'골키퍼',80),st=player('ST',2,'공격수',70),mf=player('MF',3,'미드필더',90),rows=C.entries(gk,[st,mf]);let s=C.autoSelect(C.empty(42),rows),line=C.lineup(s,rows);
 assert.equal(line.length,11);assert.equal(line.filter(p=>p.saved).length,3);assert.equal(line.find(p=>p.pos==='GK').ovr,80);assert.equal(line.filter(p=>!p.saved).every(p=>p.ovr===60),true);
 const stKey=C.identity(st),mfSlots=C.slots('433').filter(p=>p.pos==='MF');assert.equal(C.assign(s,mfSlots[0].id,stKey,rows),null);
 s=C.assign(s,mfSlots[1].id,C.identity(mf),rows);assert.equal(Object.values(s.lineup).filter(k=>k===C.identity(mf)).length,1);
 s=C.changeFormation(s,'442',rows);assert.equal(C.lineup(s,rows).length,11);assert.equal(C.lineup(s,rows).filter(p=>p.saved).length,3);
 assert.equal(C.changeFormation(s,'constructor',rows),null);const removed=C.clean(s,C.entries(gk,[st]));assert.ok(!Object.values(removed.lineup).includes(C.identity(mf)));
});
test('duplicate snapshots identify one player, while a different player with the same generated id remains eligible',()=>{
 const g=player(),later=clone(g);later.clock++;later.player.details.finishing=90;const other=clone(g);other.player.name='다른 선수';
 const rows=C.entries(later,[g,other]);assert.equal(C.roster(rows).length,2);assert.equal(C.roster(rows).find(p=>p.key===C.identity(g)).g.clock,later.clock);
});
test('exhibitions are deterministic, have internally consistent scores and never alter career seeds, stats or growth',()=>{
 const players=['GK','CB','CB','FB','FB','MF','MF','MF','WG','ST','WG'].map((pos,i)=>player(pos,i+5,'선수 '+i,70+i%4)),rows=C.entries(players[0],players.slice(1)),state=C.autoSelect(C.empty(987),rows),before=clone(players),stateBefore=clone(state);
 const a=C.friendly(state,rows,'EN-united'),b=C.friendly(clone(state),rows,'EN-united');assert.deepEqual(clone(a),clone(b));assert.deepEqual(clone(players),before);assert.deepEqual(clone(state),stateBefore);assert.equal(a.state.counter,1);C.validate(a.state);
 const m=a.match,gk=m.players.find(p=>p.pos==='GK');assert.equal(m.players.reduce((n,p)=>n+p.goals,0),m.own);assert.equal(gk.saves,m.opponentOnTarget-m.opp);assert.equal(m.timeline.filter(e=>e.side==='own').length,m.own);assert.equal(m.timeline.filter(e=>e.side==='opp').length,m.opp);assert.equal(C.liveScore(m,90).own,m.own);
 const next=C.friendly(a.state,rows,'EN-united'),resumed=C.friendly(clone(a.state),rows,'EN-united');assert.deepEqual(clone(next),clone(resumed));assert.equal(next.state.counter,2);
 let s=state;for(let i=0;i<25;i++)s=C.friendly(s,rows,'KR-suwon').state;assert.equal(s.results.length,20);assert.equal(s.counter,25);C.validate(s);
});
test('exhibition teams benefit from higher prime quality without inflating the score model',()=>{
 const team=value=>{const ps=['GK','CB','CB','FB','FB','MF','MF','MF','WG','ST','WG'].map((p,i)=>player(p,i+12,'기량 선수 '+i,value)),rows=C.entries(ps[0],ps.slice(1));return {rows,s:C.autoSelect(C.empty(681),rows)};};
 const low=team(50),high=team(90);let lowGoals=0,highGoals=0,lowConceded=0,highConceded=0;
 for(let i=0;i<100;i++){const a=C.friendly(low.s,low.rows,'KR-suwon'),b=C.friendly(high.s,high.rows,'KR-suwon');low.s=a.state;high.s=b.state;lowGoals+=a.match.own;highGoals+=b.match.own;lowConceded+=a.match.opp;highConceded+=b.match.opp;assert.ok(a.match.own<=a.match.teamOnTarget&&b.match.own<=b.match.teamOnTarget);}
 assert.ok(highGoals>lowGoals);assert.ok(highConceded<lowConceded);assert.ok(highGoals/100<5);assert.ok(lowGoals/100<3);
});
test('real match timelines use generated shot minutes and reproduce scores, personal goals, assists and saves',()=>{
 for(const pos of ['ST','MF','CB','GK'])for(let i=0;i<20;i++){
  const g=player(pos,i+4,'시간 선수',85);g.stage='pro';g.clubId='KR-suwon';g.trust=95;E.newPeriod(g);const m=E.simulateAppearance(g,70,70,E.dayAt(g.clock),true);
  assert.equal(m.timeline.filter(e=>e.type==='goal'&&e.side==='own').length,m.own);assert.equal(m.timeline.filter(e=>e.type==='goal'&&e.side==='opp').length,m.opp);assert.equal(m.timeline.filter(e=>e.type==='goal'&&e.side==='own'&&e.player).length,m.goals);assert.equal(m.timeline.filter(e=>e.assist).length,m.assists);assert.equal(m.timeline.filter(e=>e.type==='save').length,m.saves);assert.equal(C.liveScore(m,90).opp,m.opp);assert.ok(m.timeline.every(e=>e.minute>=1&&e.minute<=90));
 }
 const a={seed:87},b={seed:87},x=E.teamPerformance(a,65,70),y=E.teamPerformance(b,65,70,0,true);assert.equal(a.seed,b.seed);assert.deepEqual(clone(x),{goals:y.goals,shots:y.shots,onTarget:y.onTarget});
 assert.equal(C.liveScore({own:3,opp:1},45).own,null,'old matches do not get invented timing');assert.equal(C.liveScore({own:3,opp:1},90).own,3);
});
test('clubhouse validation rejects damaged outcomes and unsafe formation references',()=>{
 const rows=C.entries(player()),s=C.friendly(C.empty(54),rows,'KR-suwon').state;C.validate(s);
 for(const mutate of [v=>v.formation='constructor',v=>v.counter=-1,v=>v.results[0].own++,v=>v.results[0].players[0].rating=12,v=>v.results[0].timeline.push({minute:200,side:'own',type:'goal',player:'잘못된 장면',assist:null}),v=>v.lineup={'0-0':'p-one','0-1':'p-one'}]){const bad=clone(s);mutate(bad);assert.throws(()=>C.validate(bad),/클럽하우스/);}
});
