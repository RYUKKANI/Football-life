# 자료 출처

## 이미지와 화면

- 메인 경기장 배경: 이 게임을 위해 제작한 일러스트 `assets/home-cover.png`.
- 로고: 축구 생활 / Football Life 이름의 화면 내 글자 구성.
- 하단 메뉴 및 사이트 아이콘: 게임 내 SVG.
- 선수 카드·유니폼 실루엣·베스트11 경기장: 게임 내 HTML/CSS/SVG 구성. 구단 표장의 색상을 참고하며, 유니폼은 게임용 실루엣입니다. 새로운 타사 그림을 사용하지 않습니다.
- 플레이스타일 아이콘 36개: 사용자가 지정한 [FC27 클럽 빌더](https://fc27builderbuilder.pages.dev/)의 원본 PNG. `src/style-icons.js`에 포함되어 있습니다. 아이콘 목록과 원본 주소는 [playstyle-assets.json](playstyle-assets.json)에 기록했습니다.
- 메인 메뉴 구성 참고: [이번 생은 야구다](https://slbcareer.com/). 해당 게임의 로고나 배경 이미지는 이 저장소에 포함하지 않습니다.

## 학교와 구단

2000년 전후 학교 대회 성적과 당시 보도, 한국 2000년·유럽 2000/01 시즌 구단 구성을 참고했습니다. 구체적인 출처는 `src/era-2000.js`의 `SOURCES`와 게임 설정의 참고 자료에 있습니다.

구단 이름은 시대 기준을 유지합니다. 예를 들어 한국은 2000년 당시 구단 구성이고 유럽은 2000/01 시즌 1부 참가 구단입니다. 유소년 대진과 날짜, 해외 초청컵, 전력과 계약은 게임용으로 구성했습니다.

## 능력치와 플레이스타일

[FC27 클럽 빌더](https://fc27builderbuilder.pages.dev/)의 아키타입 이름, 기본 플레이스타일 조건, 전문화 경로를 참고했습니다. 이 게임은 패스·드리블 등 통합 능력치를 사용하므로 원래 세부 조건을 대응시키고, 같은 능력으로 합쳐지는 조건은 높은 기준을 적용합니다.

경기 행동 계산, 종합 능력 비중, 성장·부상·감소, 플레이스타일 효과와 강화 칸, 계약 결과는 축구 생활 자체 규칙입니다. 실제 FC 시리즈의 커리어 모드 계산식과 같다는 의미는 아닙니다.

## 구단 엠블럼과 추가 진로

기존 구단 엠블럼 91개는 [K리그 공식 사이트](https://www.kleague.com/about/emblem.do), [football.db.logos](https://github.com/sportlogos/football.db.logos), [football-logos](https://github.com/luukhopman/football-logos)에서 제공하는 이미지를 그대로 저장했습니다. 원본 경로는 club-crest-sources.json에 기록합니다. 추가 해외 구단 14곳은 [JoseArroyave/football-logos](https://github.com/JoseArroyave/football-logos)의 SVG 원본을 사용합니다. 중학교 16곳·고등학교 8곳은 각 학교 공식 홈페이지에서 교표 또는 홈페이지 로고를 가져왔습니다. 중동·경신 중학교는 같은 재단 중고교의 공용 교표를 사용합니다. 각 원본 페이지와 이미지, 표시 영역은 team-crest-sources.json에 기록합니다.

2000 시즌 프로 구단 104곳과 학교 24곳에 실제 표장을 표시합니다. 구단과 학교 표장은 해당 기관 소유이며, 현재 확인할 수 있는 표장을 사용해 정확한 2000년 엠블럼을 재현하지 않습니다. 자료가 없는 대학·일부 실업팀에는 게임용 방패 표식을 사용합니다. 외부 이미지가 사라져도 게임의 로고가 유지되도록 파일 안에 원본을 포함했습니다.

대학 축구부 이름은 [대한축구협회 대학 축구 자료](https://www.kfa.or.kr/layer_popup/popup_live.php?act=news_tv_detail&div_code=news&idx=3744)를 참고했습니다. 상무 명칭은 [김천상무 구단 소개](https://www.gimcheonfc.com/stm/stm.php)를 참고합니다. 대학·실업팀 일정, 시설 등급, 임대·입단 테스트·복무 평가는 자체 게임 규칙입니다.

## 음악과 효과음

중학교 「첫 킥오프」, 고등학교 「푸른 유니폼」, 국가대표 「태극마크」, 해외 구단 「먼 무대」는 이 게임을 위해 작성한 16마디의 오르골 연주입니다. 기존 교가·응원가의 녹음, 가사, 선율을 사용하지 않았습니다. 악보는 src/soundtracks.js에 있고, src/game-audio.js가 Web Audio로 벨 음색과 버튼 효과음을 합성합니다. 별도 음원 파일이나 외부 음악 서비스는 필요하지 않습니다.

음악은 첫 사용자 조작 후 시작되며, 화면을 다시 그릴 때 이어집니다. 무대가 바뀌면 음악을 전환하고, 페이지가 숨겨지면 음악을 멈춥니다. 소리 설정은 football-life-audio에 저장해 기존 선수 기록과 분리합니다.

## 대륙대항전 구단 표장

감바 오사카·주빌로 이와타·가시마 앤틀러스·알 힐랄·알 이티하드·알 아인의 현재 표장 6개는 [JoseArroyave/football-logos](https://github.com/JoseArroyave/football-logos)의 SVG 원본을 사용합니다. 기존 학교·구단 표장과 함께 `src/team-crests.js`에 저장했으며 개별 원본 주소는 team-crest-sources.json의 continentalClubs에 기록합니다. 당시 2000년 표장을 재현한 자료는 아닙니다.

## 기록 압축

- fflate 0.8.3 (MIT), Arjun Barrett: https://github.com/101arrowz/fflate
- 공식 npm 배포의 브라우저 파일을 프로젝트에 포함합니다. 저장과 백업은 추가 네트워크 요청 없이 압축합니다.
- 라이선스 원문은 `fflate-license.txt`와 배포 스크립트에 포함합니다.
