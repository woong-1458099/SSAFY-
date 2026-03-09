import cv2
import mediapipe as mp
import math
import time

# 1. MediaPipe 초기화
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

def get_distance(p1, p2, img_w, img_h):
    x1, y1 = int(p1.x * img_w), int(p1.y * img_h)
    x2, y2 = int(p2.x * img_w), int(p2.y * img_h)
    return math.hypot(x2 - x1, y2 - y1)

# 2. 게임 상태 변수 세팅 (기획 밸런싱 요소)
smile_gauge = 0.0          # 현재 스마일 게이지 (0 ~ 100)
MAX_GAUGE = 100.0          # 목표 게이지
# 👇 게이지 속도 조절 밸런스 패치 👇
SMILE_THRESHOLD = 0.40     # (유지) 본인 얼굴에 맞게 0.38 ~ 0.42 사이로 조절
FILL_SPEED = 0.6           # (하향) 1프레임당 차오르는 속도. 0.6이면 약 5초 내내 웃어야 100이 됩니다.
DROP_SPEED = 2.0           # (상향) 잠깐이라도 정색하면 훅 깎이는 무자비한 페널티!
game_cleared = False       # 클리어 여부

cap = cv2.VideoCapture(0)
print("🎥 자본주의 미소 유지 챌린지 시작! (종료: 'q')")

while cap.isOpened():
    success, image = cap.read()
    if not success: break

    image = cv2.flip(image, 1)
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    img_h, img_w, _ = image.shape

    results = face_mesh.process(image_rgb)

    if not game_cleared and results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            landmarks = face_landmarks.landmark

            # 랜드마크 추출 및 거리 계산
            w_mouth = get_distance(landmarks[61], landmarks[291], img_w, img_h)
            w_face = get_distance(landmarks[234], landmarks[454], img_w, img_h)
            
            smile_ratio = w_mouth / w_face if w_face > 0 else 0

            # 🌟 [핵심 로직] 미소 유지 시 게이지 증가, 정색하면 감소
            if smile_ratio >= SMILE_THRESHOLD:
                smile_gauge += FILL_SPEED
            else:
                smile_gauge -= DROP_SPEED
            
            # 게이지 범위 제한 (0 ~ 100)
            smile_gauge = max(0.0, min(smile_gauge, MAX_GAUGE))

            # 클리어 판정
            if smile_gauge >= MAX_GAUGE:
                game_cleared = True

            # 화면에 랜드마크 그리기 (입꼬리 포인트 시각화)
            cv2.circle(image, (int(landmarks[61].x * img_w), int(landmarks[61].y * img_h)), 5, (0, 255, 0), -1)
            cv2.circle(image, (int(landmarks[291].x * img_w), int(landmarks[291].y * img_h)), 5, (0, 255, 0), -1)

            # 텍스트 출력
            cv2.putText(image, f"Ratio: {smile_ratio:.3f}", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    # 🎨 [UI 그리기] 화면 상단에 스마일 게이지 바(Progress Bar) 표시
    bar_x, bar_y, bar_w, bar_h = 50, 80, 400, 30
    # 1. 빈 게이지 배경 (회색)
    cv2.rectangle(image, (bar_x, bar_y), (bar_x + bar_w, bar_y + bar_h), (100, 100, 100), -1)
    
    # 2. 차오르는 게이지 (노란색)
    fill_width = int((smile_gauge / MAX_GAUGE) * bar_w)
    if fill_width > 0:
        cv2.rectangle(image, (bar_x, bar_y), (bar_x + fill_width, bar_y + bar_h), (0, 215, 255), -1)
    
    # 3. 게이지 테두리 (흰색)
    cv2.rectangle(image, (bar_x, bar_y), (bar_x + bar_w, bar_y + bar_h), (255, 255, 255), 2)

    # 게임 클리어 연출
    if game_cleared:
        cv2.putText(image, "CLEAR! PERFECT CAPITALIST SMILE!", (30, 200), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 4)
        cv2.putText(image, "Press 'R' to Restart", (150, 250), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 0), 2)

    cv2.imshow('Smile Challenge PoC', image)
    
    # 키보드 입력 처리
    key = cv2.waitKey(5) & 0xFF
    if key == ord('q'): 
        break  # 'q'를 누르면 프로그램 완전히 종료
    elif key == ord('r'): 
        # 'r'을 누르면 상태 변수를 0으로 덮어씌워 게임 초기화!
        smile_gauge = 0.0
        game_cleared = False
        print("🔄 게임을 다시 시작합니다!")

cap.release()
cv2.destroyAllWindows()