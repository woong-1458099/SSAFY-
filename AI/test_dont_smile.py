import cv2
import mediapipe as mp
import math
import time
import numpy as np

# 1. MediaPipe 초기화 (동일)
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(max_num_faces=1, refine_landmarks=True)

def get_distance(p1, p2, img_w, img_h):
    return math.hypot(int(p2.x * img_w) - int(p1.x * img_w), int(p2.y * img_h) - int(p1.y * img_h))

# 2. 게임 상태 변수 (웃음 참기 밸런싱)
smile_gauge = 0.0
MAX_GAUGE = 100.0
SMILE_THRESHOLD = 0.38  # 이 수치를 넘으면 웃는 것으로 판단
SMILE_PENALTY = 3.5     # 웃을 때 게이지가 차오르는 속도 (매우 빠름)
AUTO_INCREASE = 0.05    # 가만히 있어도 아주 조금씩 차오르는 긴장감 수치
game_over = False
start_time = time.time()

cap = cv2.VideoCapture(0)

while cap.isOpened():
    success, image = cap.read()
    if not success: break

    image = cv2.flip(image, 1)
    img_h, img_w, _ = image.shape
    results = face_mesh.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

    if not game_over:
        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                landmarks = face_landmarks.landmark
                w_mouth = get_distance(landmarks[61], landmarks[291], img_w, img_h)
                w_face = get_distance(landmarks[234], landmarks[454], img_w, img_h)
                smile_ratio = w_mouth / w_face if w_face > 0 else 0

                # 🌟 [핵심 로직] 웃으면 게이지 급상승
                if smile_ratio >= SMILE_THRESHOLD:
                    smile_gauge += SMILE_PENALTY
                else:
                    # 무표정일 때 게이지가 아주 천천히 줄어들거나, 
                    # 게임 난이도를 위해 아주 조금씩 자동으로 차오르게 설정 가능
                    smile_gauge += AUTO_INCREASE 
                
                smile_gauge = max(0.0, min(smile_gauge, MAX_GAUGE))

                if smile_gauge >= MAX_GAUGE:
                    game_over = True

    # 🎨 UI: 게이지 바 그리기 (빨간색으로 변경하여 경고 느낌 부여)
    bar_x, bar_y, bar_w, bar_h = 50, 50, 400, 30
    cv2.rectangle(image, (bar_x, bar_y), (bar_x + bar_w, bar_y + bar_h), (50, 50, 50), -1)
    fill_width = int((smile_gauge / MAX_GAUGE) * bar_w)
    # 게이지가 높을수록 더 진한 빨간색
    cv2.rectangle(image, (bar_x, bar_y), (bar_x + fill_width, bar_y + bar_h), (0, 0, 255), -1)
    
    # 텍스트 정보
    cv2.putText(image, "RESIST SMILING!", (bar_x, bar_y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
    
    if game_over:
        cv2.putText(image, "YOU LAUGHED! FAIL!", (100, img_h // 2), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 4)
        cv2.putText(image, "Press 'R' to Retry", (200, img_h // 2 + 60), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
    else:
        survival_sec = int(time.time() - start_time)
        cv2.putText(image, f"Survival: {survival_sec}s", (img_w - 200, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

    cv2.imshow('Try Not to Laugh', image)
    
    key = cv2.waitKey(5) & 0xFF
    if key == ord('q'): break
    elif key == ord('r'):
        smile_gauge = 0.0
        game_over = False
        start_time = time.time()

cap.release()
cv2.destroyAllWindows()