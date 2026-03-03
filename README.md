# Profile Guide

이 프로젝트는 실행 환경을 `local`, `staging`, `prod` 3개 프로필로 분리한다.

## 프로필 기준

- `local`
  - 개인 노트북 개발 환경
  - 빠른 개발/디버깅 목적
  - 기본값: JWT 비활성(`JWT_ENABLED=false`)
- `staging`
  - 배포 전 검증 서버 환경
  - 운영과 최대한 유사한 설정 사용
  - JWT 활성 + 실제 Issuer URI 사용
- `prod`
  - 실제 운영 환경
  - 보안/안정성 우선
  - JWT 활성 + 운영 DB/인프라 연결

## 설정 파일 매핑

- 공통: `BackEnd/src/main/resources/application.yml`
- 로컬: `BackEnd/src/main/resources/application-local.yml`
- 스테이징: `BackEnd/src/main/resources/application-staging.yml`
- 운영: `BackEnd/src/main/resources/application-prod.yml`

## 환경변수 파일

- 루트 인프라용 템플릿: `.env.example`
- 백엔드 앱용 템플릿: `BackEnd/.env.example`

실사용 시:

1. `.env.example` -> `.env`
2. `BackEnd/.env.example` -> `BackEnd/.env`

## 실행 기준

- 로컬 기본 실행: `SPRING_PROFILES_ACTIVE=local`
- 스테이징 실행: `SPRING_PROFILES_ACTIVE=staging`
- 운영 실행: `SPRING_PROFILES_ACTIVE=prod`

## 핵심 원칙

- 코드에 인프라 주소/비밀번호를 하드코딩하지 않는다.
- 환경 차이는 프로필 + 환경변수로만 제어한다.
- EC2를 받은 뒤에는 서버 주소/키/도메인만 바꿔 연결한다.
