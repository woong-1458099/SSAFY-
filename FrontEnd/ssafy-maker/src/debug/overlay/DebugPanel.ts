import Phaser from "phaser";
import type { DebugPanelState } from "../types/debugTypes";
import type { DebugCommandBus } from "../services/DebugCommandBus";
import { UI_DEPTH } from "../../game/systems/uiDepth";

type PanelPage = "stats" | "story" | "ending";

type ButtonPreset = {
  label: string;
  row: number;
  col: number;
  width?: number;
  height?: number;
  yOffset?: number;
  dock?: "bottom-right";
  onClick: () => void;
};

type ButtonEntry = {
  preset: ButtonPreset;
  shadow: Phaser.GameObjects.Rectangle;
  rect: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
  baseShadowY: number;
  baseRectY: number;
  baseTextY: number;
};

type TabEntry = {
  page: PanelPage;
  shadow: Phaser.GameObjects.Rectangle;
  rect: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
};

type CardEntry = {
  background: Phaser.GameObjects.Rectangle;
  title: Phaser.GameObjects.Text;
  body: Phaser.GameObjects.Text;
  mask: Phaser.Display.Masks.GeometryMask;
  maskShape: Phaser.GameObjects.Rectangle;
  hover: boolean;
  scrollOffset: number;
  maxScroll: number;
  baseBodyY: number;
  viewportHeight: number;
  contentHeight: number;
  attachedButtons: ButtonEntry[];
};

type RectLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type PanelLayout = {
  centerX: number;
  centerY: number;
  panelWidth: number;
  panelHeight: number;
  panelLeft: number;
  panelTop: number;
  titleX: number;
  titleY: number;
  tabStartX: number;
  tabY: number;
  tabGapX: number;
  footerX: number;
  footerY: number;
  footerCloseX: number;
  footerCloseY: number;
  statsState: RectLayout;
  statsHelp: RectLayout;
  statsButtons: RectLayout;
  storySummary: RectLayout;
  storyList: RectLayout;
  storyDetail: RectLayout;
  storyChoices: RectLayout;
  storyControl: RectLayout;
};

const BASE_PANEL_WIDTH = 1280;
const BASE_PANEL_HEIGHT = 720;
const BUTTON_BASE_WIDTH = 136;
const BUTTON_BASE_HEIGHT = 42;
const TAB_WIDTH = 136;
const TAB_HEIGHT = 38;
const PANEL_PADDING = 24;
const PANEL_HEADER_HEIGHT = 78;
const PANEL_FOOTER_HEIGHT = 44;
const PANEL_INNER_GAP = 18;
const CARD_PADDING_X = 18;
const CARD_PADDING_Y = 16;
const CARD_BODY_TOP_OFFSET = 42;
const CARD_BOTTOM_PADDING = 16;
const SCROLL_STEP = 34;

function createUiText(
  scene: Phaser.Scene,
  text: string,
  style?: Phaser.Types.GameObjects.Text.TextStyle
): Phaser.GameObjects.Text {
  return scene.add.text(0, 0, text, {
    fontFamily: "Pretendard, Malgun Gothic, sans-serif",
    color: "#f4fbff",
    resolution: 2,
    ...style
  });
}

function trimText(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function createCard(scene: Phaser.Scene, title: string): CardEntry {
  const background = scene.add.rectangle(0, 0, 1, 1, 0x13212d, 0.94);
  background.setStrokeStyle(2, 0x2e6e8f, 0.95);

  const titleText = createUiText(scene, title, {
    fontSize: "15px",
    fontStyle: "bold",
    color: "#8fe7ff"
  });

  const body = createUiText(scene, "", {
    fontSize: "13px",
    lineSpacing: 5,
    wordWrap: { width: 100 }
  });

  const maskShape = scene.add.rectangle(0, 0, 1, 1, 0xffffff, 1);
  maskShape.setVisible(false);
  const mask = maskShape.createGeometryMask();
  body.setMask(mask);

  const card: CardEntry = {
    background,
    title: titleText,
    body,
    mask,
    maskShape,
    hover: false,
    scrollOffset: 0,
    maxScroll: 0,
    baseBodyY: 0,
    viewportHeight: 0,
    contentHeight: 0,
    attachedButtons: []
  };

  background.setInteractive({ useHandCursor: false });
  background.on("pointerover", () => {
    card.hover = true;
  });
  background.on("pointerout", () => {
    card.hover = false;
  });

  return card;
}

export class DebugPanel {
  private readonly root: Phaser.GameObjects.Container;
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly footer: Phaser.GameObjects.Text;
  private readonly footerCloseShadow: Phaser.GameObjects.Rectangle;
  private readonly footerCloseRect: Phaser.GameObjects.Rectangle;
  private readonly footerCloseText: Phaser.GameObjects.Text;
  private readonly tabEntries: TabEntry[];
  private readonly statsButtonEntries: ButtonEntry[];
  private readonly storyButtonEntries: ButtonEntry[];
  private readonly endingButtonEntries: ButtonEntry[];
  private readonly statsStateCard: CardEntry;
  private readonly statsHelpCard: CardEntry;
  private readonly statsButtonsCard: CardEntry;
  private readonly storySummaryCard: CardEntry;
  private readonly storyListCard: CardEntry;
  private readonly storyDetailCard: CardEntry;
  private readonly storyChoicesCard: CardEntry;
  private readonly storyControlCard: CardEntry;
  private readonly endingPreviewCard: CardEntry;
  private readonly endingDetailCard: CardEntry;
  private readonly endingButtonsCard: CardEntry;
  private readonly allCards: CardEntry[];
  private readonly handleResize: () => void;
  private readonly handleWheel: (
    pointer: Phaser.Input.Pointer,
    currentlyOver: Phaser.GameObjects.GameObject[],
    deltaX: number,
    deltaY: number
  ) => void;
  private latestState?: DebugPanelState;
  private lastStateString?: string;
  private visible = false;
  private page: PanelPage = "stats";
  private storySelectedWeek = 1;
  private readonly storySelectedEventIndexByWeek: Partial<Record<number, number>> = {};

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly commandBus: DebugCommandBus
  ) {
    this.overlay = scene.add.rectangle(0, 0, 0, 0, 0x02060d, 0.72);
    this.panel = scene.add.rectangle(0, 0, 0, 0, 0x101820, 0.97);
    this.panel.setStrokeStyle(3, 0x6ce7ff, 1);

    this.title = createUiText(scene, "F3 DEBUG PANEL", {
      fontSize: "25px",
      fontStyle: "bold",
      color: "#6ce7ff"
    });

    this.footer = createUiText(scene, "", {
      fontSize: "12px",
      color: "#8db8c4"
    });
    this.footerCloseShadow = scene.add.rectangle(0, 0, 1, 1, 0x000000, 0.55);
    this.footerCloseRect = scene.add.rectangle(0, 0, 112, 32, 0x17303b, 1);
    this.footerCloseRect.setStrokeStyle(2, 0x6ce7ff, 1);
    this.footerCloseRect.setInteractive({ useHandCursor: true });
    this.footerCloseRect.on("pointerover", () => this.footerCloseRect.setFillStyle(0x204554));
    this.footerCloseRect.on("pointerout", () => this.footerCloseRect.setFillStyle(0x17303b));
    this.footerCloseRect.on("pointerdown", () => this.hide());
    this.footerCloseText = createUiText(scene, "닫기", {
      fontSize: "13px",
      fontStyle: "bold",
      align: "center"
    }).setOrigin(0.5);

    this.tabEntries = this.createTabEntries();
    this.statsButtonEntries = this.createButtonEntries(this.getStatsButtonPresets());
    this.storyButtonEntries = this.createButtonEntries(this.getStoryButtonPresets());
    this.endingButtonEntries = this.createButtonEntries(this.getEndingButtonPresets());
    this.statsStateCard = createCard(scene, "현재 상태");
    this.statsHelpCard = createCard(scene, "조작");
    this.statsButtonsCard = createCard(scene, "버튼");
    this.storySummaryCard = createCard(scene, "선택 상태");
    this.storyListCard = createCard(scene, "이벤트 목록");
    this.storyDetailCard = createCard(scene, "이벤트 설명 / 조건");
    this.storyChoicesCard = createCard(scene, "선택지 요약");
    this.storyControlCard = createCard(scene, "조작");
    this.endingPreviewCard = createCard(scene, "현재 엔딩 후보");
    this.endingDetailCard = createCard(scene, "엔딩 정보");
    this.endingButtonsCard = createCard(scene, "엔딩 실행");
    this.allCards = [
      this.statsStateCard,
      this.statsHelpCard,
      this.statsButtonsCard,
      this.storySummaryCard,
      this.storyListCard,
      this.storyDetailCard,
      this.storyChoicesCard,
      this.storyControlCard,
      this.endingPreviewCard,
      this.endingDetailCard,
      this.endingButtonsCard
    ];

    this.root = scene.add.container(0, 0, [
      this.overlay,
      this.panel,
      this.title,
      ...this.tabEntries.flatMap((entry) => [entry.shadow, entry.rect, entry.text]),
      ...this.allCards.flatMap((card) => [card.background, card.title, card.body, card.maskShape]),
      ...this.statsButtonEntries.flatMap((entry) => [entry.shadow, entry.rect, entry.text]),
      ...this.storyButtonEntries.flatMap((entry) => [entry.shadow, entry.rect, entry.text]),
      ...this.endingButtonEntries.flatMap((entry) => [entry.shadow, entry.rect, entry.text]),
      this.footer,
      this.footerCloseShadow,
      this.footerCloseRect,
      this.footerCloseText
    ]);
    this.root.setDepth(UI_DEPTH.debugPanel);
    this.root.setScrollFactor(0);
    this.root.setVisible(false);

    this.handleResize = () => this.layout();
    this.handleWheel = (_pointer, _currentlyOver, _deltaX, deltaY) => {
      if (!this.visible) {
        return;
      }

      const targetCard = this.getScrollableCardAt(this.scene.input.activePointer);
      if (!targetCard) {
        return;
      }

      const nextOffset = Phaser.Math.Clamp(targetCard.scrollOffset + Math.sign(deltaY) * SCROLL_STEP, 0, targetCard.maxScroll);
      if (nextOffset === targetCard.scrollOffset) {
        return;
      }

      targetCard.scrollOffset = nextOffset;
      this.refreshCardScroll(targetCard);
    };

    this.scene.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize);
    this.scene.input.on(Phaser.Input.Events.POINTER_WHEEL, this.handleWheel);
    this.layout();
    this.updatePageVisibility();
  }

  render(state: DebugPanelState, options?: { force?: boolean }): void {
    if (!this.visible) {
      this.latestState = state;
      return;
    }

    // 간단한 값 위주로 변경 전후를 비교하여 불필요한 JSON 직렬화와 리렌더링을 최소화합니다.
    const isStatiallyEqual = 
      this.latestState &&
      this.latestState.currentSceneId === state.currentSceneId &&
      this.latestState.currentAreaId === state.currentAreaId &&
      this.latestState.hud.hp === state.hud.hp &&
      this.latestState.hud.money === state.hud.money &&
      this.latestState.hud.week === state.hud.week &&
      this.latestState.hud.timeLabel === state.hud.timeLabel &&
      this.latestState.fixedEventId === state.fixedEventId &&
      this.latestState.stats.fe === state.stats.fe &&
      this.latestState.stats.be === state.stats.be;

    if (!options?.force && isStatiallyEqual) {
      // 얕은 비교에서 같다고 판단되면 전체를 직렬화하여 한 번 더 확인합니다. (정밀 검사)
      const stateString = JSON.stringify(state);
      if (stateString === this.lastStateString) {
        return;
      }
      this.lastStateString = stateString;
    } else {
      this.lastStateString = JSON.stringify(state);
    }

    this.latestState = state;
    if (this.storySelectedWeek < 1) {
      this.storySelectedWeek = state.storyDebug.currentWeek;
    }

    this.renderStatsState(state);
    this.renderStoryState(state);
    this.renderEndingState(state);
    this.layout();

    this.footer.setText(
      this.page === "stats"
        ? "F3 패널 토글 | 상단 탭에서 스토리 디버그 페이지로 전환"
        : this.page === "story"
          ? "스토리 디버그 | 카드 안에서 마우스 휠로 스크롤 가능"
          : "엔딩 디버그 | 현재 스탯 기준 또는 프리셋으로 바로 엔딩 확인"
    );
  }

  toggle(): void {
    this.setVisible(!this.visible);
  }

  hide(): void {
    this.setVisible(false);
  }

  isVisible(): boolean {
    return this.visible;
  }

  destroy(): void {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize);
    this.scene.input.off(Phaser.Input.Events.POINTER_WHEEL, this.handleWheel);
    this.root.destroy(true);
  }

  private setVisible(visible: boolean): void {
    this.visible = visible;
    this.root.setVisible(visible);
    if (visible && this.latestState) {
      this.render(this.latestState);
    }
  }

  private setPage(page: PanelPage): void {
    this.page = page;
    if (page === "story" && this.latestState) {
      this.storySelectedWeek = this.latestState.storyDebug.currentWeek;
    }
    this.updatePageVisibility();
    if (this.visible && this.latestState) {
      this.render(this.latestState, { force: true });
    }
  }

  private createTabEntries(): TabEntry[] {
    return ([
      { page: "stats", label: "기본 디버그" },
      { page: "story", label: "스토리 디버그" },
      { page: "ending", label: "엔딩 디버그" }
    ] as const).map(({ page, label }) => {
      const shadow = this.scene.add.rectangle(0, 0, 1, 1, 0x000000, 0.55);
      const rect = this.scene.add.rectangle(0, 0, TAB_WIDTH, TAB_HEIGHT, 0x17303b, 1);
      rect.setStrokeStyle(2, 0x6ce7ff, 1);
      rect.setInteractive({ useHandCursor: true });
      rect.on("pointerdown", () => this.setPage(page));

      const text = createUiText(this.scene, label, {
        fontSize: "13px",
        fontStyle: "bold",
        align: "center"
      }).setOrigin(0.5);

      return { page, shadow, rect, text };
    });
  }

  private createButtonEntries(presets: ButtonPreset[]): ButtonEntry[] {
    return presets.map((preset) => {
      const shadow = this.scene.add.rectangle(0, 0, 1, 1, 0x000000, 0.55);
      const rect = this.scene.add.rectangle(0, 0, 1, 1, 0x17303b, 1);
      rect.setStrokeStyle(2, 0x6ce7ff, 1);
      rect.setInteractive({ useHandCursor: true });
      rect.on("pointerover", () => rect.setFillStyle(0x204554));
      rect.on("pointerout", () => rect.setFillStyle(0x17303b));
      rect.on("pointerdown", preset.onClick);

      const text = createUiText(this.scene, preset.label, {
        fontSize: "13px",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: (preset.width ?? BUTTON_BASE_WIDTH) - 14 }
      }).setOrigin(0.5);

      return {
        preset,
        shadow,
        rect,
        text,
        baseShadowY: 0,
        baseRectY: 0,
        baseTextY: 0
      };
    });
  }

  private getStatsButtonPresets(): ButtonPreset[] {
    return [
      { label: "HP -10", row: 0, col: 0, onClick: () => this.commandBus.emit({ type: "adjustHudValue", key: "hp", delta: -10 }) },
      { label: "HP +10", row: 0, col: 1, onClick: () => this.commandBus.emit({ type: "adjustHudValue", key: "hp", delta: 10 }) },
      { label: "스트 -10", row: 1, col: 0, onClick: () => this.commandBus.emit({ type: "adjustHudValue", key: "stress", delta: -10 }) },
      { label: "스트 +10", row: 1, col: 1, onClick: () => this.commandBus.emit({ type: "adjustHudValue", key: "stress", delta: 10 }) },
      { label: "돈 -1만", row: 2, col: 0, onClick: () => this.commandBus.emit({ type: "adjustHudValue", key: "money", delta: -10000 }) },
      { label: "돈 +1만", row: 2, col: 1, onClick: () => this.commandBus.emit({ type: "adjustHudValue", key: "money", delta: 10000 }) },
      { label: "행동 -1", row: 3, col: 0, onClick: () => this.commandBus.emit({ type: "adjustActionPoint", delta: -1 }) },
      { label: "행동 FULL", row: 3, col: 1, onClick: () => this.commandBus.emit({ type: "refillActionPoint" }) },
      { label: "FE -5", row: 4, col: 0, onClick: () => this.commandBus.emit({ type: "adjustStatValue", key: "fe", delta: -5 }) },
      { label: "FE +5", row: 4, col: 1, onClick: () => this.commandBus.emit({ type: "adjustStatValue", key: "fe", delta: 5 }) },
      { label: "BE -5", row: 5, col: 0, onClick: () => this.commandBus.emit({ type: "adjustStatValue", key: "be", delta: -5 }) },
      { label: "BE +5", row: 5, col: 1, onClick: () => this.commandBus.emit({ type: "adjustStatValue", key: "be", delta: 5 }) },
      { label: "협업 -5", row: 6, col: 0, onClick: () => this.commandBus.emit({ type: "adjustStatValue", key: "teamwork", delta: -5 }) },
      { label: "협업 +5", row: 6, col: 1, onClick: () => this.commandBus.emit({ type: "adjustStatValue", key: "teamwork", delta: 5 }) },
      { label: "운 -5", row: 7, col: 0, onClick: () => this.commandBus.emit({ type: "adjustStatValue", key: "luck", delta: -5 }) },
      { label: "운 +5", row: 7, col: 1, onClick: () => this.commandBus.emit({ type: "adjustStatValue", key: "luck", delta: 5 }) },
      { label: "시간 +1", row: 8, col: 0, onClick: () => this.commandBus.emit({ type: "advanceTime" }) },
      { label: "주차 -1", row: 8, col: 1, onClick: () => this.commandBus.emit({ type: "adjustWeek", delta: -1 }) },
      { label: "주차 +1", row: 9, col: 0, onClick: () => this.commandBus.emit({ type: "adjustWeek", delta: 1 }) },
      { label: "이벤트 실행", row: 9, col: 1, onClick: () => this.commandBus.emit({ type: "triggerCurrentFixedEvent" }) },
      { label: "초코 지급", row: 10, col: 0, onClick: () => this.commandBus.emit({ type: "giveInventoryItem", templateId: "item-chocolate" }) },
      { label: "에너지 지급", row: 10, col: 1, onClick: () => this.commandBus.emit({ type: "giveInventoryItem", templateId: "item-energy-drink" }) },
      { label: "키보드 지급", row: 11, col: 0, onClick: () => this.commandBus.emit({ type: "giveInventoryItem", templateId: "kbd-gaming" }) },
      { label: "오토세이브", row: 11, col: 1, onClick: () => this.commandBus.emit({ type: "saveAuto" }) }
    ];
  }

  private getStoryButtonPresets(): ButtonPreset[] {
    return [
      { label: "이전 주차", row: 0, col: 0, onClick: () => this.shiftStoryWeek(-1) },
      { label: "다음 주차", row: 0, col: 1, onClick: () => this.shiftStoryWeek(1) },
      { label: "이전 이벤트", row: 1, col: 0, onClick: () => this.shiftStoryEvent(-1) },
      { label: "다음 이벤트", row: 1, col: 1, onClick: () => this.shiftStoryEvent(1) },
      { label: "조건 점프", row: 2, col: 0, width: 136, onClick: () => this.emitSelectedEventCommand("jumpToFixedEvent", false) },
      { label: "초기화 점프", row: 2, col: 1, width: 136, onClick: () => this.emitSelectedEventCommand("jumpToFixedEvent", true) },
      { label: "즉시 실행", row: 3, col: 0, width: 136, onClick: () => this.emitSelectedEventCommand("runFixedEvent", false) },
      { label: "초기화 실행", row: 3, col: 1, width: 136, onClick: () => this.emitSelectedEventCommand("runFixedEvent", true) },
      { label: "선택 초기화", row: 4, col: 0, width: 136, onClick: () => this.resetSelectedEventCompletion() },
      { label: "주차 초기화", row: 4, col: 1, width: 136, onClick: () => this.resetSelectedWeekCompletions() }
    ];
  }

  private getEndingButtonPresets(): ButtonPreset[] {
    return [
      { label: "현재 스탯 엔딩", row: 0, col: 0, width: 130, onClick: () => this.commandBus.emit({ type: "startEndingFlow" }) },
      { label: "FE 엔딩", row: 0, col: 1, onClick: () => this.commandBus.emit({ type: "startEndingFlowPreset", endingId: "frontend-developer" }) },
      { label: "BE 엔딩", row: 0, col: 2, onClick: () => this.commandBus.emit({ type: "startEndingFlowPreset", endingId: "backend-developer" }) },
      { label: "협업 엔딩", row: 1, col: 0, onClick: () => this.commandBus.emit({ type: "startEndingFlowPreset", endingId: "team-player" }) },
      { label: "체력 엔딩", row: 1, col: 1, onClick: () => this.commandBus.emit({ type: "startEndingFlowPreset", endingId: "stamina-survivor" }) },
      { label: "운 엔딩", row: 1, col: 2, onClick: () => this.commandBus.emit({ type: "startEndingFlowPreset", endingId: "lucky-break" }) },
      { label: "프론트 리더", row: 2, col: 0, width: 130, onClick: () => this.commandBus.emit({ type: "startEndingFlowPreset", endingId: "frontend-leader" }) }
    ];
  }

  private renderStatsState(state: DebugPanelState): void {
    this.setCardText(this.statsStateCard, [
      `씬: ${state.currentSceneId || "-"}`,
      `지역: ${state.currentAreaId ?? "-"} / ${state.currentLocationLabel}`,
      `시간: ${state.hud.week}주차 ${state.hud.dayLabel} ${state.hud.timeLabel}`,
      `행동력: ${state.hud.actionPoint}/${state.hud.maxActionPoint}`,
      `HP: ${state.hud.hp}/${state.hud.hpMax}`,
      `돈: ${state.hud.money.toLocaleString("ko-KR")} G`,
      `스트레스: ${state.hud.stress}`,
      `FE: ${state.stats.fe}`,
      `BE: ${state.stats.be}`,
      `협업: ${state.stats.teamwork}`,
      `운: ${state.stats.luck}`,
      `인벤토리: ${state.inventoryUsageText}`,
      `현재 표시 이벤트: ${state.fixedEventId ?? "-"}`
    ]);

    this.setCardText(this.statsHelpCard, [
      "기본 디버그 안내",
      "",
      "- 현재 상태를 먼저 확인합니다.",
      "- 우측 버튼으로 수치와 시간을 조정합니다.",
      "- 주차 변경은 주급/이벤트 상태에 영향을 줄 수 있습니다.",
      "- 오토세이브로 현재 상태를 바로 저장할 수 있습니다."
    ]);

    this.setCardText(this.statsButtonsCard, [
      "버튼 그룹",
      "",
      "- HP / 스트레스 / 돈",
      "- FE / BE / 협업 / 운",
      "- 행동력 / 시간 / 주차",
      "- 고정 이벤트 실행",
      "- 아이템 지급 / 오토세이브"
    ]);
  }

  private renderStoryState(state: DebugPanelState): void {
    const weekState = this.getSelectedWeekState(state);
    if (!weekState) {
      this.setCardText(this.storySummaryCard, ["주차 데이터가 없습니다."]);
      this.setCardText(this.storyListCard, ["-"]);
      this.setCardText(this.storyDetailCard, ["-"]);
      this.setCardText(this.storyChoicesCard, ["-"]);
      this.setCardText(this.storyControlCard, ["-"]);
      return;
    }

    const selectedEvent = this.getSelectedEvent(state);
    const selectedEventIndex = weekState.events.findIndex((event) => event.eventId === selectedEvent?.eventId);

    this.setCardText(this.storySummaryCard, [
      `현재 주차: ${state.storyDebug.currentWeek}주차`,
      `선택 주차: ${weekState.week}주차${weekState.loaded ? "" : " (로딩 중)"}`,
      `선택 이벤트: ${selectedEventIndex >= 0 ? `${selectedEventIndex + 1}/${Math.max(weekState.events.length, 1)}` : "-"}`,
      "",
      `이름: ${selectedEvent?.eventName ?? "-"}`,
      `반복: ${selectedEvent ? (selectedEvent.isRepeatable ? "예" : "아니오") : "-"}`,
      `완료: ${selectedEvent ? (selectedEvent.isCompleted ? "예" : "아니오") : "-"}`
    ]);

    this.setCardText(
      this.storyListCard,
      weekState.loaded
        ? weekState.events.length > 0
          ? weekState.events.map((event, index) => {
              const prefix = selectedEvent?.eventId === event.eventId ? "> " : "  ";
              const suffix = event.isCompleted ? " [완료]" : "";
              return `${prefix}${index + 1}. ${trimText(event.eventName, 24)}${suffix}`;
            })
          : ["이 주차에 등록된 이벤트가 없습니다."]
        : ["이벤트 데이터를 불러오는 중입니다."]
    );

    this.setCardText(this.storyDetailCard, [
      `ID: ${selectedEvent?.eventId ?? "-"}`,
      `시점: ${selectedEvent ? `${selectedEvent.week}주차 ${selectedEvent.dayLabel} ${selectedEvent.timeOfDay}` : "-"}`,
      `장소: ${selectedEvent?.locationLabel ?? "-"}`,
      `지역: ${selectedEvent?.areaId ?? "-"}`,
      "",
      "설명",
      selectedEvent?.previewText ?? "이벤트를 선택하면 설명이 표시됩니다.",
      "",
      "필요 스탯 / 조건",
      ...(selectedEvent && selectedEvent.requirementLabels.length > 0
        ? selectedEvent.requirementLabels.map((label) => `- ${label}`)
        : ["- 별도 스탯 요구 조건 없음"])
    ]);

    const choiceLines =
      selectedEvent && selectedEvent.choiceSummaries.length > 0
        ? selectedEvent.choiceSummaries.flatMap((choice) => [
            `${choice.choiceId}. [${choice.actionType}] ${choice.text}`,
            `   요구: ${choice.requirementLabels.length > 0 ? choice.requirementLabels.join(", ") : "없음"}`,
            `   효과: ${choice.effectLabels.length > 0 ? choice.effectLabels.join(", ") : "표시 없음"}`,
            ...(choice.feedbackText ? [`   피드백: ${choice.feedbackText}`] : []),
            ""
          ])
        : ["선택지 정보가 없습니다."];
    this.setCardText(this.storyChoicesCard, choiceLines);

    this.setCardText(this.storyControlCard, [
      "스토리 디버그 조작",
      "",
      "- 1단계: 주차와 이벤트를 고릅니다.",
      "- 2단계: 점프로 조건만 맞추거나 실행으로 바로 재생합니다.",
      "- 초기화 버튼은 이미 본 이벤트를 다시 테스트할 때 사용합니다.",
      "- 페이지 이동은 상단 탭으로, 패널 닫기는 footer 버튼으로 처리합니다.",
      "- 내용이 길면 카드 위에서 마우스 휠로 스크롤합니다."
    ]);
  }

  private renderEndingState(state: DebugPanelState): void {
    this.setCardText(this.endingPreviewCard, [
      `엔딩 ID: ${state.endingDebug.endingId}`,
      `제목: ${state.endingDebug.title}`,
      "",
      state.endingDebug.shortDescription,
      "",
      `키워드: ${state.endingDebug.dominantLabels.join(" / ")}`,
      "",
      ...state.endingDebug.summaryStats.map((stat) => `- ${stat.label}: ${stat.value}`)
    ]);

    this.setCardText(this.endingDetailCard, [
      "인트로 라인",
      "",
      ...state.endingDebug.introLines,
      "",
      "NPC 한마디",
      state.endingDebug.npcLine,
      "",
      "안내",
      "- 현재 스탯 엔딩: 지금 상태로 바로 Completion부터 진입",
      "- 프리셋 버튼: 특정 엔딩이 나오도록 수치 고정 후 바로 진입",
      "- 실제 6주차까지 진행하지 않아도 연출 확인 가능"
    ]);

    this.setCardText(this.endingButtonsCard, [
      "실행 버튼",
      "",
      "- 현재 스탯 기준 결과 확인",
      "- FE / BE / 협업 / 체력 / 운 엔딩 확인",
      "- 프론트 리더 특수 분기 확인"
    ]);
  }

  private setCardText(card: CardEntry, lines: string[]): void {
    const nextText = lines.join("\n");
    if (card.body.text === nextText) {
      this.refreshCardScroll(card);
      return;
    }

    card.body.setText(nextText);
    card.scrollOffset = 0;
    this.refreshCardScroll(card);
  }

  private updatePageVisibility(): void {
    const statsVisible = this.page === "stats";
    const storyVisible = this.page === "story";
    const endingVisible = this.page === "ending";

    this.setCardVisibility(this.statsStateCard, statsVisible);
    this.setCardVisibility(this.statsHelpCard, statsVisible);
    this.setCardVisibility(this.statsButtonsCard, statsVisible);
    this.setCardVisibility(this.storySummaryCard, storyVisible);
    this.setCardVisibility(this.storyListCard, storyVisible);
    this.setCardVisibility(this.storyDetailCard, storyVisible);
    this.setCardVisibility(this.storyChoicesCard, storyVisible);
    this.setCardVisibility(this.storyControlCard, storyVisible);
    this.setCardVisibility(this.endingPreviewCard, endingVisible);
    this.setCardVisibility(this.endingDetailCard, endingVisible);
    this.setCardVisibility(this.endingButtonsCard, endingVisible);

    this.setButtonVisibility(this.statsButtonEntries, statsVisible);
    this.setButtonVisibility(this.storyButtonEntries, storyVisible);
    this.setButtonVisibility(this.endingButtonEntries, endingVisible);
    this.updateTabStyles();
  }

  private updateTabStyles(): void {
    this.tabEntries.forEach((entry) => {
      const active = entry.page === this.page;
      entry.rect.setFillStyle(active ? 0x245364 : 0x17303b);
      entry.rect.setStrokeStyle(2, active ? 0x9df3ff : 0x6ce7ff, 1);
      entry.text.setColor(active ? "#ffffff" : "#d8f7ff");
    });
  }

  private setCardVisibility(card: CardEntry, visible: boolean): void {
    card.background.setVisible(visible);
    card.title.setVisible(visible);
    card.body.setVisible(visible);
    card.maskShape.setVisible(false);
    card.attachedButtons.forEach((entry) => {
      entry.shadow.setVisible(visible);
      entry.rect.setVisible(visible);
      entry.text.setVisible(visible);
    });
  }

  private setButtonVisibility(entries: ButtonEntry[], visible: boolean): void {
    entries.forEach((entry) => {
      entry.shadow.setVisible(visible);
      entry.rect.setVisible(visible);
      entry.text.setVisible(visible);
    });
  }

  private getSelectedWeekState(state: DebugPanelState) {
    const normalizedWeek = Phaser.Math.Clamp(Math.round(this.storySelectedWeek), 1, Math.max(state.storyDebug.weeks.length, 1));
    this.storySelectedWeek = normalizedWeek;
    return state.storyDebug.weeks.find((weekState) => weekState.week === normalizedWeek) ?? state.storyDebug.weeks[0];
  }

  private getSelectedEvent(state: DebugPanelState) {
    const weekState = this.getSelectedWeekState(state);
    if (!weekState || weekState.events.length === 0) {
      return null;
    }

    const currentIndex = this.storySelectedEventIndexByWeek[weekState.week] ?? 0;
    const clampedIndex = Phaser.Math.Clamp(currentIndex, 0, weekState.events.length - 1);
    this.storySelectedEventIndexByWeek[weekState.week] = clampedIndex;
    return weekState.events[clampedIndex] ?? null;
  }

  private shiftStoryWeek(delta: number): void {
    if (!this.latestState) {
      return;
    }

    this.storySelectedWeek = Phaser.Math.Clamp(
      this.storySelectedWeek + delta,
      1,
      Math.max(this.latestState.storyDebug.weeks.length, 1)
    );
    this.render(this.latestState, { force: true });
  }

  private shiftStoryEvent(delta: number): void {
    if (!this.latestState) {
      return;
    }

    const weekState = this.getSelectedWeekState(this.latestState);
    if (!weekState || weekState.events.length === 0) {
      return;
    }

    const currentIndex = this.storySelectedEventIndexByWeek[weekState.week] ?? 0;
    this.storySelectedEventIndexByWeek[weekState.week] = Phaser.Math.Clamp(currentIndex + delta, 0, weekState.events.length - 1);
    this.render(this.latestState, { force: true });
  }

  private emitSelectedEventCommand(type: "jumpToFixedEvent" | "runFixedEvent", resetCompletion: boolean): void {
    if (!this.latestState) {
      return;
    }

    const selectedEvent = this.getSelectedEvent(this.latestState);
    if (!selectedEvent) {
      return;
    }

    this.commandBus.emit({
      type,
      week: selectedEvent.week,
      eventId: selectedEvent.eventId,
      resetCompletion
    });
  }

  private resetSelectedEventCompletion(): void {
    if (!this.latestState) {
      return;
    }

    const selectedEvent = this.getSelectedEvent(this.latestState);
    if (!selectedEvent) {
      return;
    }

    this.commandBus.emit({
      type: "resetFixedEventCompletion",
      eventId: selectedEvent.eventId
    });
  }

  private resetSelectedWeekCompletions(): void {
    if (!this.latestState) {
      return;
    }

    const weekState = this.getSelectedWeekState(this.latestState);
    if (!weekState) {
      return;
    }

    this.commandBus.emit({
      type: "resetFixedEventCompletionsForWeek",
      week: weekState.week
    });
  }

  private layoutCard(card: CardEntry, area: RectLayout): void {
    card.background.setPosition(area.x, area.y);
    card.background.setSize(area.width, area.height);
    card.title.setPosition(area.x - area.width / 2 + CARD_PADDING_X, area.y - area.height / 2 + CARD_PADDING_Y);

    const bodyX = area.x - area.width / 2 + CARD_PADDING_X;
    const bodyY = area.y - area.height / 2 + CARD_BODY_TOP_OFFSET;
    const bodyWidth = area.width - CARD_PADDING_X * 2;
    const bodyHeight = area.height - CARD_BODY_TOP_OFFSET - CARD_BOTTOM_PADDING;

    card.baseBodyY = bodyY;
    card.viewportHeight = Math.max(24, bodyHeight);
    card.contentHeight = card.body.height;
    card.body.setPosition(bodyX, bodyY);
    card.body.setWordWrapWidth(bodyWidth);
    card.maskShape.setPosition(bodyX + bodyWidth / 2, bodyY + bodyHeight / 2);
    card.maskShape.setSize(bodyWidth, bodyHeight);
    this.refreshCardScroll(card);
  }

  private refreshCardScroll(card: CardEntry): void {
    card.maxScroll = Math.max(0, card.contentHeight - card.viewportHeight);
    card.scrollOffset = Phaser.Math.Clamp(card.scrollOffset, 0, card.maxScroll);
    card.body.setY(card.baseBodyY - card.scrollOffset);
    card.attachedButtons.forEach((entry) => {
      entry.shadow.setY(entry.baseShadowY - card.scrollOffset);
      entry.rect.setY(entry.baseRectY - card.scrollOffset);
      entry.text.setY(entry.baseTextY - card.scrollOffset);
    });
  }

  private getScrollableCardAt(pointer: Phaser.Input.Pointer): CardEntry | null {
    return (
      this.allCards.find((card) => {
        if (!card.background.visible || card.maxScroll <= 0) {
          return false;
        }

        return card.background.getBounds().contains(pointer.x, pointer.y);
      }) ?? null
    );
  }

  private layout(): void {
    const layout = this.computeLayout();

    this.overlay.setPosition(layout.centerX, layout.centerY);
    this.overlay.setSize(this.scene.scale.width, this.scene.scale.height);
    this.panel.setPosition(layout.centerX, layout.centerY);
    this.panel.setSize(layout.panelWidth, layout.panelHeight);

    this.title.setPosition(layout.titleX, layout.titleY);
    this.footer.setPosition(layout.footerX, layout.footerY);
    this.footerCloseShadow.setPosition(layout.footerCloseX + 3, layout.footerCloseY + 3);
    this.footerCloseShadow.setSize(112, 32);
    this.footerCloseRect.setPosition(layout.footerCloseX, layout.footerCloseY);
    this.footerCloseRect.setSize(112, 32);
    this.footerCloseText.setPosition(layout.footerCloseX, layout.footerCloseY);

    this.tabEntries.forEach((entry, index) => {
      const x = layout.tabStartX + layout.tabGapX * index;
      const y = layout.tabY;
      entry.shadow.setPosition(x + 3, y + 3);
      entry.shadow.setSize(TAB_WIDTH, TAB_HEIGHT);
      entry.rect.setPosition(x, y);
      entry.rect.setSize(TAB_WIDTH, TAB_HEIGHT);
      entry.text.setPosition(x, y);
    });

    this.layoutCard(this.statsStateCard, layout.statsState);
    this.layoutCard(this.statsHelpCard, layout.statsHelp);
    this.layoutCard(this.statsButtonsCard, layout.statsButtons);
    this.layoutCard(this.storySummaryCard, layout.storySummary);
    this.layoutCard(this.storyListCard, layout.storyList);
    this.layoutCard(this.storyDetailCard, layout.storyDetail);
    this.layoutCard(this.storyChoicesCard, layout.storyChoices);
    this.layoutCard(this.storyControlCard, layout.storyControl);
    this.layoutCard(this.endingPreviewCard, layout.statsState);
    this.layoutCard(this.endingDetailCard, layout.statsHelp);
    this.layoutCard(this.endingButtonsCard, layout.statsButtons);

    this.layoutButtonGrid(this.statsButtonEntries, this.statsButtonsCard, layout.statsButtons, {
      columns: 3,
      mode: "flow"
    });
    this.layoutButtonGrid(this.storyButtonEntries, this.storyControlCard, layout.storyControl, {
      columns: 2,
      mode: "preset"
    });
    this.layoutButtonGrid(this.endingButtonEntries, this.endingButtonsCard, layout.statsButtons, {
      columns: 3,
      mode: "preset"
    });
  }

  private layoutButtonGrid(
    entries: ButtonEntry[],
    card: CardEntry,
    area: RectLayout,
    options: {
      columns: number;
      mode?: "flow" | "preset";
    }
  ): void {
    const normalEntries = entries.filter((entry) => entry.preset.dock !== "bottom-right");
    const dockedEntries = entries.filter((entry) => entry.preset.dock === "bottom-right");
    const gridLeft = area.x - area.width / 2 + CARD_PADDING_X + 4;
    const cardTop = area.y - area.height / 2;
    const minimumTop = cardTop + CARD_BODY_TOP_OFFSET + 72;
    const contentTop = card.body.y + card.body.height + 18;
    const gridTop = Math.max(minimumTop, contentTop);
    const availableBottom = area.y + area.height / 2 - CARD_BOTTOM_PADDING;
    const contentWidth = area.width - CARD_PADDING_X * 2 - 8;
    const columnWidth = contentWidth / options.columns;
    const maxButtonWidth = Math.max(96, columnWidth - 12);
    const layoutMode = options.mode ?? "preset";
    const rowKeys =
      layoutMode === "preset"
        ? [...new Set(normalEntries.map((entry) => entry.preset.row))].sort((a, b) => a - b)
        : [];
    const rowIndexByKey = new Map(rowKeys.map((rowKey, index) => [rowKey, index]));
    const rowCount =
      layoutMode === "preset"
        ? Math.max(rowKeys.length, 1)
        : Math.max(Math.ceil(normalEntries.length / options.columns), 1);
    const availableHeight = Math.max(BUTTON_BASE_HEIGHT, availableBottom - gridTop);
    const rowHeight = Math.max(
      34,
      Math.min(BUTTON_BASE_HEIGHT + 10, availableHeight / rowCount)
    );
    let gridBottom = card.baseBodyY + card.body.height;

    card.attachedButtons = normalEntries;

    normalEntries.forEach((entry, index) => {
      const flowRow = Math.floor(index / options.columns);
      const flowCol = index % options.columns;
      const width = Math.min(entry.preset.width ?? BUTTON_BASE_WIDTH, maxButtonWidth);
      const height = Math.min(entry.preset.height ?? BUTTON_BASE_HEIGHT, Math.max(34, rowHeight - 8));
      const colIndex = layoutMode === "preset" ? entry.preset.col : flowCol;
      const rowIndex = layoutMode === "preset" ? (rowIndexByKey.get(entry.preset.row) ?? 0) : flowRow;
      const columnCenterX = gridLeft + columnWidth * colIndex + columnWidth / 2;
      const x = columnCenterX;
      const y = gridTop + rowHeight * rowIndex + height / 2 + (entry.preset.yOffset ?? 0);
      entry.shadow.setPosition(x + 3, y + 3);
      entry.shadow.setSize(width, height);
      entry.shadow.setMask(card.mask);
      entry.rect.setPosition(x, y);
      entry.rect.setSize(width, height);
      entry.rect.setMask(card.mask);
      entry.text.setWordWrapWidth(Math.max(54, width - 14));
      entry.text.setPosition(x, y);
      entry.text.setMask(card.mask);
      entry.baseShadowY = y + 3;
      entry.baseRectY = y;
      entry.baseTextY = y;
      gridBottom = Math.max(gridBottom, y + height / 2);
    });

    dockedEntries.forEach((entry) => {
      const width = Math.min(entry.preset.width ?? BUTTON_BASE_WIDTH, Math.max(120, contentWidth * 0.42));
      const height = entry.preset.height ?? BUTTON_BASE_HEIGHT;
      const x = area.x + area.width / 2 - CARD_PADDING_X - width / 2;
      const y = area.y + area.height / 2 - CARD_BOTTOM_PADDING - height / 2;
      entry.shadow.setPosition(x + 3, y + 3);
      entry.shadow.setSize(width, height);
      entry.shadow.setMask(card.mask);
      entry.rect.setPosition(x, y);
      entry.rect.setSize(width, height);
      entry.rect.setMask(card.mask);
      entry.text.setWordWrapWidth(Math.max(54, width - 14));
      entry.text.setPosition(x, y);
      entry.text.setMask(card.mask);
      entry.baseShadowY = y + 3;
      entry.baseRectY = y;
      entry.baseTextY = y;
    });

    card.contentHeight = Math.max(card.body.height, gridBottom - card.baseBodyY);
    this.refreshCardScroll(card);
  }

  private computeLayout(): PanelLayout {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const panelWidth = Math.max(940, Math.min(BASE_PANEL_WIDTH, width - 40));
    const panelHeight = Math.max(580, Math.min(BASE_PANEL_HEIGHT, height - 40));
    const centerX = width / 2;
    const centerY = height / 2;
    const panelLeft = centerX - panelWidth / 2;
    const panelTop = centerY - panelHeight / 2;
    const contentTop = panelTop + PANEL_PADDING + PANEL_HEADER_HEIGHT;
    const contentLeft = panelLeft + PANEL_PADDING;
    const contentWidth = panelWidth - PANEL_PADDING * 2;
    const footerTop = panelTop + panelHeight - PANEL_PADDING - PANEL_FOOTER_HEIGHT;
    const contentHeight = footerTop - contentTop - PANEL_INNER_GAP;

    const statsColumnWidth = (contentWidth - PANEL_INNER_GAP * 2) / 3;
    const statsLeft = contentLeft;
    const statsMiddleLeft = statsLeft + statsColumnWidth + PANEL_INNER_GAP;
    const statsRightLeft = statsMiddleLeft + statsColumnWidth + PANEL_INNER_GAP;

    const storyLeftWidth = 250;
    const storyControlWidth = 250;
    const storyMiddleWidth = (contentWidth - storyLeftWidth - storyControlWidth - PANEL_INNER_GAP * 3) / 2;
    const storySummaryHeight = 192;
    const storyListHeight = contentHeight - storySummaryHeight - PANEL_INNER_GAP;
    const storyLeftCenterX = contentLeft + storyLeftWidth / 2;
    const storySummaryCenterY = contentTop + storySummaryHeight / 2;
    const storyListTop = contentTop + storySummaryHeight + PANEL_INNER_GAP;
    const storyListCenterY = storyListTop + storyListHeight / 2;
    const storyDetailLeft = contentLeft + storyLeftWidth + PANEL_INNER_GAP;
    const storyChoicesLeft = storyDetailLeft + storyMiddleWidth + PANEL_INNER_GAP;
    const storyControlLeft = storyChoicesLeft + storyMiddleWidth + PANEL_INNER_GAP;

    const tabGapX = TAB_WIDTH + 14;
    const tabGroupWidth = TAB_WIDTH + tabGapX * Math.max(this.tabEntries.length - 1, 0);

    return {
      centerX,
      centerY,
      panelWidth,
      panelHeight,
      panelLeft,
      panelTop,
      titleX: panelLeft + PANEL_PADDING + 8,
      titleY: panelTop + PANEL_PADDING + 4,
      tabStartX: panelLeft + panelWidth - PANEL_PADDING - tabGroupWidth + TAB_WIDTH / 2,
      tabY: panelTop + PANEL_PADDING + 6,
      tabGapX,
      footerX: panelLeft + PANEL_PADDING + 8,
      footerY: footerTop + PANEL_FOOTER_HEIGHT / 2 - 6,
      footerCloseX: panelLeft + panelWidth - PANEL_PADDING - 56,
      footerCloseY: footerTop + PANEL_FOOTER_HEIGHT / 2 - 6,
      statsState: {
        x: statsLeft + statsColumnWidth / 2,
        y: contentTop + contentHeight / 2,
        width: statsColumnWidth,
        height: contentHeight
      },
      statsHelp: {
        x: statsMiddleLeft + statsColumnWidth / 2,
        y: contentTop + contentHeight / 2,
        width: statsColumnWidth,
        height: contentHeight
      },
      statsButtons: {
        x: statsRightLeft + statsColumnWidth / 2,
        y: contentTop + contentHeight / 2,
        width: statsColumnWidth,
        height: contentHeight
      },
      storySummary: {
        x: storyLeftCenterX,
        y: storySummaryCenterY,
        width: storyLeftWidth,
        height: storySummaryHeight
      },
      storyList: {
        x: storyLeftCenterX,
        y: storyListCenterY,
        width: storyLeftWidth,
        height: storyListHeight
      },
      storyDetail: {
        x: storyDetailLeft + storyMiddleWidth / 2,
        y: contentTop + contentHeight / 2,
        width: storyMiddleWidth,
        height: contentHeight
      },
      storyChoices: {
        x: storyChoicesLeft + storyMiddleWidth / 2,
        y: contentTop + contentHeight / 2,
        width: storyMiddleWidth,
        height: contentHeight
      },
      storyControl: {
        x: storyControlLeft + storyControlWidth / 2,
        y: contentTop + contentHeight / 2,
        width: storyControlWidth,
        height: contentHeight
      }
    };
  }
}
