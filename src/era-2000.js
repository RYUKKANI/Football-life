// Historical club membership: Korea 2000, Europe 2000/01 (RSSSF season tables).
// Power is game balance. The starting club pool is retained in the simulated future.
const FootballEra2000=(()=>{
const START_YEAR=2000;
const TEAMS={
 KR:[['anyang-lg','안양 LG 치타스',74],['seongnam','성남 일화 천마',73],['jeonbuk','전북 현대 모터스',69],['bucheon-sk','부천 SK',70],['suwon','수원 삼성 블루윙즈',75],['busan','부산 아이콘스',71],['jeonnam','전남 드래곤즈',69],['pohang','포항 스틸러스',72],['ulsan','울산 현대 호랑이',71],['daejeon','대전 시티즌',65]],
 EN:[['united','맨체스터 유나이티드',88],['arsenal','아스널',85],['liverpool','리버풀',84],['leeds','리즈 유나이티드',82],['ipswich','입스위치 타운',77],['chelsea','첼시',81],['sunderland','선덜랜드',77],['villa','애스턴 빌라',78],['charlton','찰턴 애슬레틱',74],['southampton','사우샘프턴',75],['newcastle','뉴캐슬 유나이티드',79],['spurs','토트넘 홋스퍼',78],['leicester','레스터 시티',75],['middlesbrough','미들즈브러',74],['westham','웨스트햄 유나이티드',76],['everton','에버턴',75],['derby','더비 카운티',73],['city','맨체스터 시티',74],['coventry','코번트리 시티',72],['bradford','브래드퍼드 시티',70]],
 IT:[['roma','AS 로마',87],['juventus','유벤투스',87],['lazio','라치오',86],['parma','파르마',83],['inter','인터 밀란',84],['milan','AC 밀란',85],['atalanta','아탈란타',76],['brescia','브레시아',76],['fiorentina','피오렌티나',80],['bologna','볼로냐',77],['perugia','페루자',75],['udinese','우디네세',78],['lecce','레체',72],['reggina','레지나',73],['verona','엘라스 베로나',73],['vicenza','비첸차',72],['napoli','나폴리',75],['bari','바리',71]],
 FR:[['nantes','FC 낭트',81],['lyon','올랭피크 리옹',81],['lille','릴 OSC',77],['bordeaux','지롱댕 드 보르도',81],['sedan','스당',74],['rennes','스타드 렌',76],['troyes','트루아',73],['bastia','바스티아',75],['psg','파리 생제르맹',81],['guingamp','갱강',73],['monaco','AS 모나코',82],['metz','FC 메스',75],['auxerre','AJ 오세르',78],['lens','RC 랑스',77],['marseille','올랭피크 마르세유',80],['toulouse','툴루즈',71],['saintetienne','생테티엔',74],['strasbourg','스트라스부르',72]],
 DE:[['bayern','바이에른 뮌헨',88],['schalke','샬케 04',82],['dortmund','보루시아 도르트문트',83],['leverkusen','바이어 레버쿠젠',83],['hertha','헤르타 BSC',79],['freiburg','SC 프라이부르크',76],['bremen','베르더 브레멘',79],['kaiserslautern','카이저슬라우테른',80],['wolfsburg','볼프스부르크',77],['koln','FC 쾰른',75],['munich1860','TSV 1860 뮌헨',76],['rostock','한자 로스토크',73],['hamburg','함부르크 SV',79],['cottbus','에네르기 코트부스',71],['stuttgart','VfB 슈투트가르트',77],['unterhaching','운터하힝',71],['frankfurt','아인트라흐트 프랑크푸르트',75],['bochum','보훔',72]],
 ES:[['real','레알 마드리드',89],['deportivo','데포르티보 라코루냐',85],['mallorca','마요르카',79],['barcelona','FC 바르셀로나',88],['valencia','발렌시아',85],['celta','셀타 비고',80],['villarreal','비야레알',75],['malaga','말라가',76],['espanyol','에스파뇰',78],['alaves','알라베스',78],['laspalmas','라스팔마스',73],['athletic','아틀레틱 클루브',79],['sociedad','레알 소시에다드',77],['rayo','라요 바예카노',75],['osasuna','오사수나',73],['valladolid','레알 바야돌리드',75],['zaragoza','레알 사라고사',77],['oviedo','레알 오비에도',73],['racing','라싱 산탄데르',73],['numancia','누만시아',70]]
};
const CLUBS=Object.entries(TEAMS).flatMap(([country,rows])=>rows.map(([id,name,power])=>({id:country+'-'+id,country,name,power,school:null})));
// Established school football teams, not fictional pro-club U15 aliases.
const MIDDLE_SCHOOLS=[
 ['anyong','안용중학교','경기',50],['mullae','문래중학교','서울',47],['joongdong','중동중학교','서울',49],['pocheol','포항제철중학교','경북',51],
 ['gwangcheol','광양제철중학교','전남',50],['hanyang','한양중학교','서울',48],['masan','마산중앙중학교','경남',53],['cheonho','천호중학교','서울',46],
 ['bukseong','광주북성중학교','광주',55],['anyang','안양중학교','경기',55],['poongsaeng','풍생중학교','경기',53],['bupyeongdong','부평동중학교','인천',53],
 ['iridong','이리동중학교','전북',53],['namsuwon','남수원중학교','경기',52],['jangheung','장흥중학교','전남',52],['gyeongsin','경신중학교','서울',52]
].map(([id,name,region,power])=>({id:'MS-'+id,name,region,power,country:'KR'}));
const START_SCHOOLS=[
 ['anyong','2000년 전국소년체전 우승'],['masan','2000년 전국소년체전 준우승'],['bukseong','2000년 금석배 우승'],['anyang','2000년 전국중등축구선수권 우승'],
 ['poongsaeng','2000년 보도에서 소개된 전통 강호'],['bupyeongdong','1992·1993년 소년체전 우승, 이천수 배출'],['iridong','1996년 소년체전·1999년 금석배 우승'],
 ['namsuwon','1998년 금석배 우승'],['joongdong','1998년 전국소년체전 우승'],['gyeongsin','1993·1994년 금석배 우승']
].map(([id,basis])=>({...MIDDLE_SCHOOLS.find(s=>s.id==='MS-'+id),basis}));
const START_ABROAD_CHANCE=.01;
const FOREIGN_ACADEMIES=['EN-united','EN-arsenal','EN-liverpool','EN-city','IT-milan','IT-inter','FR-lyon','FR-monaco','DE-bayern','DE-dortmund','ES-barcelona','ES-real'];
// Real domestic competition names; the calendar and reduced knockout fields are game adaptations.
const YOUTH_CUPS={
 middle:[{id:'geumgang',name:'금강대기',month:5,day:5},{id:'geumseok',name:'금석배',month:6,day:21},{id:'championship',name:'전국중학교축구선수권대회',month:9,day:3}],
 academy:[{id:'geumgang',name:'금강대기',month:5,day:5},{id:'geumseok',name:'금석배',month:6,day:21},{id:'autumn',name:'추계 중고축구연맹전',month:8,day:5}],
 foreign:[{id:'spring',name:'유스 봄 초청컵',month:4,day:3},{id:'summer',name:'유스 여름 초청컵',month:8,day:5},{id:'autumn',name:'유스 가을 초청컵',month:11,day:3}]
};
// A school is displayed as a club academy only from the documented affiliation year.
const HIGH_SCHOOLS=[
 ['pocheol','포항제철공업고등학교','경북',61,'KR-pohang',2003],['gwangcheol','광양제철고등학교','전남',60,'KR-jeonnam',2003],
 ['bupyeong','부평고등학교','인천',59],['dongbuk','동북고등학교','서울',58],['joongdong','중동고등학교','서울',58],
 ['suwongong','수원공업고등학교','경기',58],['baejae','배재고등학교','서울',57],['hyundai','현대고등학교','울산',60]
].map(([id,name,region,power,parentId=null,affiliatedFrom=null])=>({id:'HS-'+id,name,region,power,parentId,affiliatedFrom,country:'KR'}));
const SOURCES=[
 ['2000 K리그 구단과 대회 기록','https://www.rsssf.org/tabless/skor00.html'],
 ['2000/01 잉글랜드 구단','https://www.rsssf.org/tablese/eng01.html'],['2000/01 이탈리아 구단','https://www.rsssf.org/tablesi/ital01.html'],
 ['2000/01 프랑스 구단','https://www.rsssf.org/tablesf/fran01.html'],['2000/01 독일 구단','https://www.rsssf.org/tablesd/duit01.html'],['2000/01 스페인 구단','https://www.rsssf.org/tabless/span01.html'],
 ['KFA · 안용중·수원공고 선수 경력','https://www.kfa.or.kr/layer_popup/popup_live.php?act=news_tv_detail&div_code=news&idx=14900'],
 ['KFA · 중동중·한양중 관련 기록','https://www.kfa.or.kr/layer_popup/popup_live.php?act=news_tv_detail&div_code=news&idx=4690'],
 ['KFA · 배재고 선수 경력','https://www.kfa.or.kr/layer_popup/popup_live.php?act=news_tv_detail&div_code=news&idx=14721'],
 ['문래중 축구부 운영 기록','https://www.ydptimes.com/news/news.php?m=view&num=19136'],
 ['천호중 · 1994년 창단과 2000년 대회 기록','https://www.kado.net/news/articleView.html?idxno=58855'],
 ['광양제철중 · 1993년 창단 기록','https://www.khan.co.kr/article/200908041451191'],
 ['포스코 · 2003년 학교 축구부의 구단 소속 전환','https://www.posco.com/homepage/docs/kor5/dn/sustain/customer/POSCO_06_view.pdf'],
 ['2000 소년체전 · 안용중과 마산중앙중','https://footballk.net/phpBB3/viewtopic.php?p=3381'],
 ['KFA · 2009년 이전 전국 토너먼트 중심의 학원축구','https://www.kfa.or.kr/competition/?act=lg_emh'],
 ['2000 금석배 · 대회 기간과 광주북성중 우승','https://www.jjan.kr/article/20000702014015'],
 ['2000년 풍생중·안용중 등의 경기도학생체육대회 기록','https://www.kyeonggi.com/article/200003220105841'],
 ['금강대기 참가팀 소개 · 안양중의 2000년 전국선수권 우승','https://www.kado.net/news/articleView.html?idxno=57413'],
 ['금석배 역대 우승 학교 기록','https://sports.news.nate.com/view/20120212n05747'],
 ['인천 구단 · 부평동중과 이천수의 선수 육성 기록','https://incheonutd.com/fanzone/feeds_view.php?idx=34&tgbn=feeds_news']
];
return{START_YEAR,CLUBS,MIDDLE_SCHOOLS,HIGH_SCHOOLS,START_SCHOOLS,START_ABROAD_CHANCE,FOREIGN_ACADEMIES,YOUTH_CUPS,SOURCES};
})();
