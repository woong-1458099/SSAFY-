import Phaser from "phaser";
import { GAME_CONSTANTS } from "@core/constants/gameConstants";
import { getAuthBootstrapState } from "@features/auth/AuthGateway";
import { getBackendApiStatus } from "@features/auth/api";
import {
  beginBackendAuth,
  clearPendingAuthRedirect,
  clearStoredSession,
  hasPendingAuthRedirect
} from "@features/auth/authSession";
import {
  DeathDashboardUnavailableError,
  fetchDeathDashboard,
  type DeathRankingEntry,
  type DeathRecordEvent
} from "@features/death/deathApi";
import { SceneKey } from "@shared/enums/sceneKey";

type AuthView = "login" | "signup";
type MessageTone = "info" | "success" | "error";

export class LoginScene extends Phaser.Scene {
  private enterKey?: Phaser.Input.Keyboard.Key;
  private root?: Phaser.GameObjects.DOMElement;
  private submitHandler?: () => void;
  private currentView: AuthView = "login";

  constructor() {
    super(SceneKey.Login);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#070f1a");
    this.drawBackground();
    this.buildAuthLayout();
    this.enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  update(): void {
    if (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.submitHandler?.();
    }
  }

  private drawBackground(): void {
    this.add.rectangle(
      this.px(GAME_CONSTANTS.WIDTH / 2),
      this.px(GAME_CONSTANTS.HEIGHT / 2),
      GAME_CONSTANTS.WIDTH,
      GAME_CONSTANTS.HEIGHT,
      0x081525,
      1
    );

    for (let i = 0; i < 16; i += 1) {
      this.add.circle(
        Phaser.Math.Between(0, GAME_CONSTANTS.WIDTH),
        Phaser.Math.Between(0, GAME_CONSTANTS.HEIGHT),
        Phaser.Math.Between(60, 140),
        0x0f2b43,
        0.22
      );
    }
  }

  private buildAuthLayout(): void {
    const html = `
      <div style="width:1120px;height:640px;display:grid;grid-template-columns:minmax(0,1.02fr) minmax(0,0.98fr);gap:24px;align-items:stretch;font-family:'PFStardustBold','Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif;">
        <section style="position:relative;overflow:hidden;box-sizing:border-box;height:100%;border:1px solid rgba(133,187,222,0.18);border-radius:28px;background:
          radial-gradient(circle at 18% 18%,rgba(73,170,215,0.22),transparent 34%),
          linear-gradient(180deg,#0b1620 0%,#081118 100%);box-shadow:0 24px 90px rgba(0,0,0,0.32);">
          <video autoplay muted loop playsinline preload="auto" poster="/assets/raw/TTPP.mp4" style="position:absolute;left:0;bottom:0;width:100%;height:100%;object-fit:cover;object-position:center bottom;filter:saturate(1.02) brightness(0.94) contrast(1.04);" src="/assets/raw/TTPP.mp4"></video>
          <div style="position:absolute;inset:0;background:
            linear-gradient(180deg,rgba(4,11,20,0.06) 0%,rgba(4,11,20,0.18) 34%,rgba(4,11,20,0.52) 100%),
            linear-gradient(90deg,rgba(6,18,28,0.28) 0%,rgba(6,18,28,0.10) 54%,rgba(6,18,28,0.20) 100%);"></div>
          <div style="position:relative;z-index:1;display:flex;flex-direction:column;height:100%;padding:24px 24px 28px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
              <div style="padding:8px 12px;border-radius:999px;background:rgba(9,24,36,0.44);backdrop-filter:blur(8px);border:1px solid rgba(133,187,222,0.16);color:#d9eef8;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">Death Dashboard</div>
              <div style="padding:7px 11px;border-radius:999px;background:rgba(9,24,36,0.30);backdrop-filter:blur(8px);border:1px solid rgba(133,187,222,0.12);color:#a9d8ea;font-size:11px;">실시간 사망 집계</div>
            </div>
            <div style="margin-top:18px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;min-height:0;max-width:760px;">
              <article style="display:flex;flex-direction:column;min-height:0;">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;">
                  <div>
                    <p style="margin:0 0 4px;color:#7ce8ff;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">Recent Deaths</p>
                    <strong style="color:#f4fbff;font-size:20px;">최근 사망자</strong>
                  </div>
                  <span style="padding:6px 10px;border-radius:999px;background:rgba(201,74,97,0.16);color:#ffd2dc;font-size:11px;">시점 포함</span>
                </div>
                <div id="death-recent-list" style="display:flex;flex-direction:column;gap:10px;min-height:0;max-height:210px;overflow-y:auto;padding-right:4px;scrollbar-width:thin;color:#e7f4ff;">
                  <div style="padding:12px 0;border-bottom:1px solid rgba(120,193,231,0.16);color:#d4e7f1;">사망 기록을 불러오는 중입니다.</div>
                </div>
              </article>
              <article style="display:flex;flex-direction:column;min-height:0;">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;">
                  <div>
                    <p style="margin:0 0 4px;color:#7ce8ff;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">Death Ranking</p>
                    <strong style="color:#f4fbff;font-size:20px;">사망 카운트 랭킹</strong>
                  </div>
                  <span style="padding:6px 10px;border-radius:999px;background:rgba(92,166,255,0.14);color:#d4e9ff;font-size:11px;">TOP 순위</span>
                </div>
                <div id="death-ranking-list" style="display:flex;flex-direction:column;gap:10px;min-height:0;max-height:210px;overflow-y:auto;padding-right:4px;scrollbar-width:thin;color:#e7f4ff;">
                  <div style="padding:12px 0;border-bottom:1px solid rgba(120,193,231,0.16);color:#d4e7f1;">랭킹을 불러오는 중입니다.</div>
                </div>
              </article>
            </div>
          </div>
        </section>
        <section style="position:relative;overflow:hidden;display:flex;flex-direction:column;min-height:0;box-sizing:border-box;height:100%;border:1px solid rgba(133,187,222,0.18);border-radius:28px;background:rgba(5,14,24,0.80);box-shadow:0 24px 90px rgba(0,0,0,0.32);padding:24px;">
          <div style="margin-bottom:16px;padding-top:8px;">
            <p style="margin:0 0 10px;color:#7ce8ff;font-size:12px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;">SSAFY Maker</p>
            <h1 style="margin:0;color:#f4fbff;font-size:46px;line-height:1.04;">SSAFY 1학기,<br/>당신의 엔딩 만들기</h1>
            <p style="max-width:420px;margin:14px 0 0;color:#d5e5ef;font-size:15px;line-height:1.6;">로그인 후 한 학기 육성 시뮬레이션을 시작하세요. 좌측에서는 최근 탈락 기록과 누적 사망 랭킹을 바로 확인할 수 있습니다.</p>
          </div>
          <div style="margin-bottom:10px;padding-top:16px;border-top:1px solid rgba(133,187,222,0.14);">
            <p style="margin:0 0 6px;color:#6be6ff;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">학기 시작</p>
            <h2 style="margin:0;color:#f4fbff;font-size:32px;line-height:1.05;" id="auth-title">로그인</h2>
            <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;" id="auth-tabs">
              <button data-view="login" style="min-height:46px;padding:10px 12px;border-radius:14px;border:0;cursor:pointer;background:rgba(55,95,128,0.95);color:#f4fbff;">로그인</button>
              <button data-view="signup" style="min-height:46px;padding:10px 12px;border-radius:14px;border:0;cursor:pointer;background:rgba(21,33,48,0.86);color:#c0cfdb;">회원가입</button>
            </div>
            <div id="auth-msg" style="margin-top:12px;padding:11px 12px;border-radius:14px;background:rgba(40,66,92,0.48);color:#c4dae9;font-size:14px;line-height:1.45;">로그인 후 이번 학기의 주인공으로 입장할 수 있습니다.</div>
            <div id="auth-form" style="margin-top:12px;display:block;flex:0 0 auto;min-height:auto;max-height:none;overflow:hidden;padding-right:0;"></div>
          </div>
          <button id="auth-submit" type="button" style="margin-top:14px;display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;border-radius:14px;border:0;background:linear-gradient(135deg,#4cd5ff,#1387c9);color:#031019;font-size:16px;font-weight:700;cursor:pointer;">로그인</button>
          <button id="auth-bypass" type="button" style="margin-top:14px;display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;border-radius:14px;border:1px solid #ffcc00;background:rgba(255,204,0,0.15);color:#ffcc00;font-size:16px;font-weight:700;cursor:pointer;">[개발용] 인증 없이 입장</button>
        </section>
      </div>
    `;

    this.root = this.add
      .dom(this.px(GAME_CONSTANTS.WIDTH / 2), this.px(GAME_CONSTANTS.HEIGHT / 2))
      .createFromHTML(html);
    const node = this.root.node as HTMLDivElement;

    const tabs = Array.from(node.querySelectorAll<HTMLButtonElement>("#auth-tabs button[data-view]"));
    const title = node.querySelector<HTMLElement>("#auth-title");
    const message = node.querySelector<HTMLElement>("#auth-msg");
    const form = node.querySelector<HTMLElement>("#auth-form");
    const recentList = node.querySelector<HTMLElement>("#death-recent-list");
    const rankingList = node.querySelector<HTMLElement>("#death-ranking-list");
    const submit = node.querySelector<HTMLButtonElement>("#auth-submit");
    const bypassBtn = node.querySelector<HTMLButtonElement>("#auth-bypass");

    if (!title || !message || !form || !recentList || !rankingList || !submit || !bypassBtn) {
      return;
    }

    form.style.display = "block";
    form.style.flex = "0 0 auto";
    form.style.minHeight = "auto";
    form.style.maxHeight = "none";
    form.style.overflow = "hidden";
    form.style.paddingRight = "0";

    let destroyed = false;

    const viewTitle: Record<AuthView, string> = {
      login: "로그인",
      signup: "회원가입"
    };

    const renderRecentDeaths = (entries: DeathRecordEvent[]): void => {
      if (entries.length === 0) {
        recentList.innerHTML = `
          <div style="padding:12px 0;border-bottom:1px solid rgba(120,193,231,0.16);color:#bfd2de;">
            아직 기록된 사망 이력이 없습니다.
          </div>
        `;
        return;
      }

      recentList.innerHTML = entries
        .map(
          (entry) => `
            <div style="padding:12px 0;border-bottom:1px solid rgba(120,193,231,0.14);">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
                <strong style="color:#f4fbff;font-size:15px;">${this.getPlayerLabel(entry.username, entry.userId)}</strong>
                <span style="color:#ffd2dc;font-size:12px;">${entry.deathCountSnapshot}회차</span>
              </div>
              <div style="margin-top:6px;color:#dbeaf2;font-size:13px;">${this.formatDashboardTimestamp(entry.diedAt)}</div>
              <div style="margin-top:6px;color:#afc2cf;font-size:12px;">${this.getDeathContextLabel(entry.areaId, entry.sceneId, entry.cause)}</div>
            </div>
          `
        )
        .join("");
    };

    const renderDeathRanking = (entries: DeathRankingEntry[]): void => {
      if (entries.length === 0) {
        rankingList.innerHTML = `
          <div style="padding:12px 0;border-bottom:1px solid rgba(120,193,231,0.16);color:#bfd2de;">
            아직 집계된 사망 랭킹이 없습니다.
          </div>
        `;
        return;
      }

      rankingList.innerHTML = entries
        .map(
          (entry, index) => `
            <div style="display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(120,193,231,0.14);">
              <span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:999px;background:${index < 3 ? "rgba(108,231,255,0.14)" : "rgba(88,107,126,0.18)"};color:${index < 3 ? "#c9fbff" : "#c9d5de"};font-size:12px;">${index + 1}</span>
              <div style="min-width:0;">
                <strong style="display:block;color:#f4fbff;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this.getPlayerLabel(entry.username, entry.userId)}</strong>
                <span style="display:block;margin-top:4px;color:#b4c5d1;font-size:12px;">${
                  entry.lastDeathAt
                    ? `마지막 사망 ${this.formatDashboardTimestamp(entry.lastDeathAt)}`
                    : "마지막 사망 기록 없음"
                }</span>
              </div>
              <strong style="color:#ffd2dc;font-size:16px;">${entry.deathCount}회</strong>
            </div>
          `
        )
        .join("");
    };

    const renderDashboardError = (target: HTMLElement, text: string): void => {
      target.innerHTML = `
        <div style="padding:12px 0;border-bottom:1px solid rgba(214,98,128,0.28);color:#ffd0d8;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${text}
        </div>
      `;
    };

    const renderDashboardUnavailable = (): void => {
      recentList.innerHTML = `
        <div style="padding:12px 0;border-bottom:1px solid rgba(120,193,231,0.16);color:#bfd2de;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          백엔드 연결 대기 중입니다.
        </div>
      `;
      rankingList.innerHTML = `
        <div style="padding:12px 0;border-bottom:1px solid rgba(120,193,231,0.16);color:#bfd2de;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          백엔드 연결 대기 중입니다.
        </div>
      `;
    };

    const loadDeathDashboard = async (): Promise<void> => {
      if (getBackendApiStatus() === "unavailable") {
        renderDashboardUnavailable();
        return;
      }

      try {
        const dashboard = await fetchDeathDashboard({ recentLimit: 8, rankingLimit: 8 });
        if (destroyed) {
          return;
        }

        renderRecentDeaths(dashboard.recentDeaths);
        renderDeathRanking(dashboard.topDeathCounts);
      } catch (error) {
        if (destroyed) {
          return;
        }

        if (
          getBackendApiStatus() === "unavailable" ||
          error instanceof DeathDashboardUnavailableError
        ) {
          renderDashboardUnavailable();
          return;
        }

        renderDashboardError(recentList, "최근 사망자 기록을 불러오지 못했습니다.");
        renderDashboardError(rankingList, "사망 랭킹을 불러오지 못했습니다.");
        console.error("[LoginScene] failed to load death dashboard", error);
      }
    };

    const setMessage = (text: string, tone: MessageTone = "info"): void => {
      message.textContent = text;
      if (tone === "success") {
        message.style.background = "rgba(24,105,78,0.36)";
        message.style.color = "#97f5d3";
        return;
      }
      if (tone === "error") {
        message.style.background = "rgba(126,44,63,0.34)";
        message.style.color = "#ffb4c2";
        return;
      }
      message.style.background = "rgba(40,66,92,0.48)";
      message.style.color = "#c4dae9";
    };

    const setSubmitting = (isSubmitting: boolean): void => {
      submit.disabled = isSubmitting;
      submit.style.opacity = isSubmitting ? "0.72" : "1";
      submit.style.cursor = isSubmitting ? "progress" : "pointer";
    };

    const restoreAuthUiAfterNavigation = (): void => {
      const authResult = new URL(window.location.href).searchParams.get("auth");
      if (!hasPendingAuthRedirect() || authResult === "success") {
        return;
      }

      clearPendingAuthRedirect();
      setSubmitting(false);
      setMessage("로그인 화면으로 돌아왔습니다. 다시 시도할 수 있습니다.", "info");
    };

    const renderView = (view: AuthView): void => {
      this.currentView = view;
      title.textContent = viewTitle[view];
      tabs.forEach((tab) => {
        const active = tab.dataset.view === view;
        tab.style.background = active ? "rgba(55,95,128,0.95)" : "rgba(21,33,48,0.86)";
        tab.style.color = active ? "#f4fbff" : "#c0cfdb";
      });

      if (view === "login") {
        form.innerHTML = `
          <div style="display:block;overflow:hidden;padding:14px;border-radius:16px;border:1px solid rgba(120,193,231,0.12);background:rgba(12,23,35,0.90);color:#9fb8ca;line-height:1.6;white-space:normal;word-break:keep-all;overflow-wrap:anywhere;">
            로그인 후 시작 화면에서 새 게임이나 이어하기를 선택할 수 있습니다. 세션이 확인되면 한 학기 육성 시뮬레이션으로 바로 이어집니다.
          </div>
        `;
        submit.textContent = "로그인";
        setMessage("로그인 후 캐릭터를 선택하고 SSAFY 1학기를 시작하세요.", "info");
        return;
      }

      form.innerHTML = `
        <div style="display:block;overflow:hidden;padding:14px;border-radius:16px;border:1px solid rgba(120,193,231,0.12);background:rgba(12,23,35,0.90);color:#9fb8ca;line-height:1.6;white-space:normal;word-break:keep-all;overflow-wrap:anywhere;">
            계정을 만들면 캐릭터 선택, 일정 관리, 미니게임, 랜덤 이벤트가 이어지는 첫 학기 플레이를 바로 시작할 수 있습니다.
        </div>
      `;
      submit.textContent = "회원가입";
      setMessage("회원가입 후 나만의 능력치 빌드와 엔딩 루트를 시작할 수 있습니다.", "info");
    };

    const initializeSession = (): void => {
      setSubmitting(true);
      const authBootstrap = getAuthBootstrapState();

      if (authBootstrap.authenticated && this.registry.get("authToken")) {
        setMessage(
          authBootstrap.source === "callback"
            ? "인증이 완료되었습니다. 게임으로 이동합니다."
            : "기존 세션을 확인했습니다. 게임으로 이동합니다.",
          "success"
        );
        this.time.delayedCall(
          authBootstrap.source === "callback" ? 250 : 150,
          () => this.scene.start(SceneKey.Start)
        );
        return;
      }

      if (authBootstrap.source === "error") {
        clearPendingAuthRedirect();
        clearStoredSession();
        setMessage(authBootstrap.error ?? "인증 처리에 실패했습니다.", "error");
        setSubmitting(false);
        return;
      }

      setMessage("로그인 후 이번 학기의 주인공으로 입장할 수 있습니다.", "info");
      setSubmitting(false);
    };

    const startAuth = async (action: "login" | "signup"): Promise<void> => {
      setSubmitting(true);
      try {
        setMessage(action === "signup" ? "회원가입 화면으로 이동합니다." : "로그인 화면으로 이동합니다.", "info");
        await beginBackendAuth(action);
      } catch (error) {
        setSubmitting(false);
        setMessage(error instanceof Error ? error.message : "인증 시작에 실패했습니다.", "error");
      }
    };

    const handleSubmit = async (): Promise<void> => {
      await startAuth(this.currentView === "signup" ? "signup" : "login");
    };

    const onSubmitClick = (): void => {
      void handleSubmit();
    };

    tabs.forEach((tab) => {
      const view = tab.dataset.view as AuthView;
      tab.addEventListener("click", () => {
        renderView(view);
      });
    });
    submit.addEventListener("click", onSubmitClick);

    const onBypassClick = () => {
      setMessage("개발용 로컬 계정으로 입장합니다.", "success");
      this.registry.set("authToken", "dummy-bypass-token");
      this.registry.set("authUser", {
        id: "local_test_user_001",
        email: "tester@ssafy.com",
        nickname: "테스터"
      });

      this.time.delayedCall(250, () => this.scene.start(SceneKey.Start));
    };
    bypassBtn.addEventListener("click", onBypassClick);

    this.submitHandler = onSubmitClick;
    renderView("login");
    initializeSession();
    void loadDeathDashboard();

    const onPageShow = (): void => {
      restoreAuthUiAfterNavigation();
    };
    const onWindowFocus = (): void => {
      restoreAuthUiAfterNavigation();
    };

    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("focus", onWindowFocus);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      destroyed = true;
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("focus", onWindowFocus);
      submit.removeEventListener("click", onSubmitClick);
      bypassBtn.removeEventListener("click", onBypassClick);
      this.root?.destroy();
      this.root = undefined;
      this.submitHandler = undefined;
    });
  }

  private px(value: number): number {
    return Math.round(value);
  }

  private formatDashboardTimestamp(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(date);
  }

  private getPlayerLabel(username: string | null, userId: string): string {
    const trimmedName = username?.trim();
    if (trimmedName) {
      return trimmedName;
    }

    return `player-${userId.slice(0, 8)}`;
  }

  private getDeathContextLabel(
    areaId: string | null,
    sceneId: string | null,
    cause: string | null
  ): string {
    const parts = [areaId, sceneId, cause]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .map((value) => value.trim());

    if (parts.length === 0) {
      return "사망 위치 정보 없음";
    }

    return parts.join(" / ");
  }
}
