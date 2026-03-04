using TMPro;
using UnityEngine;

public class StatsUI : MonoBehaviour
{
    public TextMeshProUGUI statsText;

    private bool _gameOver;
    private bool _isSubscribed;

    private void OnEnable()
    {
        TrySubscribe();
    }

    private void Update()
    {
        if (!_isSubscribed)
        {
            TrySubscribe();
        }
    }

    private void OnDisable()
    {
        if (!_isSubscribed || StatsManager.Instance == null) return;
        StatsManager.Instance.OnStatsChanged -= HandleStatsChanged;
        StatsManager.Instance.OnStressGameOver -= HandleStressGameOver;
        _isSubscribed = false;
    }

    private void HandleStatsChanged(PlayerStats s)
    {
        if (statsText == null || s == null) return;

        string text =
            $"HP {s.hp}/{s.maxHP}\n" +
            $"Coding {s.coding}\n" +
            $"Presentation {s.presentation}\n" +
            $"Teamwork {s.teamwork}\n" +
            $"Luck {s.luck}\n" +
            $"Stress {s.stress}/100";

        if (_gameOver)
        {
            text += "\n[GAME OVER] Stress limit reached";
        }

        statsText.text = text;
    }

    private void HandleStressGameOver()
    {
        _gameOver = true;
        if (StatsManager.Instance != null)
        {
            HandleStatsChanged(StatsManager.Instance.stats);
        }
    }

    private void TrySubscribe()
    {
        if (_isSubscribed || StatsManager.Instance == null) return;

        StatsManager.Instance.OnStatsChanged += HandleStatsChanged;
        StatsManager.Instance.OnStressGameOver += HandleStressGameOver;
        _isSubscribed = true;
        HandleStatsChanged(StatsManager.Instance.stats);
    }
}
