using UnityEngine;

[CreateAssetMenu(menuName = "Stats/Activity Data", fileName = "ActivityData")]
public class ActivityData : ScriptableObject
{
    public string activityName;
    [TextArea] public string description;
    public int timeCost = 1;
    public StatDelta delta;
}
