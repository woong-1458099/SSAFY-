using UnityEngine;

[RequireComponent(typeof(Collider2D))]
public class InteractableZone : MonoBehaviour
{
    [SerializeField] private string actionName = "Action";
    [SerializeField] private StatDelta delta;
    [SerializeField] private bool oneTimeUse;

    private bool _used;

    public string ActionName => actionName;

    private void Reset()
    {
        var col = GetComponent<Collider2D>();
        col.isTrigger = true;
    }

    public bool TryInteract()
    {
        if (_used)
        {
            return false;
        }

        var manager = StatsManager.EnsureInstance();
        manager.ApplyDelta(delta);
        Debug.Log($"[InteractableZone] Interacted: {actionName}");

        if (oneTimeUse)
        {
            _used = true;
        }

        return true;
    }
}
