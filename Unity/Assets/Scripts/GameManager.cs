using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;

public class GameManager : MonoBehaviour
{
    [SerializeField] private TextMeshProUGUI statText;

    private bool _isSubscribed;

    private void Awake()
    {
        StatsManager.EnsureInstance();
    }

    private void OnEnable()
    {
        TrySubscribe();
    }

    private void Start()
    {
        if (statText == null)
        {
            statText = Object.FindFirstObjectByType<TextMeshProUGUI>();
            Debug.LogWarning($"[GameManager] statText was null. Auto-bound to: {(statText != null ? statText.name : "null")}");
        }

        Debug.Log($"[GameManager] Start in scene: {SceneManager.GetActiveScene().name}");
        if (StatsManager.Instance != null)
        {
            Render(StatsManager.Instance.CurrentStats);
        }
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
        _isSubscribed = false;
    }

    public void Study()
    {
        Debug.Log("[GameManager] Study button clicked");
        StatsManager.EnsureInstance().ApplyDelta(new StatDelta
        {
            hp = -3,
            coding = 10,
            stress = 5
        });
    }

    public void Rest()
    {
        Debug.Log("[GameManager] Rest button clicked");
        StatsManager.EnsureInstance().ApplyDelta(new StatDelta
        {
            hp = 5,
            stress = -5
        });
    }

    public void TeamProject()
    {
        Debug.Log("[GameManager] TeamProject button clicked");
        StatsManager.EnsureInstance().ApplyDelta(new StatDelta
        {
            coding = 5,
            teamwork = 3,
            stress = 10
        });
    }

    public void Snack()
    {
        Debug.Log("[GameManager] Snack button clicked");
        StatsManager.EnsureInstance().ApplyDelta(new StatDelta
        {
            hp = 3,
            teamwork = 1,
            stress = -2
        });
    }

    private void TrySubscribe()
    {
        if (_isSubscribed || StatsManager.Instance == null) return;
        StatsManager.Instance.OnStatsChanged += HandleStatsChanged;
        _isSubscribed = true;
        Render(StatsManager.Instance.CurrentStats);
    }

    private void HandleStatsChanged(PlayerStats stats)
    {
        Render(stats);
    }

    private void Render(PlayerStats stats)
    {
        if (statText == null || stats == null)
        {
            return;
        }

        statText.text =
            "Health: " + stats.hp + "/" + stats.maxHP + "\n" +
            "Knowledge: " + stats.coding + "\n" +
            "Stress: " + stats.stress + "\n" +
            "Affinity: " + stats.teamwork;
    }
}
