'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context={TextEncoder,TextDecoder};vm.createContext(context);
const files=['era-2000.js','style-rules.js','game-data.js','career-data.js','game-engine.js','game-career.js','game-national.js','game-expansion.js','game-collection.js','fflate.js','game-save.js'];
vm.runInContext(files.map(f=>fs.readFileSync(path.join(__dirname,'..','src',f),'utf8')).join('\n')+';this.Save=FootballSave;this.E=FootballEngine;',context);
const Save=context.Save,E=context.E,clone=x=>JSON.parse(JSON.stringify(x));
const player=()=>E.create({name:'저장 선수 ⚽',number:9,pos:'ST',foot:'right',focus:[]},E.makeCandidate('ST',15,'ordinary'),15);
test('compressed saves round-trip Korean, Unicode, numeric precision and large collections without altering careers',()=>{
 const g=player(),data={version:2,game:g,archives:[],legacy:[]};g.prime={details:{...g.player.details},ovr:E.overall(g.player),age:g.age,season:'2000',club:E.teamName(g),clubId:g.clubId};
 g.period.events=Array.from({length:18000},(_,n)=>'김도현·류연화 '+n+' · 경기와 훈련, 득점·도움 기록 ⚽ 🏆');
 const before=JSON.stringify(data),packed=Save.serialize(data,0);assert.match(packed,/"encoding":"fgz1"/);assert.ok(packed.length<before.length/2);assert.equal(JSON.stringify(Save.decode(packed)),before);assert.equal(JSON.stringify(data),before);assert.equal(Save.parse(packed).game.player.name,g.player.name);
 const old=JSON.stringify({version:2,game:player(),archives:[],legacy:[]});assert.equal(JSON.stringify(Save.decode(old)),old);assert.equal(Save.parse(old).game.player.pos,'ST');
});
test('UTF-16 packing and multi-byte streaming boundaries preserve large varied data and deterministic next matches',()=>{
 const g=player(),data={version:2,game:g,archives:[],legacy:[]},rng={seed:51629};
 const alphabet='abcdefghijklmnopqrstuvwxyz0123456789가나다라마바사아자차카타파하⚽';let random='';for(let i=0;i<250000;i++)random+=alphabet[E.int(rng,0,alphabet.length-1)];
 g.period.events=[random,'끝의 문자 😀'];const packed=Save.serialize(data,0),restored=Save.parse(packed).game;assert.equal(restored.period.events[0],random);assert.equal(restored.period.events[1],'끝의 문자 😀');assert.equal(restored.seed,g.seed);
 const a=E.simulateAppearance(clone(g),70,65,E.dayAt(g.clock)),b=E.simulateAppearance(restored,70,65,E.dayAt(restored.clock));assert.deepEqual(clone(a),clone(b));
});
test('truncated, invalid, nested prototype and oversized encoded streams fail before replacing a save',()=>{
 const data={version:2,game:player(),archives:[],legacy:[]},packed=JSON.parse(Save.serialize(data,0));assert.ok(packed.payload);
 for(const payload of [packed.payload.slice(0,-1),String.fromCharCode(40000),String.fromCharCode(30000)+String.fromCharCode(289),packed.payload+'x'])assert.throws(()=>Save.parse(JSON.stringify({...packed,payload})),/기록 파일/);
 assert.throws(()=>Save.parse(JSON.stringify({version:2,encoding:'fgz1',payload:'x'.repeat(15000001)})),/기록 파일/);
 const malicious=JSON.parse('{"version":2,"game":null,"archives":[],"legacy":[],"__proto__":{"polluted":true}}');assert.throws(()=>Save.parse(Save.serialize(malicious,0)),/기록 파일/);assert.equal({}.polluted,undefined);
});
