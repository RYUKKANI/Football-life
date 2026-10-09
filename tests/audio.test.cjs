'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=['soundtracks.js','game-audio.js'].map(n=>fs.readFileSync(path.join(__dirname,'../src',n),'utf8')).join('\n');
function setup(storage=new Map(),supported=true){
 const intervals=new Map(),created=[],listeners={};let next=0;
 const param=()=>({value:0,cancelScheduledValues(){},setValueAtTime(v){this.value=v},linearRampToValueAtTime(v){this.value=v},exponentialRampToValueAtTime(v){this.value=v}});
 const node=()=>({gain:param(),pan:param(),frequency:param(),playbackRate:param(),connect(){},disconnect(){},start(at){this.startedAt=at},stop(at){this.stoppedAt=at},onended:null});
 class Context{constructor(){this.state='suspended';this.currentTime=0;this.sampleRate=8000;this.destination=node();this.sources=[];created.push(this)}createGain(){return node()}createStereoPanner(){return node()}createBufferSource(){const s=node();this.sources.push(s);return s}createOscillator(){const s=node();this.sources.push(s);return s}createBuffer(ch,length,rate){const samples=new Float32Array(length);return {duration:length/rate,getChannelData:()=>samples}}resume(){this.state='running';return Promise.resolve()}suspend(){this.state='suspended';return Promise.resolve()}}
 const context={window:supported?{AudioContext:Context}:{},document:{hidden:false,addEventListener:(name,fn)=>listeners[name]=fn},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setInterval:fn=>{intervals.set(++next,fn);return next},clearInterval:id=>intervals.delete(id)};
 vm.createContext(context);vm.runInContext(source+';this.audio=FootballAudio;this.tracks=FootballSoundtracks;',context);
 return {audio:context.audio,tracks:context.tracks,created,intervals,storage,context,tick(t){created[0].currentTime=t;for(const fn of intervals.values())fn()},flush:()=>new Promise(setImmediate)};
}
test('four original scores have valid notes, complete bars and distinct melodies',()=>{
 const u=setup(),scores=new Set();for(const id of ['middle','high','national','overseas']){const t=u.tracks.themes[id],s=u.tracks.score(id);assert.equal(t.melody.length,16);assert.equal(t.chords.length,16);for(const bar of t.melody)assert.equal(bar.split(' ').length,t.beats*2);assert.ok(s.beats*s.secondsPerBeat>=40);for(const note of s.notes){assert.ok(note.midi>=35&&note.midi<=91);assert.ok(note.beat>=0&&note.beat<s.beats);assert.ok(note.gain>0&&note.gain<.3)}scores.add(JSON.stringify(s.notes))}assert.equal(scores.size,4);assert.equal(u.tracks.midi('-'),null);
});
test('stage and national-team scenes select the right theme; transfers use destination',()=>{
 const a=setup().audio;assert.equal(a.themeFor(null),'home');assert.equal(a.themeFor({stage:'pro',country:'FR',phase:'callup'}),'national');assert.equal(a.themeFor({stage:'middle',country:'KR'}),'middle');assert.equal(a.themeFor({stage:'academy',country:'KR'}),'high');assert.equal(a.themeFor({stage:'academy',country:'EN'}),'overseas');assert.equal(a.themeFor({stage:'pro',country:'FR',phase:'international'}),'national');assert.equal(a.themeFor({stage:'pro',country:'FR'},'국가대표 경기'),'national');assert.equal(a.themeFor({stage:'middle',country:'KR'},'',{stage:'academy',country:'DE'}),'overseas');assert.equal(a.themeFor({stage:'pro',country:'KR'}),'domestic');assert.equal(a.themeFor({stage:'university',country:'KR'}),'domestic');assert.equal(a.themeFor({stage:'service',country:'KR'}),'domestic');assert.equal(a.themeFor({stage:'pro',country:'FR',phase:'callup'},'',null,'home'),'home');assert.equal(a.themeFor({stage:'pro',country:'FR'},'클럽 친선전'),'domestic');assert.equal(a.themeFor({stage:'pro',country:'FR'},'대표팀 본선 경기'),'national');
});

test('eighteen complete original scores belong to six stage playlists with no duplicate tracks',()=>{
 const u=setup(),ids=Object.values(u.tracks.playlists).flatMap(p=>Array.from(p.tracks)),melodies=new Set();
 assert.equal(ids.length,18);assert.equal(new Set(ids).size,18);assert.equal(Object.keys(u.tracks.themes).length,18);
 assert.deepEqual(Object.fromEntries(Object.entries(u.tracks.playlists).map(([id,p])=>[id,p.tracks.length])),{home:2,middle:3,high:3,domestic:3,national:3,overseas:4});
 for(const id of ids){const t=u.tracks.themes[id],s=u.tracks.score(id);assert.equal(t.melody.length,16,id);assert.equal(t.chords.length,16,id);
  for(const bar of t.melody){assert.equal(bar.split(' ').length,t.beats*2,id);for(const token of bar.split(' '))assert.ok(token==='-'||u.tracks.midi(token)!==null,id);}
  for(const chord of t.chords){assert.equal(chord.split(' ').length,3,id);for(const token of chord.split(' '))assert.ok(u.tracks.midi(token)!==null,id);}
  assert.ok(s.beats*s.secondsPerBeat>=40,id);assert.ok(s.beats*s.secondsPerBeat<=60,id);
  for(const n of s.notes){assert.ok(Number.isFinite(n.midi)&&n.midi>=35&&n.midi<=93,id);assert.ok(n.beat>=0&&n.beat<s.beats,id);assert.ok(n.gain>0&&n.gain<.3,id);}
  melodies.add(JSON.stringify(t.melody));
 }assert.equal(melodies.size,18);
});

test('a complete song fades into the next song, loops the playlist, and keeps one scheduler',async()=>{
 const u=setup();u.audio.sync({stage:'middle',country:'KR'});await u.audio.unlock();
 const changes=[];u.audio.onTrackChange(()=>changes.push(u.audio.getTheme()));
 const ids=Array.from(u.tracks.playlists.middle.tracks);let at=0;
 for(const [i,id]of ids.entries()){
  assert.equal(u.audio.getTheme(),id);const end=at+.08+u.tracks.score(id).beats*u.tracks.score(id).secondsPerBeat;
  for(let t=at+.1;t<=end+.2;t+=.1)u.tick(t);
  assert.equal(u.audio.getTheme(),ids[(i+1)%ids.length]);assert.equal(u.intervals.size,1);at=end;
 }
 assert.deepEqual(changes,['middle-afterschool','middle-weekend','middle']);
 assert.ok(u.created[0].sources.some(s=>Number.isFinite(s.stoppedAt)),'the outgoing voices stop after their fade');
});

test('track browsing stays in settings and returns to stage music without reading or altering career data',async()=>{
 const career='{"seed":987654,"game":"unchanged"}',storage=new Map([['this-life-football-v2',career]]),u=setup(storage),g={stage:'middle',country:'KR',phase:'ready',seed:987654};
 u.audio.sync(g,'',null,'hub');await u.audio.unlock();u.audio.selectTrack('national-night');
 assert.equal(u.audio.getTheme(),'national-night');assert.equal(u.audio.getPlaylist().previewing,true);
 u.audio.sync(g,'',null,'settings');assert.equal(u.audio.getTheme(),'national-night');
 u.audio.nextTrack();assert.equal(u.audio.getTheme(),'national');assert.equal(u.intervals.size,1);
 u.audio.returnToStage();assert.equal(u.audio.getTheme(),'middle');assert.equal(u.audio.getPlaylist().previewing,false);
 u.audio.selectTrack('overseas-road');u.audio.sync(g,'',null,'hub');assert.equal(u.audio.getTheme(),'middle');
 assert.equal(storage.get('this-life-football-v2'),career);assert.equal(g.seed,987654);assert.equal(u.audio.selectTrack('missing-song'),false);assert.equal(u.intervals.size,1);
});

test('mute, zero volume and background pauses keep the selected song without advancing silent playlists',async()=>{
 const u=setup();await u.audio.unlock();u.audio.nextTrack();assert.equal(u.audio.getTheme(),'home-next');
 u.audio.setMuted(true);u.tick(500);assert.equal(u.audio.getTheme(),'home-next');assert.equal(u.intervals.size,0);
 u.audio.setMuted(false);await u.flush();assert.equal(u.intervals.size,1);assert.equal(u.audio.getTheme(),'home-next');
 u.audio.setVolume('music',0);u.tick(1000);assert.equal(u.intervals.size,0);assert.equal(u.audio.getTheme(),'home-next');
 u.audio.selectTrack('high-lastwhistle');assert.equal(u.intervals.size,0);u.audio.setVolume('music',.32);await u.flush();assert.equal(u.intervals.size,1);
 u.audio.visibility(true);u.tick(2000);u.audio.visibility(false);await u.flush();assert.equal(u.audio.getTheme(),'high-lastwhistle');assert.equal(u.intervals.size,1);
});

test('music observers and delayed timers cannot break playback or burst missed notes',async()=>{
 const u=setup();let notices=0;const off=u.audio.onTrackChange(()=>notices++);u.audio.onTrackChange(()=>{throw Error('listener failure')});
 await u.audio.unlock();u.audio.nextTrack();assert.equal(notices,1);off();const before=u.created[0].sources.length;
 assert.doesNotThrow(()=>u.tick(500));assert.equal(notices,1);assert.ok(u.created[0].sources.length-before<=6);assert.equal(u.intervals.size,1);
 u.audio.sync({stage:'academy',country:'KR'},'',null,'hub');const count=u.created[0].sources.length;u.audio.sync({stage:'academy',country:'KR'},'',null,'hub');u.audio.sync({stage:'academy',country:'KR'},'',null,'settings');assert.equal(u.created[0].sources.length,count);
});
test('playback requires a gesture, rerenders do not restart music, themes crossfade with one scheduler',async()=>{
 const u=setup();u.audio.sync(null);assert.equal(u.created.length,0);u.audio.unlock();await u.flush();assert.equal(u.intervals.size,1);u.tick(.09);const first=u.created[0].sources.length;assert.ok(first>0);u.audio.sync(null);u.audio.sync(null);await u.flush();assert.equal(u.created[0].sources.length,first);assert.equal(u.intervals.size,1);u.audio.sync({stage:'academy',country:'KR'});assert.equal(u.audio.getTheme(),'high');assert.equal(u.intervals.size,1);assert.ok(u.created[0].sources[0].stoppedAt>=.09);u.tick(.19);assert.ok(u.created[0].sources.length>first);
});
test('mute and separate volumes survive reload without touching career data',async()=>{
 const state=new Map([['this-life-football-v2','existing career'],['football-life-preferences','{"reducedMotion":true}']]),u=setup(state);u.audio.setMuted(true);u.audio.setVolume('music',.17);u.audio.setVolume('effects',.81);u.audio.unlock();await u.flush();u.audio.click();assert.equal(u.intervals.size,0);assert.equal(u.created[0].sources.length,0);const reload=setup(state);assert.equal(reload.audio.getSettings().muted,true);assert.equal(reload.audio.getSettings().music,.17);assert.equal(reload.audio.getSettings().effects,.81);assert.equal(state.get('this-life-football-v2'),'existing career');assert.equal(state.get('football-life-preferences'),'{"reducedMotion":true}');u.audio.setMuted(false);await u.flush();assert.equal(u.intervals.size,1);u.audio.setVolume('music',0);assert.equal(u.intervals.size,0);u.audio.click();assert.ok(u.created[0].sources.length>=2);u.audio.setVolume('music',.4);await u.flush();assert.equal(u.intervals.size,1);
});
test('hidden pages pause; returning starts fresh without accumulating timers or missed notes',async()=>{
 const u=setup();u.audio.click();await u.flush();u.tick(.1);u.audio.visibility(true);assert.equal(u.intervals.size,0);assert.equal(u.created[0].state,'suspended');const count=u.created[0].sources.length;u.tick(180);assert.equal(u.created[0].sources.length,count);u.audio.visibility(false);await u.flush();assert.equal(u.intervals.size,1);assert.equal(u.created[0].state,'running');u.tick(180.1);assert.ok(u.created[0].sources.length-count<=6);for(let i=0;i<4;i++){u.audio.visibility(true);u.audio.visibility(false);await u.flush();assert.equal(u.intervals.size,1)}
});
test('unsupported audio and malformed preferences keep the game usable',async()=>{
 const u=setup(new Map([['football-life-audio','{"music":null,"effects":"bad","muted":"yes"}']]),false);assert.equal(u.audio.getSettings().music,.32);assert.equal(u.audio.getSettings().effects,.55);assert.equal(u.audio.getSettings().muted,false);for(const fn of [()=>u.audio.click(),()=>u.audio.setMuted(true),()=>u.audio.setVolume('music',.5),()=>u.audio.visibility(true),()=>u.audio.visibility(false)])assert.doesNotThrow(fn);assert.equal(u.intervals.size,0);assert.doesNotThrow(()=>setup(new Map([['football-life-audio','broken json']])));
});

