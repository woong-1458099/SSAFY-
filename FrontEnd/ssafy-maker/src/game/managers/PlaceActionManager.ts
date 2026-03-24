import Phaser from "phaser";
import type { PlaceId } from "../../common/enums/area";
import { SCENE_KEYS } from "../../common/enums/scene";
import { createHomeActionModal } from "../../features/home/homeActionModal";
import { resolveHomeAction, type HomeActionId } from "../../features/home/homeActions";
import {
  InventoryService,
  type InventoryItemTemplate
} from "../../features/inventory/InventoryService";
import { LOTTO_COMPLETED_EVENT, type LottoOutcome } from "../../features/minigame/lottoOutcome";
import { launchMinigame } from "../../features/minigame/MinigameGateway";
import {
  createPlaceBackgroundImage,
  ensurePlaceBackgroundTexture,
  getPlaceBackgroundTextureKey
} from "../../features/place/placeBackgrounds";
import { createPlaceActionModal } from "../../features/place/placeModal";
import { getPlacePopupContent, resolvePlaceEffect } from "../../features/place/placeActions";
import { createShopModal } from "../../features/shop/ShopModal";
import type { HudState, PlayerStatKey } from "../state/gameState";
import { UI_DEPTH } from "../systems/uiDepth";
import type { ConsumeActionPointResult } from "./ProgressionManager";

type PlaceActionManagerOptions = {
  scene: Phaser.Scene;
  getHudState: () => HudState;
  patchHudState: (next: Partial<HudState>) => void;
  applyStatDelta: (delta: Partial<Record<PlayerStatKey, number>>, multiplier?: 1 | -1) => void;
  inventoryService: InventoryService;
  getTimeCycleIndex: () => number;
  getActionPoint: () => number;
  getMaxActionPoint: () => number;
  tryConsumeActionPoint: () => ConsumeActionPointResult;
  onHomeTimeAdvanced?: () => void;
};

const FONT_FAMILY =
  "\"PFStardustBold\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";

export class PlaceActionManager {
  private readonly scene: Phaser.Scene;
  private readonly getHudState: () => HudState;
  private readonly patchHudState: (next: Partial<HudState>) => void;
  private readonly applyStatDelta: (delta: Partial<Record<PlayerStatKey, number>>, multiplier?: 1 | -1) => void;
  private readonly inventoryService: InventoryService;
  private readonly getTimeCycleIndex: () => number;
  private readonly getActionPoint: () => number;
  private readonly getMaxActionPoint: () => number;
  private readonly tryConsumeActionPoint: () => ConsumeActionPointResult;
  private readonly onHomeTimeAdvanced?: () => void;
  private popupRoot?: Phaser.GameObjects.Container;
  private popupRequestId = 0;

  constructor(options: PlaceActionManagerOptions) {
    this.scene = options.scene;
    this.getHudState = options.getHudState;
    this.patchHudState = options.patchHudState;
    this.applyStatDelta = options.applyStatDelta;
    this.inventoryService = options.inventoryService;
    this.getTimeCycleIndex = options.getTimeCycleIndex;
    this.getActionPoint = options.getActionPoint;
    this.getMaxActionPoint = options.getMaxActionPoint;
    this.tryConsumeActionPoint = options.tryConsumeActionPoint;
    this.onHomeTimeAdvanced = options.onHomeTimeAdvanced;
    this.scene.game.events.on(LOTTO_COMPLETED_EVENT, this.handleLottoCompleted, this);
  }

  destroy(): void {
    this.scene.game.events.off(LOTTO_COMPLETED_EVENT, this.handleLottoCompleted, this);
    this.close();
  }

  isOpen(): boolean {
    return Boolean(this.popupRoot?.visible);
  }

  close(): void {
    this.popupRequestId += 1;
    this.popupRoot?.destroy(true);
    this.popupRoot = undefined;
  }

  openShop(): void {
    this.openShopModal();
  }

  open(placeId: PlaceId): boolean {
    if (placeId === "campus" || placeId === "downtown") {
      return false;
    }

    if (placeId === "home") {
      this.openHomeModal();
      return true;
    }

    if (placeId === "store") {
      this.openStoreEntryModal();
      return true;
    }

    const content = getPlacePopupContent(placeId);
    if (!content) {
      return false;
    }

    const unavailable = this.getUnavailableMessage(placeId);
    if (unavailable) {
      this.openInfoModal(unavailable.title, unavailable.description, placeId);
      return true;
    }

    this.mountWithPlaceBackground(placeId, (backgroundImage) =>
      createPlaceActionModal(this.scene, {
        title: content.title,
        description: content.description,
        actionText: content.actionText,
        backgroundImage,
        createButton: (params) => this.createActionButton(params),
        onAction: () => this.usePlace(placeId),
        onClose: () => this.close()
      })
    );
    return true;
  }

  private mount(root: Phaser.GameObjects.Container): void {
    this.popupRoot?.destroy(true);
    this.popupRoot = root.setDepth(UI_DEPTH.placeModal);
  }

  private openHomeModal(): void {
    this.mountWithPlaceBackground("home", (backgroundImage) =>
      createHomeActionModal(this.scene, {
        actionPoint: this.getActionPoint(),
        maxActionPoint: this.getMaxActionPoint(),
        backgroundImage,
        createButton: (params) => this.createActionButton(params),
        onAction: (action) => this.useHomeAction(action),
        onClose: () => this.close()
      })
    );
  }

  private openStoreEntryModal(): void {
    this.mountWithPlaceBackground("store", (backgroundImage) =>
      createPlaceActionModal(this.scene, {
        title: "편의점",
        description: "간단한 회복 아이템과 장비를 구매할 수 있습니다.",
        actionText: "상점 열기",
        backgroundImage,
        createButton: (params) => this.createActionButton(params),
        onAction: () => this.openShopModal(),
        onClose: () => this.close()
      })
    );
  }

  private openShopModal(): void {
    this.mountWithPlaceBackground("store", (backgroundImage) =>
      createShopModal(this.scene, {
        items: this.inventoryService.getShopCatalog(),
        money: this.getHudState().money,
        backgroundImage,
        createButton: (params) => this.createActionButton(params),
        onBuy: (templateId) => this.buyShopItem(templateId),
        onClose: () => this.close()
      })
    );
  }

  private buyShopItem(templateId: string): void {
    const result = this.inventoryService.purchaseItem(templateId, this.getHudState());
    if (result.hudPatch) {
      this.patchHudState(result.hudPatch);
    }

    if (!result.hudPatch) {
      this.openInfoModal("구매 실패", result.toastMessage, "store");
      return;
    }

    this.openShopModal();
  }

  private useHomeAction(action: HomeActionId): void {
    const consumeResult = this.tryConsumeActionPoint();
    if (!consumeResult.ok) {
      this.openConsumeFailureModal(consumeResult, "home");
      return;
    }

    const hudState = this.getHudState();
    const result = resolveHomeAction(action);
    this.applyStatDelta(result.statDelta);
    this.patchHudState({
      hp: Phaser.Math.Clamp(hudState.hp + result.hpDelta, 0, hudState.hpMax),
      stress: Phaser.Math.Clamp(hudState.stress + result.stressDelta, 0, 100)
    });
    this.close();
    this.onHomeTimeAdvanced?.();
  }

  private usePlace(placeId: Exclude<PlaceId, "campus" | "downtown" | "home" | "store">): void {
    const unavailable = this.getUnavailableMessage(placeId);
    if (unavailable) {
      this.openInfoModal(unavailable.title, unavailable.description, placeId);
      return;
    }

    const hudState = this.getHudState();
    const result = resolvePlaceEffect(placeId);
    if (hudState.money < result.cost) {
      this.openInfoModal("돈 부족", "돈이 부족해서 이용할 수 없습니다.", placeId);
      return;
    }

    const consumeResult = this.tryConsumeActionPoint();
    if (!consumeResult.ok) {
      this.openConsumeFailureModal(consumeResult, placeId);
      return;
    }

    const hpMax = Math.max(1, Math.round(hudState.hpMax + (result.hpMaxDelta ?? 0)));
    this.patchHudState({
      hpMax,
      hp: Phaser.Math.Clamp(hudState.hp + (result.hpDelta ?? 0), 0, hpMax),
      stress: Phaser.Math.Clamp(hudState.stress + (result.stressDelta ?? 0), 0, 100),
      money: hudState.money - result.cost + (result.moneyDelta ?? 0)
    });
    if (result.statDelta) {
      this.applyStatDelta(result.statDelta);
    }

    this.close();

    if (result.minigameSceneKey) {
      launchMinigame(this.scene, result.minigameSceneKey, SCENE_KEYS.main);
    }
  }

  private openInfoModal(title: string, description: string, backgroundPlaceId?: PlaceId): void {
    if (!backgroundPlaceId) {
      this.mount(
        createPlaceActionModal(this.scene, {
          title,
          description,
          actionText: "확인",
          showCloseButton: false,
          createButton: (params) => this.createActionButton(params),
          onAction: () => this.close(),
          onClose: () => this.close()
        })
      );
      return;
    }

    this.mountWithPlaceBackground(backgroundPlaceId, (backgroundImage) =>
      createPlaceActionModal(this.scene, {
        title,
        description,
        actionText: "확인",
        showCloseButton: false,
        backgroundImage,
        createButton: (params) => this.createActionButton(params),
        onAction: () => this.close(),
        onClose: () => this.close()
      })
    );
  }

  private openConsumeFailureModal(result: Exclude<ConsumeActionPointResult, { ok: true }>, placeId: PlaceId): void {
    switch (result.reason) {
      case "blocked-time-advance":
        this.openInfoModal(
          "이벤트 진행 필요",
          result.message ?? "현재 시간대의 고정 이벤트를 먼저 진행해야 합니다.",
          placeId
        );
        return;
      case "busy":
        this.openInfoModal("지금은 진행할 수 없음", "다른 진행 중인 화면을 먼저 닫아 주세요.", placeId);
        return;
      case "no-action-point":
      default:
        this.openInfoModal("행동력 부족", "행동력이 부족해서 지금은 시간을 진행할 수 없습니다.", placeId);
    }
  }

  private getUnavailableMessage(placeId: PlaceId): { title: string; description: string } | null {
    const timeCycleIndex = this.getTimeCycleIndex();
    const isNight = timeCycleIndex === 3;
    const isEveningOrNight = timeCycleIndex >= 2;

    if (placeId === "cafe" && isNight) {
      return {
        title: "영업 종료",
        description: "지금은 이용할 수 없습니다.\n밤에는 카페를 이용할 수 없습니다."
      };
    }

    if ((placeId === "gym" || placeId === "ramen" || placeId === "lotto") && isNight) {
      return {
        title: "영업 종료",
        description: "지금은 이용할 수 없습니다.\n밤에는 해당 장소를 이용할 수 없습니다."
      };
    }

    if (placeId === "beer" && !isEveningOrNight) {
      return {
        title: "오픈 전",
        description: "호프는 저녁과 밤에만 이용할 수 있습니다."
      };
    }

    return null;
  }

  private handleLottoCompleted(outcome: LottoOutcome): void {
    if (outcome.rewardMoney <= 0) {
      return;
    }

    const hudState = this.getHudState();
    this.patchHudState({ money: hudState.money + outcome.rewardMoney });
  }

  private createBackgroundForPlace(placeId: PlaceId): Phaser.GameObjects.Image | null {
    return createPlaceBackgroundImage(this.scene, getPlaceBackgroundTextureKey(placeId));
  }

  private mountWithPlaceBackground(
    placeId: PlaceId,
    buildRoot: (backgroundImage: Phaser.GameObjects.Image | null) => Phaser.GameObjects.Container
  ): void {
    this.popupRequestId += 1;
    const requestId = this.popupRequestId;
    ensurePlaceBackgroundTexture(this.scene, placeId, () => {
      if (requestId !== this.popupRequestId || !this.scene.scene.isActive()) {
        return;
      }
      const backgroundImage = this.createBackgroundForPlace(placeId);
      if (requestId !== this.popupRequestId) {
        backgroundImage?.destroy();
        return;
      }
      this.mount(buildRoot(backgroundImage));
    });
  }

  private createActionButton(params: {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    onClick: () => void;
  }): Phaser.GameObjects.Container {
    const bg = this.scene.add.rectangle(0, 0, params.width, params.height, 0x29527d, 1).setScrollFactor(0);
    bg.setStrokeStyle(2, 0x8ed2ff, 1);
    const label = this.scene.add.text(0, -1, params.text, {
      fontFamily: FONT_FAMILY,
      fontSize: "18px",
      fontStyle: "bold",
      color: "#eef7ff",
      resolution: 2,
      align: "center",
      wordWrap: { width: params.width - 18 }
    }).setOrigin(0.5).setScrollFactor(0);
    const container = this.scene.add.container(params.x, params.y, [bg, label]).setScrollFactor(0);
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", params.onClick);
    bg.on("pointerover", () => bg.setFillStyle(0x34679d, 1));
    bg.on("pointerout", () => bg.setFillStyle(0x29527d, 1));
    return container;
  }
}
