import type Phaser from "phaser";
import type { Facing } from "../../common/enums/facing";
import type { NpcVisualAssetDefinition } from "../definitions/assets/npcAssetCatalog";

// NPC idle과 walk 스프라이트시트 로드 책임을 시스템 레이어로 분리한다.
export function preloadNpcVisualAsset(
  scene: Phaser.Scene,
  npcAsset: NpcVisualAssetDefinition
) {
  scene.load.spritesheet(npcAsset.idleTextureKey, npcAsset.idleImagePath, {
    frameWidth: npcAsset.frameWidth,
    frameHeight: npcAsset.frameHeight
  });
  scene.load.spritesheet(npcAsset.walkTextureKey, npcAsset.walkSpritesheetPath, {
    frameWidth: npcAsset.frameWidth,
    frameHeight: npcAsset.frameHeight
  });
}

// NPC 애니메이션 등록 책임을 시스템 레이어로 분리한다.
export function registerNpcAnimations(
  scene: Phaser.Scene,
  npcAssetList: NpcVisualAssetDefinition[]
) {
  for (const npcAsset of npcAssetList) {
    if (!scene.anims.exists(npcAsset.idleAnimationKey)) {
      scene.anims.create({
        key: npcAsset.idleAnimationKey,
        frames: scene.anims.generateFrameNumbers(npcAsset.idleTextureKey, {
          start: npcAsset.idleFrameRange.start,
          end: npcAsset.idleFrameRange.end
        }),
        frameRate: npcAsset.idleFrameRate,
        repeat: -1
      });
    }

    for (const facing of Object.keys(npcAsset.walkFrameRanges) as Facing[]) {
      const walkAnimationKey = getNpcWalkAnimationKey(npcAsset, facing);
      if (scene.anims.exists(walkAnimationKey)) {
        continue;
      }

      const frameRange = npcAsset.walkFrameRanges[facing];
      scene.anims.create({
        key: walkAnimationKey,
        frames: scene.anims.generateFrameNumbers(npcAsset.walkTextureKey, {
          start: frameRange.start,
          end: frameRange.end
        }),
        frameRate: npcAsset.walkFrameRate,
        repeat: -1
      });
    }
  }
}

// idle 애니메이션 키 조합은 시스템 레이어에서 고정한다.
export function getNpcIdleAnimationKey(npcAsset: NpcVisualAssetDefinition) {
  return npcAsset.idleAnimationKey;
}

// walk 애니메이션 키 조합도 시스템 레이어에서 고정한다.
export function getNpcWalkAnimationKey(
  npcAsset: NpcVisualAssetDefinition,
  facing: Facing
) {
  return `${npcAsset.walkTextureKey}-${facing}`;
}

// idle 상태는 정지 프레임이 아니라 숨쉬기 애니메이션을 재생한다.
export function playNpcIdle(
  sprite: Phaser.GameObjects.Sprite,
  npcAsset: NpcVisualAssetDefinition
) {
  sprite.play(getNpcIdleAnimationKey(npcAsset), true);
}

// walk 상태는 방향별 프레임 범위를 선택해서 재생한다.
export function playNpcWalk(
  sprite: Phaser.GameObjects.Sprite,
  npcAsset: NpcVisualAssetDefinition,
  facing: Facing
) {
  sprite.play(getNpcWalkAnimationKey(npcAsset, facing), true);
}
