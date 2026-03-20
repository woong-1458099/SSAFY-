// 맵, 액터, 전경 레이어가 서로 겹칠 때의 렌더 우선순위를 공통 규칙으로 관리한다.
export const RENDER_DEPTH = {
  baseMap: 0,
  actorBase: 1000,
  foregroundMap: 5000
} as const;

// 액터는 발이 닿는 y값을 기준으로 아래쪽에 있을수록 앞에 렌더한다.
export function getActorDepth(worldY: number) {
  return RENDER_DEPTH.actorBase + Math.round(worldY);
}
