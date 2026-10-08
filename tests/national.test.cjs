'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),E=require('./load-engine.cjs')();
const copy=g=>JSON.parse(JSON.stringify(g));
function player(age=21,value=72,country='KR',seed=5){
 const g=E.create({name:'대표팀 검사',number:9,pos:'ST',foot:'right',focus:[]},E.makeCandidate('ST',seed,'ordinary'),seed);
 g.clock=E.tick(g.birthYear+age,3,1);g.year=g.birthYear+age;g.age=age;g.stage='pro';g.country=country;g.clubId={KR:'KR-suwon',EN:'EN-united',FR:'FR-nantes',IT:'IT-milan',DE:'DE-bayern',ES:'ES-barcelona'}[country];
 for(const id of E.activeAttributes(g.player))g.player.details[id]=value;E.recalc(g.player);g.trust=95;g.reputation=100;E.newPeriod(g);return g;
}
function called(age=21,value=72,country='KR'){
 for(let seed=1;seed<30;seed++){const g=player(age,value,country,seed);if(E.maybeCamp(g))return g;}throw Error('No callup');
}
function playCamp(g){assert.ok(E.respondCallup(g,true));while(!g.camp.complete)assert.ok(E.internationalMatch(g));assert.ok(E.returnFromCamp(g));}
test('age categories are explicit, and exceptional young adults can earn senior selection',()=>{
 for(const [age,level]of[[15,'U17'],[17,'U17'],[18,'U20'],[20,'U20'],[21,'U23'],[23,'U23'],[24,'senior']])assert.equal(E.representativeLevel(player(age,72)),level);
 assert.equal(E.representativeLevel(player(18,80)),'senior');assert.equal(E.representativeLevel(player(17,99)),'U17');assert.equal(E.representativeLevel(player(21,80,'FR'),'FR'),'U23');
 assert.match(E.nationalMatchLabel('senior'),/A매치/);for(const level of['U17','U20','U23'])assert.doesNotMatch(E.nationalMatchLabel(level),/A매치/);
});
test('a callup waits for a decision; declining does not create caps or reroll the same window',()=>{
 const g=called(),before=copy(E.totals(g)),clock=g.clock,seed=g.seed;assert.equal(g.phase,'callup');assert.equal(g.camp.level,'U23');assert.equal(E.internationalMatch(g),false);assert.equal(E.advance(g),false);
 assert.ok(E.respondCallup(g,false));assert.equal(g.phase,'ready');assert.equal(g.clock,clock);assert.equal(g.seed,seed);assert.equal(g.national.length,0);assert.deepEqual(copy(E.totals(g)),before);assert.equal(E.respondCallup(g,true),false);assert.equal(E.maybeCamp(g),false);
 for(let i=0;i<25&&g.phase==='ready';i++){E.advance(g);if(g.phase==='callup')E.respondCallup(g,false);}assert.equal(g.phase,'market');assert.equal(g.national.length,0);assert.ok(g.history[0].matches.length>0);
});
test('accepted U23 results survive reload, remain deterministic and never inflate club or senior totals',()=>{
 const g=called(),clubs=copy(E.totals(g));assert.ok(E.respondCallup(g,true));assert.equal(E.respondCallup(g,true),false);const a=copy(g),b=copy(g);
 while(!a.camp.complete)E.internationalMatch(a);while(!b.camp.complete)E.internationalMatch(b);assert.deepEqual(copy(a),copy(b));assert.ok(a.national.length>0);assert.equal(E.nationalStats(a,{level:'senior'}).apps,0);assert.equal(E.nationalStats(a,{level:'U23'}).apps,a.national.length);assert.deepEqual(copy(E.totals(a)),clubs);
 assert.ok(a.national.every(m=>m.nationalCountry==='KR'&&m.teamLevel==='U23'&&!m.isAMatch));const done=copy(a);assert.equal(E.internationalMatch(a),false);assert.deepEqual(copy(a),done);assert.ok(E.returnFromCamp(a));assert.equal(E.returnFromCamp(a),false);
});
test('nationality takes five continuous adult years, stays optional and cannot be claimed twice',()=>{
 const g=player(20,80,'FR'),start=g.clock;assert.equal(E.nationalityStatus(g).eligible,false);assert.equal(E.acquireNationality(g,'FR'),false);
 g.clock=start+5*24-1;g.age=25;g.year=E.date(g.clock).year;assert.equal(E.nationalityStatus(g).eligible,false);g.clock++;E.newPeriod(g);const s=E.nationalityStatus(g);assert.equal(s.months,60);assert.equal(s.remainingMonths,0);assert.equal(s.eligible,true);
 const before=copy(g);E.nationalityStatus(g);E.nationalityStatus(g);assert.deepEqual(copy(g),before);assert.ok(E.acquireNationality(g,'FR'));assert.deepEqual(copy(g.internationalCareer.nationalities),['KR','FR']);assert.equal(g.internationalCareer.representing,'KR');assert.equal(E.acquireNationality(g,'FR'),false);assert.equal(g.internationalCareer.acquired.length,1);
 const youth=player(15,65,'DE');youth.clock=E.tick(youth.birthYear+22,1);youth.year=E.date(youth.clock).year;youth.age=22;E.newPeriod(youth);assert.equal(E.nationalityStatus(youth).eligible,false);youth.clock=E.tick(youth.birthYear+23,1);youth.year++;youth.age=23;assert.equal(E.nationalityStatus(youth).eligible,true);
});
test('same-country transfers keep residence; international transfers restart it',()=>{
 const g=player(20,80,'FR'),start=g.internationalCareer.residenceSince;g.clock+=24;g.year++;g.age++;g.phase='market';g.offers=[{id:'same',kind:'pro',clubId:'FR-lyon',country:'FR',name:'리옹',wage:1000,months:24}];assert.ok(E.accept(g,'same'));assert.equal(g.internationalCareer.residenceSince,start);assert.equal(E.nationalityStatus(g).months,12);
 g.phase='market';g.offers=[{id:'abroad',kind:'pro',clubId:'IT-milan',country:'IT',name:'밀란',wage:1000,months:24}];assert.ok(E.accept(g,'abroad'));assert.equal(g.internationalCareer.residenceSince,g.clock);assert.equal(E.nationalityStatus(g).months,0);
 g.country='FR';g.clubId='FR-nantes';E.newPeriod(g);assert.equal(E.nationalityStatus(g).months,0);assert.equal(g.internationalCareer.residenceSince,g.clock);
});
test('a real same-country loan and automatic return keep the entire foreign residence period',()=>{
 const g=player(20,72,'FR'),start=g.internationalCareer.residenceSince;g.clock=E.tick(g.year+1,1);g.year++;g.age++;g.contract=24;g.wage=1000;g.phase='market';g.offers=[{id:'loan',kind:'loan',clubId:'FR-bordeaux',country:'FR',borrowStage:'pro',name:'보르도',months:6,wage:1000}];assert.ok(E.accept(g,'loan'));assert.equal(g.internationalCareer.residenceSince,start);
 for(let i=0;i<40&&['ready','callup','international'].includes(g.phase);i++){if(g.phase==='callup')E.respondCallup(g,false);else E.advance(g);}assert.equal(g.phase,'market');assert.equal(g.loan,null);assert.equal(g.clubId,'FR-nantes');assert.equal(g.internationalCareer.residenceSince,start);assert.ok(g.history.at(-1).matches.every(m=>m.clubId==='FR-bordeaux'));
});
test('one representative switch preserves Korean caps and generates foreign senior opponents and records',()=>{
 const g=called();playCamp(g);const old=copy(g.national);g.country='FR';g.clubId='FR-nantes';E.newPeriod(g);g.clock+=120;g.year=E.date(g.clock).year;g.age=g.year-g.birthYear;E.newPeriod(g);assert.ok(E.acquireNationality(g,'FR'));assert.ok(E.chooseRepresentative(g,'FR'));assert.equal(g.internationalCareer.switchUsed,true);assert.equal(E.chooseRepresentative(g,'KR'),false);assert.deepEqual(copy(g.national),old);
 for(const id of E.activeAttributes(g.player))g.player.details[id]=88;E.recalc(g.player);g.clock=E.tick(g.year,6,1);E.newPeriod(g);let found=E.maybeCamp(g);for(let i=0;i<4&&!found;i++){g.clock+=24;g.year++;g.age++;E.newPeriod(g);found=E.maybeCamp(g);}assert.ok(found);assert.equal(g.camp.country,'FR');assert.equal(g.camp.level,'senior');assert.ok(g.camp.opponents.every(o=>o!=='프랑스'));playCamp(g);
 assert.ok(g.national.some(m=>m.nationalCountry==='FR'&&m.isAMatch));assert.equal(E.nationalStats(g,{country:'KR',level:'U23'}).apps,old.length);assert.ok(E.nationalStats(g,{country:'FR',level:'senior'}).apps>0);assert.equal(E.canRepresent(g,'KR'),false);
});
test('a nationality choice before any caps remains reversible; unavailable nationalities and official caps are rejected',()=>{
 const g=player(25,85,'FR');g.internationalCareer.nationalities.push('FR');assert.equal(E.chooseRepresentative(g,'EN'),false);assert.ok(E.chooseRepresentative(g,'FR'));assert.equal(g.internationalCareer.switchUsed,false);assert.ok(E.chooseRepresentative(g,'KR'));g.national=[{minutes:90,nationalCountry:'KR',teamLevel:'senior',matchType:'official'}];assert.equal(E.chooseRepresentative(g,'FR'),false);assert.equal(g.internationalCareer.representing,'KR');
});
test('old national records and camps migrate as Korean senior caps without changing stored results',()=>{
 const g=called();playCamp(g);const stats=g.national.map(m=>[m.date,m.minutes,m.goals,m.assists,m.rating,m.own,m.opp]);delete g.nationalityVersion;delete g.internationalCareer;g.national.forEach(m=>{delete m.nationalCountry;delete m.teamLevel;delete m.matchType;delete m.isAMatch;});g.camp=null;
 g.country='FR';g.clubId='FR-nantes';g.journey.push({date:E.tick(2007,1),clubId:'FR-nantes'});g.clock=E.tick(2013,1);g.year=2013;g.age=28;g.period.start=E.tick(2012,7);g.period.country='FR';assert.ok(E.migrate(g));assert.deepEqual(g.national.map(m=>[m.date,m.minutes,m.goals,m.assists,m.rating,m.own,m.opp]),stats);assert.equal(E.nationalStats(g,{level:'senior'}).apps,stats.length);assert.equal(g.internationalCareer.residenceSince,E.tick(2007,1));assert.ok(E.nationalityStatus(g).eligible);assert.equal(E.migrate(g),false);
});
test('injured players and regular military service cannot receive a callup',()=>{
 const g=player(25,99);E.injure(g,E.dayAt(g.clock),'검사');assert.equal(E.maybeCamp(g),false);const h=player(25,99);h.stage='service';assert.equal(E.maybeCamp(h),false);
});
test('all five foreign nationalities yield their own senior team and cannot draw themselves as opponents',()=>{
 for(const country of['EN','IT','FR','DE','ES']){
  const g=player(20,89,country,1);g.clock+=120;g.year=E.date(g.clock).year;g.age=g.year-g.birthYear;E.newPeriod(g);assert.ok(E.acquireNationality(g,country));assert.ok(E.chooseRepresentative(g,country));assert.ok(E.maybeCamp(g));assert.equal(g.camp.country,country);assert.equal(g.camp.level,'senior');assert.ok(g.camp.opponents.every(o=>o!==E.NATIONAL_TEAMS[country].name));playCamp(g);assert.ok(E.nationalStats(g,{country,level:'senior'}).apps>0);
 }
 assert.equal(E.nationalityName('EN'),'영국');assert.equal(E.NATIONAL_TEAMS.EN.name,'잉글랜드');
});
