'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const files=['era-2000.js','style-rules.js','style-icons.js','home-art.js','game-data.js','career-data.js','game-engine.js','game-career.js','club-crests.js','team-crests.js','game-save.js','soundtracks.js','game-audio.js','game-ui.js'];
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
 u.click('tab',{value:'season'});u.click('advance');const before=clone(u.state());assert.match(u.html(),/반기 기록/);assert.doesNotMatch(u.html(),/class="offer /);assert.match(u.html(),/선방률|클럽 경기/);
 u.click('offer',{value:'stay'});assert.deepEqual(u.state(),before);u.click('market-next');assert.doesNotMatch(u.html(),/反기|반기 기록|경기별 기록/);const after=clone(u.state());u.click('market-back');u.click('market-next');assert.deepEqual(u.state(),after);
 const reload=setup(u.storage);reload.click('hub');assert.match(reload.html(),/class="offer/);reload.click('offer',{value:'stay'});reload.click('confirm-profile');reload.click('advance');assert.match(reload.html(),/다음 · 시즌 스카우팅 리포트/);reload.click('market-next');assert.match(reload.html(),/스카우팅 리포트/);assert.doesNotMatch(reload.html(),/class="offer/);reload.click('market-next');assert.match(reload.html(),/고교 \/ 해외 유스 제안/);assert.doesNotMatch(reload.html(),/반기 기록/);
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
 const first=setup();start(first,'GK');const data=clone(first.state());data.game.health.injuries.push({name:'무릎 부상',start:first.E.dayAt(data.game.clock),until:first.E.dayAt(data.game.clock)+30,days:30});const u=setup(new Map([[STORE,JSON.stringify(data)]]));u.click('hub');assert.match(u.html(),/회복까지 30일 · 출전 불가/);u.click('advance');assert.match(u.html(),/부상으로 훈련 제한/);assert.match(u.html(),/변화 원인/);assert.doesNotMatch(u.html(),/class="offer /);
});
test('new seasons confirm a profile; domestic midseason resumes directly, saves once and rolls back on failure',()=>{
 const u=setup();u.click('new');assert.doesNotMatch(u.html(),/잠재력|재능 10종|99%|1%|랜덤 배정/);u.nodes.name={value:'프로필 선수'};u.nodes.number={value:'17'};u.submit();u.click('reveal');assert.doesNotMatch(u.html(),/잠재력|재능 10종/);u.click('growth');u.click('begin');assert.match(u.html(),/선수 준비 완료/);assert.match(u.html(),/cm \/ \d+kg/);assert.equal(u.state(),null);
 const profile=u.html();u.click('profile-back');u.click('begin');assert.equal(u.html(),profile);u.click('confirm-profile');const before=clone(u.state());u.click('advance',{},false);assert.match(u.html(),/progress-scene/);const after=clone(u.state());u.click('advance',{},false);assert.deepEqual(u.state(),after);u.click('skip-scene');assert.match(u.html(),/반기 기록/);openOffers(u);
 const midseason=clone(u.state());u.failSave(true);u.click('offer',{value:'stay'});assert.deepEqual(u.state(),midseason);assert.doesNotMatch(u.html(),/PLAYER PROFILE/);u.failSave(false);u.click('offer',{value:'stay'});assert.match(u.html(),/소속팀 훈련/);assert.doesNotMatch(u.html(),/PLAYER PROFILE|선택 다시 보기/);assert.equal(u.state().game.phase,'ready');
 const resumed=clone(u.state());u.click('offer',{value:'stay'});u.click('confirm-profile');assert.deepEqual(u.state(),resumed);const reload=setup(u.storage);reload.click('hub');assert.match(reload.html(),/소속팀 훈련/);assert.deepEqual(reload.state(),resumed);
 reload.click('advance');openOffers(reload);const annual=clone(reload.state()),offer=annual.game.offers.find(o=>o.kind==='academy');reload.click('offer',{value:offer.id});assert.match(reload.html(),/PLAYER PROFILE|새 시즌 시작/);assert.deepEqual(reload.state(),annual);reload.failSave(true);reload.click('confirm-profile');assert.deepEqual(reload.state(),annual);reload.failSave(false);reload.click('profile-back');reload.click('offer',{value:offer.id});reload.click('confirm-profile');assert.equal(reload.state().game.phase,'ready');assert.equal(reload.state().game.player.name,before.game.player.name);assert.equal(reload.state().game.clubId,offer.clubId);
});
test('new role, mentor and ranking screens are separate, persist rewards once, and reject malformed new backups',()=>{
 const u=setup();start(u,'GK');u.click('season-view',{value:'role'});assert.match(u.html(),/이번 반기 목표/);assert.doesNotMatch(u.html(),/training-options|다음 플레이스타일/);u.click('manager',{value:'rest'});assert.match(u.html(),/회복을 먼저/);u.click('season-view',{value:'special'});assert.match(u.html(),/data-value="training" aria-pressed="true"/);u.click('special-start',{value:'mentor'});assert.ok(u.nodes.dialog.open);assert.match(u.nodes.dialog.innerHTML,/멘토 지도 완료/);assert.equal(u.state().game.special.used,1);u.click('close');const before=clone(u.state());u.click('special-start',{value:'mentor'});assert.deepEqual(u.state(),before);u.click('tab',{value:'league'});u.click('rank-open',{world:'KR-2000-pro'});assert.match(u.html(),/개인 순위/);assert.doesNotMatch(u.html(),/training-options/);const bad=clone(before);bad.game.stage='university';bad.game.special.used=99;assert.throws(()=>u.Save.parse(JSON.stringify(bad)));
});
test('two-step and three-step loading last exactly 4 seconds; reduced motion and skipping preserve the result',()=>{
 const u=setup();u.click('settings');u.click('toggle-motion');u.click('new');u.nodes.name={value:'연출 선수'};u.nodes.number={value:'9'};u.submit(false);
 assert.equal(u.nodes.app.dataset.screen,'loading');u.advanceClock(1749);assert.doesNotMatch(u.html(),/>완료</);u.advanceClock(1);assert.match(u.html(),/>완료</);u.advanceClock(1750);assert.equal((u.html().match(/>완료</g)||[]).length,2);u.advanceClock(499);assert.equal(u.nodes.app.dataset.screen,'loading');u.advanceClock(1);assert.equal(u.nodes.app.dataset.screen,'talents');
 u.click('growth');u.click('begin');u.click('confirm-profile');u.click('advance',{},false);const saved=clone(u.state());u.advanceClock(3498);assert.equal((u.html().match(/>완료</g)||[]).length,3);u.advanceClock(501);assert.equal(u.nodes.app.dataset.screen,'loading');u.advanceClock(1);assert.match(u.html(),/반기 기록/);assert.deepEqual(u.state(),saved);openOffers(u);u.click('offer',{value:'stay'});u.click('advance',{},false);const skipped=clone(u.state());u.click('skip-scene');assert.match(u.html(),/반기 기록/);u.advanceClock(10000);assert.deepEqual(u.state(),skipped);assert.match(u.html(),/반기 기록/);
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
  const u=setup(new Map([[STORE,JSON.stringify(data)]]));u.click('hub');u.click('advance');assert.equal(u.state().game.phase,'market');openOffers(u);
  let market=clone(u.state());if(startMonth===7){market.game.offers.push({id:'winter-transfer',kind:'pro',clubId:'FR-nantes',country:'FR',name:'낭트',months:24,wage:9000});}
  const next=setup(new Map([[STORE,JSON.stringify(market)]]));next.click('hub');const before=clone(next.state());next.click('offer',{value:startMonth===1?'stay':'winter-transfer'},false);
  if(startMonth===1){assert.deepEqual(next.state(),before);next.advanceClock(4000);assert.equal(next.nodes.app.dataset.screen,'profile');assert.match(next.html(),/새 시즌 시작/);next.click('confirm-profile');}
  else{assert.equal(next.state().game.clubId,'FR-nantes');assert.equal(next.state().game.phase,'ready');next.advanceClock(3999);assert.equal(next.nodes.app.dataset.screen,'loading');next.advanceClock(1);assert.match(next.html(),/소속팀 훈련/);assert.doesNotMatch(next.html(),/PLAYER PROFILE/);const saved=clone(next.state());next.click('offer',{value:'winter-transfer'});next.click('confirm-profile');assert.deepEqual(next.state(),saved);}
  assert.equal(next.state().game.phase,'ready');assert.equal(next.state().game.history.length,before.game.history.length);
 }
});
