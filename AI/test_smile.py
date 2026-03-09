import cv2
import mediapipe as mp
import math

# 1. MediaPipe 초기화
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1, # 오직 한 명의 얼굴만 인식
    refine_landmarks=True, 
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# 2. 두 점 사이의 픽셀 거리 계산 함수
def get_distance(p1, p2, img_w, img_h):
    # MediaPipe의 정규화된 좌표(0.0 ~ 1.0)를 실제 픽셀 좌표로 변환
    x1, y1 = int(p1.x * img_w), int(p1.y * img_h)
    x2, y2 = int(p2.x * img_w), int(p2.y * img_h)
    return math.hypot(x2 - x1, y2 - y1)

# 3. 웹캠 켜기
cap = cv2.VideoCapture(0)

print("🎥 자본주의 미소 테스트를 시작합니다! (종료하려면 'q'를 누르세요)")

while cap.isOpened():
    success, image = cap.read()
    if not success:
        print("웹캠을 찾을 수 없습니다.")
        break

    # 거울처럼 보이기 위해 좌우 반전 및 RGB 변환
    image = cv2.flip(image, 1)
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    img_h, img_w, _ = image.shape

    # AI 추론 실행
    results = face_mesh.process(image_rgb)

    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            landmarks = face_landmarks.landmark

            # [핵심 랜드마크 추출]
            # 61: 왼쪽 입꼬리, 291: 오른쪽 입꼬리
            # 234: 왼쪽 뺨 끝, 454: 오른쪽 뺨 끝
            # 13: 윗입술 중앙, 14: 아랫입술 중앙
            pt_left_mouth = landmarks[61]
            pt_right_mouth = landmarks[291]
            pt_left_face = landmarks[234]
            pt_right_face = landmarks[454]
            pt_upper_lip = landmarks[13]
            pt_lower_lip = landmarks[14]

            # [거리 계산]
            w_mouth = get_distance(pt_left_mouth, pt_right_mouth, img_w, img_h)
            w_face = get_distance(pt_left_face, pt_right_face, img_w, img_h)
            h_mouth = get_distance(pt_upper_lip, pt_lower_lip, img_w, img_h)

            # [미소 비율 및 점수 산출]
            smile_ratio = w_mouth / w_face if w_face > 0 else 0
            open_ratio = h_mouth / w_face if w_face > 0 else 0

            # 기획 밸런싱 (이 수치들을 직접 테스트하며 조절하세요!)
            min_ratio = 0.35 # 무표정일 때의 평균 비율
            max_ratio = 0.45 # 활짝 웃었을 때의 목표 비율

            if smile_ratio < min_ratio:
                score = 0.0
            elif smile_ratio >= max_ratio:
                score = 100.0
            else:
                score = ((smile_ratio - min_ratio) / (max_ratio - min_ratio)) * 100.0
            
            # 입을 벌리고 웃으면 가산점 10%
            if open_ratio > 0.05:
                score = min(score * 1.1, 100.0)

            # [화면에 결과 그리기 (시각화)]
            # 1. 랜드마크에 점 찍기 (입꼬리: 초록색, 얼굴 윤곽: 파란색)
            for pt in [pt_left_mouth, pt_right_mouth]:
                cv2.circle(image, (int(pt.x * img_w), int(pt.y * img_h)), 3, (0, 255, 0), -1)
            for pt in [pt_left_face, pt_right_face]:
                cv2.circle(image, (int(pt.x * img_w), int(pt.y * img_h)), 3, (255, 0, 0), -1)

            # 2. 텍스트 출력
            cv2.putText(image, f"Ratio: {smile_ratio:.3f}", (20, 50), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
            
            # 점수에 따라 글씨 색상 변경 (100점이면 빨간색)
            color = (0, 0, 255) if score >= 100 else (0, 255, 0)
            cv2.putText(image, f"Score: {int(score)}", (20, 100), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1.5, color, 3)

    cv2.imshow('Smile Challenge PoC', image)

    # 'q' 키를 누르면 종료
    if cv2.waitKey(5) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()