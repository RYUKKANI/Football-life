'use strict';
const FootballData=(()=>{
const {START_YEAR,MIDDLE_SCHOOLS,HIGH_SCHOOLS,START_SCHOOLS,START_ABROAD_CHANCE,FOREIGN_ACADEMIES,YOUTH_CUPS}=FootballEra2000;
const ATTR={
 pace:{name:'속도',items:[['speed','속도','가속과 전력 질주를 포함한 이동 속도']]},
 shoot:{name:'공격',items:[['positioning','공격 위치선정','득점하기 좋은 공간을 찾는 능력'],['finishing','골 결정력','골문 앞에서 기회를 마무리하는 정확도']]},
 pass:{name:'패스',items:[['vision','시야','동료의 움직임과 빈 공간을 읽는 능력'],['passing','패스','거리와 방향에 맞춰 동료에게 공을 연결하는 정확도']]},
 tech:{name:'드리블',items:[['agility','민첩성','빠르게 방향을 바꾸는 능력'],['balance','밸런스','접촉에도 자세를 유지하는 능력'],['reactions','반응속도','상황 변화에 대응하는 속도'],['dribbling','드리블','공을 다루고 몰면서 상대를 돌파하는 능력'],['composure','평정심','압박받는 상황에서 침착함을 유지하는 능력']]},
 def:{name:'수비',items:[['marking','수비 이해도','상대를 막기 좋은 위치를 잡는 능력'],['tackle','태클','상대에게서 공을 빼앗는 능력'],['interceptions','가로채기','상대 패스 길을 읽고 끊는 능력']]},
 fit:{name:'피지컬',items:[['jumping','점프','공중볼에 도달하는 능력'],['stamina','체력','경기 내내 움직일 수 있는 지구력'],['strength','힘','몸싸움에서 버티는 능력'],['aggression','적극성','공을 향해 도전하는 적극성']]},
 gk:{name:'골키퍼',items:[['diving','GK 다이빙','몸을 날려 공에 도달하는 능력'],['reflexes','GK 반응속도','가까운 슈팅에 반응하는 능력'],['handling','GK 핸들링','공을 안정적으로 잡는 능력'],['gkPosition','GK 위치선정','슈팅을 막기 좋은 위치를 잡는 능력'],['kicking','GK 킥','골킥과 긴 배급의 정확도']]}
};
const TALENTS={
 ordinary:{name:'평범함',short:'고르게 시작',desc:'별도 보정 없이 능력치를 고르게 생성합니다.'},
 dribbler:{name:'드리블러',short:'패스 · 드리블 +6',desc:'패스·드리블 계열의 공용 세부 능력치가 6 높게 시작합니다.'},
 physical:{name:'피지컬',short:'속도 · 피지컬 +7',desc:'속도와 점프·체력·힘·적극성이 7 높게 시작합니다.'},
 calm:{name:'침착함',short:'평정심 · 핵심 능력 +4',desc:'평정심 +4. 골키퍼는 GK 위치선정, 다른 포지션은 골 결정력도 +4를 받습니다.'},
 late:{name:'대기만성',short:'낮은 시작 · 높은 잠재력',desc:'시작 능력치가 4 낮고, 잠재력은 91~97에서 결정됩니다.'},
 ready:{name:'즉시 전력',short:'시작 능력치 +4',desc:'모든 시작 능력치가 4 높습니다.'},
 fast:{name:'빠른 성장',short:'성장량 +25%',desc:'훈련과 경기 경험으로 얻는 능력치 성장량이 25% 높습니다. 노화에 따른 하락량은 늘어나지 않습니다.',growth:1.25},
 tactical:{name:'전술 이해',short:'경기 이해 능력 +4',desc:'시야·수비 이해도·공격 위치선정 +4. 골키퍼는 GK 위치선정도 +4를 받습니다.'},
 iron:{name:'철인',short:'부상 확률 절반',desc:'같은 훈련 강도에서 부상 확률이 절반으로 줄어듭니다. 부상을 완전히 막아주지는 않습니다.',injury:.5},
 ambidextrous:{name:'양발잡이',short:'처음부터 양발 활용',desc:'양발잡이 특성을 타고납니다. 약한 발 숙련도 100으로 시작하며 별도 훈련 없이 양발을 활용합니다.'}
};
const OVERALL_WEIGHTS={"ST":{"finishing":0.24,"positioning":0.16,"composure":0.08,"reactions":0.05,"strength":0.06,"jumping":0.05,"speed":0.09,"agility":0.05,"balance":0.03,"dribbling":0.06,"passing":0.04,"stamina":0.04,"vision":0.02,"marking":0.005,"tackle":0.005,"interceptions":0.005,"aggression":0.015},"WG":{"speed":0.18,"dribbling":0.18,"agility":0.1,"positioning":0.09,"passing":0.1,"finishing":0.1,"balance":0.05,"reactions":0.04,"vision":0.05,"composure":0.04,"stamina":0.03,"strength":0.01,"marking":0.005,"tackle":0.005,"interceptions":0.005,"jumping":0.005,"aggression":0.01},"MF":{"vision":0.1691542288557214,"passing":0.1890547263681592,"composure":0.08955223880597014,"reactions":0.06965174129353234,"dribbling":0.09950248756218906,"stamina":0.07960199004975124,"positioning":0.04975124378109453,"agility":0.03980099502487562,"balance":0.029850746268656716,"marking":0.05970149253731343,"tackle":0.03980099502487562,"interceptions":0.03980099502487562,"speed":0.01990049751243781,"jumping":0.004975124378109453,"strength":0.004975124378109453,"aggression":0.009950248756218905,"finishing":0.004975124378109453},"CB":{"marking":0.1782178217821782,"tackle":0.1782178217821782,"interceptions":0.1782178217821782,"jumping":0.09900990099009901,"strength":0.09900990099009901,"reactions":0.06930693069306931,"speed":0.0594059405940594,"composure":0.039603960396039604,"passing":0.0297029702970297,"vision":0.019801980198019802,"stamina":0.019801980198019802,"aggression":0.009900990099009901,"dribbling":0.0049504950495049506,"agility":0.0049504950495049506,"balance":0.0049504950495049506,"finishing":0.0024752475247524753,"positioning":0.0024752475247524753},"FB":{"speed":0.12871287128712872,"stamina":0.1188118811881188,"passing":0.1188118811881188,"tackle":0.13861386138613863,"marking":0.12871287128712872,"interceptions":0.12871287128712872,"dribbling":0.0594059405940594,"agility":0.039603960396039604,"reactions":0.0297029702970297,"vision":0.0297029702970297,"composure":0.0297029702970297,"strength":0.019801980198019802,"balance":0.009900990099009901,"positioning":0.0049504950495049506,"finishing":0.0049504950495049506,"jumping":0.0049504950495049506,"aggression":0.0049504950495049506},"GK":{"reflexes":0.24,"diving":0.18,"handling":0.16,"gkPosition":0.19,"kicking":0.11,"reactions":0.035,"agility":0.025,"composure":0.02,"vision":0.015,"passing":0.015,"strength":0.01}};
const POS={ST:{name:'스트라이커',w:[.12,.39,.08,.24,.02,.15]},WG:{name:'윙어',w:[.25,.20,.20,.25,.02,.08]},MF:{name:'미드필더',w:[.08,.09,.33,.26,.13,.11]},CB:{name:'센터백',w:[.13,.02,.10,.08,.43,.24]},FB:{name:'풀백',w:[.20,.03,.18,.12,.30,.17]},GK:{name:'골키퍼'}};
// Display order approved for each role. The underlying 22 attributes remain save-compatible.
const POSITION_ATTRIBUTES={
 ST:[
  {id:'core',name:'스트라이커 핵심 능력치',keys:['finishing','positioning','composure','reactions','strength','jumping']},
  {id:'support',name:'보조 능력치',keys:['speed','agility','balance','dribbling','passing','stamina']}
 ],
 WG:[
  {id:'core',name:'윙어 핵심 능력치',keys:['speed','dribbling','agility','positioning','passing','finishing']},
  {id:'support',name:'보조 능력치',keys:['balance','reactions','vision','composure','stamina','strength']}
 ],
 MF:[
  {id:'core',name:'미드필더 핵심 능력치',keys:['vision','passing','composure','reactions','dribbling','stamina']},
  {id:'support',name:'보조 능력치',keys:['positioning','agility','balance','marking','tackle','interceptions']}
 ],
 CB:[
  {id:'core',name:'센터백 핵심 능력치',keys:['marking','tackle','interceptions','jumping','strength','reactions']},
  {id:'support',name:'보조 능력치',keys:['speed','composure','passing','vision','stamina','aggression']}
 ],
 FB:[
  {id:'core',name:'풀백 핵심 능력치',keys:['speed','stamina','passing','tackle','marking','interceptions']},
  {id:'support',name:'보조 능력치',keys:['dribbling','agility','reactions','vision','composure','strength']}
 ],
 GK:[
  {id:'core',name:'골키퍼 전용 능력치',keys:['diving','reflexes','handling','gkPosition','kicking']},
  {id:'movement',name:'움직임 · 신체',keys:['speed','agility','balance','jumping','stamina','strength']},
  {id:'judgement',name:'판단 · 발밑',keys:['vision','passing','reactions','dribbling','composure','aggression']}
 ]
};
const commonKeys=Object.entries(ATTR).filter(([id])=>id!=='gk').flatMap(([,group])=>group.items.map(([id])=>id));
for(const[pos,sections]of Object.entries(POSITION_ATTRIBUTES))if(pos!=='GK'){
 const shown=new Set(sections.flatMap(section=>section.keys));
 sections.push({id:'other',name:'기타 능력치',keys:commonKeys.filter(id=>!shown.has(id)),collapsed:true});
}
const TACTICS={defense:{name:'수비적',desc:'위치를 지키며 상대 공격을 차단'},balanced:{name:'밸런스',desc:'공격과 수비에 고르게 참여'},team:{name:'지원적',desc:'패스와 움직임으로 동료를 지원'},attack:{name:'공격적',desc:'전진과 득점 기회에 적극 참여'}};
const INTENSITIES={light:{name:'최소',mult:.5},normal:{name:'보통',mult:1},hard:{name:'2배',mult:2}};
const GROWTH_TYPES={
 physical:['speed','agility','balance','jumping','stamina','strength'],
 technique:['finishing','passing','dribbling','tackle','diving','reflexes','handling','kicking'],
 mental:['positioning','vision','reactions','composure','marking','interceptions','aggression','gkPosition']
};
const AGE_PHASES=[
 {id:'young',max:21,name:'피지컬 성장기',desc:'속도·민첩성·밸런스·점프·체력·힘이 가장 빠르게 성장합니다.',physical:3.2,technique:2.2,mental:1.4},
 {id:'prime',max:29,name:'기술 완성기',desc:'피지컬 성장폭은 낮아지고 패스·드리블과 포지션 기술이 주로 성장합니다.',physical:.45,technique:2.0,mental:1.4},
 {id:'veteran',max:99,name:'경험과 판단의 시기',desc:'신체 능력은 내려갑니다. 유지 훈련으로 감소 폭을 줄이고 판단 능력을 다듬습니다.',physical:0,technique:.25,mental:1.15}
];
// Names and category structure follow the user-supplied builder. Bonuses are this game's own balance.
const ARCH={
 stopper:{name:'슈팅 스토퍼',plain:'선방형 골키퍼',pos:['GK'],keys:['reflexes','gkPosition'],group:'gk',style:'reach',desc:'반응속도와 위치 선정으로 슈팅을 막습니다.'},
 sweeper:{name:'스위퍼 키퍼',plain:'넓게 수비하는 골키퍼',pos:['GK'],keys:['handling','diving'],group:'gk',style:'rush',desc:'골문 밖의 공간까지 커버하는 골키퍼입니다.'},
 progressor:{name:'프로그레서',plain:'패스하는 수비수',pos:['CB','FB'],keys:['passing','tackle'],group:'pass',style:'longball',desc:'공을 빼앗은 뒤 정확한 패스로 공격을 시작합니다.'},
 boss:{name:'보스',plain:'몸싸움형 센터백',pos:['CB'],keys:['aggression','strength'],group:'fit',style:'bruiser',desc:'중앙에서 강한 몸싸움으로 상대 공격수를 제압합니다.'},
 marauder:{name:'머로더',plain:'측면을 오가는 풀백',pos:['FB'],keys:['tackle','speed'],group:'pace',style:'slide',desc:'빠르게 복귀하고 측면 공격에도 가담합니다.'},
 disruptor:{name:'파괴자',plain:'공을 되찾는 미드필더',pos:['MF'],keys:['stamina','interceptions'],group:'def',style:'intercept',desc:'왕성한 활동량으로 상대의 공격을 끊습니다.'},
 recycler:{name:'리사이클러',plain:'안정적인 연결형 미드필더',pos:['MF'],keys:['marking','passing'],group:'pass',style:'tikitaka',desc:'수비 위치를 지키며 짧은 패스로 경기를 연결합니다.'},
 maestro:{name:'마에스트로',plain:'경기를 조율하는 미드필더',pos:['MF'],keys:['reactions','dribbling'],group:'tech',style:'firsttouch',desc:'좋은 첫 터치와 판단으로 경기의 흐름을 조절합니다.'},
 creator:{name:'크리에이터',plain:'기회를 만드는 미드필더',pos:['MF','WG'],keys:['passing','vision'],group:'pass',style:'incisive',desc:'넓은 시야와 날카로운 패스로 득점 기회를 만듭니다.'},
 spark:{name:'스파크',plain:'측면 돌파형 공격수',pos:['WG'],keys:['passing','dribbling'],group:'pass',style:'whipped',desc:'측면에서 돌파하고 동료에게 크로스를 연결합니다.'},
 magician:{name:'매지션',plain:'기술형 공격수',pos:['WG','ST'],keys:['dribbling','speed'],group:'tech',style:'technical',desc:'빠른 첫발과 정교한 기술로 수비를 흔듭니다.'},
 finisher:{name:'피니셔',plain:'마무리에 강한 공격수',pos:['ST'],keys:['composure','finishing'],group:'shoot',style:'finesse',desc:'골문 앞에서 침착하게 득점 기회를 살립니다.'},
 target:{name:'타깃',plain:'공중볼에 강한 공격수',pos:['ST'],keys:['balance','jumping'],group:'fit',style:'header',desc:'공을 지켜내고 높은 공을 득점으로 연결합니다.'}
};
// [id, name, explanation, category, required attribute, threshold, effect, magnitude]
const STYLE_ROWS=[
 ['finesse','감아차기','공을 휘어 차서 득점 기회를 살립니다.','득점','curve',62,'goal',.09],['chip','칩 슛','골키퍼의 키를 넘기는 마무리에 강합니다.','득점','finishing',62,'goal',.07],['power','파워 슛','강한 슈팅으로 득점 확률을 높입니다.','득점','shotPower',64,'goal',.09],['deadball','데드볼','프리킥과 세트피스 기회를 살립니다.','득점','freeKick',65,'goal',.07],['header','프리시전 헤딩','정확한 헤딩으로 득점을 노립니다.','득점','heading',62,'goal',.08],['acrobat','아크로바틱','어려운 자세에서도 슈팅을 마무리합니다.','득점','volleys',65,'goal',.07],['lowshot','낮은 드리븐 슛','낮고 빠른 슈팅에 강합니다.','득점','finishing',66,'goal',.10],['changer','게임 체인저','팽팽한 경기의 마무리에 강합니다.','득점','composure',76,'goal',.12],
 ['incisive','예리한 패스','수비 사이로 득점 기회를 연결합니다.','패스','vision',63,'assist',.12],['ping','핑 패스','빠르고 정확한 땅볼 패스를 보냅니다.','패스','shortPass',62,'assist',.09],['longball','긴 패스','멀리 있는 동료를 정확하게 찾습니다.','패스','longPass',62,'assist',.10],['tikitaka','티키타카','짧은 패스로 동료와 연계합니다.','패스','shortPass',65,'assist',.11],['whipped','휩 패스','빠르게 휘어지는 크로스를 보냅니다.','패스','crossing',63,'assist',.12],['inventive','인벤티브','창의적인 패스로 기회를 만듭니다.','패스','vision',72,'assist',.14],
 ['jockey','견제','상대의 돌파 방향을 따라갑니다.','수비','marking',62,'defend',.05],['block','블로킹','상대 슈팅을 몸으로 막습니다.','수비','marking',64,'defend',.06],['intercept','가로채기','패스 길을 끊고 공을 되찾습니다.','수비','interceptions',62,'defend',.06],['anticipate','예상','태클 시점을 정확히 읽습니다.','수비','tackle',66,'defend',.07],['slide','슬라이딩 태클','슬라이딩으로 공을 빼앗습니다.','수비','slide',62,'defend',.06],['aerial','공중 요새','공중볼 경합에서 우위를 점합니다.','수비','jumping',66,'defend',.06],
 ['technical','테크니컬','좁은 공간에서도 공을 지킵니다.','볼 컨트롤','dribbling',63,'attack',.04],['rapid','래피드','공을 몰면서 빠르게 돌파합니다.','볼 컨트롤','sprint',65,'attack',.04],['firsttouch','퍼스트 터치','첫 터치로 다음 플레이를 준비합니다.','볼 컨트롤','ballControl',62,'attack',.035],['trickster','트릭스터','개인기로 수비의 균형을 무너뜨립니다.','볼 컨트롤','dribbling',72,'attack',.055],['press','압박 검증','압박을 받아도 공을 잃지 않습니다.','볼 컨트롤','composure',65,'attack',.04],
 ['quick','퀵 스텝','첫발을 빠르게 내딛습니다.','피지컬','acceleration',63,'attack',.035],['relentless','끈기와 인내','오래 뛰어도 체력을 유지합니다.','피지컬','stamina',64,'fitness',.25],['throw','롱 스로','긴 스로인으로 기회를 만듭니다.','피지컬','strength',62,'assist',.06],['bruiser','브루저','강한 몸싸움으로 상대를 밀어냅니다.','피지컬','strength',66,'defend',.06],['enforcer','인포서','적극적인 경합으로 공을 지킵니다.','피지컬','aggression',65,'defend',.05],
 ['far','파 스로','긴 손 배급으로 역습을 시작합니다.','골키퍼','kicking',60,'assist',.12],['feet','발놀림','발로 막아내는 선방에 강합니다.','골키퍼','reflexes',62,'defend',.06],['claim','크로스 클레이머','크로스를 안정적으로 잡아냅니다.','골키퍼','handling',62,'defend',.07],['rush','1v1 클로즈다운','일대일 상황에서 각도를 좁힙니다.','골키퍼','gkPosition',64,'defend',.08],['reach','넓은 수비 범위','골문 구석으로 오는 슈팅을 막습니다.','골키퍼','diving',64,'defend',.07],['deflector','디플렉터','위험한 슈팅을 안전하게 쳐냅니다.','골키퍼','reflexes',67,'defend',.08]
];
const STYLE_ATTRIBUTE_MAP={curve:'finishing',shotPower:'strength',freeKick:'passing',heading:'jumping',volleys:'agility',shortPass:'passing',longPass:'passing',crossing:'passing',slide:'tackle',sprint:'speed',acceleration:'speed',ballControl:'dribbling'};
const STYLES=Object.fromEntries(STYLE_ROWS.map(([id,name,desc,category,key,min,effect,value])=>[id,{id,name,desc,category,key:STYLE_ATTRIBUTE_MAP[key]||key,min,effect,value,requirements:FootballStyleRules.requirements[id]}]));
for(const[id,signature]of Object.entries(FootballStyleRules.signatures))ARCH[id].style=signature;
const PLUS_BRANCHES=FootballStyleRules.branches;
const LEAGUES={KR:{name:'대한민국',league:'K리그 1',flag:'🇰🇷'},EN:{name:'잉글랜드',league:'프리미어리그',flag:'🏴'},IT:{name:'이탈리아',league:'세리에 A',flag:'🇮🇹'},FR:{name:'프랑스',league:'리그 1',flag:'🇫🇷'},DE:{name:'독일',league:'분데스리가',flag:'🇩🇪'},ES:{name:'스페인',league:'라리가',flag:'🇪🇸'}};
// Fixed 2026 / 2026-27 club pool. Team strengths are fictional game balance, not real ratings.
const TEAMS={
 KR:[['서울','FC 서울',71,'서울오산고'],['울산','울산 HD',73,'울산현대고'],['전북','전북 현대',73,'전주영생고'],['포항','포항 스틸러스',71,'포항제철고'],['광주','광주 FC',68,'금호고'],['대전','대전하나시티즌',70,'충남기계공업고'],['강원','강원 FC',68,'강릉제일고'],['인천','인천 유나이티드',66,'인천대건고'],['김천','김천 상무',68,'경북미용예술고'],['부천','부천 FC 1995',64],['안양','FC 안양',65],['제주','제주 SK',67]],
 EN:[['arsenal','아스널',87],['city','맨체스터 시티',87],['liverpool','리버풀',86],['chelsea','첼시',83],['united','맨체스터 유나이티드',81],['spurs','토트넘 홋스퍼',81],['villa','애스턴 빌라',81],['newcastle','뉴캐슬 유나이티드',82],['brighton','브라이턴 앤 호브 앨비언',78],['bournemouth','AFC 본머스',77],['brentford','브렌트퍼드',77],['palace','크리스털 팰리스',77],['everton','에버턴',76],['fulham','풀럼',77],['forest','노팅엄 포리스트',77],['leeds','리즈 유나이티드',75],['sunderland','선덜랜드',75],['coventry','코번트리 시티',73],['ipswich','입스위치 타운',74],['hull','헐 시티',72]],
 IT:[['inter','인터 밀란',86],['milan','AC 밀란',83],['juventus','유벤투스',83],['napoli','나폴리',84],['roma','AS 로마',81],['lazio','라치오',80],['atalanta','아탈란타',82],['bologna','볼로냐',79],['fiorentina','피오렌티나',79],['como','코모',78],['torino','토리노',76],['udinese','우디네세',75],['sassuolo','사수올로',75],['genoa','제노아',75],['parma','파르마',74],['cagliari','칼리아리',73],['lecce','레체',73],['frosinone','프로시노네',72],['monza','몬차',73],['venezia','베네치아',72]],
 FR:[['psg','파리 생제르맹',87],['monaco','AS 모나코',81],['marseille','올랭피크 마르세유',81],['lyon','올랭피크 리옹',80],['lille','릴 OSC',79],['nice','OGC 니스',78],['rennes','스타드 렌',78],['lens','RC 랑스',78],['strasbourg','스트라스부르',77],['brest','스타드 브레스트',75],['toulouse','툴루즈',75],['auxerre','AJ 오세르',73],['angers','앙제 SCO',72],['paris','파리 FC',74],['lorient','FC 로리앙',73],['havre','르아브르 AC',72],['troyes','트루아',71],['lemans','르망 FC',70]],
 DE:[['bayern','바이에른 뮌헨',88],['dortmund','보루시아 도르트문트',84],['leverkusen','바이어 레버쿠젠',84],['leipzig','RB 라이프치히',82],['stuttgart','VfB 슈투트가르트',80],['frankfurt','아인트라흐트 프랑크푸르트',80],['freiburg','SC 프라이부르크',77],['hoffenheim','호펜하임',77],['mainz','마인츠 05',76],['augsburg','아우크스부르크',75],['union','우니온 베를린',75],['gladbach','보루시아 묀헨글라트바흐',76],['bremen','베르더 브레멘',76],['hamburg','함부르크 SV',75],['koln','FC 쾰른',74],['schalke','샬케 04',74],['elversberg','엘버스베르크',71],['paderborn','파더보른',72]],
 ES:[['real','레알 마드리드',89],['barcelona','FC 바르셀로나',88],['atletico','아틀레티코 마드리드',84],['athletic','아틀레틱 클루브',81],['villarreal','비야레알',81],['betis','레알 베티스',80],['sociedad','레알 소시에다드',79],['sevilla','세비야',78],['valencia','발렌시아',77],['celta','셀타 비고',77],['osasuna','오사수나',76],['getafe','헤타페',75],['rayo','라요 바예카노',76],['espanyol','에스파뇰',74],['alaves','알라베스',74],['elche','엘체',73],['levante','레반테',73],['malaga','말라가',72],['racing','라싱 산탄데르',72],['deportivo','데포르티보 라코루냐',73]]
};
const LEGACY_CLUBS=Object.entries(TEAMS).flatMap(([country,rows])=>rows.map(([id,name,power,school])=>({id:country+'-'+id,country,name,power,school:school||null})));
const CLUBS=FootballEra2000.CLUBS;
const SOURCES=[['FC27 클럽 빌더 · 능력치 / 아키타입 / 플레이스타일','https://fc27builderbuilder.pages.dev/'],['K리그 · 유스와 연계 학교','https://www.kleague.com/youth/junior.do'],['K리그 · 대회 방식','https://www.kleague.com/about/competition.do'],['잉글랜드 구단','https://www.premierleague.com/en/news/4365156'],['이탈리아 구단','https://en.legaseriea.it/serie-a/standings'],['프랑스 구단','https://ligue1.com/en/competitions/ligue1mcdonalds/standings?season=2026'],['독일 구단','https://www.bundesliga.com/en/bundesliga/clubs'],['스페인 구단','https://www.laliga.com/laliga-easports/clubes']];
return{ATTR,TALENTS,POS,OVERALL_WEIGHTS,POSITION_ATTRIBUTES,TACTICS,INTENSITIES,GROWTH_TYPES,AGE_PHASES,ARCH,STYLES,PLUS_BRANCHES,LEAGUES,CLUBS,LEGACY_CLUBS,START_YEAR,MIDDLE_SCHOOLS,HIGH_SCHOOLS,START_SCHOOLS,START_ABROAD_CHANCE,FOREIGN_ACADEMIES,YOUTH_CUPS,SOURCES:[SOURCES[0],...FootballEra2000.SOURCES]};
})();
