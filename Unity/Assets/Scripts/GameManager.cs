using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;

public class GameManager : MonoBehaviour
{
    public TextMeshProUGUI statText;

    int health = 50;
    int knowledge = 50;
    int stress = 0;
    int affection = 0;

    void Start()
    {
        if (statText == null)
        {
            statText = FindObjectOfType<TextMeshProUGUI>();
            Debug.LogWarning($"[GameManager] statText was null. Auto-bound to: {(statText != null ? statText.name : "null")}");
        }

        Debug.Log($"[GameManager] Start in scene: {SceneManager.GetActiveScene().name}");
        UpdateUI();
    }

    public void Study()
    {
        Debug.Log("[GameManager] Study button clicked");
        knowledge += 10;
        stress += 5;
        health -= 3;
        UpdateUI();
    }

    public void Rest()
    {
        Debug.Log("[GameManager] Rest button clicked");
        health += 5;
        stress -= 5;
        UpdateUI();
    }

    public void TeamProject()
    {
        Debug.Log("[GameManager] TeamProject button clicked");
        knowledge += 5;
        stress += 10;
        affection += 3;
        UpdateUI();
    }

    public void Snack()
    {
        Debug.Log("[GameManager] Snack button clicked");
        health += 3;
        stress -= 2;
        affection += 1;
        UpdateUI();
    }

    void UpdateUI()
    {
        if (health < 0) health = 0;
        if (stress < 0) stress = 0;

        statText.text =
            "체력: " + health + "\n" +
            "지식: " + knowledge + "\n" +
            "스트레스: " + stress + "\n" +
            "호감도: " + affection;
    }
}
