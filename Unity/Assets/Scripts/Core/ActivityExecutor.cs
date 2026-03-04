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

        var manager = StatsManager.EnsureInstance();

        Debug.Log($"[ActivityExecutor] DoActivity: {activity.activityName}");
        manager.ApplyDelta(activity.delta);
    }
}
