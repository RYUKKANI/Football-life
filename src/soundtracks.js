'use strict';
// Original instrumental themes written for Football Life; no recorded school song or chant is used.
const FootballSoundtracks=(()=>{
 const themes={
  middle:{name:'중학교 · 첫 킥오프',bpm:72,beats:3,melody:[
   'G5 B5 D6 E6 D6 B5','A5 C6 E6 D6 C6 A5','B5 D6 G6 F#6 E6 D6','C6 B5 A5 G5 - -',
   'E5 G5 B5 D6 B5 G5','F#5 A5 C6 E6 D6 C6','B5 A5 G5 A5 B5 D6','A5 G5 F#5 G5 - -',
   'D6 E6 G6 E6 D6 B5','C6 D6 E6 D6 C6 A5','B5 D6 E6 D6 B5 G5','A5 C6 B5 A5 G5 -',
   'E6 D6 B5 G5 A5 B5','C6 B5 A5 F#5 G5 A5','B5 A5 G5 D5 F#5 A5','G5 - B5 - G5 -'
  ],chords:['G3 B3 D4','A3 C4 E4','G3 B3 D4','C3 E3 G3','E3 G3 B3','A3 C4 E4','D3 F#3 A3','G3 B3 D4','E3 G3 B3','A3 C4 E4','G3 B3 D4','C3 E3 G3','E3 G3 B3','C3 E3 G3','D3 F#3 A3','G3 B3 D4']},
  high:{name:'고등학교 · 푸른 유니폼',bpm:84,beats:4,melody:[
   'D5 F#5 A5 B5 A5 F#5 E5 F#5','G5 A5 B5 D6 B5 A5 G5 -','F#5 A5 D6 C#6 B5 A5 F#5 E5','E5 F#5 G5 A5 F#5 E5 D5 -',
   'F#5 A5 B5 D6 C#6 B5 A5 F#5','G5 B5 D6 E6 D6 B5 A5 G5','F#5 G5 A5 C#6 B5 A5 G5 E5','F#5 E5 D5 F#5 A5 - D5 -',
   'A5 B5 D6 F#6 E6 D6 B5 A5','G5 A5 B5 E6 D6 B5 A5 G5','F#5 A5 B5 D6 C#6 A5 G5 F#5','E5 F#5 A5 B5 A5 G5 E5 -',
   'D6 B5 A5 F#5 G5 A5 B5 A5','G5 E5 F#5 G5 B5 A5 G5 E5','F#5 A5 G5 F#5 E5 F#5 G5 A5','D5 - F#5 - A5 - D5 -'
  ],chords:['D3 F#3 A3','G3 B3 D4','B2 D3 F#3','A3 C#4 E4','B2 D3 F#3','G3 B3 D4','A3 C#4 E4','D3 F#3 A3','B2 D3 F#3','E3 G3 B3','D3 F#3 A3','A3 C#4 E4','B2 D3 F#3','G3 B3 D4','A3 C#4 E4','D3 F#3 A3']},
  national:{name:'국가대표 · 태극마크',bpm:92,beats:4,melody:[
   'C5 - G5 G5 A5 G5 E5 -','F5 A5 C6 - B5 A5 G5 -','E5 G5 C6 D6 C6 G5 E5 -','D5 E5 F5 G5 E5 D5 C5 -',
   'G5 C6 E6 - D6 C6 A5 G5','A5 C6 F6 - E6 D6 C6 A5','G5 A5 B5 D6 C6 B5 A5 G5','E5 G5 C6 - G5 E5 C5 -',
   'E6 D6 C6 G5 A5 C6 D6 -','F6 E6 D6 C6 A5 G5 F5 -','E6 D6 C6 B5 C6 G5 E5 G5','D6 C6 B5 A5 G5 A5 B5 -',
   'C6 E6 G6 - E6 D6 C6 G5','A5 C6 F6 E6 D6 C6 A5 F5','G5 A5 B5 C6 D6 B5 G5 -','C6 - G5 - E5 - C5 -'
  ],chords:['C3 E3 G3','F3 A3 C4','A3 C4 E4','G3 B3 D4','C3 E3 G3','F3 A3 C4','G3 B3 D4','C3 E3 G3','A3 C4 E4','F3 A3 C4','C3 E3 G3','G3 B3 D4','C3 E3 G3','F3 A3 C4','G3 B3 D4','C3 E3 G3']},
  overseas:{name:'해외 구단 · 먼 무대',bpm:78,beats:4,melody:[
   'E5 G5 B5 D6 B5 A5 G5 -','D5 F#5 A5 B5 A5 G5 F#5 -','C5 E5 G5 B5 A5 G5 E5 -','D5 F#5 A5 C6 B5 A5 F#5 -',
   'G5 B5 E6 D6 B5 A5 G5 E5','F#5 A5 D6 C6 A5 G5 F#5 D5','E5 G5 C6 B5 A5 G5 E5 G5','F#5 A5 B5 A5 G5 F#5 E5 -',
   'B5 D6 E6 G6 E6 D6 B5 -','A5 B5 D6 F#6 D6 C6 A5 -','G5 A5 C6 E6 D6 C6 A5 G5','F#5 G5 A5 C6 B5 A5 F#5 -',
   'E6 D6 B5 G5 A5 B5 D6 B5','C6 B5 A5 G5 F#5 E5 D5 F#5','G5 A5 B5 A5 G5 F#5 D#5 F#5','E5 - G5 - B5 - E5 -'
  ],chords:['E3 G3 B3','D3 F#3 A3','C3 E3 G3','D3 F#3 A3','E3 G3 B3','D3 F#3 A3','C3 E3 G3','B2 D#3 F#3','E3 G3 B3','D3 F#3 A3','C3 E3 G3','D3 F#3 A3','E3 G3 B3','C3 E3 G3','B2 D#3 F#3','E3 G3 B3']}
 };
 const pitch={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
 function midi(note){if(note==='-')return null;const match=/^([A-G])(#?)(\d)$/.exec(note);return match?(Number(match[3])+1)*12+pitch[match[1]]+(match[2]?1:0):null;}
 function score(id){const t=themes[id]||themes.middle,notes=[];for(let bar=0;bar<t.melody.length;bar++){
  t.melody[bar].split(' ').forEach((n,i)=>{if(midi(n)!==null)notes.push({beat:bar*t.beats+i*.5,midi:midi(n),gain:.20,pan:0});});
  const chord=t.chords[bar].split(' ').map(midi);for(let i=0;i<t.beats*2;i++)notes.push({beat:bar*t.beats+i*.5,midi:chord[[0,1,2,1][i%4]]+12,gain:.047,pan:i%2?.24:-.24});
  notes.push({beat:bar*t.beats,midi:chord[0],gain:.065,pan:-.12});
 }return{notes:notes.sort((a,b)=>a.beat-b.beat),secondsPerBeat:60/t.bpm,beats:t.melody.length*t.beats};}
 return{themes,midi,score};
})();
