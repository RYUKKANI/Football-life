'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),load=require('./load-engine.cjs'),E=load();
function make(pos='ST',seed=914,talent='ordinary'){return E.create({name:'커리어 검증',number:9,pos,foot:'right',focus:[]},E.makeCandidate(pos,seed,talent),seed);}
test('six complete careers progress through schools, professional football and retirement',()=>{
 for(const pos of Object.keys(E.POS)){
  const g=make(pos),initial=E.overall(g.player);let peak=initial,halves=0;
  while(!g.retired&&halves++<60){
   g.training='core';const physical=Object.fromEntries(E.activeAttributes(g.player).filter(id=>E.growthType(id)==='physical').map(id=>[id,g.player.details[id]])),age=g.age;
   for(let guard=0;['ready','international'].includes(g.phase);guard++){
    assert.ok(guard<30,'half cannot stall');
    if(g.phase==='international'){while(!g.camp.complete)E.internationalMatch(g);E.returnFromCamp(g);}else E.advance(g);
   }
   peak=Math.max(peak,E.overall(g.player));assert.ok(Number.isFinite(E.overall(g.player)));
   for(const value of Object.values(g.player.details))assert.ok(Number.isFinite(value)&&value>=10&&value<=99);
   if(age>=30)for(const [id,value] of Object.entries(physical))assert.ok(g.player.details[id]<=value+.001,'physical training cannot grow veteran '+id);
   const total=E.totals(g),matches=g.history.flatMap(r=>r.matches);assert.equal(total.apps,matches.filter(m=>m.minutes).length);assert.equal(total.starts,matches.filter(m=>m.started).length);
   if(g.phase==='market')assert.ok(E.accept(g,(g.offers.find(o=>o.kind==='pro')||g.offers.find(o=>o.kind==='academy')||g.offers[0]).id));
  }
  assert.ok(g.retired);assert.equal(g.age,pos==='GK'?40:38);assert.equal(g.stage,'pro');assert.ok(peak>initial+15);assert.ok(E.overall(g.player)<peak,'late career loses overall ability');assert.ok(E.totals(g).apps>100);
 }
});
test('difficult training causes more match injuries and absences than recovery training',()=>{
 const injuries={light:0,hard:0},absences={light:0,hard:0};
 for(const intensity of ['light','hard'])for(let seed=0;seed<180;seed++){
  const g=make('CB',10000+seed);g.intensity=intensity;g.trust=95;for(const id of E.activeAttributes(g.player))g.player.details[id]=75;
  for(let match=0;match<24;match++){
   const day=E.dayAt(g.clock)+match*5,m=E.simulateAppearance(g,60,70,day,true);if(m.injury?.start===day)injuries[intensity]++;if(m.injured&&!m.minutes)absences[intensity]++;
   if(m.minutes)g.fitness=Math.max(25,g.fitness-m.minutes/90*13);
  }
 }
 assert.ok(injuries.hard>injuries.light*1.7);assert.ok(absences.hard>absences.light*1.7);
});
test('fatigue changes execution, rather than only changing a displayed overall',()=>{
 const totals={rested:{passes:0,completed:0},tired:{passes:0,completed:0}};
 for(const cohort of Object.keys(totals))for(let seed=0;seed<700;seed++){
  const g=make('MF',14000+seed);g.trust=95;g.intensity='light';g.fitness=cohort==='rested'?100:25;for(const id of E.activeAttributes(g.player))g.player.details[id]=80;
  const m=E.simulateAppearance(g,60,70,E.dayAt(g.clock));totals[cohort].passes+=m.passes;totals[cohort].completed+=m.completed;
 }
 assert.ok(totals.rested.completed/totals.rested.passes>totals.tired.completed/totals.tired.passes+.025);
});
test('annual physical growth gives way to technique, then declines with age',()=>{
 const groups={};
 for(const age of [18,25,32,38]){
  const g=make('WG');g.age=age;for(const id of E.activeAttributes(g.player))g.player.details[id]=60;E.train(g);E.settleDevelopment(g,g.target);groups[age]=g.period.trainingReview;
 }
 assert.ok(groups[18].summary.physical>groups[25].summary.physical*3);assert.ok(groups[25].summary.technique>groups[25].summary.physical*2);assert.equal(groups[32].summary.physical,0);assert.ok(groups[38].aging.physical<groups[32].aging.physical);
});
