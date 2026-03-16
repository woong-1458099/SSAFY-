import Phaser from "phaser";
import { GAME_CONSTANTS } from "@core/constants/gameConstants";
import { beginBackendAuth, clearStoredSession, completeAuthIfPresent, readStoredSession } from "@features/auth/authSession";
import { fetchCurrentUser } from "@features/auth/api";
import { SceneKey } from "@shared/enums/sceneKey";

type AuthView = "login" | "signup" | "findId" | "findPw";
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
          <h1 style="margin:0;color:#f4fbff;font-size:62px;line-height:0.94;">로그인하고<br/>싸피생 키우기</h1>
          <p style="margin:18px 0 0;color:#b6c5d3;font-size:16px;line-height:1.5;">기존 로그인 화면 감성을 유지하면서, 실제 인증은 백엔드가 관리하는 페이지에서 안전하게 처리합니다. 로그인 또는 회원가입을 완료하면 게임으로 바로 돌아옵니다.</p>
          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:28px;">
            <article style="padding:14px;border-radius:16px;background:linear-gradient(180deg,rgba(15,33,52,0.86),rgba(7,18,30,0.92));border:1px solid rgba(120,193,231,0.12);">
              <span style="display:inline-block;margin-bottom:10px;color:#7ce8ff;font-weight:700;">01</span>
              <strong style="display:block;margin-bottom:8px;color:#f4fbff;">로그인</strong>
              <p style="margin:0;color:#9baebe;font-size:13px;">백엔드 인증 페이지로 이동</p>
            </article>
            <article style="padding:14px;border-radius:16px;background:linear-gradient(180deg,rgba(15,33,52,0.86),rgba(7,18,30,0.92));border:1px solid rgba(120,193,231,0.12);">
              <span style="display:inline-block;margin-bottom:10px;color:#7ce8ff;font-weight:700;">02</span>
              <strong style="display:block;margin-bottom:8px;color:#f4fbff;">인증 완료</strong>
              <p style="margin:0;color:#9baebe;font-size:13px;">백엔드에서 세션 확인 및 사용자 정보 동기화</p>
            </article>
            <article style="padding:14px;border-radius:16px;background:linear-gradient(180deg,rgba(15,33,52,0.86),rgba(7,18,30,0.92));border:1px solid rgba(120,193,231,0.12);">
              <span style="display:inline-block;margin-bottom:10px;color:#7ce8ff;font-weight:700;">03</span>
              <strong style="display:block;margin-bottom:8px;color:#f4fbff;">게임 입장</strong>
              <p style="margin:0;color:#9baebe;font-size:13px;">인증 후 바로 싸피생 키우기 진입</p>
            </article>
          </div>
        </section>
        <section style="position:relative;overflow:hidden;display:flex;flex-direction:column;min-height:0;box-sizing:border-box;height:100%;border:1px solid rgba(133,187,222,0.18);border-radius:28px;background:rgba(5,14,24,0.80);box-shadow:0 24px 90px rgba(0,0,0,0.32);padding:24px;">
          <div style="margin-bottom:10px;">
            <p style="margin:0 0 6px;color:#6be6ff;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">게임 입장</p>
            <h2 style="margin:0;color:#f4fbff;font-size:34px;" id="auth-title">로그인</h2>
          </div>
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;" id="auth-tabs">
            <button data-view="login" style="padding:12px;border-radius:14px;border:0;cursor:pointer;background:rgba(55,95,128,0.95);color:#f4fbff;">로그인</button>
            <button data-view="signup" style="padding:12px;border-radius:14px;border:0;cursor:pointer;background:rgba(21,33,48,0.86);color:#c0cfdb;">회원가입</button>
            <button data-view="findId" style="padding:12px;border-radius:14px;border:0;cursor:pointer;background:rgba(21,33,48,0.86);color:#c0cfdb;">아이디 찾기</button>
            <button data-view="findPw" style="padding:12px;border-radius:14px;border:0;cursor:pointer;background:rgba(21,33,48,0.86);color:#c0cfdb;">비밀번호 찾기</button>
          </div>
          <div id="auth-msg" style="margin-top:12px;padding:12px;border-radius:14px;background:rgba(40,66,92,0.48);color:#c4dae9;font-size:14px;">로그인 후 게임에 입장할 수 있습니다.</div>
          <div id="auth-form" style="margin-top:12px;display:flex;flex-direction:column;gap:10px;flex:1 1 auto;min-height:0;overflow-y:auto;padding-right:6px;scrollbar-width:thin;"></div>
          <button id="auth-submit" type="button" style="margin-top:14px;display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:0 20px;border-radius:14px;border:0;background:linear-gradient(135deg,#4cd5ff,#1387c9);color:#031019;font-size:16px;font-weight:700;cursor:pointer;">로그인</button>
          
          <!-- 로컬 우회 테스트용 버튼 -->
          <button id="auth-bypass" type="button" style="margin-top:14px;display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:0 20px;border-radius:14px;border:1px solid #ffcc00;background:rgba(255,204,0,0.15);color:#ffcc00;font-size:16px;font-weight:700;cursor:pointer;">[ 개발용 ] 백엔드 없이 바로 접속하기</button>
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
    const bypassBtn = node.querySelector<HTMLButtonElement>("#auth-bypass"); // 우회 버튼

    if (!title || !message || !form || !submit || !bypassBtn) {
      return;
    }

    const viewTitle: Record<AuthView, string> = {
      login: "로그인",
      signup: "회원가입",
      findId: "아이디 찾기",
      findPw: "비밀번호 찾기"
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
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="padding:14px;border-radius:16px;border:1px solid rgba(120,193,231,0.12);background:rgba(12,23,35,0.90);color:#9fb8ca;line-height:1.6;">
              로그인은 백엔드가 관리하는 인증 페이지에서 진행됩니다. 아이디와 비밀번호 입력, 검증, 세션 발급은 게임 클라이언트가 아닌 인증 서버에서 처리합니다.
            </div>
            <div style="padding:14px;border-radius:16px;border:1px solid rgba(120,193,231,0.12);background:rgba(8,18,29,0.92);color:#cfe0eb;line-height:1.6;">
              아래 <strong style="color:#f4fbff;">로그인</strong> 버튼을 누르면 인증 페이지로 이동한 뒤, 인증이 완료되면 다시 게임으로 돌아옵니다.
            </div>
          </div>
        `;
        submit.textContent = "로그인";
        submit.disabled = false;
        submit.style.opacity = "1";
        submit.style.cursor = "pointer";
        setMessage("로그인 후 게임에 입장할 수 있습니다.", "info");
        return;
      }

      if (view === "signup") {
        form.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="padding:14px;border-radius:16px;border:1px solid rgba(120,193,231,0.12);background:rgba(12,23,35,0.90);color:#9fb8ca;line-height:1.6;">
              회원가입은 백엔드가 연결한 등록 페이지에서 진행됩니다. 계정 생성과 인증 절차는 외부 인증 페이지에서 처리됩니다.
            </div>
            <div style="padding:14px;border-radius:16px;border:1px solid rgba(120,193,231,0.12);background:rgba(8,18,29,0.92);color:#cfe0eb;line-height:1.6;">
              아래 <strong style="color:#f4fbff;">회원가입</strong> 버튼을 누르면 가입 페이지로 이동합니다. 가입을 마치면 로그인 후 게임에 들어올 수 있습니다.
            </div>
          </div>
        `;
        submit.textContent = "회원가입";
        submit.disabled = false;
        submit.style.opacity = "1";
        submit.style.cursor = "pointer";
        setMessage("회원가입 후 로그인하여 게임에 입장할 수 있습니다.", "info");
        return;
      }

      form.innerHTML = `
        <div style="padding:18px;border-radius:16px;border:1px solid rgba(120,193,231,0.12);background:rgba(12,23,35,0.90);color:#d2deea;line-height:1.6;">
          ${view === "findId"
            ? "현재 인증 구조에서는 별도의 아이디 찾기 기능 대신, 가입한 계정 정보나 인증 서비스 정책에 따라 아이디를 확인해야 합니다."
            : "비밀번호 재설정은 게임 내부 입력창이 아니라 인증 서비스의 재설정 페이지에서 제공하는 방식으로 연결되어야 합니다."}
        </div>
      `;
      submit.textContent = "준비 중";
      setMessage("현재 클라이언트에서는 로그인과 회원가입만 연결되어 있습니다.", "info");
      submit.disabled = false;
      submit.style.opacity = "1";
      submit.style.cursor = "pointer";
    };

    const applySession = (
      accessToken: string,
      refreshToken: string,
      idToken: string | null,
      user: { id: string; email: string }
    ): void => {
      const nickname = user.email.split("@")[0]?.slice(0, 8) ?? "player";

      this.registry.set("authToken", accessToken);
      this.registry.set("authRefreshToken", refreshToken);
      this.registry.set("authIdToken", idToken);
      this.registry.set("authUser", {
        id: user.id,
        email: user.email,
        nickname
      });
    };

    const initializeSession = async (): Promise<void> => {
      setSubmitting(true);
      try {
        const callbackSession = await completeAuthIfPresent();
        if (callbackSession) {
          applySession(
            callbackSession.accessToken,
            callbackSession.refreshToken,
            callbackSession.idToken,
            callbackSession.user
          );
          setMessage("인증이 완료되었습니다. 게임으로 이동합니다.", "success");
          this.time.delayedCall(250, () => this.scene.start(SceneKey.Start));
          return;
        }

        const storedSession = readStoredSession();
        if (storedSession) {
          const currentUser = await fetchCurrentUser(storedSession.accessToken);
          applySession(
            storedSession.accessToken,
            storedSession.refreshToken,
            storedSession.idToken,
            currentUser
          );
          setMessage("기존 세션을 확인했습니다. 게임으로 이동합니다.", "success");
          this.time.delayedCall(150, () => this.scene.start(SceneKey.Start));
          return;
        }

        setMessage("로그인 후 게임에 입장할 수 있습니다.", "info");
      } catch (error) {
        clearStoredSession();
        setMessage(error instanceof Error ? error.message : "인증에 실패했습니다.", "error");
      } finally {
        setSubmitting(false);
      }
    };

    const startAuth = async (action: "login" | "signup"): Promise<void> => {
      setSubmitting(true);
      try {
        setMessage(
          action === "signup"
            ? "회원가입 페이지로 이동합니다."
            : "로그인 페이지로 이동합니다.",
          "info"
        );
        await beginBackendAuth(action);
      } catch (error) {
        setSubmitting(false);
        setMessage(error instanceof Error ? error.message : "인증 시작에 실패했습니다.", "error");
      }
    };

    const handleSubmit = async (): Promise<void> => {
      if (this.currentView === "findId" || this.currentView === "findPw") {
        setMessage("현재 클라이언트에서는 로그인과 회원가입만 연결되어 있습니다.", "info");
        return;
      }

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

    // 로컬 접속 기능 바인딩
    const onBypassClick = () => {
      setMessage("백엔드 인증 없이 더미 계정으로 게임에 진입합니다.", "success");
      
      this.registry.set("authToken", "dummy-bypass-token");
      this.registry.set("authRefreshToken", "dummy-refresh-token");
      this.registry.set("authIdToken", "dummy-id-token");
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
    void initializeSession();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
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
