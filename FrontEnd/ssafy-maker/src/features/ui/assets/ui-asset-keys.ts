export const UI_ASSET_KEYS = {
  PANEL_MAIN: "ui_panel_main",
  PANEL_CONTENT: "ui_panel_content",
  TAB_SETTINGS: "ui_tab_settings",
  TAB_STATS: "ui_tab_stats",
  TAB_SAVE: "ui_tab_save",
  BUTTON_PRIMARY: "ui_button_primary",
  BUTTON_PRIMARY_HOVER: "ui_button_primary_hover"
} as const;

export type UiAssetKey = (typeof UI_ASSET_KEYS)[keyof typeof UI_ASSET_KEYS];
