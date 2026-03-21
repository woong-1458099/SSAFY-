export const LEGACY_QUIZ_QUESTION_COUNT = 8;
export const LEGACY_QUIZ_TOTAL_TIME = 20;

export const LEGACY_QUIZ_QUESTIONS = [
  { question: "OSI 7계층에서 전송 계층 프로토콜은?", options: ["HTTP", "TCP", "IP", "FTP"], answer: 1 },
  { question: "TCP/IP 4계층 중 최상위 계층은?", options: ["네트워크", "전송", "인터넷", "응용"], answer: 3 },
  { question: "HTTP 상태코드 404의 의미는?", options: ["서버 오류", "인증 필요", "찾을 수 없음", "권한 없음"], answer: 2 },
  { question: "HTTP 상태코드 500의 의미는?", options: ["클라이언트 오류", "서버 내부 오류", "리다이렉션", "인증 필요"], answer: 1 },
  { question: "DNS의 주요 역할은?", options: ["데이터 암호화", "도메인을 IP로 변환", "IP 주소 할당", "패킷 라우팅"], answer: 1 },
  { question: "기본키(Primary Key)의 특징으로 올바른 것은?", options: ["중복 허용", "NULL 허용", "유일성 보장", "외래키와 동일"], answer: 2 },
  { question: "GROUP BY와 함께 사용하는 조건절은?", options: ["WHERE", "HAVING", "ORDER BY", "JOIN"], answer: 1 },
  { question: "DBMS에서 트랜잭션의 ACID 중 A는?", options: ["Atomicity", "Availability", "Accuracy", "Authentication"], answer: 0 },
  { question: "정규화의 목적으로 올바른 것은?", options: ["데이터 중복 증가", "이상현상 제거", "조회 속도 저하", "테이블 수 감소"], answer: 1 },
  { question: "INNER JOIN의 결과는?", options: ["왼쪽 테이블 전체", "오른쪽 테이블 전체", "양쪽 교집합", "양쪽 합집합"], answer: 2 },
  { question: "프로세스와 스레드의 차이로 올바른 것은?", options: ["스레드는 독립 메모리", "프로세스가 더 가볍다", "스레드는 자원 공유", "프로세스는 스레드 미포함"], answer: 2 },
  { question: "교착상태(Deadlock) 발생 조건이 아닌 것은?", options: ["상호 배제", "점유와 대기", "선점 가능", "순환 대기"], answer: 2 },
  { question: "가상 메모리의 장점이 아닌 것은?", options: ["메모리 확장", "메모리 보호", "처리 속도 향상", "다중 프로그래밍"], answer: 2 },
  { question: "시간복잡도 O(n log n)인 정렬 알고리즘은?", options: ["버블 정렬", "선택 정렬", "삽입 정렬", "퀵 정렬"], answer: 3 },
  { question: "스택(Stack)의 특징은?", options: ["FIFO", "LIFO", "Random Access", "Priority"], answer: 1 },
  { question: "이진 탐색의 시간복잡도는?", options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], answer: 2 },
  { question: "애자일 방법론의 특징이 아닌 것은?", options: ["반복 개발", "문서 중심", "고객 협력", "변화 대응"], answer: 1 },
  { question: "UML 다이어그램 중 동적 모델링은?", options: ["클래스 다이어그램", "시퀀스 다이어그램", "패키지 다이어그램", "컴포넌트 다이어그램"], answer: 1 },
] as const;

const LEGACY_QUIZ_RESULT_RULES = [
  { minRatio: 0.8, grade: "🏆 EXCELLENT!", color: "#FFD700", reward: "지능 +10, GP +30" },
  { minRatio: 0.6, grade: "✅ GOOD!", color: "#00ff88", reward: "지능 +5, GP +15" },
  { minRatio: 0, grade: "📚 TRY AGAIN", color: "#ff8844", reward: "지능 +2, 스트레스 +5" },
] as const;

export function resolveLegacyQuizResult(score: number, total: number) {
  const ratio = total > 0 ? score / total : 0;
  return LEGACY_QUIZ_RESULT_RULES.find((rule) => ratio >= rule.minRatio) ?? LEGACY_QUIZ_RESULT_RULES[LEGACY_QUIZ_RESULT_RULES.length - 1];
}
