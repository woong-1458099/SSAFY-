import cv2
import mediapipe as mp
import math
import time
import numpy as np
import random

# 1. MediaPipe 초기화
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(max_num_faces=1, refine_landmarks=True)

def get_distance(p1, p2, img_w, img_h):
    return math.hypot(int(p2.x * img_w) - int(p1.x * img_w), int(p2.y * img_h) - int(p1.y * img_h))

# [신규 추가] 입꼬리 상승 각도(Y축) 계산 로직
def get_smile_slope(landmarks, img_h):
    # 상순 중앙(13번)과 좌우 입꼬리(61, 291)의 y좌표 비교
    center_y = landmarks[13].y * img_h
    left_corner_y = landmarks[61].y * img_h
    right_corner_y = landmarks[291].y * img_h
    
    # 입꼬리가 중앙보다 위로 올라갈수록 양수 값이 커짐
    slope = (center_y - left_corner_y) + (center_y - right_corner_y)
    return slope

# ---------------------------------------------------------
# [필터 엔진] 블랙홀(강력한 수렴) 필터 추가
# ---------------------------------------------------------
def apply_distort_filter(img, mode="blackhole"):
    try:
        h, w = img.shape[:2]
        map_y, map_x = np.indices((h, w), dtype=np.float32)
        cx, cy = w / 2, h / 2
        dx = map_x - cx
        dy = map_y - cy
        r = np.sqrt(dx**2 + dy**2)
        
        # 이미지의 최대 반지름 (대각선 길이의 절반)
        max_r = np.sqrt(cx**2 + cy**2)

        if mode == "blackhole":
            # 1. 거리 계산 시 세로(dy)에 가중치를 주어 '세로로 긴 타원형' 영역을 만듭니다.
            # dy에 1.5를 곱하면 세로 거리가 더 멀게 인식되어, 수렴 시 더 강하게 당겨집니다.
            dist_weight_y = 1.5 
            r_weighted = np.sqrt(dx**2 + (dy * dist_weight_y)**2)
            
            # 2. 정규화된 거리 (0~1 사이)
            r_norm = r_weighted / max_r
            
            # 3. 수렴 강도 (0.2 정도로 낮추면 훨씬 강력해집니다)
            suck_strength = 0.15 
            
            # 4. 좌표 매핑
            # 여기서 마지막에 0.8 같은 상수를 곱하면 전체적인 얼굴 크기가 작아지는 효과가 나고,
            # r_norm의 지수를 조절하면 중앙으로 빨려 들어가는 '곡률'이 변합니다.
            map_x = cx + dx * (r_norm ** suck_strength)
            map_y = cy + dy * (r_norm ** suck_strength) * 0.8 # 0.8로 낮추면 세로가 더 쫙 붙습니다.
            
            # 2. [옵션] '사건의 지평선' 효과: 아주 가까운 중심부는 아예 단색처리
            # 예: 중심에서 10픽셀 이내는 검은색으로 뭉침
            # event_horizon = 10
            # map_x[r < event_horizon] = cx
            # map_y[r < event_horizon] = cy

        # elif mode == "fish_eye":
        #     r_norm = r / max_r
        #     strength = 1.5
        #     map_x = cx + dx * (r_norm ** strength)
        #     map_y = cy + dy * (r_norm ** strength)
            
        # elif mode == "pinch": # 기존 홀쭉이 (블랙홀보다는 약함)
        #     r_norm = r / max_r
        #     strength = 0.6 # 블랙홀보다 큰 값
        #     map_x = cx + dx * (r_norm ** strength)
        #     map_y = cy + dy * (r_norm ** strength)
            
        elif mode == "stretch":
            map_x = cx + dx * 1.8
            map_y = cy + dy * 0.7

        # 타입 강제 및 remap 적용
        map_x = map_x.astype(np.float32)
        map_y = map_y.astype(np.float32)
        return cv2.remap(img, map_x, map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    except Exception as e:
        print(f"Filter Error: {e}")
        return img.copy()

# ---------------------------------------------------------
# 2. 게임 설정 및 밸런스 변수
# ---------------------------------------------------------
cap = cv2.VideoCapture(0)
smile_gauge = 0.0
MAX_GAUGE = 100.0

# 👇 [밸런스 조절 포인트] 👇
RATIO_THRESHOLD = 0.42  # 입 가로 너비 임계치 (약간 상향)
SLOPE_THRESHOLD = 5.0   # 입꼬리 상승 임계치 (픽셀 단위)
RECOVERY_SPEED = 0.3    # 무표정일 때 게이지 회복 속도

filters = ["none", "blackhole", "stretch"]
current_filter = "none"
last_filter_change = time.time()
start_time = time.time()
game_over = False

while cap.isOpened():
    success, image = cap.read()
    if not success: break
    image = cv2.flip(image, 1)
    img_h, img_w, _ = image.shape

    if not game_over and time.time() - last_filter_change > 5.0:
        current_filter = random.choice(filters)
        last_filter_change = time.time()

    display_img = apply_distort_filter(image, mode=current_filter) if current_filter != "none" else image.copy()
    results = face_mesh.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

    if not game_over and results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            landmarks = face_landmarks.landmark
            
            # 1. 가로 너비 비율 계산
            w_mouth = get_distance(landmarks[61], landmarks[291], img_w, img_h)
            w_face = get_distance(landmarks[234], landmarks[454], img_w, img_h)
            smile_ratio = w_mouth / w_face if w_face > 0 else 0
            
            # 2. 신규 로직: 입꼬리 각도(상승분) 계산
            smile_slope = get_smile_slope(landmarks, img_h)

            # 🌟 [판정 시스템] 🌟
            # 가로로 넓어지거나, 입꼬리가 올라가면 웃음으로 간주
            if smile_ratio >= RATIO_THRESHOLD or smile_slope >= SLOPE_THRESHOLD:
                # 웃음 강도에 비례해서 페널티 부여
                penalty = 1.0 + (smile_ratio * 10) + (smile_slope / 2)
                smile_gauge += penalty
            else:
                # 무표정 유지 시 게이지 회복
                smile_gauge -= RECOVERY_SPEED
            
            smile_gauge = max(0.0, min(smile_gauge, MAX_GAUGE))
            if smile_gauge >= MAX_GAUGE:
                game_over = True

    # --- UI 그리기 섹션 ---
    
    # 1. 필터 이름 표시 박스 (좌측 상단)
    # 배경 박스 (반투명 느낌을 위해 진한 회색)
    cv2.rectangle(display_img, (20, 20), (220, 60), (30, 30, 30), -1)
    # 테두리 (필터 종류에 따라 색상 변경)
    box_color = (0, 255, 255) # 기본 노란색
    if current_filter == "blackhole": box_color = (255, 0, 255) # 보라색
    elif current_filter == "square": box_color = (0, 255, 0)    # 초록색
    elif current_filter == "fish_eye": box_color = (255, 255, 0) # 하늘색
    
    cv2.rectangle(display_img, (20, 20), (220, 60), box_color, 2)
    
    # 필터 텍스트 출력
    filter_label = f"MODE: {current_filter.upper()}"
    cv2.putText(display_img, filter_label, (35, 48), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

    # 2. 다음 필터 교체까지 남은 시간 (프로그레스 바 형태나 숫자로 표시)
    time_left = max(0, 5.0 - (time.time() - last_filter_change))
    cv2.putText(display_img, f"Next Change: {time_left:.1f}s", (20, 85), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

    # 3. 웃음 참기 게이지 (기존 로직 유지하되 위치 살짝 조정)
    # 화면 하단 중앙으로 옮기면 얼굴을 가리지 않아 좋습니다.
    gauge_x = (img_w // 2) - 200
    gauge_y = img_h - 50
    cv2.rectangle(display_img, (gauge_x, gauge_y), (gauge_x + 400, gauge_y + 20), (50, 50, 50), -1)
    bar_w = int((smile_gauge / MAX_GAUGE) * 400)
    # 게이지가 찰수록 빨간색이 진해짐
    cv2.rectangle(display_img, (gauge_x, gauge_y), (gauge_x + bar_w, gauge_y + 20), (0, 0, 255), -1)
    cv2.putText(display_img, "LAUGH GAUGE", (gauge_x, gauge_y - 10), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)

cap.release()
cv2.destroyAllWindows()