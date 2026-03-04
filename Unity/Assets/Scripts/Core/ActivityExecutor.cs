using UnityEngine;

public class ActivityExecutor : MonoBehaviour
{
    public void DoActivity(ActivityData activity)
    {
        if (activity == null)
        {
            Debug.LogWarning("[ActivityExecutor] Activity is null.");
            return;
        }

        if (StatsManager.Instance == null)
        {
            var go = new GameObject("StatsManager");
            go.AddComponent<StatsManager>();
            Debug.LogWarning("[ActivityExecutor] StatsManager was missing and has been created at runtime.");
        }

        Debug.Log($"[ActivityExecutor] DoActivity: {activity.activityName}");
        StatsManager.Instance.ApplyDelta(activity.delta);
    }
}
