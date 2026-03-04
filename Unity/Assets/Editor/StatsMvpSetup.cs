using UnityEditor;
using UnityEditor.Events;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using TMPro;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem.UI;
#endif

public static class StatsMvpSetup
{
    private const string DataFolder = "Assets/StatsData";

    [MenuItem("Tools/Stats/Create MVP Setup")]
    public static void CreateMvpSetup()
    {
        EnsureFolder(DataFolder);

        var statsManagerGo = GetOrCreate("StatsManager");
        if (statsManagerGo.GetComponent<StatsManager>() == null)
        {
            statsManagerGo.AddComponent<StatsManager>();
        }

        var executorGo = GetOrCreate("ActivityExecutor");
        var executor = executorGo.GetComponent<ActivityExecutor>() ?? executorGo.AddComponent<ActivityExecutor>();

        var canvas = GetOrCreateCanvas();
        EnsureEventSystem();

        var statsText = GetOrCreateStatsText(canvas.transform);
        var statsUi = statsText.GetComponent<StatsUI>() ?? statsText.gameObject.AddComponent<StatsUI>();
        statsUi.statsText = statsText;

        var lecture = CreateOrUpdateActivity("Lecture", "Lecture", "Boosts coding/presentation, adds stress", new StatDelta
        {
            coding = 3,
            presentation = 1,
            stress = 5,
            hp = -2
        });

        var exercise = CreateOrUpdateActivity("Exercise", "Exercise", "Increases max HP and stress", new StatDelta
        {
            maxHP = 5,
            stress = 5
        });

        var teamProject = CreateOrUpdateActivity("TeamProject", "Team Project", "Boosts teamwork/presentation, adds stress", new StatDelta
        {
            teamwork = 4,
            presentation = 2,
            stress = 7,
            coding = 1
        });

        var rest = CreateOrUpdateActivity("Rest", "Rest", "Recovers HP and reduces stress", new StatDelta
        {
            stress = -10,
            hp = 8
        });

        var buttonsRoot = GetOrCreateButtonsRoot(canvas.transform);
        CreateOrUpdateButton(buttonsRoot, "LectureBtn", "Lecture", executor, lecture, 0);
        CreateOrUpdateButton(buttonsRoot, "ExerciseBtn", "Exercise", executor, exercise, 1);
        CreateOrUpdateButton(buttonsRoot, "TeamProjectBtn", "Team Project", executor, teamProject, 2);
        CreateOrUpdateButton(buttonsRoot, "RestBtn", "Rest", executor, rest, 3);

        EditorSceneManager.MarkSceneDirty(EditorSceneManager.GetActiveScene());
        AssetDatabase.SaveAssets();
        Debug.Log("Stats MVP setup complete.");
    }

    private static void EnsureFolder(string path)
    {
        if (AssetDatabase.IsValidFolder(path)) return;

        var parent = "Assets";
        var parts = path.Split('/');
        for (int i = 1; i < parts.Length; i++)
        {
            var current = parent + "/" + parts[i];
            if (!AssetDatabase.IsValidFolder(current))
            {
                AssetDatabase.CreateFolder(parent, parts[i]);
            }
            parent = current;
        }
    }

    private static GameObject GetOrCreate(string name)
    {
        var go = GameObject.Find(name);
        if (go != null) return go;
        return new GameObject(name);
    }

    private static Canvas GetOrCreateCanvas()
    {
        var canvas = Object.FindFirstObjectByType<Canvas>();
        if (canvas != null) return canvas;

        var go = new GameObject("Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
        canvas = go.GetComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        return canvas;
    }

    private static void EnsureEventSystem()
    {
        var es = Object.FindFirstObjectByType<EventSystem>();
        if (es == null)
        {
#if ENABLE_INPUT_SYSTEM
            new GameObject("EventSystem", typeof(EventSystem), typeof(InputSystemUIInputModule));
#else
            new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
#endif
            return;
        }

#if ENABLE_INPUT_SYSTEM
        var legacy = es.GetComponent<StandaloneInputModule>();
        if (legacy != null)
        {
            Object.DestroyImmediate(legacy);
        }

        if (es.GetComponent<InputSystemUIInputModule>() == null)
        {
            es.gameObject.AddComponent<InputSystemUIInputModule>();
        }
#else
        if (es.GetComponent<StandaloneInputModule>() == null)
        {
            es.gameObject.AddComponent<StandaloneInputModule>();
        }
#endif
    }

    private static TextMeshProUGUI GetOrCreateStatsText(Transform parent)
    {
        var existing = GameObject.Find("StatsText");
        if (existing != null)
        {
            return existing.GetComponent<TextMeshProUGUI>();
        }

        var go = new GameObject("StatsText", typeof(RectTransform), typeof(TextMeshProUGUI));
        go.transform.SetParent(parent, false);

        var rect = go.GetComponent<RectTransform>();
        rect.anchorMin = new Vector2(0f, 1f);
        rect.anchorMax = new Vector2(0f, 1f);
        rect.pivot = new Vector2(0f, 1f);
        rect.anchoredPosition = new Vector2(20f, -20f);
        rect.sizeDelta = new Vector2(260f, 220f);

        var tmp = go.GetComponent<TextMeshProUGUI>();
        tmp.fontSize = 24;
        tmp.alignment = TextAlignmentOptions.TopLeft;
        tmp.text = "HP 0/0\nCoding 0\nPresentation 0\nTeamwork 0\nLuck 0\nStress 0/100";

        return tmp;
    }

    private static Transform GetOrCreateButtonsRoot(Transform parent)
    {
        var existing = GameObject.Find("ActivityButtons");
        if (existing != null) return existing.transform;

        var go = new GameObject("ActivityButtons", typeof(RectTransform));
        go.transform.SetParent(parent, false);

        var rect = go.GetComponent<RectTransform>();
        rect.anchorMin = new Vector2(0f, 1f);
        rect.anchorMax = new Vector2(0f, 1f);
        rect.pivot = new Vector2(0f, 1f);
        rect.anchoredPosition = new Vector2(320f, -20f);
        rect.sizeDelta = new Vector2(200f, 240f);

        return rect.transform;
    }

    private static void CreateOrUpdateButton(Transform parent, string name, string label, ActivityExecutor executor, ActivityData data, int index)
    {
        GameObject go = GameObject.Find(name);
        if (go == null)
        {
            go = new GameObject(name, typeof(RectTransform), typeof(CanvasRenderer), typeof(Image), typeof(Button));
            go.transform.SetParent(parent, false);

            var textGo = new GameObject("Text", typeof(RectTransform), typeof(TextMeshProUGUI));
            textGo.transform.SetParent(go.transform, false);

            var buttonText = textGo.GetComponent<TextMeshProUGUI>();
            buttonText.text = label;
            buttonText.alignment = TextAlignmentOptions.Center;
            buttonText.fontSize = 24;

            var textRect = textGo.GetComponent<RectTransform>();
            textRect.anchorMin = Vector2.zero;
            textRect.anchorMax = Vector2.one;
            textRect.offsetMin = Vector2.zero;
            textRect.offsetMax = Vector2.zero;
        }

        var rect = go.GetComponent<RectTransform>();
        rect.anchorMin = new Vector2(0f, 1f);
        rect.anchorMax = new Vector2(0f, 1f);
        rect.pivot = new Vector2(0f, 1f);
        rect.anchoredPosition = new Vector2(0f, -(index * 60f));
        rect.sizeDelta = new Vector2(180f, 50f);

        var image = go.GetComponent<Image>();
        image.color = new Color(0.2f, 0.5f, 0.9f, 1f);

        var text = go.GetComponentInChildren<TextMeshProUGUI>();
        if (text != null)
        {
            text.text = label;
            text.color = Color.white;
            text.alignment = TextAlignmentOptions.Center;
            text.fontSize = 24;
        }

        var btn = go.GetComponent<Button>();
        while (btn.onClick.GetPersistentEventCount() > 0)
        {
            UnityEventTools.RemovePersistentListener(btn.onClick, 0);
        }
        btn.onClick.RemoveAllListeners();
        UnityEventTools.AddObjectPersistentListener(btn.onClick, executor.DoActivity, data);
    }

    private static ActivityData CreateOrUpdateActivity(string assetName, string displayName, string description, StatDelta delta)
    {
        var path = DataFolder + "/" + assetName + ".asset";
        var data = AssetDatabase.LoadAssetAtPath<ActivityData>(path);
        if (data == null)
        {
            data = ScriptableObject.CreateInstance<ActivityData>();
            AssetDatabase.CreateAsset(data, path);
        }

        data.activityName = displayName;
        data.description = description;
        data.timeCost = 1;
        data.delta = delta;

        EditorUtility.SetDirty(data);
        return data;
    }
}
