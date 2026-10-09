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
 function add(id,name,bpm,beats,melody,chords){
  const harmony=chords.split('|').map(s=>s.trim());
  themes[id]={name,bpm,beats,melody:melody.split('|').map(s=>s.trim()),chords:Array.from({length:16},(_,i)=>harmony[i%harmony.length])};
 }
 add('home-dawn','홈 · 푸른 그라운드',68,3,
  'D5 G5 A5 B5 A5 G5|E5 G5 B5 C6 B5 G5|F#5 A5 B5 D6 B5 A5|G5 B5 A5 G5 - -|B5 D6 E6 D6 B5 A5|A5 C6 D6 C6 A5 G5|F#5 A5 G5 F#5 E5 D5|G5 - B5 - D6 -|E6 D6 B5 A5 G5 B5|C6 B5 G5 E5 G5 A5|D6 B5 A5 F#5 A5 B5|C6 A5 G5 E5 - -|B5 A5 G5 E5 G5 A5|A5 G5 E5 C5 E5 G5|F#5 G5 A5 D6 C6 A5|B5 - A5 G5 - -',
  'G3 B3 D4|E3 G3 B3|D3 F#3 A3|G3 B3 D4|E3 G3 B3|C3 E3 G3|D3 F#3 A3|G3 B3 D4');
 add('home-next','홈 · 다음 킥오프',76,4,
  'E5 G5 A5 G5 C6 B5 A5 G5|F5 A5 G5 F5 E5 G5 A5 -|G5 B5 C6 E6 D6 C6 B5 G5|A5 G5 E5 D5 C5 - E5 -|G5 C6 D6 E6 C6 A5 G5 E5|F5 A5 C6 D6 C6 A5 G5 F5|E5 G5 B5 C6 D6 B5 A5 G5|C6 G5 E5 G5 C6 - - -|A5 C6 E6 D6 C6 A5 G5 A5|B5 D6 F6 E6 D6 B5 A5 G5|G5 C6 E6 G6 E6 D6 C6 B5|A5 F5 G5 A5 C6 - A5 -|E6 D6 C6 A5 G5 A5 C6 G5|F5 G5 A5 C6 B5 A5 G5 E5|D5 G5 A5 B5 C6 D6 B5 G5|C6 - G5 - E5 - C5 -',
  'C3 E3 G3|F3 A3 C4|G3 B3 D4|C3 E3 G3|A3 C4 E4|F3 A3 C4|G3 B3 D4|C3 E3 G3');
 add('middle-afterschool','중학교 · 방과 후 운동장',64,3,
  'E5 G5 C6 B5 G5 E5|F5 A5 C6 D6 C6 A5|E5 G5 A5 C6 B5 G5|D5 F5 E5 C5 - -|A5 C6 E6 D6 C6 A5|G5 B5 D6 C6 B5 G5|F5 A5 G5 E5 D5 F5|E5 C5 G5 - C6 -|C6 E6 D6 C6 G5 A5|D6 C6 A5 F5 A5 C6|B5 D6 C6 B5 A5 G5|A5 F5 E5 C5 - -|G5 C6 B5 A5 G5 E5|F5 A5 C6 A5 G5 F5|E5 G5 A5 B5 D6 B5|C6 - G5 E5 C5 -',
  'C3 E3 G3|F3 A3 C4|C3 E3 G3|G3 B3 D4|A3 C4 E4|G3 B3 D4|F3 A3 C4|C3 E3 G3');
 add('middle-weekend','중학교 · 토요일의 약속',70,3,
  'A5 F#5 D5 F#5 A5 B5|G5 B5 A5 G5 F#5 E5|F#5 A5 D6 C#6 A5 F#5|E5 G5 F#5 E5 D5 -|B5 D6 F#6 E6 D6 B5|A5 C#6 E6 D6 C#6 A5|G5 B5 A5 F#5 E5 C#5|D5 F#5 A5 D6 - -|D6 A5 B5 D6 F#6 E6|E6 D6 B5 G5 A5 B5|C#6 A5 F#5 A5 B5 C#6|D6 B5 A5 F#5 - -|G5 A5 B5 D6 C#6 A5|F#5 E5 D5 F#5 A5 G5|E5 F#5 G5 A5 C#6 E6|D6 - A5 - D5 -',
  'D3 F#3 A3|G3 B3 D4|D3 F#3 A3|A3 C#4 E4|B2 D3 F#3|A3 C#4 E4|G3 B3 D4|D3 F#3 A3');
 add('high-together','고등학교 · 같은 유니폼',88,4,
  'G5 B5 D6 B5 A5 G5 D5 G5|A5 C6 E6 D6 C6 A5 G5 -|B5 D6 G6 F#6 E6 D6 B5 A5|C6 B5 A5 G5 F#5 A5 G5 -|D6 E6 D6 B5 G5 A5 B5 D6|E6 D6 C6 A5 F#5 G5 A5 C6|B5 A5 G5 D5 E5 F#5 A5 F#5|G5 B5 D6 G6 D6 B5 G5 -|B5 D6 E6 G6 F#6 E6 D6 B5|C6 E6 G6 E6 D6 C6 A5 G5|A5 B5 D6 F#6 E6 D6 C6 A5|G5 A5 B5 D6 C6 B5 G5 -|E6 D6 B5 G5 A5 B5 D6 E6|C6 B5 A5 G5 E5 G5 A5 C6|D6 C6 A5 F#5 G5 A5 B5 A5|G5 - B5 - D6 - G5 -',
  'G3 B3 D4|A3 C4 E4|E3 G3 B3|D3 F#3 A3|G3 B3 D4|C3 E3 G3|D3 F#3 A3|G3 B3 D4');
 add('high-lastwhistle','고등학교 · 마지막 휘슬',72,4,
  'A5 E5 G5 A5 C6 B5 A5 E5|F5 A5 C6 B5 A5 G5 F5 -|G5 B5 D6 C6 B5 A5 G5 E5|E5 G#5 B5 A5 G#5 E5 - -|C6 E6 D6 C6 B5 A5 C6 B5|D6 C6 A5 F5 G5 A5 C6 A5|B5 D6 E6 D6 B5 G5 A5 B5|C6 B5 A5 E5 A5 - - -|E6 D6 C6 A5 C6 E6 D6 B5|F6 E6 D6 C6 A5 C6 D6 -|E6 D6 B5 G5 A5 B5 D6 B5|C6 B5 G#5 E5 G#5 B5 A5 -|C6 A5 G5 E5 F5 A5 G5 E5|D6 C6 A5 G5 F5 E5 D5 F5|E5 G#5 B5 D6 C6 B5 G#5 E5|A5 - E5 - C5 - A4 -',
  'A2 C3 E3|F3 A3 C4|G3 B3 D4|E3 G#3 B3|A2 C3 E3|F3 A3 C4|G3 B3 D4|A2 C3 E3');
 add('domestic-home','국내 구단 · 홈 스탠드',84,4,
  'F5 A5 C6 A5 G5 F5 A5 G5|G5 B5 D6 C6 B5 G5 F5 -|A5 C6 F6 E6 D6 C6 A5 G5|B5 A5 G5 E5 F5 G5 C6 -|C6 D6 F6 D6 C6 A5 F5 A5|B5 D6 G6 F6 D6 B5 A5 G5|A5 C6 E6 D6 C6 A5 G5 E5|F5 A5 G5 F5 C5 - F5 -|F6 E6 D6 C6 D6 F6 E6 C6|D6 C6 B5 G5 A5 B5 D6 C6|C6 A5 F5 A5 C6 F6 E6 D6|E6 D6 C6 A5 G5 A5 C6 -|D6 C6 A5 F5 G5 A5 C6 D6|B5 A5 G5 D5 F5 G5 A5 B5|C6 B5 G5 E5 F5 A5 G5 E5|F5 - A5 - C6 - F5 -',
  'F3 A3 C4|G3 B3 D4|D3 F3 A3|C3 E3 G3|F3 A3 C4|G3 B3 D4|A2 C3 E3|F3 A3 C4');
 add('domestic-lights','국내 구단 · 야간 훈련',76,4,
  'D5 F5 A5 C6 A5 G5 F5 D5|E5 G5 B5 D6 B5 A5 G5 -|F5 A5 C6 D6 C6 A5 F5 G5|A5 C#6 E6 D6 C#6 A5 G5 -|F5 A5 D6 F6 E6 D6 C6 A5|G5 B5 D6 E6 D6 B5 A5 G5|F5 A5 C6 E6 D6 C6 A5 F5|E5 G5 A5 C#6 B5 A5 G5 E5|D6 F6 A6 F6 E6 D6 C6 A5|E6 D6 B5 G5 A5 B5 D6 E6|F6 E6 D6 C6 A5 C6 D6 -|E6 C#6 A5 G5 E5 A5 C#6 -|D6 C6 A5 F5 A5 C6 D6 C6|B5 A5 G5 E5 G5 A5 B5 D6|C#6 A5 G5 E5 F5 G5 A5 C#6|D6 - A5 - F5 - D5 -',
  'D3 F3 A3|E3 G3 B3|F3 A3 C4|A3 C#4 E4|D3 F3 A3|G3 B3 D4|F3 A3 C4|A3 C#4 E4');
 add('domestic-victory','국내 구단 · 승리의 귀갓길',90,4,
  'B5 D6 G6 D6 B5 A5 G5 B5|C6 E6 G6 E6 D6 C6 B5 A5|A5 C6 F#6 E6 D6 C6 A5 F#5|G5 B5 D6 B5 A5 G5 D5 -|D6 G6 F#6 E6 D6 B5 A5 G5|E6 D6 C6 A5 C6 D6 E6 -|D6 C6 A5 F#5 A5 B5 C6 D6|G5 A5 B5 D6 G6 - D6 -|E6 G6 E6 D6 B5 D6 E6 D6|C6 D6 E6 G6 E6 D6 C6 A5|B5 D6 F#6 A6 G6 F#6 E6 D6|C6 B5 A5 G5 B5 D6 G6 -|D6 B5 G5 A5 B5 D6 E6 D6|C6 A5 G5 E5 G5 A5 C6 E6|D6 C6 B5 A5 F#5 G5 A5 F#5|G5 - D6 - B5 - G5 -',
  'G3 B3 D4|C3 E3 G3|D3 F#3 A3|G3 B3 D4|E3 G3 B3|C3 E3 G3|D3 F#3 A3|G3 B3 D4');
 add('national-journey','국가대표 · 원정의 아침',84,4,
  'D5 - A5 B5 D6 A5 F#5 -|G5 A5 B5 D6 E6 D6 B5 G5|F#5 A5 D6 F#6 E6 D6 C#6 A5|E5 F#5 G5 A5 C#6 B5 A5 -|B5 D6 F#6 E6 D6 B5 A5 G5|G5 B5 E6 G6 F#6 E6 D6 B5|A5 B5 C#6 E6 D6 C#6 B5 A5|D6 - A5 F#5 D5 - - -|F#6 E6 D6 B5 A5 B5 D6 E6|G6 F#6 E6 D6 B5 D6 E6 -|F#6 E6 D6 C#6 A5 C#6 D6 E6|D6 B5 A5 G5 F#5 E5 C#5 -|D6 F#6 A6 F#6 E6 D6 B5 A5|G5 A5 B5 E6 D6 B5 A5 G5|F#5 G5 A5 C#6 E6 D6 C#6 A5|D6 - A5 - F#5 - D5 -',
  'D3 F#3 A3|G3 B3 D4|D3 F#3 A3|A3 C#4 E4|B2 D3 F#3|E3 G3 B3|A3 C#4 E4|D3 F#3 A3');
 add('national-night','국가대표 · 별 아래 태극기',78,4,
  'C6 A5 F5 A5 C6 D6 C6 A5|D6 B5 G5 B5 D6 E6 D6 B5|A5 C6 F6 E6 D6 C6 A5 G5|G5 A5 C6 E6 D6 C6 G5 -|D6 F6 A6 G6 F6 D6 C6 A5|E6 D6 B5 G5 A5 B5 D6 -|C6 E6 G6 F6 E6 D6 C6 A5|F5 A5 C6 A5 G5 F5 - -|F6 E6 D6 C6 A5 C6 D6 F6|G6 F6 E6 D6 B5 D6 E6 -|A5 C6 F6 A6 G6 F6 E6 D6|C6 D6 E6 G6 F6 E6 C6 -|D6 C6 A5 F5 G5 A5 C6 D6|B5 A5 G5 E5 G5 B5 A5 G5|E6 D6 C6 G5 A5 C6 B5 G5|F5 - C6 - A5 - F5 -',
  'F3 A3 C4|G3 B3 D4|D3 F3 A3|C3 E3 G3|F3 A3 C4|G3 B3 D4|C3 E3 G3|F3 A3 C4');
 add('overseas-road','해외 구단 · 원정 버스',72,4,
  'E5 A5 B5 C6 B5 A5 G5 E5|F5 A5 C6 E6 D6 C6 A5 F5|G5 B5 D6 F6 E6 D6 B5 G5|E5 G#5 B5 D6 C6 B5 G#5 -|A5 C6 E6 G6 E6 D6 C6 A5|B5 D6 F6 E6 D6 B5 A5 G5|C6 B5 A5 F5 G5 A5 C6 B5|A5 G#5 E5 G#5 B5 - A5 -|E6 C6 A5 C6 E6 G6 F6 E6|D6 C6 A5 F5 A5 C6 D6 E6|B5 D6 G6 F6 E6 D6 B5 A5|G#5 B5 E6 D6 C6 B5 G#5 E5|A5 B5 C6 E6 D6 C6 B5 A5|F5 G5 A5 C6 B5 A5 G5 F5|E5 G#5 B5 C6 D6 B5 G#5 E5|A5 - E5 - C5 - A4 -',
  'A2 C3 E3|F3 A3 C4|G3 B3 D4|E3 G#3 B3|A2 C3 E3|G3 B3 D4|F3 A3 C4|A2 C3 E3');
 add('overseas-lights','해외 구단 · 낯선 도시의 불빛',86,4,
  'F#5 A5 C#6 D6 C#6 A5 F#5 E5|G5 B5 D6 F#6 E6 D6 B5 G5|A5 C#6 E6 G6 F#6 E6 C#6 A5|D6 A5 F#5 E5 D5 F#5 A5 -|B5 D6 F#6 A6 G6 F#6 E6 D6|E6 D6 B5 G5 A5 B5 D6 E6|C#6 E6 A6 G6 E6 C#6 B5 A5|F#5 A5 D6 C#6 B5 A5 F#5 -|D6 F#6 E6 D6 C#6 A5 B5 C#6|E6 G6 F#6 E6 D6 B5 A5 G5|F#6 E6 C#6 A5 B5 C#6 E6 F#6|D6 C#6 A5 F#5 E5 D5 - -|B5 D6 E6 F#6 E6 D6 B5 A5|G5 B5 D6 E6 D6 B5 A5 G5|A5 C#6 D6 E6 G6 E6 C#6 A5|D6 - A5 - F#5 - D5 -',
  'D3 F#3 A3|G3 B3 D4|A3 C#4 E4|D3 F#3 A3|B2 D3 F#3|G3 B3 D4|A3 C#4 E4|D3 F#3 A3');
 add('overseas-return','해외 구단 · 시즌의 끝에서',70,4,
  'B5 G5 E5 G5 B5 D6 B5 A5|C6 A5 F#5 A5 C6 D6 C6 A5|B5 G5 E5 G5 A5 B5 E6 D6|A5 F#5 D5 F#5 A5 B5 A5 -|G5 B5 E6 G6 F#6 E6 D6 B5|A5 C6 E6 G6 F#6 E6 C6 A5|F#5 A5 D6 F#6 E6 D6 C6 A5|B5 A5 G5 F#5 E5 - - -|E6 D6 B5 A5 G5 B5 D6 E6|F#6 E6 C6 A5 C6 E6 D6 C6|G6 F#6 E6 D6 B5 D6 E6 -|F#6 E6 D6 C6 A5 C6 B5 A5|E6 D6 B5 G5 A5 B5 D6 B5|C6 B5 A5 G5 E5 G5 A5 C6|B5 A5 F#5 D#5 F#5 A5 B5 F#5|E5 - B5 - G5 - E5 -',
  'E3 G3 B3|A3 C4 E4|E3 G3 B3|D3 F#3 A3|E3 G3 B3|A3 C4 E4|D3 F#3 A3|B2 D#3 F#3');
 const playlists={
  home:{name:'홈 · 클럽하우스',tracks:['home-dawn','home-next']},
  middle:{name:'중학교',tracks:['middle','middle-afterschool','middle-weekend']},
  high:{name:'고등학교',tracks:['high','high-together','high-lastwhistle']},
  domestic:{name:'국내 구단',tracks:['domestic-home','domestic-lights','domestic-victory']},
  national:{name:'국가대표',tracks:['national','national-journey','national-night']},
  overseas:{name:'해외 구단',tracks:['overseas','overseas-road','overseas-lights','overseas-return']}
 };
 const pitch={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
 function midi(note){if(note==='-')return null;const match=/^([A-G])(#?)(\d)$/.exec(note);return match?(Number(match[3])+1)*12+pitch[match[1]]+(match[2]?1:0):null;}
 function score(id){const t=themes[id]||themes.middle,notes=[];for(let bar=0;bar<t.melody.length;bar++){
  t.melody[bar].split(' ').forEach((n,i)=>{if(midi(n)!==null)notes.push({beat:bar*t.beats+i*.5,midi:midi(n),gain:.20,pan:0});});
  const chord=t.chords[bar].split(' ').map(midi);for(let i=0;i<t.beats*2;i++)notes.push({beat:bar*t.beats+i*.5,midi:chord[[0,1,2,1][i%4]]+12,gain:.047,pan:i%2?.24:-.24});
  notes.push({beat:bar*t.beats,midi:chord[0],gain:.065,pan:-.12});
 }return{notes:notes.sort((a,b)=>a.beat-b.beat),secondsPerBeat:60/t.bpm,beats:t.melody.length*t.beats};}
 return{themes,playlists,midi,score};
})();
