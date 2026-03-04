using System;
using UnityEngine;

[Serializable]
public class PlayerStats
{
    [Header("Health")]
    public int maxHP = 100;
    public int hp = 100;

    [Header("Skills")]
    public int coding = 0;
    public int presentation = 0;
    public int teamwork = 0;

    [Header("Etc")]
    [Range(0, 100)]
    public int luck = 1;
    [Range(0, 100)]
    public int stress = 0;

    public void ClampAll()
    {
        if (maxHP < 1) maxHP = 1;
        hp = Mathf.Clamp(hp, 0, maxHP);
        coding = Mathf.Max(0, coding);
        presentation = Mathf.Max(0, presentation);
        teamwork = Mathf.Max(0, teamwork);
        luck = Mathf.Clamp(luck, 0, 100);
        stress = Mathf.Clamp(stress, 0, 100);
    }
}
