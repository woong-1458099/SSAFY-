/**
 * UI 대화창 컴포넌트에서 연동하기 위해 필요한 데이터 인터페이스입니다.
 * 실제 대본(StoryNode) 데이터 구조와 맵핑하여 사용할 수 있습니다.
 */
export interface DialogData {
  id: string;
  speakerName: string;
  text: string;
  portraitKey?: string; // 캐릭터 초상화 에셋 키 (옵션)
  action?: () => void;  // 선택지 클릭 또는 대사 완료 시 실행될 콜백 (옵션)
}

export interface ChoiceData {
  id: string;
  text: string;
  nextNodeId?: string;
  action?: () => void;
}

/**
 * UI 뼈대 테스트를 위한 더미(Dummy) 데이터 세트
 */
export const DUMMY_DIALOGS: DialogData[] = [
  {
    id: 'dummy_01',
    speakerName: 'SSAFY',
    text: '이곳은 대사가 출력되는 영역입니다. 뼈대를 잡기 위한 더미 텍스트입니다.',
    portraitKey: 'temp_portrait_player'
  },
  {
    id: 'dummy_02',
    speakerName: '시스템',
    text: '대화창 컴포넌트가 정상적으로 분리되어 작동하는지 테스트합니다.',
    portraitKey: 'temp_portrait_system'
  }
];

export const DUMMY_CHOICES: ChoiceData[] = [
  { id: 'choice_1', text: '네, 확인했습니다.' },
  { id: 'choice_2', text: '다시 한 번 알려주세요.' }
];
