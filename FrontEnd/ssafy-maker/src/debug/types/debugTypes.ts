// 디버그 오버레이에서 표시할 월드와 액션 상태 타입 정의
export type DebugState = {
  currentSceneId: string;
  currentAction: string;
  currentAreaId?: string;
  events: string[];
};
