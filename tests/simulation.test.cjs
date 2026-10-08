const test=require('node:test'),assert=require('node:assert/strict'),load=require('./load-engine.cjs');
const E=load();
const make=(pos='ST',seed=914)=>E.create({name:'테스트 선수',number:9,pos,foot:'right',focus:[]},E.makeCandidate(pos,seed,'ordinary'),seed);
const finish=g=>require('./advance-career.cjs').finish(E,g);
const totals=rows=>rows.reduce((a,m)=>{for(const key of ['minutes','goals','shots','onTarget','saves','facedOnTarget','conceded','passes','completed','tackles','tackleAttempts','interceptions'])a[key]=(a[key]||0)+m[key];return a;},{});
function samples(pos,stats){let rows=[];for(let i=0;i<750;i++){const g=make(pos,2000+i);g.age=25;g.trust=95;g.form=60;g.fitness=100;g.intensity='light';for(const key of E.activeAttributes(g.player))g.player.details[key]=70;Object.assign(g.player.details,stats);E.recalc(g.player);rows.push(E.simulateAppearance(g,60,70,E.dayAt(g.clock),true));}return totals(rows);}
test('every recorded match is internally consistent for all six positions',()=>{
 for(const pos of Object.keys(E.POS))for(let i=0;i<250;i++){
  const g=make(pos,7000+i),m=E.simulateAppearance(g,50,68,E.dayAt(g.clock),true);
  assert.ok(m.goals<=m.onTarget&&m.onTarget<=m.shots);assert.ok(m.goals+m.assists<=m.own);
  assert.ok(m.completed<=m.passes&&m.assists<=m.completed);assert.ok(m.dribbles<=m.dribbleAttempts);assert.ok(m.tackles<=m.tackleAttempts);
  assert.ok(m.minutes>=0&&m.minutes<=90);assert.ok(m.own<=m.teamOnTarget&&m.opp<=m.opponentOnTarget);
  if(pos==='GK'){assert.equal(m.saves+m.conceded,m.facedOnTarget);assert.equal(m.shots,0);}
  if(!m.minutes){for(const key of ['goals','assists','shots','passes','saves','tackles'])assert.equal(m[key],0);assert.equal(m.rating,0);}
  if(m.clean)assert.ok(m.minutes>=60&&m.conceded===0);
 }
});
test('finishing, passing, defending and goalkeeping improve their own records',()=>{
 const weakShot=samples('ST',{finishing:25,composure:35,positioning:40}),strongShot=samples('ST',{finishing:90,composure:85,positioning:85});assert.ok(strongShot.goals/strongShot.minutes>weakShot.goals/weakShot.minutes*1.4);
 const weakPass=samples('MF',{passing:25,vision:35}),strongPass=samples('MF',{passing:90,vision:90});assert.ok(strongPass.completed/strongPass.passes>weakPass.completed/weakPass.passes+.15);
 const weakDef=samples('CB',{tackle:25,marking:25,interceptions:25}),strongDef=samples('CB',{tackle:90,marking:90,interceptions:90});assert.ok(strongDef.tackles/strongDef.tackleAttempts>weakDef.tackles/weakDef.tackleAttempts+.15);assert.ok(strongDef.interceptions/strongDef.minutes>weakDef.interceptions/weakDef.minutes*1.5);
 const lowGK=samples('GK',{reflexes:25,diving:25,gkPosition:25,handling:25}),highGK=samples('GK',{reflexes:90,diving:90,gkPosition:90,handling:90});assert.ok(highGK.saves/highGK.facedOnTarget>lowGK.saves/lowGK.facedOnTarget+.15);
});
test('an injury persists across matches until recovery and reduces training exposure',()=>{
 const healthy=make('GK'),injured=make('GK');const day=E.dayAt(injured.clock);injured.health.injuries.push({name:'무릎 부상',start:day,until:day+90,days:90,source:'경기'});
 const missing=E.simulateAppearance(injured,50,65,day+30,true);assert.equal(missing.minutes,0);assert.equal(missing.status,'부상 결장');assert.equal(E.injuryAt(injured,day+90),null);
 E.train(healthy);E.train(injured);E.settleDevelopment(healthy,healthy.target);E.settleDevelopment(injured,injured.target);
 assert.ok(injured.period.trainingReview.injuredDays>=89);assert.ok(injured.player.details.reflexes- injured.period.development.before.reflexes < healthy.player.details.reflexes-healthy.period.development.before.reflexes);
});
test('ageing lowers physical and later technical attributes; maintenance slows decline',()=>{
 for(const age of [30,34,38]){
  const g=make('ST');g.age=age;g.clock=E.tick(2000,1);g.period.start=g.clock;g.target=E.tick(2000,7);g.period.development=null;for(const key of E.activeAttributes(g.player))g.player.details[key]=80;E.recalc(g.player);
  E.train(g);E.settleDevelopment(g,g.target);assert.ok(g.player.details.speed<80);if(age>=34)assert.ok(g.player.details.finishing<80);if(age>=38)assert.ok(g.player.details.vision<80);
 }
 const base=make(),maintained=make();for(const g of [base,maintained]){g.age=36;g.clock=E.tick(2000,1);g.period.start=g.clock;g.target=E.tick(2000,7);g.period.development=null;g.player.details.speed=80;}maintained.training='physical';E.train(base);E.train(maintained);E.settleDevelopment(base,base.target);E.settleDevelopment(maintained,maintained.target);assert.ok(maintained.player.details.speed>base.player.details.speed&&maintained.player.details.speed<80);
});
test('experience only grows attributes that were practised and does not grant level-up stat points',()=>{
 const g=make('ST'),before={...g.player.details};E.xp(g,1000);assert.deepEqual(JSON.stringify(g.player.details),JSON.stringify(before));
 const m=E.simulateAppearance(g,45,55,E.dayAt(g.clock));if(m.minutes){E.matchDevelopment(g,m);assert.ok(Object.values(g.period.development.matches).some(v=>v>0));assert.ok(g.player.details.passing>=before.passing);}
});
test('season summaries add recorded appearances, true starts and matching totals',()=>{
 for(const pos of Object.keys(E.POS)){
  const g=make(pos);finish(g);assert.equal(g.phase,'market');const r=g.history[0];assert.equal(r.apps,r.matches.filter(m=>m.minutes>0).length);assert.equal(r.starts,r.matches.filter(m=>m.started).length);assert.equal(r.minutes,r.matches.reduce((n,m)=>n+m.minutes,0));assert.equal(r.growth,r.endOvr-r.startOvr);assert.ok(r.trainingReview);
  for(const key of ['goals','assists','saves','shots','passes','completed'])assert.equal(r[key],r.matches.reduce((n,m)=>n+m[key],0));
 }
});
test('reload is deterministic, including injury recovery, development and national pauses',()=>{
 const g=make('GK',99);g.stage='pro';g.clubId='KR-anyang-lg';g.reputation=80;g.clock=E.tick(2002,3);g.year=2002;g.age=17;g.target=E.tick(2002,7);g.period.start=g.clock;g.period.development=null;for(const k in g.player.details)g.player.details[k]=88;E.recalc(g.player);
 g.phase='international';g.camp={date:g.clock,opponents:['일본','호주'],matches:[],complete:false};
 const a=JSON.parse(JSON.stringify(g)),b=JSON.parse(JSON.stringify(g));finish(a);finish(b);assert.equal(JSON.stringify(a),JSON.stringify(b));assert.ok(a.national.length>0);assert.equal(a.history[0].matches.length,a.period.matches.length);
});
test('old careers retain recorded history and begin new rules without applying old training twice',()=>{
 const g=make();delete g.simulationVersion;delete g.health;delete g.period.development;g.period.trained=true;g.history.push({apps:1,starts:1,matches:[{minutes:90,goals:2,rating:8}],growth:5});const history=JSON.stringify(g.history),before=g.player.details.speed;E.migrate(g);assert.equal(JSON.stringify(g.history),history);assert.equal(g.period.legacyTraining,true);E.settleDevelopment(g,g.target);assert.equal(g.player.details.speed,before);
});
