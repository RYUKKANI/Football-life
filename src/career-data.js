'use strict';
// Historical institutions; competition schedules, facilities and player rosters are game balance.
const FootballCareerData=(()=>{
 const universities=[['yonsei','연세대학교',63],['korea','고려대학교',64],['hanyang','한양대학교',61],['kyunghee','경희대학교',60],['ajou','아주대학교',62],['sungkyunkwan','성균관대학교',60]].map(([id,name,power])=>({id:'UNI-'+id,name:name+' 축구부',country:'KR',power,kind:'university'}));
 const semi=[['mipo','울산현대미포조선',66],['kb','국민은행',65],['gangneung','강릉시청',63],['hallelujah','할렐루야',61],['railway','인천 한국철도',64],['sangmu','상무 축구단',67]].map(([id,name,power])=>({id:'SP-'+id,name,country:'KR',power,kind:'semipro'}));
 const surnames=['김','김','김','이','이','박','박','최','정','강','조','윤','장','임','한','오','서','신','권','황','안','송','류','홍','전','문'];
 const given=['민준','서준','도윤','지호','시우','준서','현우','지훈','건우','우진','승현','민재','준혁','성민','동현','재현','태훈','수현','승우','지환','도현','재민','성훈','정우','주영','진우','동준','승민','준호','영준','태민','찬우','유찬','시온','현준','민성','은찬','준영','상민','하준'];
 const foreign={EN:[['James','Oliver','Harry','Jack','Adam','Luke','Daniel','Sam'],['Smith','Wilson','Taylor','Brown','Walker','Hughes','Martin','Green']],IT:[['Marco','Luca','Andrea','Paolo','Matteo','Davide'],['Rossi','Bianchi','Romano','Costa','Marino','Moretti']],ES:[['Pablo','Diego','Sergio','Javier','Carlos','Alvaro'],['Garcia','Lopez','Sanchez','Perez','Torres','Ruiz']],FR:[['Lucas','Hugo','Louis','Theo','Antoine','Maxime'],['Martin','Bernard','Dubois','Laurent','Moreau','Petit']],DE:[['Leon','Lukas','Finn','Jonas','Max','Tim'],['Muller','Schmidt','Weber','Wagner','Fischer','Koch']]};
 const ROLES={starter:{name:'주전',desc:'팀의 중심으로 꾸준히 출전',chance:.055,share:.65},rotation:{name:'로테이션',desc:'경쟁과 교체 출전으로 기회 확보',chance:.025,share:.38},prospect:{name:'유망주',desc:'훈련과 제한된 출전으로 성장',chance:0,share:.16}};
 const HEIGHT={ST:[174,194],WG:[164,184],MF:[167,188],CB:[178,196],FB:[168,189],GK:[180,199]};
 const BMI={ST:[21.5,24],WG:[20.3,22.5],MF:[20.5,23],CB:[22,24.5],FB:[20.8,23],GK:[21.3,24]};
 const SOURCES=[['대한축구협회 · 대학 축구부','https://www.kfa.or.kr/layer_popup/popup_live.php?act=news_tv_detail&div_code=news&idx=3744'],['김천상무 · 구단 소개','https://www.gimcheonfc.com/stm/stm.php'],['현대중공업 · 미포조선 축구단 창단 기록','https://www.hd.com/common/kr/docs/현대중공업그룹_50년사_2권(성장스토리).pdf']];
 return {CLUBS:[...universities,...semi],ROLES,HEIGHT,BMI,surnames,given,foreign,SOURCES};
})();
