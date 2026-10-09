'use strict';
const FootballAudio=(()=>{
 const KEY='football-life-audio',defaults={muted:false,music:.32,effects:.55};
 const level=(v,fallback)=>typeof v==='number'&&Number.isFinite(v)?Math.min(1,Math.max(0,v)):fallback;
 let settings={...defaults};try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');if(raw)settings={muted:raw.muted===true,music:level(raw.music,defaults.music),effects:level(raw.effects,defaults.effects)};}catch{}
 let context=null,master=null,musicGain=null,effectGain=null,bell=null,timer=null,group=null,started=false,hidden=false,category='home',actualCategory='home',theme='home-dawn',previewing=false,noteIndex=0,loopStart=0,score=null,lastClick=-1;
 const groups=new Set(),activeEffects=new Set(),listeners=new Set(),positions=Object.fromEntries(Object.keys(FootballSoundtracks.playlists).map(id=>[id,0]));
 function announce(){for(const fn of listeners)try{fn()}catch{}}
 function choose(index=positions[category]){const list=FootballSoundtracks.playlists[category].tracks;positions[category]=((index%list.length)+list.length)%list.length;theme=list[positions[category]];announce();}
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(settings));}catch{}}
 function ramp(param,value,seconds=.12){if(!context)return;const now=context.currentTime;param.cancelScheduledValues(now);param.setValueAtTime(param.value,now);param.linearRampToValueAtTime(value,now+seconds);}
 function volumes(){if(!context)return;ramp(master.gain,settings.muted||hidden?0:.85);ramp(musicGain.gain,settings.music);ramp(effectGain.gain,settings.effects);}
 function makeBell(){const rate=context.sampleRate,length=Math.round(rate*2.8),buffer=context.createBuffer(1,length,rate),out=buffer.getChannelData(0);for(let i=0;i<length;i++){const t=i/rate,attack=Math.min(1,t/.006);out[i]=attack*(Math.sin(2*Math.PI*440*t)*Math.exp(-t*2.8)*.64+Math.sin(2*Math.PI*884.4*t)*Math.exp(-t*5.2)*.20+Math.sin(2*Math.PI*1753.4*t)*Math.exp(-t*8)*.085+Math.sin(2*Math.PI*2648.8*t)*Math.exp(-t*12)*.035);}return buffer;}
 function init(){if(context)return true;try{const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return false;context=new Context();master=context.createGain();master.gain.value=0;musicGain=context.createGain();effectGain=context.createGain();musicGain.connect(master);effectGain.connect(master);master.connect(context.destination);bell=makeBell();volumes();return true;}catch{context=null;return false;}}
 function retire(g,at,duration=.22){g.bus.gain.cancelScheduledValues(context.currentTime);g.bus.gain.setValueAtTime(g.bus.gain.value,at);g.bus.gain.linearRampToValueAtTime(0,at+duration);for(const source of g.sources){try{source.stop(at+duration+.03);}catch{}}if(!g.sources.size){g.bus.disconnect();groups.delete(g);}}
 function stopMusic(){if(timer!==null){clearInterval(timer);timer=null;}if(context)for(const g of groups)retire(g,context.currentTime);groups.clear();group=null;}
 function note(data,at){if(!group||!context)return;const g=group,source=context.createBufferSource(),gain=context.createGain();source.buffer=bell;source.playbackRate.value=2**((data.midi-69)/12);gain.gain.value=data.gain;source.connect(gain);let output=gain;if(typeof context.createStereoPanner==='function'){const pan=context.createStereoPanner();pan.pan.value=data.pan;gain.connect(pan);output=pan;}output.connect(g.bus);g.sources.add(source);source.onended=()=>{g.sources.delete(source);source.disconnect();gain.disconnect();if(output!==gain)output.disconnect();if(g!==group&&!g.sources.size){g.bus.disconnect();groups.delete(g);}};source.start(at);}
 function beginTrack(at){if(group)retire(group,at,.8);score=FootballSoundtracks.score(theme);group={bus:context.createGain(),sources:new Set()};group.bus.gain.value=0;group.bus.connect(musicGain);group.bus.gain.setValueAtTime(0,at);group.bus.gain.linearRampToValueAtTime(1,at+.8);groups.add(group);loopStart=at;noteIndex=0;}
 function schedule(){
  if(!context||!group||context.state!=='running'||hidden||settings.muted||settings.music===0)return;
  if(context.currentTime>loopStart+score.beats*score.secondsPerBeat+.5){choose(positions[category]+1);beginTrack(context.currentTime+.08);}
  const horizon=context.currentTime+.2;
  for(let scheduled=0;scheduled<32;scheduled++){
   if(noteIndex===score.notes.length){const boundary=loopStart+score.beats*score.secondsPerBeat;if(boundary>horizon)break;choose(positions[category]+1);beginTrack(Math.max(boundary,context.currentTime));}
   const data=score.notes[noteIndex],at=loopStart+data.beat*score.secondsPerBeat;
   if(at>horizon)break;if(at>=context.currentTime-.03)note(data,Math.max(context.currentTime,at));noteIndex++;
  }
 }
 function startMusic(){if(!context||!started||hidden||settings.muted||settings.music===0||context.state!=='running')return;stopMusic();beginTrack(context.currentTime+.08);schedule();timer=setInterval(schedule,100);}
 function unlock(){if(!init())return Promise.resolve(false);started=true;if(hidden)return Promise.resolve(false);const resume=context.state==='suspended'?context.resume():Promise.resolve();return Promise.resolve(resume).then(()=>{volumes();if(!group&&!settings.muted)startMusic();return true;}).catch(()=>false);}
 function playClick(){if(!context||context.state!=='running'||hidden||settings.muted||!settings.effects)return;const now=context.currentTime;if(now-lastClick<.04)return;lastClick=now;for(const [frequency,offset,amp]of[[760,0,.085],[1140,.016,.027]]){const osc=context.createOscillator(),gain=context.createGain();osc.type='sine';osc.frequency.setValueAtTime(frequency,now+offset);osc.frequency.exponentialRampToValueAtTime(frequency*.8,now+offset+.06);gain.gain.setValueAtTime(.0001,now+offset);gain.gain.exponentialRampToValueAtTime(amp,now+offset+.004);gain.gain.exponentialRampToValueAtTime(.0001,now+offset+.075);osc.connect(gain);gain.connect(effectGain);activeEffects.add(osc);osc.onended=()=>{activeEffects.delete(osc);osc.disconnect();gain.disconnect();};osc.start(now+offset);osc.stop(now+offset+.08);}}
 function click(){const ready=unlock();if(context?.state==='running')playClick();else ready.then(ok=>{if(ok)playClick();});}
 function setTheme(id){id=FootballSoundtracks.playlists[id]?id:'home';if(category===id)return;category=id;choose();if(started)startMusic();}
 function themeFor(g,sceneLabel='',preview=null,screen=''){
  g=preview||g;
  if(!sceneLabel&&['home','archives','collection-card','collection-compare','xi-picker','friendly-result'].includes(screen))return'home';
  if(!g&&(['create','talents','growth'].includes(screen)||/새로운 선수/.test(sceneLabel)))return'middle';
  if(/국가대표|대표팀/.test(sceneLabel)||['callup','international'].includes(g?.phase))return'national';
  if(/친선전/.test(sceneLabel))return'domestic';
  if(g?.country&&g.country!=='KR')return'overseas';
  return !g?'home':g.stage==='middle'?'middle':g.stage==='academy'?'high':'domestic';
 }
 function sync(g,sceneLabel='',preview=null,screen=''){if(screen==='settings'&&!sceneLabel)return;actualCategory=themeFor(g,sceneLabel,preview,screen);previewing=false;setTheme(actualCategory);}
 function nextTrack(){choose(positions[category]+1);unlock();if(started)startMusic();return theme;}
 function selectTrack(id){const owner=Object.keys(FootballSoundtracks.playlists).find(key=>FootballSoundtracks.playlists[key].tracks.includes(id));if(!owner)return false;previewing=true;category=owner;choose(FootballSoundtracks.playlists[owner].tracks.indexOf(id));unlock();if(started)startMusic();return true;}
 function returnToStage(){previewing=false;setTheme(actualCategory);}
 function getPlaylist(){const list=FootballSoundtracks.playlists[category];return{id:category,name:list.name,position:positions[category]+1,total:list.tracks.length,previewing};}
 function onTrackChange(fn){if(typeof fn!=='function')return()=>{};listeners.add(fn);return()=>listeners.delete(fn);}
 function setMuted(muted){settings.muted=!!muted;persist();volumes();if(settings.muted)stopMusic();else{unlock();if(group)stopMusic();startMusic();}return settings.muted;}
 function setVolume(kind,value){if(!['music','effects'].includes(kind))return;const previous=settings[kind];settings[kind]=level(value,previous);persist();volumes();if(kind==='music'){if(settings.music===0)stopMusic();else if(previous===0||!group){unlock();startMusic();}}}
 function visibility(isHidden){hidden=!!isHidden;volumes();if(hidden){stopMusic();for(const source of activeEffects){try{source.stop();}catch{}}try{Promise.resolve(context?.suspend?.()).catch(()=>{});}catch{}}else if(started&&!settings.muted)unlock();}
 document.addEventListener?.('visibilitychange',()=>visibility(document.hidden));
 return{unlock,click,sync,themeFor,nextTrack,selectTrack,returnToStage,getPlaylist,onTrackChange,setMuted,setVolume,visibility,getSettings:()=>({...settings}),getTheme:()=>theme,getThemeName:()=>FootballSoundtracks.themes[theme].name};
})();
