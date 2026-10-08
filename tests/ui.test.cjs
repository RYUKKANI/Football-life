'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const files=['era-2000.js','style-rules.js','style-icons.js','home-art.js','game-data.js','career-data.js','game-engine.js','game-career.js','game-national.js','game-expansion.js','club-crests.js','team-crests.js','game-save.js','soundtracks.js','game-audio.js','game-ui.js'];
const source=files.map(n=>fs.readFileSync(path.join(__dirname,'../src',n),'utf8')).join('\n');
const STORE='this-life-football-v2',clone=v=>JSON.parse(JSON.stringify(v));
function setup(storage=new Map()){
 const listeners={},dialogEvents={},errors=[],nodes={app:{innerHTML:'',dataset:{}},toast:{textContent:'',classList:{add(){},remove(){}}},'backup-file':{click(){},value:''},dialog:{innerHTML:'',open:false,showModal(){this.open=true},close(){this.open=false;dialogEvents.close?.()},addEventListener(type,fn){dialogEvents[type]=fn}}};
 let failSave=false,now=0,nextTimer=0;const timers=new Map();
 const document={documentElement:{classList:{toggle(){}}},getElementById:id=>nodes[id]||null,querySelectorAll:()=>[],addEventListener:(type,fn)=>listeners[type]=fn,createElement:()=>({click(){}})};
 const context={document,crypto:{getRandomValues(a){a[0]=914;return a}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>{if(failSave)throw Error('Quota test');storage.set(k,v)}},window:{scrollY:0,scrollTo(){}},console:{error:e=>errors.push(e)},setTimeout:(fn,delay)=>{timers.set(++nextTimer,{fn,at:now+delay});return nextTimer},clearTimeout:id=>timers.delete(id),Blob,URL};
 vm.createContext(context);vm.runInContext(source+';this.E=FootballEngine;this.Save=FootballSave;this.Audio=FootballAudio;',context);
 const endScene=()=>{if(nodes.app.dataset.screen==='loading')listeners.click({target:{closest:()=>({dataset:{action:'skip-scene'},disabled:false})}});};
 return {E:context.E,Save:context.Save,Audio:context.Audio,storage,nodes,html:()=>nodes.app.innerHTML,state:()=>JSON.parse(storage.get(STORE)||'null'),failSave:v=>{failSave=v},advanceClock(ms){const end=now+ms;for(let i=0;i<100;i++){const due=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;now=due[1].at;timers.delete(due[0]);due[1].fn();}now=end;},click(action,fields={},skip=true){listeners.click({target:{closest:()=>({dataset:{action,...fields},disabled:false})}});if(skip)endScene();assert.equal(errors.length,0,errors.map(e=>e.message).join(';'));},submit(skip=true){listeners.submit({target:{id:'creation'},preventDefault(){}});if(skip)endScene();},async import(data){listeners.change({target:{id:'backup-file',value:'file.json',files:[{size:JSON.stringify(data).length,text:async()=>JSON.stringify(data)}]}});await new Promise(setImmediate);}};
}
function start(u,pos='ST',name='테스트 선수'){u.click('new');u.nodes.name={value:name};u.nodes.number={value:'9'};u.click('draft',{key:'pos',value:pos});u.submit();u.click('growth');u.click('begin');u.click('confirm-profile');}
function openOffers(u){for(let i=0;i<3&&u.state().game.marketStep!=='offers';i++)u.click('market-next');assert.equal(u.state().game.marketStep,'offers');}
function finishUI(u){for(let guard=0;['ready','callup','international','cup','rehab'].includes(u.state().game.phase);guard++){assert.ok(guard<200,'UI progress stalled');const g=u.state().game;if(g.phase==='ready')u.click('advance');else if(g.phase==='rehab')u.click('rehab-choice',{value:'normal'});else if(g.phase==='cup')u.click(g.cupMatch.stage==='result'?'cup-continue':'cup-play',{value:'auto'});else if(g.phase==='callup')u.click('callup-decline');else u.click(g.camp.complete?'return':'international');}}
function nationalPlayer(age=21,country='KR',value=72){const u=setup(),E=u.E,g=E.create({name:'대표팀 선수',number:9,pos:'ST',foot:'right',focus:[]},E.makeCandidate('ST',1,'ordinary'),1);g.clock=E.tick(g.birthYear+age,3,1);g.year=g.birthYear+age;g.age=age;g.stage='pro';g.country=country;g.clubId=country==='FR'?'FR-nantes':'KR-suwon';for(const id of E.activeAttributes(g.player))g.player.details[id]=value;E.recalc(g.player);g.reputation=100;g.trust=95;E.newPeriod(g);return{E,g};}
const nationalStorage=g=>new Map([[STORE,JSON.stringify({version:2,game:g,archives:[],legacy:[]})]]);

test('U23 callup decisions survive reload, roll back failed saves and require acceptance before a match',()=>{
 const{E,g}=nationalPlayer();assert.ok(E.maybeCamp(g));const u=setup(nationalStorage(g));u.click('hub');assert.match(u.html(),/대한민국 U23 대표팀|소집 수락|이번 소집 거절/);assert.doesNotMatch(u.html(),/A매치/);const before=clone(u.state());u.click('international');assert.deepEqual(u.state(),before);u.failSave(true);u.click('callup-accept');assert.deepEqual(u.state(),before);u.failSave(false);u.click('callup-accept',{},false);assert.equal(u.state().game.phase,'international');assert.equal(u.nodes.app.dataset.screen,'loading');u.advanceClock(3999);assert.equal(u.nodes.app.dataset.screen,'loading');u.advanceClock(1);assert.match(u.html(),/U23 친선 경기/);
 const reload=setup(u.storage);reload.click('hub');const accepted=clone(reload.state());reload.click('callup-accept');assert.deepEqual(reload.state(),accepted);reload.click('international');const first=clone(reload.state());assert.equal(first.game.camp.matches.length,1);const again=setup(reload.storage);again.click('hub');assert.match(again.html(),/1\/2경기/);again.click('international');assert.equal(again.state().game.camp.matches.length,2);const completed=clone(again.state());again.click('international');assert.deepEqual(again.state(),completed);again.click('return');assert.equal(again.state().game.phase,'ready');again.click('tab',{value:'career'});assert.match(again.html(),/성인 A매치|연령별 대표팀|대한민국 U23 대표팀/);assert.doesNotMatch(again.html(),/유스 대표팀.*포함하지/);
});
test('declining a callup creates no caps, survives reload and resumes after the same processed date',()=>{
 const{E,g}=nationalPlayer();assert.ok(E.maybeCamp(g));g.lastProcessedClock=g.clock;const u=setup(nationalStorage(g)),date=g.clock;u.click('hub');u.failSave(true);u.click('callup-decline');assert.equal(u.state().game.phase,'callup');u.failSave(false);u.click('callup-decline');assert.equal(u.state().game.phase,'ready');assert.equal(u.state().game.national.length,0);const reload=setup(u.storage);reload.click('hub');assert.match(reload.html(),/소속팀 훈련/);reload.click('advance');assert.ok(reload.state().game.clock>date);assert.equal(reload.state().game.internationalCareer.decisions.filter(d=>d.date===date).length,1);
});
test('foreign nationality can be acquired and selected with saved confirmation, separate from club country',()=>{
 const{E,g}=nationalPlayer(20,'FR',85);g.clock+=120;g.year=E.date(g.clock).year;g.age=g.year-g.birthYear;E.newPeriod(g);const u=setup(nationalStorage(g));u.click('show-nationality');assert.match(u.html(),/프랑스 국적 취득/);assert.match(u.html(),/신청 가능|5년 0개월/);const before=clone(u.state());u.failSave(true);u.click('acquire-nationality',{value:'FR'});assert.deepEqual(u.state(),before);u.failSave(false);u.click('acquire-nationality',{value:'FR'});assert.deepEqual(u.state().game.internationalCareer.nationalities,['KR','FR']);assert.equal(u.state().game.internationalCareer.representing,'KR');u.click('representative-open',{value:'FR'});assert.ok(u.nodes.dialog.open);u.click('close');u.click('representative-confirm');assert.equal(u.state().game.internationalCareer.representing,'KR');u.click('representative-open',{value:'FR'});u.failSave(true);u.click('representative-confirm');assert.equal(u.state().game.internationalCareer.representing,'KR');u.failSave(false);u.click('representative-open',{value:'FR'});u.click('representative-confirm');assert.equal(u.state().game.internationalCareer.representing,'FR');assert.equal(u.state().game.country,'FR');const reload=setup(u.storage);reload.click('show-nationality');assert.match(reload.html(),/프랑스 대표팀/);assert.match(reload.html(),/취득 완료/);
});
test('portable national backups reject invalid eligibility, duplicate passports and impossible pending camps',()=>{
 const{E,g}=nationalPlayer();assert.ok(E.maybeCamp(g));const u=setup(nationalStorage(g)),valid=clone(u.state());assert.equal(u.Save.parse(JSON.stringify(valid)).game.phase,'callup');
 for(const mutate of[g=>g.internationalCareer.nationalities.push('KR'),g=>g.internationalCareer.representing='FR',g=>g.internationalCareer.nationalities=['constructor'],g=>g.internationalCareer.residenceSince=g.clock+1,g=>g.camp.accepted=true,g=>g.camp.level='U99',g=>g.internationalCareer.decisions.push({date:g.clock,country:'FR',level:'U23',accepted:'yes'})]){const bad=clone(valid);mutate(bad.game);assert.throws(()=>u.Save.parse(JSON.stringify(bad)),/기록 파일/);}
});
test('old active senior camps import without a new decision and retain their completed match',()=>{
 const{E,g}=nationalPlayer(25,'KR',85);assert.ok(E.maybeCamp(g));assert.ok(E.respondCallup(g,true));E.internationalMatch(g);const old=clone({version:2,game:g,archives:[],legacy:[]}),score=clone(old.game.camp.matches[0]);delete old.game.nationalityVersion;delete old.game.internationalCareer;for(const m of[...old.game.national,...old.game.camp.matches]){delete m.nationalCountry;delete m.teamLevel;delete m.matchType;delete m.isAMatch;}for(const key of['country','level','matchType','accepted'])delete old.game.camp[key];const u=setup(),migrated=u.Save.parse(JSON.stringify(old)).game;assert.equal(migrated.phase,'international');assert.equal(migrated.camp.accepted,true);assert.equal(migrated.camp.level,'senior');assert.equal(migrated.camp.matches.length,1);assert.equal(migrated.camp.matches[0].own,score.own);assert.equal(migrated.camp.matches[0].opp,score.opp);const reload=setup(nationalStorage(migrated));reload.click('hub');assert.match(reload.html(),/성인 대표팀|A매치/);assert.doesNotMatch(reload.html(),/소집 수락/);
});
test('brand and five real menu destinations work without starting a fake online feature',()=>{
 const u=setup();assert.match(u.html(),/축구 생활/);assert.match(u.html(),/FOOTBALL LIFE/);assert.doesNotMatch(u.html(),/이번 생은 축구다|로그인|멀티플레이/);
 assert.equal((u.html().match(/class="nav-btn/g)||[]).length,5);u.click('settings');assert.match(u.html(),/기록 파일 불러오기/);u.click('toggle-motion');assert.ok(JSON.parse(u.storage.get('football-life-preferences')).reducedMotion);u.click('home');start(u);u.click('player-menu');assert.match(u.html(),/data-stat="finishing"/);assert.match(u.html(),/종합 능력 계산/);
 assert.doesNotMatch(u.html(),/home-art/);u.click('guide');assert.match(u.nodes.dialog.innerHTML,/피지컬은 30세부터/);
});
test('training, fixtures, styles, results and proposals remain separate and stable on reload',()=>{
 const u=setup();start(u,'GK');assert.match(u.html(),/소속팀 훈련/);assert.doesNotMatch(u.html(),/유소년 토너먼트|다음 플레이스타일/);
 u.click('season-view',{value:'schedule'});assert.match(u.html(),/유소년 토너먼트/);assert.doesNotMatch(u.html(),/소속팀 훈련|다음 플레이스타일/);
 u.click('season-view',{value:'traits'});assert.match(u.html(),/다음 플레이스타일/);assert.doesNotMatch(u.html(),/소속팀 훈련|유소년 토너먼트/);
 u.click('show-plus');assert.match(u.html(),/플레이스타일\+ 강화/);assert.doesNotMatch(u.html(),/style-gallery/);u.click('player-tab',{value:'styles'});assert.equal((u.html().match(/class="reference-style-icon"/g)||[]).length,36);
  u.click('tab',{value:'season'});u.click('advance');finishUI(u);const before=clone(u.state());assert.match(u.html(),/반기 기록/);assert.doesNotMatch(u.html(),/class="offer /);assert.match(u.html(),/선방률|클럽 경기/);
 u.click('offer',{value:'stay'});assert.deepEqual(u.state(),before);u.click('market-next');assert.doesNotMatch(u.html(),/反기|반기 기록|경기별 기록/);const after=clone(u.state());u.click('market-back');u.click('market-next');assert.deepEqual(u.state(),after);
  const reload=setup(u.storage);reload.click('hub');assert.match(reload.html(),/class="offer/);reload.click('offer',{value:'stay'});reload.click('confirm-profile');reload.click('advance');finishUI(reload);assert.match(reload.html(),/다음 · 시즌 스카우팅 리포트/);reload.click('market-next');assert.match(reload.html(),/스카우팅 리포트/);assert.doesNotMatch(reload.html(),/class="offer/);reload.click('market-next');assert.match(reload.html(),/고교 \/ 해외 유스 제안/);assert.doesNotMatch(reload.html(),/반기 기록/);
});
test('all positions show their own read-only ability groups',()=>{
 for(const pos of ['ST','WG','MF','CB','FB','GK']){
  const u=setup();start(u,pos);u.click('player-menu');assert.equal((u.html().match(/data-stat="/g)||[]).length,17);assert.doesNotMatch(u.html(),/data-action="upgrade"|type="range"/);
  assert.equal(u.html().includes('data-stat="diving"'),pos==='GK');assert.match(u.html(),new RegExp(u.E.POS[pos].name));
 }
});
test('portable backups preserve the current life; duplicate imports do not add identical archives',async()=>{
 const from=setup();start(from,'MF','가져온 선수');from.click('advance');const data=clone(from.state());
 const to=setup();start(to,'CB','기존 선수');const before=clone(to.state());await to.import(data);assert.ok(to.nodes.dialog.open);assert.deepEqual(to.state(),before);to.click('close');to.click('confirm-import');assert.deepEqual(to.state(),before);
 await to.import(data);to.click('confirm-import');assert.equal(to.state().game.player.name,'가져온 선수');assert.equal(to.state().archives[0].player.name,'기존 선수');assert.equal(to.state().archives.length,1);assert.deepEqual(to.state().game.history,data.game.history);
 await to.import(data);to.click('confirm-import');assert.equal(to.state().archives.length,1);
});
test('bad backups and storage failure never replace current records',async()=>{
 const u=setup();start(u);const before=clone(u.state());await u.import({version:2,game:{player:{name:'잘못된 선수'}},archives:[]});assert.deepEqual(u.state(),before);assert.ok(!u.nodes.dialog.open);
 assert.throws(()=>u.Save.parse('{"__proto__":{},"version":2}'));
 const incoming=clone(before);incoming.game.player.name='다른 선수';await u.import(incoming);u.failSave(true);u.click('confirm-import');assert.deepEqual(u.state(),before);u.failSave(false);u.click('close');u.click('hub');assert.match(u.html(),/테스트 선수/);
});
test('deletion targets exact archives and rolls back on failed storage',()=>{
 const initial=setup();start(initial);const save=clone(initial.state()),a=clone(save.game),b=clone(save.game);a.player.name=b.player.name='동명이인';a.age=17;b.age=18;save.archives=[a,b];const u=setup(new Map([[STORE,JSON.stringify(save)]]));u.click('archives');
 u.click('delete-career',{source:'archives',index:'1'});assert.match(u.nodes.dialog.innerHTML,/18세/);u.click('close');u.click('confirm-delete-career');assert.equal(u.state().archives.length,2);
 u.click('delete-career',{source:'archives',index:'1'});u.click('confirm-delete-career');assert.equal(u.state().archives.length,1);assert.equal(u.state().archives[0].age,17);
 const before=clone(u.state());u.click('delete-career',{source:'active',index:'0'});u.failSave(true);u.click('confirm-delete-career');assert.deepEqual(u.state(),before);u.failSave(false);u.click('close');u.click('delete-career',{source:'active',index:'0'});u.click('confirm-delete-career');assert.equal(u.state().game,null);assert.equal(u.state().archives.length,1);
});
test('injury recovery and ageing show readable, separate explanations',()=>{
 const first=setup();start(first,'GK');const data=clone(first.state());data.game.health.injuries.push({name:'무릎 부상',start:first.E.dayAt(data.game.clock),until:first.E.dayAt(data.game.clock)+30,days:30});const u=setup(new Map([[STORE,JSON.stringify(data)]]));u.click('hub');assert.match(u.html(),/회복까지 30일 · 출전 불가/);u.click('advance');assert.match(u.html(),/복귀 계획/);u.click('rehab-choice',{value:'normal'});finishUI(u);assert.match(u.html(),/부상으로 훈련 제한/);assert.match(u.html(),/변화 원인/);assert.doesNotMatch(u.html(),/class="offer /);
});
test('new seasons confirm a profile; domestic midseason resumes directly, saves once and rolls back on failure',()=>{
 const u=setup();u.click('new');assert.doesNotMatch(u.html(),/잠재력|재능 10종|99%|1%|랜덤 배정/);u.nodes.name={value:'프로필 선수'};u.nodes.number={value:'17'};u.submit();u.click('reveal');assert.doesNotMatch(u.html(),/잠재력|재능 10종/);u.click('growth');u.click('begin');assert.match(u.html(),/선수 준비 완료/);assert.match(u.html(),/cm \/ \d+kg/);assert.equal(u.state(),null);
  const profile=u.html();u.click('profile-back');u.click('begin');assert.equal(u.html(),profile);u.click('confirm-profile');const before=clone(u.state());u.click('advance',{},false);assert.match(u.html(),/progress-scene/);const after=clone(u.state());u.click('advance',{},false);assert.deepEqual(u.state(),after);u.click('skip-scene');finishUI(u);assert.match(u.html(),/반기 기록/);openOffers(u);
 const midseason=clone(u.state());u.failSave(true);u.click('offer',{value:'stay'});assert.deepEqual(u.state(),midseason);assert.doesNotMatch(u.html(),/PLAYER PROFILE/);u.failSave(false);u.click('offer',{value:'stay'});assert.match(u.html(),/소속팀 훈련/);assert.doesNotMatch(u.html(),/PLAYER PROFILE|선택 다시 보기/);assert.equal(u.state().game.phase,'ready');
 const resumed=clone(u.state());u.click('offer',{value:'stay'});u.click('confirm-profile');assert.deepEqual(u.state(),resumed);const reload=setup(u.storage);reload.click('hub');assert.match(reload.html(),/소속팀 훈련/);assert.deepEqual(reload.state(),resumed);
  reload.click('advance');finishUI(reload);openOffers(reload);const annual=clone(reload.state()),offer=annual.game.offers.find(o=>o.kind==='academy');reload.click('offer',{value:offer.id});assert.match(reload.html(),/PLAYER PROFILE|새 시즌 시작/);assert.deepEqual(reload.state(),annual);reload.failSave(true);reload.click('confirm-profile');assert.deepEqual(reload.state(),annual);reload.failSave(false);reload.click('profile-back');reload.click('offer',{value:offer.id});reload.click('confirm-profile');assert.equal(reload.state().game.phase,'ready');assert.equal(reload.state().game.player.name,before.game.player.name);assert.equal(reload.state().game.clubId,offer.clubId);
});
test('new role, mentor and ranking screens are separate, persist rewards once, and reject malformed new backups',()=>{
 const u=setup();start(u,'GK');u.click('season-view',{value:'role'});assert.match(u.html(),/이번 반기 목표/);assert.doesNotMatch(u.html(),/training-options|다음 플레이스타일/);u.click('manager',{value:'rest'});assert.match(u.html(),/회복을 먼저/);u.click('season-view',{value:'special'});assert.match(u.html(),/data-value="training" aria-pressed="true"/);u.click('special-start',{value:'mentor'});assert.ok(u.nodes.dialog.open);assert.match(u.nodes.dialog.innerHTML,/멘토 지도 완료/);assert.equal(u.state().game.special.used,1);u.click('close');const before=clone(u.state());u.click('special-start',{value:'mentor'});assert.deepEqual(u.state(),before);u.click('tab',{value:'league'});u.click('rank-open',{world:'KR-2000-pro'});assert.match(u.html(),/개인 순위/);assert.doesNotMatch(u.html(),/training-options/);const bad=clone(before);bad.game.stage='university';bad.game.special.used=99;assert.throws(()=>u.Save.parse(JSON.stringify(bad)));
});
test('two-step and three-step loading last exactly 4 seconds; reduced motion and skipping preserve the result',()=>{
 const u=setup();u.click('settings');u.click('toggle-motion');u.click('new');u.nodes.name={value:'연출 선수'};u.nodes.number={value:'9'};u.submit(false);
 assert.equal(u.nodes.app.dataset.screen,'loading');u.advanceClock(1749);assert.doesNotMatch(u.html(),/>완료</);u.advanceClock(1);assert.match(u.html(),/>완료</);u.advanceClock(1750);assert.equal((u.html().match(/>완료</g)||[]).length,2);u.advanceClock(499);assert.equal(u.nodes.app.dataset.screen,'loading');u.advanceClock(1);assert.equal(u.nodes.app.dataset.screen,'talents');
 u.click('growth');u.click('begin');u.click('confirm-profile');u.click('advance',{},false);const saved=clone(u.state());u.advanceClock(3498);assert.equal((u.html().match(/>완료</g)||[]).length,3);u.advanceClock(501);assert.equal(u.nodes.app.dataset.screen,'loading');u.advanceClock(1);assert.notEqual(u.nodes.app.dataset.screen,'loading');assert.deepEqual(u.state(),saved);finishUI(u);assert.match(u.html(),/반기 기록/);openOffers(u);u.click('offer',{value:'stay'});u.click('advance',{},false);const skipped=clone(u.state());u.click('skip-scene');const skippedHTML=u.html();assert.notEqual(u.nodes.app.dataset.screen,'loading');u.advanceClock(10000);assert.deepEqual(u.state(),skipped);assert.equal(u.html(),skippedHTML);finishUI(u);assert.match(u.html(),/반기 기록/);
});
test('sound controls are available and preferences survive reopening without changing the player',()=>{
 const u=setup();start(u);const before=clone(u.state());u.click('settings');assert.match(u.html(),/배경음/);assert.match(u.html(),/버튼 효과음/);assert.match(u.html(),/id="music-volume"/);u.click('audio-mute');assert.equal(JSON.parse(u.storage.get('football-life-audio')).muted,true);assert.deepEqual(u.state(),before);const again=setup(u.storage);again.click('settings');assert.match(again.html(),/음소거/);assert.match(again.html(),/aria-pressed="true"/);
});
test('creating another player uses the new season and theme while preserving the current overseas career',()=>{
 const original=setup();start(original,'GK','기존 선수');const data=clone(original.state());
 Object.assign(data.game,{country:'FR',clubId:'FR-guingamp',stage:'pro',year:2005,age:20,clock:original.E.tick(2005,7)});
 const u=setup(new Map([[STORE,JSON.stringify(data)]])),before=clone(u.state());assert.equal(u.Audio.getTheme(),'overseas');
 u.click('new');u.click('confirm-new');assert.equal(u.Audio.getTheme(),'middle');u.nodes.name={value:'새로운 선수'};u.nodes.number={value:'8'};u.submit(false);
 assert.match(u.html(),/2000 · 새로운 선수/);assert.doesNotMatch(u.html(),/2005|갱강/);assert.equal(u.Audio.getTheme(),'middle');assert.deepEqual(u.state(),before);
 u.advanceClock(4000);u.click('growth');u.click('begin',{},false);assert.match(u.html(),/2000년/);assert.doesNotMatch(u.html(),/2005|갱강/);assert.match(u.html(),/club-crest/);assert.equal(u.Audio.getTheme(),'middle');assert.deepEqual(u.state(),before);
 u.click('skip-scene');assert.match(u.html(),/새로운 선수/);u.click('home');assert.equal(u.Audio.getTheme(),'overseas');assert.deepEqual(u.state(),before);assert.match(u.html(),/기존 선수/);
});
test('overseas professionals show a profile in summer but skip it for a winter transfer',()=>{
 for(const startMonth of [1,7]){
  const original=setup();start(original,'ST','해외 선수');const data=clone(original.state());Object.assign(data.game,{country:'FR',clubId:'FR-guingamp',stage:'pro',year:2005,age:20,clock:original.E.tick(2005,startMonth)});original.E.newPeriod(data.game);
  const u=setup(new Map([[STORE,JSON.stringify(data)]]));u.click('hub');finishUI(u);assert.equal(u.state().game.phase,'market');openOffers(u);
  let market=clone(u.state());if(startMonth===7){market.game.offers.push({id:'winter-transfer',kind:'pro',clubId:'FR-nantes',country:'FR',name:'낭트',months:24,wage:9000});}
  const next=setup(new Map([[STORE,JSON.stringify(market)]]));next.click('hub');const before=clone(next.state());next.click('offer',{value:startMonth===1?'stay':'winter-transfer'},false);
  if(startMonth===1){assert.deepEqual(next.state(),before);next.advanceClock(4000);assert.equal(next.nodes.app.dataset.screen,'profile');assert.match(next.html(),/새 시즌 시작/);next.click('confirm-profile');}
  else{assert.equal(next.state().game.clubId,'FR-nantes');assert.equal(next.state().game.phase,'ready');next.advanceClock(3999);assert.equal(next.nodes.app.dataset.screen,'loading');next.advanceClock(1);assert.match(next.html(),/소속팀 훈련/);assert.doesNotMatch(next.html(),/PLAYER PROFILE/);const saved=clone(next.state());next.click('offer',{value:'winter-transfer'});next.click('confirm-profile');assert.deepEqual(next.state(),saved);}
  assert.equal(next.state().game.phase,'ready');assert.equal(next.state().game.history.length,before.game.history.length);
 }
});
test('cup preview, saved result and continuation remain separate and storage failure restores the original match',()=>{
 const {E,g}=nationalPlayer(20,'KR',84),steps=require('./advance-career.cjs');
 for(let n=0;g.phase!=='cup'&&n<100;n++){if(g.phase==='market')E.accept(g,'stay');else steps.step(E,g,{accept:false});}
 assert.equal(g.phase,'cup');const u=setup(nationalStorage(g));u.click('hub');assert.match(u.html(),/출전 준비|플레이 선택/);assert.doesNotMatch(u.html(),/class="offer /);
 const before=clone(u.state());u.failSave(true);u.click('cup-play',{value:'auto'});assert.deepEqual(u.state(),before);u.failSave(false);u.click('cup-play',{value:'auto'},false);
 const played=clone(u.state());assert.equal(played.game.period.matches.length,before.game.period.matches.length+1);u.click('cup-play',{value:'auto'},false);assert.deepEqual(u.state(),played);u.advanceClock(3999);assert.equal(u.nodes.app.dataset.screen,'loading');u.advanceClock(1);
 const reload=setup(u.storage);reload.click('hub');assert.match(reload.html(),/경기 결과|승부차기/);if(reload.state().game.cupMatch.stage==='shootout')reload.click('cup-play',{value:'auto'});
 const completed=clone(reload.state());assert.match(reload.html(),/경기 결과/);reload.click('cup-play',{value:'auto'});assert.deepEqual(reload.state(),completed);reload.click('cup-continue');assert.equal(reload.state().game.phase,'ready');assert.equal(reload.state().game.period.matches.length,played.game.period.matches.length);
});
test('rehabilitation choices roll back on save failure and a confirmed plan resumes without a new player profile',()=>{
 const {E,g}=nationalPlayer(20,'KR',75),day=E.dayAt(g.clock);g.health.injuries.push({name:'햄스트링 부상',start:day,until:day+30,days:30});E.advance(g);assert.equal(g.phase,'rehab');
 const u=setup(nationalStorage(g));u.click('hub');assert.match(u.html(),/복귀 계획|충분한 재활|빠른 복귀/);const before=clone(u.state());u.failSave(true);u.click('rehab-choice',{value:'safe'});assert.deepEqual(u.state(),before);u.failSave(false);u.click('rehab-choice',{value:'safe'},false);const saved=clone(u.state());assert.equal(saved.game.health.injuries.at(-1).rehabChoice,'safe');u.advanceClock(4000);assert.doesNotMatch(u.html(),/PLAYER PROFILE/);
 const reload=setup(u.storage);reload.click('hub');assert.equal(reload.state().game.phase,'ready');reload.click('rehab-choice',{value:'early'});assert.deepEqual(reload.state(),saved);
});
test('coaching, offer comparison and season graphs are readable and inspection preserves the saved career',()=>{
 const {E,g}=nationalPlayer(20,'FR',78);const u=setup(nationalStorage(g));u.click('hub');u.click('season-view',{value:'role'});assert.match(u.html(),/감독 전술과 주전 경쟁|선발 전망|전술 적합도/);
 const before=clone(u.state());u.click('tab',{value:'career'});u.click('trend-open');assert.match(u.html(),/최근 5시즌 비교/);assert.deepEqual(u.state(),before);u.click('trend-back');assert.deepEqual(u.state(),before);
 require('./advance-career.cjs').finish(E,g,{accept:false});g.marketStep='offers';const offers=setup(nationalStorage(g));offers.click('hub');assert.match(offers.html(),/이적 제안 비교|예상 출전|경쟁 기량|성장 \+/);assert.doesNotMatch(offers.html(),/반기 기록/);
});
test('professional and university fixture views show the upcoming league without changing records or the next result',()=>{
 for(const country of ['KR','FR']){
  const {E,g}=nationalPlayer(20,country,78);if(country==='FR'){g.clock=E.tick(2005,7);E.newPeriod(g);delete g.competitionState.clubs['DOM-FR-2005'];delete g.competitionState.clubs['EU-2005'];}
  const u=setup(nationalStorage(g));u.click('hub');const before=clone(u.state());
  u.click('season-view',{value:'schedule'});assert.match(u.html(),/리그 일정|남은 리그 일정/);assert.match(u.html(),/클럽 컵대회/);assert.doesNotMatch(u.html(),/소속팀 훈련|다음 플레이스타일/);
  if(country==='FR'){const html=u.html().replace(/src="data:[^"]+"/g,'src="crest"');assert.match(html,/2005\/06/);assert.match(html,/34경기 남음/);assert.match(html,/2005년 8월 상순/);assert.match(html,/쿠프 드 프랑스 · 2005 출전 예정/);assert.doesNotMatch(html,/쿠프 드 프랑스 · 2004/);}
  assert.deepEqual(u.state(),before);u.click('season-view',{value:'role'});u.click('season-view',{value:'schedule'});assert.deepEqual(u.state(),before);
 }
 const {E,g}=nationalPlayer(20,'KR',65);g.stage='university';g.clubId='UNI-yonsei';E.newPeriod(g);const u=setup(nationalStorage(g));u.click('hub');const before=clone(u.state());u.click('season-view',{value:'schedule'});assert.match(u.html(),/리그 일정/);assert.doesNotMatch(u.html(),/클럽 컵대회/);assert.deepEqual(u.state(),before);
});
test('official finals expose one important-match choice at a time and keep caps through completion and reload',()=>{
 const {E,g}=nationalPlayer(21,'KR',96);g.clock=E.tick(2006,6,1);E.newPeriod(g);const def={...E.nationalDefinitions(2006).find(d=>d.kind==='world'),year:2006};
 const q=E.nationalTournament(g,def,true);q.complete=true;q.qualified=true;const c=E.nationalTournament(g,def,false);for(const t of [...c.teams,...c.table])t.power=t.id==='KR'?95:35;
 assert.ok(E.maybeCamp(g));const u=setup(nationalStorage(g));u.click('hub');assert.match(u.html(),/FIFA 월드컵/);u.click('callup-accept');
 let choices=0;for(let guard=0;!u.state().game.camp.complete;guard++){assert.ok(guard<20);const current=u.state().game,x=E.nationalContext(current);if(x.important){choices++;assert.match(u.html(),/플레이 선택|승부차기/);assert.doesNotMatch(u.html(),/data-action="international"/);u.click('international-choice',{value:'auto'});}else u.click('international');}
 assert.ok(choices>0);const finished=clone(u.state()),reload=setup(u.storage);reload.click('hub');assert.match(reload.html(),/대표팀 일정 완료|소속팀으로 복귀/);reload.click('international');assert.deepEqual(reload.state(),finished);reload.click('return');reload.click('tab',{value:'career'});assert.match(reload.html(),/대표팀 대회와 클럽 컵 우승 연혁|FIFA 월드컵/);
});
