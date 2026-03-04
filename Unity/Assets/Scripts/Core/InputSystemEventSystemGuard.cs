using UnityEngine;
using UnityEngine.EventSystems;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem.UI;
using UnityEngine.SceneManagement;
#endif

public static class InputSystemEventSystemGuard
{
#if ENABLE_INPUT_SYSTEM
    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
    private static void Install()
    {
        SceneManager.sceneLoaded += (_, __) => EnsureAllEventSystemsUseInputSystem();
        EnsureAllEventSystemsUseInputSystem();
    }

    private static void EnsureAllEventSystemsUseInputSystem()
    {
        var systems = Object.FindObjectsOfType<EventSystem>(true);
        foreach (var es in systems)
        {
            var modules = es.GetComponents<BaseInputModule>();
            foreach (var module in modules)
            {
                if (module is InputSystemUIInputModule)
                {
                    continue;
                }

                module.enabled = false;
                Object.Destroy(module);
            }

            var inputSystemModule = es.GetComponent<InputSystemUIInputModule>();
            if (inputSystemModule == null)
            {
                inputSystemModule = es.gameObject.AddComponent<InputSystemUIInputModule>();
            }

            if (inputSystemModule.actionsAsset == null ||
                inputSystemModule.point?.action == null ||
                inputSystemModule.leftClick?.action == null)
            {
                inputSystemModule.AssignDefaultActions();
            }

            Debug.Log($"[InputGuard] EventSystem '{es.name}' module ready. point={inputSystemModule.point?.action != null}, leftClick={inputSystemModule.leftClick?.action != null}");
        }
    }
#endif
}
