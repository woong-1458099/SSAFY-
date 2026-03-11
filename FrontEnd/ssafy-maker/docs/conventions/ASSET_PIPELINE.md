# ASSET_PIPELINE

## 흐름

`assets/raw` -> export(가공) -> `assets/game`

## 구분

- 원본 파일: `assets/raw/**`
- 런타임 로딩 파일: `assets/game/**`

## 원칙

- 코드에서 preload/load는 `assets/game`만 사용
- 원본 수정은 raw에서만 수행
- 게임 반영 파일은 최적화 버전을 사용

## 분류 기준

- 스프라이트: `assets/game/sprites`
- 타일셋: `assets/game/tiles`
- 배경: `assets/game/backgrounds`
- UI: `assets/game/ui`
- 오디오: `assets/game/audio`
- 폰트: `assets/game/fonts`

## 파일명 규칙 예시

- 캐릭터 스프라이트시트: `char_<name>_<state>_sheet.png`
- 타일셋: `tileset_<theme>_<size>.png`
- UI 패널: `ui_<screen>_<role>.png`
- 배경음: `bgm_<area>_<mood>.ogg`

## 권장 체크리스트

- 해상도/픽셀 밀도 확인
- 투명도/알파 채널 확인
- atlas/json 매칭 확인
- 실제 씬에서 로딩 테스트