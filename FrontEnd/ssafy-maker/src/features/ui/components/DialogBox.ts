import Phaser from 'phaser';
import { DialogData } from '../types/dialog';
import { UI_ASSET_KEYS } from '../../../shared/constants/uiAssetKeys';

export class DialogBox extends Phaser.GameObjects.Container {
  private bgRectangle: Phaser.GameObjects.Rectangle;
  private nameText: Phaser.GameObjects.Text;
  private dialogText: Phaser.GameObjects.Text;
  private portraitPlaceholder: Phaser.GameObjects.Rectangle;
  private nextIconPlaceholder: Phaser.GameObjects.Triangle;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y);

    // 1. 대화창 배경 (나중에 UI_ASSET_KEYS.DIALOG_BOX 이미지로 교체 예정)
    this.bgRectangle = scene.add.rectangle(0, 0, width, height, 0x111111, 0.85);
    this.bgRectangle.setStrokeStyle(2, 0xdddddd, 1);
    this.bgRectangle.setOrigin(0.5);

    // 2. 초상화 임시 영역 (나중에 이미지 에셋 적용)
    this.portraitPlaceholder = scene.add.rectangle(-width / 2 + 80, 0, 100, 100, 0x444444);

    // 3. 이름표 텍스트
    this.nameText = scene.add.text(-width / 2 + 150, -height / 2 + 20, '', {
      fontSize: '24px',
      color: '#ffd700',
      fontStyle: 'bold'
    });

    // 4. 대사 텍스트
    this.dialogText = scene.add.text(-width / 2 + 150, -height / 2 + 60, '', {
      fontSize: '20px',
      color: '#ffffff',
      wordWrap: { width: width - 180, useAdvancedWrap: true }
    });

    // 5. 다음 대사로 넘어가기 아이콘 임시 도형 (역삼각형)
    this.nextIconPlaceholder = scene.add.triangle(
      width / 2 - 30, height / 2 - 30,
      0, 0, 16, 0, 8, 12,
      0xffffff
    );
    // 기본적으로 깜빡이게 하는 등 애니메이션을 줄 수 있으나 임시로 고정

    this.add([
      this.bgRectangle, 
      this.portraitPlaceholder, 
      this.nameText, 
      this.dialogText,
      this.nextIconPlaceholder
    ]);
    
    // 화면에 처음에 안보이게 설정
    this.setVisible(false);

    // 씬에 Container 추가
    scene.add.existing(this);
  }

  /**
   * 대화 데이터를 받아 화면에 출력합니다.
   */
  public showDialog(data: DialogData) {
    this.setVisible(true);
    this.nameText.setText(data.speakerName);
    this.dialogText.setText(data.text);
    
    // TODO: data.portraitKey가 있으면 this.portraitPlaceholder를 해당 이미지로 교체하는 로직 추가
    
    // 상호작용 등록
    this.bgRectangle.setInteractive({ useHandCursor: true });
    this.bgRectangle.once('pointerdown', () => {
      if (data.action) {
        data.action();
      }
    });
  }

  /**
   * 대화창을 숨깁니다.
   */
  public hideDialog() {
    this.setVisible(false);
    this.bgRectangle.disableInteractive();
  }
}
