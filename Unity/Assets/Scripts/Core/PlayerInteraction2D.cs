using UnityEngine;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

[RequireComponent(typeof(Collider2D))]
public class PlayerInteraction2D : MonoBehaviour
{
    [SerializeField] private bool canInteract = true;

    private InteractableZone _currentZone;

    private void Update()
    {
        if (!canInteract || _currentZone == null)
        {
            return;
        }

        if (InteractPressed())
        {
            _currentZone.TryInteract();
        }
    }

    private void OnTriggerEnter2D(Collider2D other)
    {
        var zone = other.GetComponent<InteractableZone>();
        if (zone == null) return;
        _currentZone = zone;
        Debug.Log($"[PlayerInteraction2D] Enter zone: {zone.ActionName}");
    }

    private void OnTriggerExit2D(Collider2D other)
    {
        var zone = other.GetComponent<InteractableZone>();
        if (zone == null) return;

        if (_currentZone == zone)
        {
            Debug.Log($"[PlayerInteraction2D] Exit zone: {zone.ActionName}");
            _currentZone = null;
        }
    }

    private bool InteractPressed()
    {
#if ENABLE_INPUT_SYSTEM
        return Keyboard.current != null && Keyboard.current.eKey.wasPressedThisFrame;
#else
        return Input.GetKeyDown(KeyCode.E);
#endif
    }
}
