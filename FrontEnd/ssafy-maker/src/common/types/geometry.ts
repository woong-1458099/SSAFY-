// 좌표와 사각형 영역처럼 월드 배치에 공통으로 쓰는 기하 타입 정의
export type Vector2 = {
  x: number;
  y: number;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};
