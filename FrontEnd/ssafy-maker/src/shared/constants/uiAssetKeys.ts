/**
 * UI 관련 에셋(이미지, 아이콘 등)의 기본 키값을 관리합니다.
 * 아직 에셋이 없더라도 임시 도형 등을 대체할 때 키를 예약해둡니다.
 */
export const UI_ASSET_KEYS = {
  DIALOG_BOX: 'ui_dialog_box',         // 대화창 배경
  CHOICE_BUTTON: 'ui_choice_button',   // 선택지 버튼 배경
  NAME_TAG: 'ui_name_tag',             // 이름표 배경
  NEXT_ICON: 'ui_next_icon',           // 다음 대사로 넘어가는 아이콘
} as const;
