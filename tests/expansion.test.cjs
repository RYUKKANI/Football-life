'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const advance=require('./advance-career.cjs'),copy=x=>JSON.parse(JSON.stringify(x));
const context={};vm.createContext(context);
const files=['era-2000.js','style-rules.js','game-data.js','career-data.js','game-engine.js','game-career.js','game-national.js','game-expansion.js','game-save.js'];
vm.runInContext(files.map(n=>fs.readFileSync(path.join(__dirname,'../src',n),'utf8')).join('\n')+';this.E=FootballEngine;this.X=FootballExpansion;this.Save=FootballSave;',context);
const {E,X,Save}=context;
function pro(pos='ST',seed=83,country='KR',year=2005,month=1,value=85){
 const g=E.create({name:'대회 선수',number:9,pos,foot:'right',focus:[]},E.makeCandidate(pos,seed,'ordinary'),seed);
 Object.assign(g,{clock:E.tick(year,month),year,age:year-g.birthYear,stage:'pro',country,clubId:{KR:'KR-suwon',EN:'EN-united',FR:'FR-nantes'}[country],trust:95,reputation:80,contract:36,wage:9000,fitness:100,intensity:'light',contractTerms:{role:'starter',bonus:0}});
 for(const id of E.activeAttributes(g.player))g.player.details[id]=value;
 E.recalc(g.player);E.newPeriod(g);return g;
}
function backup(g){return Save.parse(JSON.stringify({version:2,game:g,archives:[],legacy:[]})).game;}
function readyCup(g,predicate=()=>true){
 for(let n=0;n<150&&(g.phase!=='cup'||!predicate(E.cupContext(g)));n++){
  if(g.phase==='market'){assert.ok(E.accept(g,'stay'));continue;}
  assert.ok(advance.step(E,g,{accept:false}));
 }
 assert.equal(g.phase,'cup');return g;
}
function weakCupOpponents(g){for(const c of Object.values(g.competitionState.clubs))for(const t of [...c.teams,...c.table])if(t.id!==g.clubId)t.power=35;}
function officialFinal(pos='ST',seed=40,kind='world',year=2006){
 const g=pro(pos,seed,'KR',year,6,96),def={...E.nationalDefinitions(year).find(d=>d.kind===kind),year};
 assert.ok(def.kind);g.clock=E.tick(year,def.month,1);E.newPeriod(g);
 const q=E.nationalTournament(g,def,true),c=E.nationalTournament(g,def,false);
 for(const cup of [q,c])for(const t of [...cup.teams,...cup.table])t.power=t.id==='KR'?95:35;
 assert.ok(X.maybeNationalCamp(g));assert.ok(E.respondCallup(g,true));return g;
}

test('new professional seasons expose club cups without consuming the gameplay random state',()=>{
 const g=pro(),seed=g.seed,before=copy(g.competitionState);
 for(let i=0;i<5;i++){E.ensureClubCups(g);E.selection(g);E.offerComparison(g,{kind:'pro',clubId:'EN-united',country:'EN'});E.seasonTrend(g);}
 assert.equal(g.seed,seed);assert.deepEqual(copy(g.competitionState),before);
 assert.ok(Object.values(before.clubs).some(c=>c.type==='domestic'&&c.teams.some(t=>t.id===g.clubId)));
 assert.ok(Object.values(before.clubs).some(c=>c.type==='continental'));
});
test('continental entries follow saved prior-year league order rather than only club reputation',()=>{
 const g=pro('ST',44,'EN'),w=E.makeWorld(g,'EN',2004);w.complete=true;
 w.table.forEach((t,i)=>{t.pts=100-i;});const lower=w.table.find(t=>t.id==='EN-bradford');lower.pts=200;X.qualification(g,w);
 g.clock=E.tick(2005,8);g.year=2005;g.clubId='EN-bradford';E.newPeriod(g);
 const c=g.competitionState.clubs['EU-2005'];assert.ok(c.teams.some(t=>t.id===g.clubId));
 assert.deepEqual(copy(c.teams.filter(t=>t.country==='EN').map(t=>t.id)),copy(E.sortTable(w).slice(0,4).map(t=>t.id)));
 const old=copy(g.competitionState.qualifications);X.qualification(g,w);assert.deepEqual(copy(g.competitionState.qualifications),old);
});
test('cup records count once in career totals and cannot inflate league-only individual rankings',()=>{
 const g=readyCup(pro('ST',98)),x=E.cupContext(g),before=g.period.matches.length;
 let m=E.playCup(g);if(g.cupMatch.stage==='shootout')m=E.playCup(g,'auto');
 assert.equal(g.period.matches.length,before+1);assert.equal(m.competition,x.cup.name);assert.equal(m.kind,'pro');
 assert.equal(E.totals(g).apps,E.careerMatches(g).filter(m=>m.minutes).length);
 const w=E.seasonWorld(g,g.country,'pro'),user=E.rankings(g,'goals',w).mine;
 assert.equal(user.goals,E.careerMatches(g).filter(m=>!m.competition&&m.league===E.leagueLabel(w)).reduce((n,m)=>n+m.goals,0));
 const seed=g.seed,record=copy(m);assert.equal(E.playCup(g),false);assert.equal(g.seed,seed);assert.deepEqual(copy(g.period.matches.at(-1)),record);
 const reloaded=backup(g);assert.ok(E.continueCup(reloaded));assert.equal(E.continueCup(reloaded),false);
});
test('cup shootouts are a separate saved choice and never add a second match, minutes or development reward',()=>{
 const initial=pro('GK',11),base=readyCup(initial,x=>x.round.stage==='knockout'&&!E.injuryAt(initial,E.dayAt(x.round.t)+13));let g;
 for(let seed=1;seed<150;seed++){const t=copy(base);t.seed=seed;const m=E.playCup(t);if(t.cupMatch.stage==='shootout'&&m.minutes){g=t;break;}}
 assert.ok(g,'real match simulation should produce a played drawn knockout');
 const before=copy({count:g.period.matches.length,apps:g.period.apps,minutes:g.period.minutes,details:g.player.details,axp:g.player.axp}),loaded=backup(g),twin=copy(loaded);
 assert.equal(E.continueCup(loaded),false);const m=E.playCup(loaded,'pen-read'),same=E.playCup(twin,'pen-read');
 assert.deepEqual(copy(m),copy(same));assert.notEqual(m.shootout.own,m.shootout.opp);assert.equal(loaded.cupMatch.stage,'result');
 assert.deepEqual(copy({count:loaded.period.matches.length,apps:loaded.period.apps,minutes:loaded.period.minutes,details:loaded.player.details,axp:loaded.player.axp}),before);
 assert.ok(backup(loaded));
});
test('a club cup winner receives one contribution-based trophy and history survives another half and reload',()=>{
 const g=pro('ST',93,'KR',2005,1,99);weakCupOpponents(g);
 advance.finish(E,g,{accept:false});assert.ok(E.accept(g,'stay'));weakCupOpponents(g);advance.finish(E,g,{accept:false});
 const played=g.history.flatMap(r=>r.matches).filter(m=>m.competitionId?.startsWith('DOM-'));
 assert.ok(played.length);const c=g.competitionState.clubs['DOM-KR-2005'];assert.ok(c.complete);
 if(c.winner===g.clubId&&played.some(m=>m.minutes))assert.equal(g.trophies.filter(t=>t.name===c.name+' 우승').length,1);
 assert.equal(g.competitionState.honours.filter(h=>h.id===c.id).length,1);
 const loaded=backup(g),honours=copy(loaded.competitionState.honours);assert.ok(E.accept(loaded,'stay'));X.processClubCups(loaded);assert.deepEqual(copy(loaded.competitionState.honours),honours);
});
test('school knockout choices pause at the semifinal and preserve the draw, youth records and one-time result through reload',()=>{
 const g=E.create({name:'학교 대회 선수',number:9,pos:'ST',foot:'right',focus:[]},E.makeCandidate('ST',211,'ordinary'),211);
 for(const id of E.activeAttributes(g.player))g.player.details[id]=99;
 E.recalc(g.player);g.trust=95;g.intensity='light';
 for(const c of E.youthSeason(g).cups)for(const t of c.teams)if(t.id!==g.clubId)t.power=10;
 readyCup(g,x=>x.round.name==='4강'&&x.pending.stage==='preview');
 const ctx=E.cupContext(g);assert.ok(ctx.cup.youth);assert.equal(ctx.important,true);
 assert.ok(g.period.matches.some(m=>m.competitionId===ctx.cup.id&&m.kind==='middle'));
 const loaded=backup(g),before=loaded.period.matches.length,twin=copy(loaded);
 assert.deepEqual(copy(E.cupContext(loaded).round),copy(ctx.round));
 const a=E.playCup(loaded,'shoot'),b=E.playCup(twin,'shoot');assert.deepEqual(copy(a),copy(b));assert.equal(loaded.period.matches.length,before+1);assert.equal(a.kind,'middle');
 if(loaded.cupMatch.stage==='shootout')E.playCup(loaded,'auto');
 assert.ok(backup(loaded));assert.equal(E.playCup(loaded),false);E.continueCup(loaded);advance.finish(E,loaded,{accept:false});
 const completed=loaded.competitionState.clubs[ctx.cup.id],source=Object.values(loaded.youthCups).flatMap(s=>s.cups).find(c=>c.id===ctx.cup.id);
 assert.ok(completed.complete);assert.ok(source.complete);assert.equal(source.winner,completed.winner);
 assert.equal(loaded.history.flatMap(p=>p.cups||[]).filter(c=>c.id===completed.id).length,1);
 const own=E.careerMatches(loaded).filter(m=>m.competitionId===completed.id);assert.equal(new Set(own.map(m=>m.fixtureId)).size,own.length);
 assert.equal(loaded.competitionState.honours.filter(h=>h.id===completed.id).length,1);assert.ok(backup(loaded));
});
test('international finals progress through groups and elimination, keeping official national records separate',()=>{
 const g=officialFinal(),clubBefore=copy(E.totals(g));let guard=0;
 while(!g.camp.complete){assert.ok(guard++<20);const x=E.nationalContext(g);assert.ok(E.internationalMatch(g,x.shootout?'pen-place':x.important?'shoot':'auto'));}
 const c=g.competitionState.nationals[g.camp.seriesId];assert.ok(c.complete);assert.ok(g.camp.matches.length>=3);
 assert.ok(g.national.every(m=>m.isAMatch&&m.matchType==='official'&&m.competition==='FIFA 월드컵'));
 assert.deepEqual(copy(E.totals(g)),clubBefore);assert.equal(new Set(g.national.map(m=>m.fixtureId)).size,g.national.length);
 assert.equal(g.competitionState.honours.filter(h=>h.id===c.id).length,1);assert.ok(backup(g));
 if(c.winner==='KR')assert.equal(g.trophies.filter(t=>t.name==='FIFA 월드컵 우승').length,1);
 assert.ok(E.returnFromCamp(g));assert.equal(E.internationalMatch(g),false);
});
test('declined, injured and missed qualifying windows advance the team without inventing caps',()=>{
 const g=pro('ST',4,'KR',2005,10,90);g.clock=E.tick(2005,10,1);E.newPeriod(g);
 assert.ok(X.maybeNationalCamp(g));const c=g.competitionState.nationals[g.camp.seriesId];assert.ok(c.qualifier);assert.ok(c.rounds[0].matches.every(f=>f.done));
 assert.equal(g.national.length,0);assert.ok(E.respondCallup(g,false));assert.ok(c.rounds[1].matches.every(f=>f.done));assert.equal(g.national.length,0);
 g.clock=E.tick(2005,11,1);E.newPeriod(g);const day=E.dayAt(g.clock);g.health.injuries.push({name:'부상',start:day,until:day+30,days:30});
 assert.equal(X.maybeNationalCamp(g),false);assert.ok(c.complete);assert.equal(g.national.length,0);
 assert.equal(E.maybeCamp(g),false);assert.ok(backup(g));
});
test('national shootouts survive a backup and update the existing cap without replaying its 90 minutes',()=>{
 const g=officialFinal('GK',102);let guard=0;
 while(!g.camp.complete&&!E.nationalContext(g)?.important){assert.ok(guard++<10);E.internationalMatch(g);}
 assert.ok(!g.camp.complete);const base=copy(g);let pending;
 for(let seed=1;seed<300;seed++){const t=copy(base);t.seed=seed;const m=E.internationalMatch(t);if(t.camp.pendingShootout&&m.minutes){pending=t;break;}}
 assert.ok(pending);const loaded=backup(pending),before=copy({apps:E.nationalStats(loaded).apps,minutes:E.nationalStats(loaded).minutes,details:loaded.player.details,axp:loaded.player.axp});
 assert.equal(E.returnFromCamp(loaded),false);const m=E.internationalMatch(loaded,'pen-dive');
 assert.ok(m.shootout);assert.notEqual(m.shootout.own,m.shootout.opp);assert.deepEqual(copy(loaded.national.find(n=>n.fixtureId===m.fixtureId).shootout),copy(m.shootout));
 assert.deepEqual(copy({apps:E.nationalStats(loaded).apps,minutes:E.nationalStats(loaded).minutes,details:loaded.player.details,axp:loaded.player.axp}),before);assert.ok(backup(loaded));
});
test('youth finals and Olympic wildcard labels follow age while senior official caps bind the country',()=>{
 const youth=pro('MF',48,'KR',2001,7,85);youth.clock=E.tick(2001,7,1);E.newPeriod(youth);const yq=E.nationalTournament(youth,{...E.nationalDefinitions(2001).find(d=>d.kind==='u17'),year:2001},true);yq.complete=true;yq.qualified=true;assert.ok(X.maybeNationalCamp(youth));assert.equal(youth.camp.level,'U17');E.respondCallup(youth,true);E.internationalMatch(youth);assert.ok(youth.national.every(m=>!m.isAMatch));
 youth.internationalCareer.nationalities.push('FR');assert.ok(E.canRepresent(youth,'FR'));
 const senior=officialFinal();E.internationalMatch(senior);senior.internationalCareer.nationalities.push('FR');assert.equal(E.canRepresent(senior,'FR'),false);
 const olympic=pro('ST',18,'KR',2012,7,90);olympic.clock=E.tick(2012,7,1);E.newPeriod(olympic);const def={...E.nationalDefinitions(2012).find(d=>d.kind==='olympic'),year:2012};const q=E.nationalTournament(olympic,def,true);q.complete=true;q.qualified=true;assert.ok(X.maybeNationalCamp(olympic));assert.equal(olympic.camp.level,'U23');assert.equal(olympic.camp.wildcard,true);
 const foreign=pro('ST',22,'FR',2004,6,90);foreign.internationalCareer.nationalities.push('FR');foreign.internationalCareer.representing='FR';foreign.clock=E.tick(2004,6,1);E.newPeriod(foreign);const euro=E.nationalTournament(foreign,{...E.nationalDefinitions(2004).find(d=>d.kind==='euro'),year:2004},false);assert.equal(euro.teams.length,16);assert.ok(euro.teams.every(t=>t.region==='EU'));assert.equal(euro.teams.filter(t=>t.id==='FR').length,1);
});
test('rehabilitation choice changes the return date and risk, persists once and protects a one-day recovery',()=>{
 const base=pro(),day=E.dayAt(base.clock);base.health.injuries.push({name:'무릎 부상',start:day,until:day+30,days:30});assert.ok(X.maybeRehab(base));
 const early=backup(base),normal=backup(base),safe=backup(base);assert.ok(E.chooseRehab(early,'early'));assert.ok(E.chooseRehab(normal,'normal'));assert.ok(E.chooseRehab(safe,'safe'));
 assert.ok(early.health.injuries[0].until<normal.health.injuries[0].until);assert.ok(safe.health.injuries[0].until>normal.health.injuries[0].until);
 assert.ok(X.injuryMultiplier(early,day+31)>X.injuryMultiplier(normal,day+31));assert.ok(X.injuryMultiplier(safe,day+37)<X.injuryMultiplier(normal,day+37));
 const before=copy(early);assert.equal(E.chooseRehab(early,'early'),false);assert.deepEqual(copy(early),before);assert.ok(backup(early));
 const one=copy(base);one.health.injuries[0].until=day+1;assert.equal(E.rehabOptions(one).find(o=>o.id==='early').days,1);
 assert.equal(E.simulateAppearance(early,75,75,day+1).minutes,0);
});
test('coach fit, form and recovery affect both the selection explanation and actual starts without rerolling on inspection',()=>{
 const base=pro('WG',33,'KR',2005,1,75);base.trust=60;base.form=50;base.morale=60;base.period.role='rotation';
 const matched=copy(base);matched.player.tactic=E.coaching(base).tactic;const tired=copy(matched);tired.fitness=25;
 assert.ok(E.selection(matched).chance>E.selection(tired).chance);assert.match(E.selection(tired).reason,/체력|역할|경쟁/);
 const own=copy(matched),seed=own.seed;E.selection(own);assert.equal(own.seed,seed);assert.deepEqual(copy(E.selection(own)),copy(E.selection(matched)));
 let restedStarts=0,tiredStarts=0;
 for(let n=0;n<160;n++){const a=copy(matched),b=copy(tired);a.seed=b.seed=1000+n;restedStarts+=E.simulateAppearance(a,E.club(a.clubId,a).power,75,E.dayAt(a.clock)).started?1:0;tiredStarts+=E.simulateAppearance(b,E.club(b.clubId,b).power,75,E.dayAt(b.clock)).started?1:0;}
 assert.ok(restedStarts>tiredStarts+30);
});
test('recent five seasons use actual records and stored OVR, leaving unknown historical attributes empty',()=>{
 const g=pro('GK',45);g.history=[];
 for(let year=2000;year<=2006;year++){
  const start=E.tick(year,3),m={...E.blankStats(),date:start,kind:'pro',country:'KR',league:String(year),clubId:g.clubId,club:'수원',minutes:90,started:true,saves:7,facedOnTarget:10,conceded:3,rating:7.5};
  g.history.push({...E.blankStats(),start,end:E.tick(year+1,1),stage:'pro',country:'KR',startOvr:60,endOvr:60+year-2000,matches:[m],events:[]});
 }
 g.clock=E.tick(2007,1);g.year=2007;g.age=22;g.phase='market';delete g.expansionVersion;X.migrate(g);
 const rows=E.seasonTrend(g);assert.equal(rows.length,5);assert.deepEqual(copy(rows.map(r=>r.season)),['2002','2003','2004','2005','2006']);assert.equal(rows.at(-1).ovr,66);assert.equal(rows.at(-1).apps,1);assert.equal(rows.at(-1).saveRate,70);
 assert.ok(g.seasonSnapshots.every(s=>Object.keys(s.details).length===0));const before=copy(g);E.seasonTrend(g);assert.deepEqual(copy(g),before);
});
test('portable backups reject invalid pending competition choices without weakening legacy migration',()=>{
 const g=readyCup(pro('CB',47));assert.ok(backup(g));
 for(const mutate of [x=>{x.cupMatch.stage='unknown';},x=>{x.cupMatch.fixture=999;},x=>{const c=E.cupContext(x).cup;c.rounds[0].matches[0].h='fake-team';},x=>{x.seasonSnapshots.push({key:'fake',country:'KR',start:1,end:2,endOvr:999,details:{}});}]){const bad=copy(g);mutate(bad);assert.throws(()=>backup(bad));}
 const legacy=pro();delete legacy.expansionVersion;delete legacy.competitionState;delete legacy.seasonSnapshots;const original=copy(legacy.history),loaded=backup(legacy);assert.equal(loaded.expansionVersion,1);assert.deepEqual(copy(loaded.history),original);
});
