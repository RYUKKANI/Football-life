# 자료 출처

## 이미지와 화면

- 메인 경기장 배경: 이 게임을 위해 제작한 일러스트 `assets/home-cover.png`.
- 로고: 축구 생활 / Football Life 이름과 축구공을 사용한 화면 내 글자 구성.
- 하단 메뉴 및 사이트 아이콘: 게임 내 SVG.
- 플레이스타일 아이콘 36개: 사용자가 지정한 [FC27 클럽 빌더](https://fc27builderbuilder.pages.dev/)의 원본 PNG. `src/style-icons.js`에 포함되어 있습니다. 아이콘 목록과 원본 주소는 [playstyle-assets.json](playstyle-assets.json)에 기록했습니다.
- 메인 메뉴 구성 참고: [이번 생은 야구다](https://slbcareer.com/). 해당 게임의 로고나 배경 이미지는 이 저장소에 포함하지 않습니다.

## 학교와 구단

2000년 전후 학교 대회 성적과 당시 보도, 한국 2000년·유럽 2000/01 시즌 구단 구성을 참고했습니다. 구체적인 출처는 `src/era-2000.js`의 `SOURCES`와 게임 설정의 참고 자료에 있습니다.

구단 이름은 시대 기준을 유지합니다. 예를 들어 한국은 2000년 당시 구단 구성이고 유럽은 2000/01 시즌 1부 참가 구단입니다. 유소년 대진과 날짜, 해외 초청컵, 전력과 계약은 게임용으로 구성했습니다.

## 능력치와 플레이스타일

[FC27 클럽 빌더](https://fc27builderbuilder.pages.dev/)의 아키타입 이름, 기본 플레이스타일 조건, 전문화 경로를 참고했습니다. 이 게임은 패스·드리블 등 통합 능력치를 사용하므로 원래 세부 조건을 대응시키고, 같은 능력으로 합쳐지는 조건은 높은 기준을 적용합니다.

경기 행동 계산, 종합 능력 비중, 성장·부상·감소, 플레이스타일 효과와 강화 칸, 계약 결과는 축구 생활 자체 규칙입니다. 실제 FC 시리즈의 커리어 모드 계산식과 같다는 의미는 아닙니다.

## 구단 엠블럼과 추가 진로

구단 엠블럼 91개는 [K리그 공식 사이트](https://www.kleague.com/about/emblem.do), [football.db.logos](https://github.com/sportlogos/football.db.logos), [football-logos](https://github.com/luukhopman/football-logos)에서 제공하는 이미지를 그대로 저장했습니다. 원본 경로는 club-crest-sources.json에 기록합니다. 구단 표장은 각 구단 소유입니다. 국내 구단에는 현재 후신 구단의 엠블럼이 포함되어 정확한 2000년 엠블럼을 재현하지 않습니다. 자료가 없는 학교·대학·실업팀과 역사 구단 14곳에는 게임용 방패 표식을 사용합니다.

대학 축구부 이름은 [대한축구협회 대학 축구 자료](https://www.kfa.or.kr/layer_popup/popup_live.php?act=news_tv_detail&div_code=news&idx=3744)를 참고했습니다. 상무 명칭은 [김천상무 구단 소개](https://www.gimcheonfc.com/stm/stm.php)를 참고합니다. 대학·실업팀 일정, 시설 등급, 임대·입단 테스트·복무 평가는 자체 게임 규칙입니다.
