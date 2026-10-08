'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const files=['era-2000.js','style-rules.js','style-icons.js','home-art.js','game-data.js','career-data.js','game-engine.js','game-career.js','club-crests.js','game-save.js','game-ui.js'];
const source=files.map(n=>fs.readFileSync(path.join(__dirname,'../src',n),'utf8')).join('\n');
const STORE='this-life-football-v2',clone=v=>JSON.parse(JSON.stringify(v));
function setup(storage=new Map()){
 const listeners={},dialogEvents={},errors=[],nodes={app:{innerHTML:'',dataset:{}},toast:{textContent:'',classList:{add(){},remove(){}}},'backup-file':{click(){},value:''},dialog:{innerHTML:'',open:false,showModal(){this.open=true},close(){this.open=false;dialogEvents.close?.()},addEventListener(type,fn){dialogEvents[type]=fn}}};
 let failSave=false;
 const document={documentElement:{classList:{toggle(){}}},getElementById:id=>nodes[id]||null,querySelectorAll:()=>[],addEventListener:(type,fn)=>listeners[type]=fn,createElement:()=>({click(){}})};
 const context={document,crypto:{getRandomValues(a){a[0]=914;return a}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>{if(failSave)throw Error('Quota test');storage.set(k,v)}},window:{scrollY:0,scrollTo(){}},console:{error:e=>errors.push(e)},setTimeout:()=>1,clearTimeout(){},Blob,URL};
 vm.createContext(context);vm.runInContext(source+';this.E=FootballEngine;this.Save=FootballSave;',context);
 const endScene=()=>{if(nodes.app.dataset.screen==='loading')listeners.click({target:{closest:()=>({dataset:{action:'skip-scene'},disabled:false})}});};
 return {E:context.E,Save:context.Save,storage,nodes,html:()=>nodes.app.innerHTML,state:()=>JSON.parse(storage.get(STORE)||'null'),failSave:v=>{failSave=v},click(action,fields={},skip=true){listeners.click({target:{closest:()=>({dataset:{action,...fields},disabled:false})}});if(skip)endScene();assert.equal(errors.length,0,errors.map(e=>e.message).join(';'));},submit(){listeners.submit({target:{id:'creation'},preventDefault(){}});endScene();},async import(data){listeners.change({target:{id:'backup-file',value:'file.json',files:[{size:JSON.stringify(data).length,text:async()=>JSON.stringify(data)}]}});await new Promise(setImmediate);}};
}
function start(u,pos='ST',name='테스트 선수'){u.click('new');u.nodes.name={value:name};u.nodes.number={value:'9'};u.click('draft',{key:'pos',value:pos});u.submit();u.click('growth');u.click('begin');u.click('confirm-profile');}
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
test('creation and transfers need a stable profile confirmation; saving failure preserves the current player',()=>{
 const u=setup();u.click('new');assert.doesNotMatch(u.html(),/잠재력|재능 10종|99%|1%|랜덤 배정/);u.nodes.name={value:'프로필 선수'};u.nodes.number={value:'17'};u.submit();u.click('reveal');assert.doesNotMatch(u.html(),/잠재력|재능 10종/);u.click('growth');u.click('begin');assert.match(u.html(),/선수 준비 완료/);assert.match(u.html(),/cm \/ \d+kg/);assert.equal(u.state(),null);const profile=u.html();u.click('profile-back');u.click('begin');assert.equal(u.html(),profile);u.click('confirm-profile');const before=clone(u.state());u.click('advance',{},false);assert.match(u.html(),/progress-scene/);const after=clone(u.state());u.click('advance',{},false);assert.deepEqual(u.state(),after);u.click('skip-scene');assert.match(u.html(),/반기 기록/);u.click('market-next');const offerState=clone(u.state());u.click('offer',{value:'stay'});assert.match(u.html(),/새 유니폼/);assert.deepEqual(u.state(),offerState);u.failSave(true);u.click('confirm-profile');assert.deepEqual(u.state(),offerState);u.failSave(false);u.click('profile-back');u.click('offer',{value:'stay'});u.click('confirm-profile');assert.equal(u.state().game.phase,'ready');assert.equal(u.state().game.player.name,before.game.player.name);
});
test('new role, mentor and ranking screens are separate, persist rewards once, and reject malformed new backups',()=>{
 const u=setup();start(u,'GK');u.click('season-view',{value:'role'});assert.match(u.html(),/이번 반기 목표/);assert.doesNotMatch(u.html(),/training-options|다음 플레이스타일/);u.click('manager',{value:'rest'});assert.match(u.html(),/회복을 먼저/);u.click('season-view',{value:'special'});u.click('special-start',{value:'mentor'});assert.ok(u.nodes.dialog.open);assert.match(u.nodes.dialog.innerHTML,/멘토 지도 완료/);assert.equal(u.state().game.special.used,1);u.click('close');const before=clone(u.state());u.click('special-start',{value:'mentor'});assert.deepEqual(u.state(),before);u.click('tab',{value:'league'});u.click('rank-open',{world:'KR-2000-pro'});assert.match(u.html(),/개인 순위/);assert.doesNotMatch(u.html(),/training-options/);const bad=clone(before);bad.game.stage='university';bad.game.special.used=99;assert.throws(()=>u.Save.parse(JSON.stringify(bad)));
});
