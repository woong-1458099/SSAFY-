import Phaser from "phaser";
import type { AreaId } from "../../common/enums/area";
import type { WorldRenderBounds } from "../../game/managers/WorldManager";
import type { ParsedTmxMap, TmxRuntimeGrids } from "../../game/systems/tmxNavigation";
import { UI_DEPTH } from "../../game/systems/uiDepth";

type EditableLayer = "mouse" | "collision" | "interaction";

type WorldTileEditorState = {
  areaId?: AreaId;
  tmxKey?: string;
  parsedMap?: ParsedTmxMap;
  runtimeGrids?: TmxRuntimeGrids;
  renderBounds?: WorldRenderBounds;
};

type TileEditSession = {
  areaId: AreaId;
  tmxKey?: string;
  width: number;
  height: number;
  originalCollision: boolean[][];
  originalInteraction: boolean[][];
  collision: boolean[][];
  interaction: boolean[][];
};

type ButtonEntry = {
  shadow: Phaser.GameObjects.Rectangle;
  rect: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  setPosition: (x: number, y: number) => void;
};

type WorldTileEditorOptions = {
  onApply: (payload: { collisionGrid: boolean[][]; interactionGrid: boolean[][] }) => void;
};

function cloneGrid(grid: boolean[][]) {
  return grid.map((row) => [...row]);
}

function createText(
  scene: Phaser.Scene,
  text: string,
  style?: Phaser.Types.GameObjects.Text.TextStyle
) {
  return scene.add.text(0, 0, text, {
    fontFamily: "Pretendard, Malgun Gothic, sans-serif",
    fontSize: "13px",
    color: "#f4fbff",
    resolution: 2,
    lineSpacing: 4,
    ...style
  });
}

export class WorldTileEditor {
  private static readonly PANEL_WIDTH = 472;
  private static readonly EXPANDED_PANEL_HEIGHT = 356;
  private static readonly COLLAPSED_PANEL_HEIGHT = 96;
  private static readonly VIEWPORT_MARGIN = 20;
  private static readonly HEADER_HEIGHT = 56;
  private static readonly BUTTON_WIDTH = 124;
  private static readonly BUTTON_HEIGHT = 36;

  private readonly root: Phaser.GameObjects.Container;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly subtitleText: Phaser.GameObjects.Text;
  private readonly collapseButton: ButtonEntry;
  private readonly infoPanel: Phaser.GameObjects.Rectangle;
  private readonly shortcutPanel: Phaser.GameObjects.Rectangle;
  private readonly exportPanel: Phaser.GameObjects.Rectangle;
  private readonly infoText: Phaser.GameObjects.Text;
  private readonly shortcutText: Phaser.GameObjects.Text;
  private readonly exportText: Phaser.GameObjects.Text;
  private readonly statusText: Phaser.GameObjects.Text;
  private readonly hoverGraphics: Phaser.GameObjects.Graphics;
  private readonly buttonEntries: ButtonEntry[];
  private state?: WorldTileEditorState;
  private session?: TileEditSession;
  private visible = false;
  private collapsed = false;
  private selectedLayer: EditableLayer = "mouse";
  private statusMessage = "F4로 편집기를 닫을 수 있습니다.";
  private lastPaintKey?: string;
  private panelBounds = { left: 0, top: 0, width: 0, height: 0 };
  private panelPosition?: { left: number; top: number };
  private dragState?: { pointerId: number; offsetX: number; offsetY: number };

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: WorldTileEditorOptions
  ) {
    this.panel = scene.add.rectangle(0, 0, 472, 356, 0x09131d, 0.94);
    this.panel.setStrokeStyle(2, 0x6ce7ff, 1);
    this.titleText = createText(scene, "F4 TILE EDITOR", {
      fontSize: "20px",
      fontStyle: "bold",
      color: "#6ce7ff"
    });
    this.subtitleText = createText(scene, "타일 충돌/건물 확인 타일 편집", {
      fontSize: "11px",
      color: "#8bb8c8"
    });
    this.infoPanel = scene.add.rectangle(0, 0, 204, 112, 0x10212c, 0.96);
    this.infoPanel.setStrokeStyle(1, 0x2f5666, 1);
    this.shortcutPanel = scene.add.rectangle(0, 0, 204, 112, 0x10212c, 0.96);
    this.shortcutPanel.setStrokeStyle(1, 0x2f5666, 1);
    this.exportPanel = scene.add.rectangle(0, 0, 428, 120, 0x10212c, 0.96);
    this.exportPanel.setStrokeStyle(1, 0x2f5666, 1);
    this.infoText = createText(scene, "", {
      wordWrap: { width: 168 }
    });
    this.shortcutText = createText(scene, "", {
      wordWrap: { width: 168 }
    });
    this.exportText = createText(scene, "", {
      wordWrap: { width: 390 }
    });
    this.statusText = createText(scene, "", {
      color: "#ffd666",
      wordWrap: { width: 428 }
    });
    this.hoverGraphics = scene.add.graphics().setDepth(UI_DEPTH.debugTileEditor + 1);
    this.collapseButton = this.createButton("접기", () => {
      this.collapsed = !this.collapsed;
      this.statusMessage = this.collapsed
        ? "편집기를 접었습니다. 버튼을 다시 누르면 펼쳐집니다."
        : "편집기를 펼쳤습니다.";
      this.layout();
      this.renderInfo();
    });

    this.buttonEntries = [
      this.createButton("복사", () => {
        void this.copyPatchToClipboard();
      }),
      this.createButton("다운로드", () => {
        this.downloadPatch();
      }),
      this.createButton("초기화", () => {
        this.resetSession();
      })
    ];

    this.root = scene.add.container(0, 0, [
      this.panel,
      this.titleText,
      this.subtitleText,
      this.collapseButton.shadow,
      this.collapseButton.rect,
      this.collapseButton.label,
      this.infoPanel,
      this.shortcutPanel,
      this.exportPanel,
      this.infoText,
      this.shortcutText,
      this.exportText,
      this.statusText,
      ...this.buttonEntries.flatMap((entry) => [entry.shadow, entry.rect, entry.label])
    ]);
    this.root.setDepth(UI_DEPTH.debugTileEditor);
    this.root.setScrollFactor(0);
    this.root.setVisible(false);

    this.scene.input.mouse?.disableContextMenu();
    this.bindInput();
    this.layout();
  }

  setWorldState(state: WorldTileEditorState) {
    this.state = state;

    if (!state.areaId || !state.parsedMap || !state.runtimeGrids) {
      this.session = undefined;
      this.renderInfo();
      return;
    }

    if (
      !this.session ||
      this.session.areaId !== state.areaId ||
      this.session.width !== state.parsedMap.width ||
      this.session.height !== state.parsedMap.height
    ) {
      this.session = {
        areaId: state.areaId,
        tmxKey: state.tmxKey,
        width: state.parsedMap.width,
        height: state.parsedMap.height,
        originalCollision: cloneGrid(state.runtimeGrids.blockedGrid),
        originalInteraction: cloneGrid(state.runtimeGrids.interactionGrid),
        collision: cloneGrid(state.runtimeGrids.blockedGrid),
        interaction: cloneGrid(state.runtimeGrids.interactionGrid)
      };
      this.statusMessage = `${state.areaId} 편집 세션을 시작했습니다.`;
    }

    this.renderInfo();
  }

  update() {
    if (!this.visible) {
      return;
    }

    this.renderHoverTile();
    this.renderInfo();
  }

  setVisible(visible: boolean) {
    this.visible = visible;
    this.root.setVisible(visible);

    if (!visible) {
      this.dragState = undefined;
      this.lastPaintKey = undefined;
      this.hoverGraphics.clear();
      return;
    }

    this.renderInfo();
  }

  toggle() {
    this.setVisible(!this.visible);
  }

  isVisible() {
    return this.visible;
  }

  destroy() {
    this.hoverGraphics.destroy();
    this.root.destroy(true);
  }

  private bindInput() {
    this.scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);
    this.scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.handlePointerMove, this);
    this.scene.input.on(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);
    this.scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);

    const keyboard = this.scene.input.keyboard;
    keyboard?.on("keydown-Q", this.handleSelectCollision, this);
    keyboard?.on("keydown-W", this.handleSelectInteraction, this);
    keyboard?.on("keydown-M", this.handleSelectMouse, this);
    keyboard?.on("keydown-G", this.handleCopyShortcut, this);
    keyboard?.on("keydown-R", this.handleResetShortcut, this);

    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);
      this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.handlePointerMove, this);
      this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);
      this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
      keyboard?.off("keydown-Q", this.handleSelectCollision, this);
      keyboard?.off("keydown-W", this.handleSelectInteraction, this);
      keyboard?.off("keydown-M", this.handleSelectMouse, this);
      keyboard?.off("keydown-G", this.handleCopyShortcut, this);
      keyboard?.off("keydown-R", this.handleResetShortcut, this);
    });
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (!this.visible) {
      return;
    }

    if (this.tryStartPanelDrag(pointer)) {
      return;
    }

    this.paintFromPointer(pointer);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.visible) {
      return;
    }

    if (this.dragState?.pointerId === pointer.id) {
      this.updatePanelDrag(pointer);
      return;
    }

    if (pointer.leftButtonDown() || pointer.rightButtonDown()) {
      this.paintFromPointer(pointer);
    }
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer) {
    if (this.dragState?.pointerId === pointer.id) {
      this.dragState = undefined;
    }
    this.lastPaintKey = undefined;
  }

  private handleSelectCollision(event: KeyboardEvent) {
    if (!this.visible) {
      return;
    }

    event.preventDefault();
    this.selectedLayer = "collision";
    this.statusMessage = "브러시를 collision로 변경했습니다.";
    this.renderInfo();
  }

  private handleSelectMouse(event: KeyboardEvent) {
    if (!this.visible) {
      return;
    }

    event.preventDefault();
    this.selectedLayer = "mouse";
    this.statusMessage = "브러시를 mouse로 변경했습니다. 클릭해도 타일을 수정하지 않습니다.";
    this.renderInfo();
  }

  private handleSelectInteraction(event: KeyboardEvent) {
    if (!this.visible) {
      return;
    }

    event.preventDefault();
    this.selectedLayer = "interaction";
    this.statusMessage = "브러시를 interaction으로 변경했습니다.";
    this.renderInfo();
  }

  private handleCopyShortcut(event: KeyboardEvent) {
    if (!this.visible) {
      return;
    }

    event.preventDefault();
    void this.copyPatchToClipboard();
  }

  private handleResetShortcut(event: KeyboardEvent) {
    if (!this.visible) {
      return;
    }

    event.preventDefault();
    this.resetSession();
  }

  private paintFromPointer(pointer: Phaser.Input.Pointer) {
    if (!this.visible || !this.session || this.selectedLayer === "mouse") {
      return;
    }

    if (this.isPointerOverPanel(pointer)) {
      return;
    }

    const tile = this.resolveTileFromPointer(pointer);
    if (!tile) {
      return;
    }

    const nextValue = pointer.rightButtonDown() ? false : true;
    const paintKey = `${this.selectedLayer}:${tile.tileX},${tile.tileY}:${nextValue ? 1 : 0}`;
    if (paintKey === this.lastPaintKey) {
      return;
    }
    this.lastPaintKey = paintKey;

    const targetGrid =
      this.selectedLayer === "collision" ? this.session.collision : this.session.interaction;
    const row = targetGrid[tile.tileY];
    if (!row || row[tile.tileX] === nextValue) {
      return;
    }

    row[tile.tileX] = nextValue;
    this.options.onApply({
      collisionGrid: cloneGrid(this.session.collision),
      interactionGrid: cloneGrid(this.session.interaction)
    });
    this.statusMessage = `${this.selectedLayer} ${tile.tileX},${tile.tileY} -> ${nextValue ? "on" : "off"}`;
    this.renderInfo();
  }

  private resolveTileFromPointer(pointer: Phaser.Input.Pointer) {
    const parsedMap = this.state?.parsedMap;
    if (!parsedMap) {
      return undefined;
    }

    const renderBounds = this.state?.renderBounds;
    if (!renderBounds) {
      const tileX = Math.floor(pointer.worldX / parsedMap.tileWidth);
      const tileY = Math.floor(pointer.worldY / parsedMap.tileHeight);
      if (tileX < 0 || tileY < 0 || tileX >= parsedMap.width || tileY >= parsedMap.height) {
        return undefined;
      }
      return { tileX, tileY };
    }

    const scaledTileWidth = renderBounds.tileWidth * renderBounds.scale;
    const scaledTileHeight = renderBounds.tileHeight * renderBounds.scale;
    const tileX = Math.floor((pointer.worldX - renderBounds.offsetX) / scaledTileWidth);
    const tileY = Math.floor((pointer.worldY - renderBounds.offsetY) / scaledTileHeight);

    if (tileX < 0 || tileY < 0 || tileX >= parsedMap.width || tileY >= parsedMap.height) {
      return undefined;
    }

    return { tileX, tileY };
  }

  private renderHoverTile() {
    this.hoverGraphics.clear();

    const pointer = this.scene.input.activePointer;
    if (this.selectedLayer === "mouse" || this.isPointerOverPanel(pointer)) {
      return;
    }
    const tile = this.resolveTileFromPointer(pointer);
    const renderBounds = this.state?.renderBounds;
    const parsedMap = this.state?.parsedMap;

    if (!tile || !parsedMap) {
      return;
    }

    const offsetX = renderBounds?.offsetX ?? 0;
    const offsetY = renderBounds?.offsetY ?? 0;
    const tileWidth = (renderBounds?.tileWidth ?? parsedMap.tileWidth) * (renderBounds?.scale ?? 1);
    const tileHeight = (renderBounds?.tileHeight ?? parsedMap.tileHeight) * (renderBounds?.scale ?? 1);

    this.hoverGraphics.lineStyle(2, 0xffffff, 0.95);
    this.hoverGraphics.strokeRect(
      offsetX + tile.tileX * tileWidth,
      offsetY + tile.tileY * tileHeight,
      tileWidth,
      tileHeight
    );
  }

  private createButton(label: string, onClick: () => void): ButtonEntry {
    const shadow = this.scene.add.rectangle(0, 0, 124, 36, 0x000000, 0.5);
    const rect = this.scene.add.rectangle(0, 0, 124, 36, 0x17303b, 1);
    rect.setStrokeStyle(2, 0x6ce7ff, 1);
    rect.setInteractive({ useHandCursor: true });
    rect.on("pointerover", () => rect.setFillStyle(0x204554));
    rect.on("pointerout", () => rect.setFillStyle(0x17303b));
    rect.on("pointerdown", onClick);
    const text = createText(this.scene, label, {
      fontSize: "13px",
      fontStyle: "bold",
      align: "center"
    }).setOrigin(0.5);

    return {
      shadow,
      rect,
      label: text,
      setPosition: (x: number, y: number) => {
        shadow.setPosition(x + 3, y + 3);
        rect.setPosition(x, y);
        text.setPosition(x, y);
      }
    };
  }

  private buildPatchPayload() {
    if (!this.session) {
      return null;
    }

    const collision = this.collectDiff(this.session.originalCollision, this.session.collision);
    const interaction = this.collectDiff(this.session.originalInteraction, this.session.interaction);

    return {
      version: 1,
      areaId: this.session.areaId,
      tmxKey: this.session.tmxKey,
      generatedAt: new Date().toISOString(),
      edits: {
        collision,
        interaction
      }
    };
  }

  private collectDiff(previous: boolean[][], next: boolean[][]) {
    const diff: Array<{ x: number; y: number; value: boolean }> = [];

    for (let y = 0; y < next.length; y += 1) {
      for (let x = 0; x < (next[y]?.length ?? 0); x += 1) {
        if ((previous[y]?.[x] ?? false) === (next[y]?.[x] ?? false)) {
          continue;
        }
        diff.push({ x, y, value: next[y][x] });
      }
    }

    return diff;
  }

  private async copyPatchToClipboard() {
    const payload = this.buildPatchPayload();
    if (!payload) {
      this.statusMessage = "복사할 편집 데이터가 없습니다.";
      this.renderInfo();
      return;
    }

    const text = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      this.statusMessage = "타일 편집 패치를 클립보드에 복사했습니다.";
    } catch (error) {
      console.error("[WorldTileEditor] failed to copy patch", error);
      this.statusMessage = "클립보드 복사에 실패했습니다.";
    }
    this.renderInfo();
  }

  private downloadPatch() {
    const payload = this.buildPatchPayload();
    if (!payload) {
      this.statusMessage = "다운로드할 편집 데이터가 없습니다.";
      this.renderInfo();
      return;
    }

    const text = JSON.stringify(payload, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `debug-tile-editor-${payload.areaId}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    this.statusMessage = "타일 편집 패치를 JSON 파일로 다운로드했습니다.";
    this.renderInfo();
  }

  private resetSession() {
    if (!this.session) {
      return;
    }

    this.session.collision = cloneGrid(this.session.originalCollision);
    this.session.interaction = cloneGrid(this.session.originalInteraction);
    this.options.onApply({
      collisionGrid: cloneGrid(this.session.collision),
      interactionGrid: cloneGrid(this.session.interaction)
    });
    this.statusMessage = "현재 지역 편집 세션을 초기 상태로 되돌렸습니다.";
    this.renderInfo();
  }

  private renderInfo() {
    const patch = this.buildPatchPayload();
    const diffCount = patch ? patch.edits.collision.length + patch.edits.interaction.length : 0;
    const currentArea = this.session?.areaId ?? this.state?.areaId ?? "-";
    const currentMap = this.session?.tmxKey ?? this.state?.tmxKey ?? "-";
    const layerLabel =
      this.selectedLayer === "mouse"
        ? "mouse"
        : this.selectedLayer === "collision"
          ? "collision"
          : "interaction";

    this.infoText.setText([
      "MAP",
      `지역  ${currentArea}`,
      `맵키  ${currentMap}`,
      `브러시  ${layerLabel}`,
      `변경  ${diffCount}`,
      "",
      "mouse = 클릭해도 편집 안 함",
      "collision = 이동 불가 타일",
      "interaction = 건물 확인 타일"
    ]);
    this.shortcutText.setText([
      "CONTROLS",
      "상단 바 드래그  창 이동",
      "좌클릭  칠하기",
      "우클릭  지우기",
      "M  mouse(편집 안 함)",
      "Q  collision(이동 불가)",
      "W  interaction(건물 확인)",
      "G  JSON 복사",
      "R  세션 초기화"
    ]);
    this.exportText.setText([
      "NOTES",
      "복사: 현재 지역 diff를 클립보드 JSON으로 복사",
      "다운로드: 현재 지역 diff를 파일로 저장",
      "초기화: 현재 편집 세션을 원본 상태로 되돌림",
      "fallback-zone: 코드에 남아있는 예전 사각형 판정",
      "fallback-zone은 타일 레이어가 아니라서 단축키가 없음"
    ]);
    this.statusText.setText(this.statusMessage);
    this.collapseButton.label.setText(this.collapsed ? "펼치기" : "접기");
  }

  private layout() {
    const panelWidth = WorldTileEditor.PANEL_WIDTH;
    const panelHeight = this.collapsed
      ? WorldTileEditor.COLLAPSED_PANEL_HEIGHT
      : WorldTileEditor.EXPANDED_PANEL_HEIGHT;
    const defaultLeft = Math.max(
      WorldTileEditor.VIEWPORT_MARGIN,
      this.scene.scale.width - panelWidth - WorldTileEditor.VIEWPORT_MARGIN
    );
    const defaultTop = WorldTileEditor.VIEWPORT_MARGIN;
    const nextPosition = this.clampPanelPosition(
      this.panelPosition?.left ?? defaultLeft,
      this.panelPosition?.top ?? defaultTop,
      panelWidth,
      panelHeight
    );
    const { left, top } = nextPosition;
    const x = left + panelWidth / 2;
    const y = top + panelHeight / 2;
    this.panelPosition = nextPosition;
    this.panelBounds = { left, top, width: panelWidth, height: panelHeight };

    this.panel.setPosition(x, y);
    this.panel.setSize(panelWidth, panelHeight);
    this.titleText.setPosition(left + 20, top + 14);
    this.subtitleText.setPosition(left + 20, top + 40);
    this.collapseButton.setPosition(left + 406, top + 28);

    this.infoPanel.setPosition(left + 114, top + 102);
    this.infoPanel.setSize(204, 112);
    this.shortcutPanel.setPosition(left + 358, top + 102);
    this.shortcutPanel.setSize(204, 112);
    this.exportPanel.setPosition(left + 236, top + 238);
    this.exportPanel.setSize(428, 120);

    this.infoText.setPosition(left + 24, top + 62);
    this.shortcutText.setPosition(left + 268, top + 62);
    this.exportText.setPosition(left + 24, top + 190);
    this.statusText.setPosition(left + 24, top + 322);

    this.buttonEntries[0]?.setPosition(left + 92, top + 286);
    this.buttonEntries[1]?.setPosition(left + 236, top + 286);
    this.buttonEntries[2]?.setPosition(left + 380, top + 286);

    const expandedVisible = !this.collapsed;
    this.infoPanel.setVisible(expandedVisible);
    this.shortcutPanel.setVisible(expandedVisible);
    this.exportPanel.setVisible(expandedVisible);
    this.infoText.setVisible(expandedVisible);
    this.shortcutText.setVisible(expandedVisible);
    this.exportText.setVisible(expandedVisible);
    this.buttonEntries.forEach((entry) => {
      entry.shadow.setVisible(expandedVisible);
      entry.rect.setVisible(expandedVisible);
      entry.label.setVisible(expandedVisible);
    });

    if (this.collapsed) {
      this.statusText.setPosition(left + 20, top + 66);
    }
  }

  private isPointerOverPanel(pointer: Phaser.Input.Pointer) {
    const { left, top, width, height } = this.panelBounds;
    return (
      pointer.x >= left &&
      pointer.x <= left + width &&
      pointer.y >= top &&
      pointer.y <= top + height
    );
  }

  private tryStartPanelDrag(pointer: Phaser.Input.Pointer) {
    if (!pointer.leftButtonDown() || !this.isPointerOverDragHandle(pointer)) {
      return false;
    }

    this.dragState = {
      pointerId: pointer.id,
      offsetX: pointer.x - this.panelBounds.left,
      offsetY: pointer.y - this.panelBounds.top
    };
    this.lastPaintKey = undefined;
    return true;
  }

  private updatePanelDrag(pointer: Phaser.Input.Pointer) {
    const panelHeight = this.collapsed
      ? WorldTileEditor.COLLAPSED_PANEL_HEIGHT
      : WorldTileEditor.EXPANDED_PANEL_HEIGHT;
    const nextPosition = this.clampPanelPosition(
      pointer.x - this.dragState!.offsetX,
      pointer.y - this.dragState!.offsetY,
      WorldTileEditor.PANEL_WIDTH,
      panelHeight
    );

    if (
      this.panelPosition?.left === nextPosition.left &&
      this.panelPosition?.top === nextPosition.top
    ) {
      return;
    }

    this.panelPosition = nextPosition;
    this.layout();
  }

  private isPointerOverDragHandle(pointer: Phaser.Input.Pointer) {
    const { left, top, width } = this.panelBounds;
    const withinHeader =
      pointer.x >= left &&
      pointer.x <= left + width &&
      pointer.y >= top &&
      pointer.y <= top + WorldTileEditor.HEADER_HEIGHT;

    if (!withinHeader) {
      return false;
    }

    return !this.isPointerOverCollapseButton(pointer);
  }

  private isPointerOverCollapseButton(pointer: Phaser.Input.Pointer) {
    const left = this.panelBounds.left + 406 - WorldTileEditor.BUTTON_WIDTH / 2;
    const top = this.panelBounds.top + 28 - WorldTileEditor.BUTTON_HEIGHT / 2;

    return (
      pointer.x >= left &&
      pointer.x <= left + WorldTileEditor.BUTTON_WIDTH &&
      pointer.y >= top &&
      pointer.y <= top + WorldTileEditor.BUTTON_HEIGHT
    );
  }

  private clampPanelPosition(left: number, top: number, width: number, height: number) {
    const minX = WorldTileEditor.VIEWPORT_MARGIN;
    const minY = WorldTileEditor.VIEWPORT_MARGIN;
    const maxX = Math.max(minX, this.scene.scale.width - width - WorldTileEditor.VIEWPORT_MARGIN);
    const maxY = Math.max(
      minY,
      this.scene.scale.height - height - WorldTileEditor.VIEWPORT_MARGIN
    );

    return {
      left: Phaser.Math.Clamp(left, minX, maxX),
      top: Phaser.Math.Clamp(top, minY, maxY)
    };
  }
}
