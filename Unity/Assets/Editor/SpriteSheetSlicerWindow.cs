using System.Collections.Generic;
using UnityEditor;
using UnityEditor.U2D.Sprites;
using UnityEngine;

public class SpriteSheetSlicerWindow : EditorWindow
{
    private const string DefaultPath = "Assets/Sprites/Full Asset_tempt.png";

    private Texture2D targetTexture;
    private int cellWidth = 32;
    private int cellHeight = 32;
    private int offsetX;
    private int offsetY;
    private int paddingX;
    private int paddingY;

    [MenuItem("Tools/Sprites/Slice Selected Texture")]
    private static void Open()
    {
        GetWindow<SpriteSheetSlicerWindow>("Sprite Slicer");
    }

    [MenuItem("Assets/Sprites/Slice Selected Texture", false, 2000)]
    private static void SliceFromAssetsMenu()
    {
        Open();
    }

    private void OnGUI()
    {
        EditorGUILayout.LabelField("Grid Slice Settings", EditorStyles.boldLabel);
        targetTexture = (Texture2D)EditorGUILayout.ObjectField("Target Texture", targetTexture, typeof(Texture2D), false);
        cellWidth = Mathf.Max(1, EditorGUILayout.IntField("Cell Width", cellWidth));
        cellHeight = Mathf.Max(1, EditorGUILayout.IntField("Cell Height", cellHeight));
        offsetX = Mathf.Max(0, EditorGUILayout.IntField("Offset X", offsetX));
        offsetY = Mathf.Max(0, EditorGUILayout.IntField("Offset Y", offsetY));
        paddingX = Mathf.Max(0, EditorGUILayout.IntField("Padding X", paddingX));
        paddingY = Mathf.Max(0, EditorGUILayout.IntField("Padding Y", paddingY));

        EditorGUILayout.Space();
        EditorGUILayout.HelpBox("Assign Target Texture or select a PNG in Project and click Slice.", MessageType.Info);

        if (GUILayout.Button("Slice Selected Texture"))
        {
            SliceSelectedTexture();
        }
    }

    private void SliceSelectedTexture()
    {
        var texture = ResolveTexture();
        if (texture == null)
        {
            Debug.LogError("[SpriteSlicer] Texture not found. Set 'Target Texture' or select a PNG.");
            return;
        }

        var path = AssetDatabase.GetAssetPath(texture);
        var importer = AssetImporter.GetAtPath(path) as TextureImporter;
        if (importer == null)
        {
            Debug.LogError($"[SpriteSlicer] TextureImporter not found: {path}");
            return;
        }

        importer.textureType = TextureImporterType.Sprite;
        importer.spriteImportMode = SpriteImportMode.Multiple;
        importer.alphaIsTransparency = true;
        importer.SaveAndReimport();

        var spriteRects = BuildSpriteRects(texture);

        var factory = new SpriteDataProviderFactories();
        factory.Init();
        var dataProvider = factory.GetSpriteEditorDataProviderFromObject(importer);
        if (dataProvider == null)
        {
            Debug.LogError("[SpriteSlicer] Sprite data provider is not available.");
            return;
        }

        dataProvider.InitSpriteEditorDataProvider();
        dataProvider.SetSpriteRects(spriteRects.ToArray());

        dataProvider.Apply();
        importer.SaveAndReimport();
        AssetDatabase.Refresh();

        Debug.Log($"[SpriteSlicer] Done: {spriteRects.Count} sprites ({path}, {texture.width}x{texture.height}, cell {cellWidth}x{cellHeight})");
    }

    private Texture2D ResolveTexture()
    {
        if (targetTexture != null)
        {
            return targetTexture;
        }

        var active = Selection.activeObject;
        if (active != null)
        {
            var selectedPath = AssetDatabase.GetAssetPath(active);
            if (!string.IsNullOrEmpty(selectedPath))
            {
                var fromSelected = AssetDatabase.LoadAssetAtPath<Texture2D>(selectedPath);
                if (fromSelected != null)
                {
                    targetTexture = fromSelected;
                    return fromSelected;
                }
            }
        }

        var fallback = AssetDatabase.LoadAssetAtPath<Texture2D>(DefaultPath);
        if (fallback != null)
        {
            targetTexture = fallback;
        }
        return fallback;
    }

    private List<SpriteRect> BuildSpriteRects(Texture2D texture)
    {
        var list = new List<SpriteRect>();
        int index = 0;

        for (int y = offsetY; y + cellHeight <= texture.height; y += cellHeight + paddingY)
        {
            for (int x = offsetX; x + cellWidth <= texture.width; x += cellWidth + paddingX)
            {
                list.Add(new SpriteRect
                {
                    name = $"{texture.name}_{index:D4}",
                    rect = new Rect(x, texture.height - y - cellHeight, cellWidth, cellHeight),
                    alignment = SpriteAlignment.Center,
                    pivot = new Vector2(0.5f, 0.5f),
                    spriteID = GUID.Generate()
                });
                index++;
            }
        }

        return list;
    }
}
