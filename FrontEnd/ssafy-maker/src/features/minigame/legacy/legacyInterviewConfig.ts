export const LEGACY_INTERVIEW_QUESTION_COUNT = 8;
export const LEGACY_INTERVIEW_TOTAL_TIME = 20;

export const LEGACY_INTERVIEW_QUESTIONS = [
  { question: "REST API에서 PUT과 PATCH의 차이는?", options: ["PUT: 전체 수정, PATCH: 부분 수정", "PUT: 삭제, PATCH: 수정", "PUT: 조회, PATCH: 생성", "둘 다 동일한 기능"], answer: 0, category: "WEB" },
  { question: "HTTP 상태코드 401과 403의 차이는?", options: ["401: 서버 오류, 403: 클라이언트 오류", "401: 인증 없음, 403: 권한 없음", "401: 찾을 수 없음, 403: 요청 오류", "둘 다 인증 오류"], answer: 1, category: "WEB" },
  { question: "CORS(Cross-Origin Resource Sharing)란?", options: ["서버 간 통신 프로토콜", "다른 출처 리소스 공유 정책", "데이터 암호화 방식", "캐싱 전략"], answer: 1, category: "WEB" },
  { question: "React useEffect의 빈 배열 []의 의미는?", options: ["업데이트마다 실행", "언마운트 시만 실행", "마운트 시 한 번만 실행", "아무것도 실행 안함"], answer: 2, category: "FE" },
  { question: "JavaScript == 와 === 차이는?", options: ["==: 타입+값, ===: 값만", "==: 값만, ===: 타입+값 모두", "둘 다 동일하게 동작", "==: 객체, ===: 원시값"], answer: 1, category: "FE" },
  { question: "Virtual DOM의 장점은?", options: ["메모리 사용량 감소", "실제 DOM 조작 최소화", "SEO 향상", "보안 강화"], answer: 1, category: "FE" },
  { question: "CSR과 SSR의 차이는?", options: ["CSR: 서버 렌더링, SSR: 클라이언트", "CSR: 클라이언트 렌더링, SSR: 서버", "둘 다 동일한 방식", "CSR: 정적, SSR: 동적"], answer: 1, category: "FE" },
  { question: "Spring @Autowired의 역할은?", options: ["HTTP 요청 매핑", "의존성 자동 주입", "트랜잭션 관리", "예외 처리"], answer: 1, category: "BE" },
  { question: "JWT(JSON Web Token)의 구성 요소는?", options: ["ID, PW, Token", "Header, Payload, Signature", "Key, Value, Hash", "Auth, Session, Cookie"], answer: 1, category: "BE" },
  { question: "Spring @Transactional의 역할은?", options: ["의존성 주입", "트랜잭션 관리", "HTTP 매핑", "예외 처리"], answer: 1, category: "BE" },
  { question: "SQL INNER JOIN과 LEFT JOIN 차이는?", options: ["INNER: 왼쪽만, LEFT: 오른쪽만", "INNER: 교집합, LEFT: 왼쪽 전체 포함", "INNER: 합집합, LEFT: 교집합", "둘 다 동일한 결과"], answer: 1, category: "DB" },
  { question: "데이터베이스 인덱스의 장점은?", options: ["저장 공간 절약", "검색 속도 향상", "데이터 무결성", "동시성 제어"], answer: 1, category: "DB" },
  { question: "NoSQL과 RDBMS의 차이는?", options: ["NoSQL: 정형, RDBMS: 비정형", "NoSQL: 스키마 유연, RDBMS: 고정 스키마", "둘 다 동일", "NoSQL: SQL 사용, RDBMS: 미사용"], answer: 1, category: "DB" },
  { question: "Git merge와 rebase의 차이는?", options: ["merge: 이력 유지, rebase: 이력 재정렬", "merge: 브랜치 삭제, rebase: 브랜치 생성", "merge: 로컬용, rebase: 원격용", "둘 다 동일한 기능"], answer: 0, category: "GIT" },
  { question: "Git stash의 용도는?", options: ["커밋 삭제", "변경사항 임시 저장", "브랜치 생성", "원격 동기화"], answer: 1, category: "GIT" },
  { question: "OOP 4대 특성이 아닌 것은?", options: ["캡슐화", "상속", "동기화", "다형성"], answer: 2, category: "CS" },
  { question: "TCP와 UDP의 차이는?", options: ["TCP: 빠름, UDP: 신뢰성", "TCP: 신뢰성, UDP: 빠름", "TCP: 비연결형, UDP: 연결형", "둘 다 동일한 방식"], answer: 1, category: "CS" },
  { question: "프로세스와 스레드의 차이는?", options: ["프로세스: 메모리 공유, 스레드: 독립", "프로세스: 독립 메모리, 스레드: 메모리 공유", "둘 다 동일", "프로세스가 더 가볍다"], answer: 1, category: "CS" },
  { question: "Docker 이미지와 컨테이너의 관계는?", options: ["이미지: 실행 인스턴스, 컨테이너: 템플릿", "둘 다 동일한 개념", "이미지: 템플릿, 컨테이너: 실행 인스턴스", "이미지: 네트워크, 컨테이너: 스토리지"], answer: 2, category: "INFRA" },
  { question: "CI/CD의 의미는?", options: ["코드 검사/배포", "지속적 통합/배포", "컨테이너 생성/삭제", "클라우드 연결/해제"], answer: 1, category: "INFRA" },
] as const;

export const LEGACY_INTERVIEW_CATEGORY_COLORS = {
  WEB: 0x4499ff,
  FE: 0x44ff88,
  BE: 0xff8800,
  DB: 0xcc55ff,
  GIT: 0xff4466,
  CS: 0xffd700,
  INFRA: 0x33ffcc
} as const;

const LEGACY_INTERVIEW_RESULT_RULES = [
  { minCorrect: LEGACY_INTERVIEW_QUESTION_COUNT, grade: "S", gradeColor: "#FFD700", message: "🏆 PERFECT! 면접 합격!", reward: "BE +5, GP +15" },
  { minCorrect: 6, grade: "A", gradeColor: "#00ff88", message: "✅ 합격권!", reward: "BE +3, GP +10" },
  { minCorrect: 4, grade: "B", gradeColor: "#4499ff", message: "😤 아슬아슬...", reward: "BE +2, GP +5" },
  { minCorrect: 0, grade: "C", gradeColor: "#ff4466", message: "📚 공부가 필요해요", reward: "STRESS +3" },
] as const;

export function resolveLegacyInterviewResult(correctCount: number) {
  return (
    LEGACY_INTERVIEW_RESULT_RULES.find((rule) => correctCount >= rule.minCorrect) ??
    LEGACY_INTERVIEW_RESULT_RULES[LEGACY_INTERVIEW_RESULT_RULES.length - 1]
  );
}
