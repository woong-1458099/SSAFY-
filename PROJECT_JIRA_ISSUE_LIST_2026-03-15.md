# Project Jira Issue List

기준일

- 2026-03-15

---

## Frontend

- Epic: [Frontend] UI 기본 틀 개발
  - Story: UI 기본 틀 잡기
    - Task: UI 에셋 상수화 및 폴더 구조 세팅
    - Task: 스크립트 연동용 데이터 인터페이스 정의
    - Task: 공용 UI 컴포넌트(대화창, 버튼 등) 뼈대 제작
    - Task: Scene과 UI 컴포넌트 간 상태 연동 로직 구현

- Epic: [Frontend] 게임 클라이언트 초기 구조 및 인증 진입 흐름 구현
  - Story: Phaser + Vite 기반 게임 클라이언트 부트스트랩 및 씬 레지스트리 구성
  - Story: 백엔드 연동 로그인/회원가입 화면 및 세션 저장 구현
  - Story: 시작 화면, 로그아웃, 이어하기 슬롯 선택 UI 구현

- Epic: [Frontend] 게임 시작 연출 및 캐릭터 생성 흐름 구현
  - Story: 인트로 시네마틱 연출 및 씬 전환 구현
  - Story: 캐릭터 생성 화면 및 아바타 커스터마이징 구현

- Epic: [Frontend] 메인 플레이 루프 및 게임 시스템 구현
  - Story: 메인 게임 플레이 허브(MainScene) 구현
  - Story: TMX 기반 맵 파싱 및 충돌/인터랙션 처리 구현
  - Story: HUD 및 공용 UI 컴포넌트 구현
  - Story: 인벤토리, 장비, 상점 로컬 상태 시스템 구현
  - Story: 로컬 저장 슬롯 기반 세이브/로드 시스템 구현

- Epic: [Frontend] 스토리, 선택지, 엔딩 흐름 및 발표 결과물 정리
  - Story: NPC 대화 스크립트 및 선택지 기반 분기 처리 구현
  - Story: 스탯 기반 엔딩 판정 및 엔딩 씬 파이프라인 구현
  - Story: 이번 주 스토리 작업
  - Story: 메인스토리 스크립트 선택지 작업
    - Task: 발표 자료 제작
    - Task: 발표 진행

- Epic: [Frontend] 미니게임 구조 유지 및 연동 준비
  - Story: 레거시 미니게임 씬 등록 및 허브 구조 유지
  - Story: 미니게임 초안 설계 및 연동 준비
    - Task: 미니게임 목록 정리
    - Task: 미니게임 진입 구조 정리
    - Task: 미니게임 결과 반영 포인트 정리
    - Task: 미니게임 상세 시스템은 추후 확정으로 보류

- Epic: [Frontend] 문서화 정리
  - Story: 프론트 구현 구조 문서화

---

## Backend

- Epic: [Backend] 인증 및 사용자 관리 백엔드 구축
  - Story: BFF 기반 Keycloak 로그인/회원가입/로그아웃 플로우 구현
  - Story: JWT 기반 현재 사용자 bootstrap 및 조회 API 구현
    - Task: Spring Security 및 Keycloak 연동 설정 구성

- Epic: [Backend] 게임 저장/인벤토리/도전과제 백엔드 구축
  - Story: 세이브 파일 CRUD API 구현
  - Story: 세이브 파일별 인벤토리 CRUD API 구현
  - Story: 도전과제 마스터 및 사용자 도전과제 API 구현

- Epic: [Backend] 에셋 및 공용 백엔드 지원 기능 구축
  - Story: 에셋 매니페스트 공개 조회 API 구현
    - Task: asset bundle 관리용 파일 조회 API 구현

- Epic: [Backend] 데이터 설계 및 명세 문서 정리
  - Story: 게임 도메인용 DB 스키마 및 마이그레이션 구성
    - Task: ERD 문서 수정 및 PostgreSQL 기준 구조 정리
    - Task: API 명세서 수정 및 예시 문서 정리

---

## Infrastructure

- Epic: [Infra] STG 인프라 및 운영 도구 기반 환경 구축
  - Story: STG EC2 Docker 및 Compose 운영 환경 구성
    - Task: 운영 도구 스택(Jenkins, n8n, Prometheus, Grafana) 배포
    - Task: 도메인 및 host 기반 reverse proxy 구조 정리

- Epic: [Infra] 인증 및 백엔드 STG 배포 파이프라인 안정화
  - Story: Keycloak 인증 도메인 및 HTTPS reverse proxy 구성
  - Story: 백엔드 STG Jenkins 파이프라인 검증 및 target color 배포 확인
    - Task: 백엔드 health check 실패 원인 분석 정리

- Epic: [Infra] 프론트 배포 및 정적 자산 운영 개선
  - Story: GitLab webhook과 Jenkins trigger 연동 구성
  - Story: 프론트 정적 에셋 경로 문제 분석 및 public/assets 기준 재정리
    - Task: Frontend Jenkins pipeline에 Cloudflare cache purge 자동화 추가
    - Task: nginx 심볼릭 링크 반영 문제 대응을 위한 live + rsync 배포 구조 전환
    - Task: Origin 및 Cloudflare 경유 이미지 Content-Type 정상화 검증
