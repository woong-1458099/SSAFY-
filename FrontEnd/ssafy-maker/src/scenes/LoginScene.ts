import Phaser from "phaser";
import { GAME_CONSTANTS } from "@core/constants/gameConstants";
import { getAuthBootstrapState } from "@features/auth/AuthGateway";
import {
  beginBackendAuth,
  clearPendingAuthRedirect,
  clearStoredSession,
  hasPendingAuthRedirect
} from "@features/auth/authSession";
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
      <div style="width:1120px;height:640px;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,0.9fr);gap:24px;align-items:stretch;font-family:'PFStardustBold','Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif;">
        <section style="position:relative;overflow:hidden;box-sizing:border-box;height:100%;border:1px solid rgba(133,187,222,0.18);border-radius:28px;background:rgba(5,14,24,0.80);box-shadow:0 24px 90px rgba(0,0,0,0.32);padding:34px 36px;">
          <p style="margin:0 0 10px;color:#6be6ff;font-size:12px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;">SSAFY Maker</p>
          <h1 style="margin:0;color:#f4fbff;font-size:62px;line-height:0.94;">SSAFY 1학기,<br/>당신의 엔딩 만들기</h1>
          <p style="margin:18px 0 0;color:#b6c5d3;font-size:16px;line-height:1.5;">6명의 개성 있는 교육생 중 한 명이 되어 강의장, 번화가, 자취방을 오가며 학습, 체력, 멘탈, 친밀도를 키우세요. 한 학기 동안의 선택이 어떤 개발자 엔딩으로 이어질지 결정합니다.</p>
          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:28px;">
            <article style="padding:14px;border-radius:16px;background:linear-gradient(180deg,rgba(15,33,52,0.86),rgba(7,18,30,0.92));border:1px solid rgba(120,193,231,0.12);">
              <span style="display:inline-block;margin-bottom:10px;color:#7ce8ff;font-weight:700;">01</span>
              <strong style="display:block;margin-bottom:8px;color:#f4fbff;">캐릭터와 성장</strong>
              <p style="margin:0;color:#9baebe;font-size:13px;">코딩형, 체력형, 행운형 등 서로 다른 성향의 주인공으로 1학기를 시작합니다.</p>
            </article>
            <article style="padding:14px;border-radius:16px;background:linear-gradient(180deg,rgba(15,33,52,0.86),rgba(7,18,30,0.92));border:1px solid rgba(120,193,231,0.12);">
              <span style="display:inline-block;margin-bottom:10px;color:#7ce8ff;font-weight:700;">02</span>
              <strong style="display:block;margin-bottom:8px;color:#f4fbff;">일정과 선택</strong>
              <p style="margin:0;color:#9baebe;font-size:13px;">평일 강의는 버티고, 방과 후와 주말엔 원하는 활동으로 능력치를 설계합니다.</p>
            </article>
            <article style="padding:14px;border-radius:16px;background:linear-gradient(180deg,rgba(15,33,52,0.86),rgba(7,18,30,0.92));border:1px solid rgba(120,193,231,0.12);">
              <span style="display:inline-block;margin-bottom:10px;color:#7ce8ff;font-weight:700;">03</span>
              <strong style="display:block;margin-bottom:8px;color:#f4fbff;">미니게임과 엔딩</strong>
              <p style="margin:0;color:#9baebe;font-size:13px;">퀴즈, 타이핑, 웃음참기와 랜덤 이벤트를 거쳐 자신만의 결말에 도달합니다.</p>
            </article>
          </div>
        </section>
        <section style="position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;height:100%;border:1px solid rgba(133,187,222,0.18);border-radius:28px;background:rgba(5,14,24,0.80);box-shadow:0 24px 90px rgba(0,0,0,0.32);padding:22px;">
          <div style="display:flex;flex-direction:column;gap:10px;">
            <p style="margin:0 0 6px;color:#6be6ff;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">학기 시작</p>
            <h2 style="margin:0;color:#f4fbff;font-size:32px;line-height:1.05;" id="auth-title">로그인</h2>
            <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;" id="auth-tabs">
              <button data-view="login" style="min-height:46px;padding:10px 12px;border-radius:14px;border:0;cursor:pointer;background:rgba(55,95,128,0.95);color:#f4fbff;">로그인</button>
              <button data-view="signup" style="min-height:46px;padding:10px 12px;border-radius:14px;border:0;cursor:pointer;background:rgba(21,33,48,0.86);color:#c0cfdb;">회원가입</button>
            </div>
            <div id="auth-msg" style="padding:11px 12px;border-radius:14px;background:rgba(40,66,92,0.48);color:#c4dae9;font-size:14px;line-height:1.45;">로그인 후 이번 학기의 주인공으로 입장할 수 있습니다.</div>
            <div id="auth-form" style="display:flex;flex-direction:column;gap:10px;"></div>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px;padding-top:16px;">
            <button id="auth-submit" type="button" style="display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;border-radius:14px;border:0;background:linear-gradient(135deg,#4cd5ff,#1387c9);color:#031019;font-size:16px;font-weight:700;cursor:pointer;">로그인</button>
            <button id="auth-bypass" type="button" style="display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;border-radius:14px;border:1px solid #ffcc00;background:rgba(255,204,0,0.15);color:#ffcc00;font-size:16px;font-weight:700;cursor:pointer;">[개발용] 인증 없이 입장</button>
          </div>
        </section>
      </div>
    `;

    this.root = this.add.dom(this.px(GAME_CONSTANTS.WIDTH / 2), this.px(GAME_CONSTANTS.HEIGHT / 2)).createFromHTML(html);
    const node = this.root.node as HTMLDivElement;

    const tabs = Array.from(node.querySelectorAll<HTMLButtonElement>("#auth-tabs button[data-view]"));
    const title = node.querySelector<HTMLElement>("#auth-title");
    const message = node.querySelector<HTMLElement>("#auth-msg");
    const form = node.querySelector<HTMLElement>("#auth-form");
    const submit = node.querySelector<HTMLButtonElement>("#auth-submit");
    const bypassBtn = node.querySelector<HTMLButtonElement>("#auth-bypass");

    if (!title || !message || !form || !submit || !bypassBtn) {
      return;
    }

    form.style.display = "block";
    form.style.flex = "0 0 auto";
    form.style.minHeight = "auto";
    form.style.maxHeight = "none";
    form.style.overflow = "hidden";
    form.style.paddingRight = "0";

    const viewTitle: Record<AuthView, string> = {
      login: "로그인",
      signup: "회원가입"
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

      if (view === "signup") {
        form.innerHTML = `
          <div style="display:block;overflow:hidden;padding:14px;border-radius:16px;border:1px solid rgba(120,193,231,0.12);background:rgba(12,23,35,0.90);color:#9fb8ca;line-height:1.6;white-space:normal;word-break:keep-all;overflow-wrap:anywhere;">
            계정을 만들면 캐릭터 선택, 일정 관리, 미니게임, 랜덤 이벤트가 이어지는 첫 학기 플레이를 바로 시작할 수 있습니다.
          </div>
        `;
        submit.textContent = "회원가입";
        setMessage("회원가입 후 나만의 능력치 빌드와 엔딩 루트를 시작할 수 있습니다.", "info");
        return;
      }

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
        this.time.delayedCall(authBootstrap.source === "callback" ? 250 : 150, () => this.scene.start(SceneKey.Start));
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

    const onPageShow = (): void => {
      restoreAuthUiAfterNavigation();
    };
    const onWindowFocus = (): void => {
      restoreAuthUiAfterNavigation();
    };

    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("focus", onWindowFocus);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
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
}
