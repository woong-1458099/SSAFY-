import Phaser from "phaser";
import { GAME_CONSTANTS } from "@core/constants/gameConstants";
import { beginPkceAuth, completePkceAuthIfPresent, readStoredSession } from "@features/auth/keycloakPkce";
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
      <div style="width:1120px;height:640px;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,0.9fr);gap:24px;align-items:stretch;font-family:'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif;">
        <section style="position:relative;overflow:hidden;box-sizing:border-box;height:100%;border:1px solid rgba(133,187,222,0.18);border-radius:28px;background:rgba(5,14,24,0.80);box-shadow:0 24px 90px rgba(0,0,0,0.32);padding:34px 36px;">
          <p style="margin:0 0 10px;color:#6be6ff;font-size:12px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;">SSAFY Maker</p>
          <h1 style="margin:0;color:#f4fbff;font-size:58px;line-height:0.98;">PKCE sign-in<br/>for the game client</h1>
          <p style="margin:18px 0 0;color:#b6c5d3;font-size:16px;line-height:1.5;">The client now uses Authorization Code with PKCE. Credentials are entered only on the Keycloak hosted page, then the browser exchanges the returned code with a PKCE verifier.</p>
          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:28px;">
            <article style="padding:14px;border-radius:16px;background:linear-gradient(180deg,rgba(15,33,52,0.86),rgba(7,18,30,0.92));border:1px solid rgba(120,193,231,0.12);">
              <span style="display:inline-block;margin-bottom:10px;color:#7ce8ff;font-weight:700;">01</span>
              <strong style="display:block;margin-bottom:8px;color:#f4fbff;">Redirect</strong>
              <p style="margin:0;color:#9baebe;font-size:13px;">Send the player to the Keycloak hosted login or registration page.</p>
            </article>
            <article style="padding:14px;border-radius:16px;background:linear-gradient(180deg,rgba(15,33,52,0.86),rgba(7,18,30,0.92));border:1px solid rgba(120,193,231,0.12);">
              <span style="display:inline-block;margin-bottom:10px;color:#7ce8ff;font-weight:700;">02</span>
              <strong style="display:block;margin-bottom:8px;color:#f4fbff;">PKCE</strong>
              <p style="margin:0;color:#9baebe;font-size:13px;">Validate the callback with a state value and exchange the code using the verifier.</p>
            </article>
            <article style="padding:14px;border-radius:16px;background:linear-gradient(180deg,rgba(15,33,52,0.86),rgba(7,18,30,0.92));border:1px solid rgba(120,193,231,0.12);">
              <span style="display:inline-block;margin-bottom:10px;color:#7ce8ff;font-weight:700;">03</span>
              <strong style="display:block;margin-bottom:8px;color:#f4fbff;">Bootstrap</strong>
              <p style="margin:0;color:#9baebe;font-size:13px;">Call the backend with the issued JWT and sync the local user profile.</p>
            </article>
          </div>
        </section>
        <section style="position:relative;overflow:hidden;display:flex;flex-direction:column;min-height:0;box-sizing:border-box;height:100%;border:1px solid rgba(133,187,222,0.18);border-radius:28px;background:rgba(5,14,24,0.80);box-shadow:0 24px 90px rgba(0,0,0,0.32);padding:24px;">
          <div style="margin-bottom:10px;">
            <p style="margin:0 0 6px;color:#6be6ff;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">Player Access</p>
            <h2 style="margin:0;color:#f4fbff;font-size:34px;" id="auth-title">Login</h2>
          </div>
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;" id="auth-tabs">
            <button data-view="login" style="padding:12px;border-radius:14px;border:0;cursor:pointer;background:rgba(55,95,128,0.95);color:#f4fbff;">Login</button>
            <button data-view="signup" style="padding:12px;border-radius:14px;border:0;cursor:pointer;background:rgba(21,33,48,0.86);color:#c0cfdb;">Signup</button>
            <button data-view="findId" style="padding:12px;border-radius:14px;border:0;cursor:pointer;background:rgba(21,33,48,0.86);color:#c0cfdb;">Find ID</button>
            <button data-view="findPw" style="padding:12px;border-radius:14px;border:0;cursor:pointer;background:rgba(21,33,48,0.86);color:#c0cfdb;">Find Password</button>
          </div>
          <div id="auth-msg" style="margin-top:12px;padding:12px;border-radius:14px;background:rgba(40,66,92,0.48);color:#c4dae9;font-size:14px;">Use the Keycloak hosted page to authenticate.</div>
          <div id="auth-form" style="margin-top:12px;display:flex;flex-direction:column;gap:10px;flex:1 1 auto;min-height:0;overflow-y:auto;padding-right:6px;scrollbar-width:thin;"></div>
          <button id="auth-submit" type="button" style="margin-top:14px;display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:0 20px;border-radius:14px;border:0;background:linear-gradient(135deg,#4cd5ff,#1387c9);color:#031019;font-size:16px;font-weight:700;cursor:pointer;">Continue</button>
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

    if (!title || !message || !form || !submit) {
      return;
    }

    const viewTitle: Record<AuthView, string> = {
      login: "Login",
      signup: "Signup",
      findId: "Find ID",
      findPw: "Find Password"
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
          <div style="padding:18px;border-radius:16px;border:1px solid rgba(120,193,231,0.12);background:rgba(12,23,35,0.90);color:#d2deea;line-height:1.6;">
            Continue to the hosted login page. The browser will return with an authorization code and complete the PKCE exchange inside this client.
          </div>
        `;
        submit.textContent = "Continue to Login";
        setMessage("Use the Keycloak hosted page to authenticate.", "info");
        return;
      }

      if (view === "signup") {
        form.innerHTML = `
          <div style="padding:18px;border-radius:16px;border:1px solid rgba(120,193,231,0.12);background:rgba(12,23,35,0.90);color:#d2deea;line-height:1.6;">
            Continue to the hosted registration page. After the account is created, the client will complete the PKCE callback and then sync the local user profile.
          </div>
        `;
        submit.textContent = "Continue to Signup";
        setMessage("Registration is now handled on the Keycloak side.", "info");
        return;
      }

      form.innerHTML = `
        <div style="padding:18px;border-radius:16px;border:1px solid rgba(120,193,231,0.12);background:rgba(12,23,35,0.90);color:#d2deea;line-height:1.6;">
          ${view === "findId"
            ? "If email is the login identifier, a separate find-id feature is usually unnecessary."
            : "Password recovery should use the Keycloak reset credentials page instead of a custom in-game form."}
        </div>
      `;
      submit.textContent = "Coming Soon";
      setMessage("Only PKCE login and signup are wired right now.", "info");
    };

    const applySession = (accessToken: string, refreshToken: string, user: { id: string; email: string }): void => {
      const nickname = user.email.split("@")[0]?.slice(0, 8) ?? "player";

      this.registry.set("authToken", accessToken);
      this.registry.set("authRefreshToken", refreshToken);
      this.registry.set("authUser", {
        id: user.id,
        email: user.email,
        nickname
      });
    };

    const initializeSession = async (): Promise<void> => {
      setSubmitting(true);
      try {
        const callbackSession = await completePkceAuthIfPresent();
        if (callbackSession) {
          applySession(callbackSession.accessToken, callbackSession.refreshToken, callbackSession.user);
          setMessage("Authentication completed. Moving into the game.", "success");
          this.time.delayedCall(250, () => this.scene.start(SceneKey.Start));
          return;
        }

        const storedSession = readStoredSession();
        if (storedSession) {
          applySession(storedSession.accessToken, storedSession.refreshToken, storedSession.user);
          setMessage("Existing session found. Moving into the game.", "success");
          this.time.delayedCall(150, () => this.scene.start(SceneKey.Start));
          return;
        }

        setMessage("Use the Keycloak hosted page to authenticate.", "info");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Authentication failed", "error");
      } finally {
        setSubmitting(false);
      }
    };

    const handleSubmit = async (): Promise<void> => {
      if (this.currentView === "findId" || this.currentView === "findPw") {
        setMessage("Only PKCE login and signup are wired right now.", "info");
        return;
      }

      setSubmitting(true);
      try {
        await beginPkceAuth(this.currentView === "signup" ? "signup" : "login");
      } catch (error) {
        setSubmitting(false);
        setMessage(error instanceof Error ? error.message : "Failed to start PKCE login", "error");
      }
    };

    const onSubmitClick = (): void => {
      void handleSubmit();
    };

    tabs.forEach((tab) => {
      const view = tab.dataset.view as AuthView;
      tab.addEventListener("click", () => renderView(view));
    });
    submit.addEventListener("click", onSubmitClick);

    this.submitHandler = onSubmitClick;
    renderView("login");
    void initializeSession();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      submit.removeEventListener("click", onSubmitClick);
      this.root?.destroy();
      this.root = undefined;
      this.submitHandler = undefined;
    });
  }

  private px(value: number): number {
    return Math.round(value);
  }
}
