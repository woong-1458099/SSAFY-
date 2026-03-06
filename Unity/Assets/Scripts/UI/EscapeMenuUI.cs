using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

public class EscapeMenuUI : MonoBehaviour
{
    public enum TabType
    {
        Settings,
        Stats,
        Save
    }

    [Header("Menu Roots")]
    public GameObject overlayRoot;
    public GameObject popupPanelRoot;

    [Header("Tab Buttons")]
    public Button settingsTabButton;
    public Button statsTabButton;
    public Button saveTabButton;

    [Header("Tab Contents")]
    public GameObject settingsContent;
    public GameObject statsContent;
    public GameObject saveContent;

    [Header("Tab Colors")]
    public Color tabNormalColor = new Color(0.80f, 0.72f, 0.56f, 1f);
    public Color tabSelectedColor = new Color(0.95f, 0.86f, 0.62f, 1f);
    public Color tabTextNormalColor = new Color(0.26f, 0.20f, 0.12f, 1f);
    public Color tabTextSelectedColor = new Color(0.15f, 0.10f, 0.05f, 1f);

    [Header("Default")]
    public TabType defaultTab = TabType.Stats;
    public bool autoBindStatsManager = true;

    [Header("Settings - Key Guide")]
    public TMP_Text escKeyText;
    public TMP_Text moveKeyText;
    public TMP_Text interactKeyText;
    public TMP_Text keyStatusText;

    [Header("Settings - Key Change Buttons (MVP placeholders)")]
    public Button changeEscKeyButton;
    public Button changeMoveKeyButton;
    public Button changeInteractKeyButton;

    [Header("Settings - Audio")]
    public Slider bgmSlider;
    public Slider sfxSlider;
    public Slider ambienceSlider;
    public TMP_Text bgmValueText;
    public TMP_Text sfxValueText;
    public TMP_Text ambienceValueText;

    [Header("Settings - Resolution")]
    public TMP_Dropdown resolutionDropdown;
    public Button applyResolutionButton;
    public TMP_Text resolutionStatusText;

    [Header("Stats Texts")]
    public TMP_Text healthValueText;
    public TMP_Text codingValueText;
    public TMP_Text presentationValueText;
    public TMP_Text teamworkValueText;
    public TMP_Text luckValueText;
    public TMP_Text stressValueText;

    [Header("Save / Load")]
    public Button saveButton;
    public Button loadButton;
    public TMP_Text saveStatusText;

    private readonly List<Resolution> _resolutionOptions = new List<Resolution>();
    private bool _eventsBound;
    private bool _isMenuOpen;
    private bool _statsBound;

    private int _health = 100;
    private int _coding = 0;
    private int _presentation = 0;
    private int _teamwork = 0;
    private int _luck = 1;
    private int _stress = 0;

    private void Start()
    {
        BindEvents();
        SetupDefaultText();
        SetupResolutionDropdown();
        RefreshAudioValueText();
        RefreshStatsTexts();

        SetMenuVisible(false);
        ShowTab(defaultTab);

        if (autoBindStatsManager)
        {
            StatsManager.EnsureInstance();
            TryBindStatsManager();
        }
    }

    private void Update()
    {
        if (autoBindStatsManager && !_statsBound)
        {
            TryBindStatsManager();
        }

        if (EscapePressed())
        {
            ToggleMenu();
        }
    }

    private void OnDestroy()
    {
        UnbindStatsManager();
    }

    public void ToggleMenu()
    {
        SetMenuVisible(!_isMenuOpen);
    }

    public void SetMenuVisible(bool visible)
    {
        _isMenuOpen = visible;

        if (overlayRoot != null) overlayRoot.SetActive(visible);
        if (popupPanelRoot != null) popupPanelRoot.SetActive(visible);
    }

    public void ShowSettingsTab()
    {
        ShowTab(TabType.Settings);
    }

    public void ShowStatsTab()
    {
        ShowTab(TabType.Stats);
    }

    public void ShowSaveTab()
    {
        ShowTab(TabType.Save);
    }

    public void ShowTab(TabType tab)
    {
        if (settingsContent != null) settingsContent.SetActive(tab == TabType.Settings);
        if (statsContent != null) statsContent.SetActive(tab == TabType.Stats);
        if (saveContent != null) saveContent.SetActive(tab == TabType.Save);

        ApplyTabVisual(settingsTabButton, tab == TabType.Settings);
        ApplyTabVisual(statsTabButton, tab == TabType.Stats);
        ApplyTabVisual(saveTabButton, tab == TabType.Save);
    }

    public void SetStats(int health, int coding, int presentation, int teamwork, int luck, int stress)
    {
        _health = health;
        _coding = coding;
        _presentation = presentation;
        _teamwork = teamwork;
        _luck = luck;
        _stress = stress;
        RefreshStatsTexts();
    }

    public void OnClickSave()
    {
        if (saveStatusText != null)
        {
            saveStatusText.text = "Saved (MVP placeholder)";
        }
        Debug.Log("[EscapeMenuUI] Save clicked");
    }

    public void OnClickLoad()
    {
        if (saveStatusText != null)
        {
            saveStatusText.text = "Loaded (MVP placeholder)";
        }
        Debug.Log("[EscapeMenuUI] Load clicked");
    }

    public void OnClickChangeEscKey()
    {
        SetKeyStatus("ESC rebind UI placeholder");
    }

    public void OnClickChangeMoveKey()
    {
        SetKeyStatus("Move rebind UI placeholder");
    }

    public void OnClickChangeInteractKey()
    {
        SetKeyStatus("Interact rebind UI placeholder");
    }

    public void OnAudioSliderChanged()
    {
        RefreshAudioValueText();
    }

    public void OnClickApplyResolution()
    {
        if (resolutionDropdown == null || _resolutionOptions.Count == 0)
        {
            return;
        }

        int idx = Mathf.Clamp(resolutionDropdown.value, 0, _resolutionOptions.Count - 1);
        Resolution target = _resolutionOptions[idx];
        Screen.SetResolution(target.width, target.height, Screen.fullScreenMode, target.refreshRateRatio);

        if (resolutionStatusText != null)
        {
            resolutionStatusText.text = $"Applied: {target.width}x{target.height}";
        }
    }

    private void BindEvents()
    {
        if (_eventsBound) return;
        _eventsBound = true;

        if (settingsTabButton != null) settingsTabButton.onClick.AddListener(ShowSettingsTab);
        if (statsTabButton != null) statsTabButton.onClick.AddListener(ShowStatsTab);
        if (saveTabButton != null) saveTabButton.onClick.AddListener(ShowSaveTab);

        if (changeEscKeyButton != null) changeEscKeyButton.onClick.AddListener(OnClickChangeEscKey);
        if (changeMoveKeyButton != null) changeMoveKeyButton.onClick.AddListener(OnClickChangeMoveKey);
        if (changeInteractKeyButton != null) changeInteractKeyButton.onClick.AddListener(OnClickChangeInteractKey);

        if (bgmSlider != null) bgmSlider.onValueChanged.AddListener(_ => OnAudioSliderChanged());
        if (sfxSlider != null) sfxSlider.onValueChanged.AddListener(_ => OnAudioSliderChanged());
        if (ambienceSlider != null) ambienceSlider.onValueChanged.AddListener(_ => OnAudioSliderChanged());

        if (applyResolutionButton != null) applyResolutionButton.onClick.AddListener(OnClickApplyResolution);
        if (saveButton != null) saveButton.onClick.AddListener(OnClickSave);
        if (loadButton != null) loadButton.onClick.AddListener(OnClickLoad);
    }

    private void SetupDefaultText()
    {
        if (escKeyText != null) escKeyText.text = "ESC = Open / Close Menu";
        if (moveKeyText != null) moveKeyText.text = "WASD / Arrow Keys = Move";
        if (interactKeyText != null) interactKeyText.text = "Mouse Click = Interact";

        if (keyStatusText != null) keyStatusText.text = "Rebinding not connected yet";
        if (resolutionStatusText != null) resolutionStatusText.text = "Select resolution and press Apply";
        if (saveStatusText != null) saveStatusText.text = "Ready";

        if (bgmSlider != null && bgmSlider.value <= 0f) bgmSlider.value = 0.7f;
        if (sfxSlider != null && sfxSlider.value <= 0f) sfxSlider.value = 0.8f;
        if (ambienceSlider != null && ambienceSlider.value <= 0f) ambienceSlider.value = 0.6f;
    }

    private void SetupResolutionDropdown()
    {
        if (resolutionDropdown == null) return;

        resolutionDropdown.ClearOptions();
        _resolutionOptions.Clear();

        var options = new List<string>();
        var seen = new HashSet<string>();
        var resolutions = Screen.resolutions;

        for (int i = 0; i < resolutions.Length; i++)
        {
            Resolution r = resolutions[i];
            string key = $"{r.width}x{r.height}";
            if (seen.Contains(key))
            {
                continue;
            }

            seen.Add(key);
            _resolutionOptions.Add(r);
            options.Add(key);
        }

        if (options.Count == 0)
        {
            options.Add("1920x1080");
        }

        resolutionDropdown.AddOptions(options);

        int currentIndex = 0;
        for (int i = 0; i < _resolutionOptions.Count; i++)
        {
            if (_resolutionOptions[i].width == Screen.currentResolution.width &&
                _resolutionOptions[i].height == Screen.currentResolution.height)
            {
                currentIndex = i;
                break;
            }
        }

        resolutionDropdown.value = currentIndex;
        resolutionDropdown.RefreshShownValue();
    }

    private void ApplyTabVisual(Button button, bool selected)
    {
        if (button == null) return;

        Image bg = button.targetGraphic as Image;
        if (bg != null)
        {
            bg.color = selected ? tabSelectedColor : tabNormalColor;
        }

        TMP_Text label = button.GetComponentInChildren<TMP_Text>();
        if (label != null)
        {
            label.color = selected ? tabTextSelectedColor : tabTextNormalColor;
        }
    }

    private void RefreshStatsTexts()
    {
        if (healthValueText != null) healthValueText.text = _health.ToString();
        if (codingValueText != null) codingValueText.text = _coding.ToString();
        if (presentationValueText != null) presentationValueText.text = _presentation.ToString();
        if (teamworkValueText != null) teamworkValueText.text = _teamwork.ToString();
        if (luckValueText != null) luckValueText.text = _luck.ToString();
        if (stressValueText != null) stressValueText.text = _stress.ToString();
    }

    private void TryBindStatsManager()
    {
        if (_statsBound || StatsManager.Instance == null)
        {
            return;
        }

        StatsManager.Instance.OnStatsChanged += HandleStatsChanged;
        _statsBound = true;
        HandleStatsChanged(StatsManager.Instance.CurrentStats);
        Debug.Log("[EscapeMenuUI] Bound to StatsManager");
    }

    private void UnbindStatsManager()
    {
        if (!_statsBound || StatsManager.Instance == null)
        {
            return;
        }

        StatsManager.Instance.OnStatsChanged -= HandleStatsChanged;
        _statsBound = false;
    }

    private void HandleStatsChanged(PlayerStats stats)
    {
        if (stats == null)
        {
            return;
        }

        SetStats(
            stats.hp,
            stats.coding,
            stats.presentation,
            stats.teamwork,
            stats.luck,
            stats.stress
        );
    }

    private void RefreshAudioValueText()
    {
        if (bgmValueText != null && bgmSlider != null) bgmValueText.text = Mathf.RoundToInt(bgmSlider.value * 100f) + "%";
        if (sfxValueText != null && sfxSlider != null) sfxValueText.text = Mathf.RoundToInt(sfxSlider.value * 100f) + "%";
        if (ambienceValueText != null && ambienceSlider != null) ambienceValueText.text = Mathf.RoundToInt(ambienceSlider.value * 100f) + "%";
    }

    private void SetKeyStatus(string message)
    {
        if (keyStatusText != null)
        {
            keyStatusText.text = message;
        }
    }

    private bool EscapePressed()
    {
#if ENABLE_INPUT_SYSTEM
        return Keyboard.current != null && Keyboard.current.escapeKey.wasPressedThisFrame;
#else
        return Input.GetKeyDown(KeyCode.Escape);
#endif
    }
}
