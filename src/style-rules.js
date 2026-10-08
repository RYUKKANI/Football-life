// Read from the user-provided builder's visible requirement tooltips, 2026-10-08.
// Original builder attributes are folded into this career game's approved 22 attributes.
const FootballStyleRules=(()=>{
const aliases={acceleration:'speed',sprint:'speed',shortPass:'passing',longPass:'passing',crossing:'passing',freeKick:'passing',curve:'finishing',shotPower:'strength',longShots:'finishing',volleys:'agility',heading:'jumping',ballControl:'dribbling',slide:'tackle'};
const normalise=rows=>Object.entries(rows.reduce((a,[key,value])=>{key=aliases[key]||key;a[key]=Math.max(a[key]||0,value);return a},{}));
const rows={
 finesse:[['vision',80],['finishing',75],['curve',80]],chip:[['reactions',75],['composure',80],['ballControl',80]],
 power:[['finishing',80],['shotPower',75],['longShots',80]],deadball:[['crossing',80],['freeKick',75],['shotPower',80]],
 header:[['jumping',80],['strength',80],['heading',75]],acrobat:[['agility',80],['reactions',80],['volleys',75]],
 lowshot:[['composure',80],['finishing',75],['shotPower',80]],changer:[['composure',80],['finishing',75],['curve',80]],
 incisive:[['vision',75],['longPass',80],['curve',80]],ping:[['longPass',85],['shortPass',80]],
 longball:[['vision',85],['longPass',80]],tikitaka:[['reactions',80],['ballControl',80],['shortPass',75]],
 whipped:[['crossing',80],['longPass',75]],inventive:[['composure',80],['longPass',75],['curve',80]],
 jockey:[['agility',75],['marking',80],['tackle',80]],block:[['agility',80],['strength',75],['reactions',80]],
 intercept:[['aggression',80],['interceptions',80]],anticipate:[['balance',80],['marking',75],['tackle',80]],
 slide:[['aggression',80],['slide',75]],aerial:[['jumping',75],['heading',75]],
 technical:[['balance',80],['ballControl',75],['dribbling',80]],rapid:[['acceleration',75],['sprint',80],['dribbling',80]],
 firsttouch:[['composure',80],['ballControl',75]],trickster:[['acceleration',80],['agility',75],['dribbling',80]],
 press:[['strength',75],['composure',80],['ballControl',80]],quick:[['acceleration',75],['sprint',80],['stamina',80]],
 relentless:[['agility',80],['stamina',80]],throw:[['strength',80],['vision',75]],
 bruiser:[['strength',75],['aggression',80],['marking',80]],enforcer:[['balance',80],['strength',75],['ballControl',80]],
 far:[['vision',75],['longPass',75],['kicking',80]],feet:[['agility',80],['balance',80],['reflexes',75]],
 claim:[['jumping',80],['strength',80],['gkPosition',75]],rush:[['acceleration',80],['agility',75],['aggression',80]],
 reach:[['agility',80],['reactions',80],['diving',75]],deflector:[['strength',75],['diving',80],['reflexes',75]]
};
const requirements=Object.fromEntries(Object.entries(rows).map(([id,r])=>[id,normalise(r)]));
const signatures={stopper:'reach',sweeper:'feet',progressor:'longball',boss:'bruiser',marauder:'quick',disruptor:'jockey',recycler:'intercept',maestro:'ping',creator:'incisive',spark:'trickster',magician:'technical',finisher:'lowshot',target:'header'};
// [specialization name, awarded plus style, original builder requirements]
const rawBranches={
 stopper:[['슈팅 스토퍼+','claim',[['jumping',90],['handling',92],['gkPosition',90]]],['스파이더','rush',[['acceleration',90],['agility',90],['reflexes',92]]],['옥토퍼스','deflector',[['strength',90],['diving',92],['gkPosition',90]]]],
 sweeper:[['스위퍼 키퍼+','far',[['vision',90],['diving',92],['kicking',90]]],['런처','longball',[['longPass',90],['kicking',92],['reflexes',90]]],['엑스트라','press',[['composure',90],['shortPass',90],['gkPosition',92]]]],
 progressor:[['프로그레서+','jockey',[['longPass',90],['marking',90],['tackle',92]]],['파이오니어','ping',[['dribbling',92],['longPass',90],['shortPass',90]]],['재니터','quick',[['acceleration',92],['sprint',90],['slide',90]]]],
 boss:[['보스+','slide',[['slide',92],['aggression',90],['strength',90]]],['인포서','press',[['composure',92],['vision',90],['ballControl',90]]],['캡틴','block',[['agility',90],['reactions',90],['marking',92]]]],
 marauder:[['머로더+','slide',[['sprint',92],['aggression',90],['slide',90]]],['스피드스터','rapid',[['acceleration',90],['sprint',92],['dribbling',90]]],['애슬리트','bruiser',[['strength',92],['aggression',90],['marking',90]]]],
 disruptor:[['파괴자+','intercept',[['balance',90],['reactions',90],['interceptions',92]]],['파괴자','slide',[['sprint',90],['strength',92],['slide',90]]],['앵커','bruiser',[['ballControl',90],['dribbling',90],['shortPass',92]]]],
 recycler:[['리사이클러+','ping',[['strength',90],['longPass',90],['shortPass',92]]],['드라이버','enforcer',[['strength',90],['balance',92],['sprint',90]]],['씨프','anticipate',[['interceptions',90],['marking',90],['tackle',92]]]],
 maestro:[['마에스트로+','technical',[['balance',90],['vision',92],['dribbling',90]]],['크래셔','firsttouch',[['composure',92],['ballControl',90],['finishing',90]]],['하트비트','relentless',[['agility',92],['stamina',90],['aggression',90]]]],
 creator:[['크리에이터+','whipped',[['longPass',90],['crossing',90],['vision',92]]],['아키텍트','deadball',[['crossing',92],['freeKick',90],['shotPower',90]]],['스나이퍼','power',[['finishing',90],['shotPower',92],['longShots',90]]]],
 spark:[['스파크+','quick',[['acceleration',90],['sprint',90],['agility',92]]],['조커','whipped',[['positioning',90],['crossing',92],['longPass',90]]],['에이스','chip',[['finishing',92],['ballControl',90],['reactions',90]]]],
 magician:[['매지션+','firsttouch',[['acceleration',90],['composure',90],['ballControl',92]]],['핫샷','power',[['finishing',90],['shotPower',92],['longShots',90]]],['인베이더','incisive',[['positioning',90],['vision',90],['longPass',92]]]],
 finisher:[['피니셔+','chip',[['reactions',90],['composure',92],['ballControl',90]]],['프레서','relentless',[['aggression',90],['stamina',92],['agility',90]]],['헌터','changer',[['positioning',90],['finishing',90],['curve',92]]]],
 target:[['타깃+','acrobat',[['agility',90],['jumping',92],['volleys',90]]],['로머','incisive',[['vision',90],['longPass',90],['shortPass',92]]],['러너','enforcer',[['sprint',92],['strength',90],['positioning',90]]]]
};
const branches=Object.fromEntries(Object.entries(rawBranches).map(([arch,list])=>[arch,list.map(([name,style,req],i)=>({id:arch+'-'+i,name,style,requirements:normalise(req),level:10}))]));
return{requirements,signatures,branches,normalise};
})();
