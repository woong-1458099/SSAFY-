using System;
using UnityEngine;

[Serializable]
public struct StatDelta
{
    public int hp;
    public int maxHP;
    public int coding;
    public int presentation;
    public int teamwork;
    public int luck;
    public int stress;
}

public class StatsManager : MonoBehaviour
{
    public static StatsManager Instance { get; private set; }

    [SerializeField] private PlayerStats stats = new PlayerStats();
    public PlayerStats CurrentStats => stats;

    public event Action<PlayerStats> OnStatsChanged;
    public event Action OnStressGameOver;

    private bool _gameOverRaised;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);

        stats.ClampAll();
    }

    public void ApplyDelta(StatDelta d)
    {
        stats.maxHP += d.maxHP;
        stats.hp += d.hp;
        stats.coding += d.coding;
        stats.presentation += d.presentation;
        stats.teamwork += d.teamwork;
        stats.luck += d.luck;
        stats.stress += d.stress;

        stats.ClampAll();
        OnStatsChanged?.Invoke(stats);

        if (!_gameOverRaised && stats.stress >= 100)
        {
            _gameOverRaised = true;
            OnStressGameOver?.Invoke();
        }
    }

    public void EndOfDay()
    {
        ApplyDelta(new StatDelta { hp = 10 });
    }

    public static StatsManager EnsureInstance()
    {
        if (Instance != null)
        {
            return Instance;
        }

        var go = new GameObject("StatsManager");
        return go.AddComponent<StatsManager>();
    }
}
