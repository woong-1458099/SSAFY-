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
          <h1 style="margin:0;color:#f4fbff;font-size:58px;line-height:0.98;">BFF sign-in<br/>for the game client</h1>
          <p style="margin:18px 0 0;color:#b6c5d3;font-size:16px;line-height:1.5;">The client now starts auth through the backend. Credentials are entered on the hosted auth page, while the backend handles the code exchange and returns a short-lived auth ticket to the game.</p>
          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:28px;">
            <article style="padding:14px;border-radius:16px;background:linear-gradient(180deg,rgba(15,33,52,0.86),rgba(7,18,30,0.92));border:1px solid rgba(120,193,231,0.12);">
              <span style="display:inline-block;margin-bottom:10px;color:#7ce8ff;font-weight:700;">01</span>
              <strong style="display:block;margin-bottom:8px;color:#f4fbff;">Redirect</strong>
              <p style="margin:0;color:#9baebe;font-size:13px;">Send the player to the hosted login or registration page through the backend auth gateway.</p>
            </article>
            <article style="padding:14px;border-radius:16px;background:linear-gradient(180deg,rgba(15,33,52,0.86),rgba(7,18,30,0.92));border:1px solid rgba(120,193,231,0.12);">
              <span style="display:inline-block;margin-bottom:10px;color:#7ce8ff;font-weight:700;">02</span>
              <strong style="display:block;margin-bottom:8px;color:#f4fbff;">BFF Callback</strong>
              <p style="margin:0;color:#9baebe;font-size:13px;">The backend validates the callback, exchanges the code, and issues a one-time auth ticket for the client.</p>
            </article>
            <article style="padding:14px;border-radius:16px;background:linear-gradient(180deg,rgba(15,33,52,0.86),rgba(7,18,30,0.92));border:1px solid rgba(120,193,231,0.12);">
              <span style="display:inline-block;margin-bottom:10px;color:#7ce8ff;font-weight:700;">03</span>
              <strong style="display:block;margin-bottom:8px;color:#f4fbff;">Bootstrap</strong>
              <p style="margin:0;color:#9baebe;font-size:13px;">The client redeems the backend ticket, stores the session, and syncs the local user profile.</p>
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
          <div id="auth-msg" style="margin-top:12px;padding:12px;border-radius:14px;background:rgba(40,66,92,0.48);color:#c4dae9;font-size:14px;">Use the hosted auth page to authenticate.</div>
          <div id="auth-form" style="margin-top:12px;display:flex;flex-direction:column;gap:10px;flex:1 1 auto;min-height:0;overflow-y:auto;padding-right:6px;scrollbar-width:thin;"></div>
          <button id="auth-submit" type="button" style="margin-top:14px;display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:0 20px;border-radius:14px;border:0;background:linear-gradient(135deg,#4cd5ff,#1387c9);color:#031019;font-size:16px;font-weight:700;cursor:pointer;">Login</button>
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
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="padding:14px;border-radius:16px;border:1px solid rgba(120,193,231,0.12);background:rgba(12,23,35,0.90);color:#9fb8ca;line-height:1.6;">
              Login immediately redirects to the hosted auth page. Credentials are entered and verified there, not inside the game client.
            </div>
            <div style="padding:14px;border-radius:16px;border:1px solid rgba(120,193,231,0.12);background:rgba(8,18,29,0.92);color:#cfe0eb;line-height:1.6;">
              Click the top <strong style="color:#f4fbff;">Login</strong> button or the action button below to start the backend-managed OIDC login flow.
            </div>
          </div>
        `;
        submit.textContent = "Login";
        submit.disabled = false;
        submit.style.opacity = "1";
        submit.style.cursor = "pointer";
        setMessage("Login starts immediately on the hosted auth page.", "info");
        return;
      }

      if (view === "signup") {
        form.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="padding:14px;border-radius:16px;border:1px solid rgba(120,193,231,0.12);background:rgba(12,23,35,0.90);color:#9fb8ca;line-height:1.6;">
              Signup immediately redirects to the hosted registration page. Account creation, email verification, and token issuance are all handled there.
            </div>
            <div style="padding:14px;border-radius:16px;border:1px solid rgba(120,193,231,0.12);background:rgba(8,18,29,0.92);color:#cfe0eb;line-height:1.6;">
              Click the top <strong style="color:#f4fbff;">Signup</strong> button or the action button below to open the backend-managed registration flow.
            </div>
          </div>
        `;
        submit.textContent = "Signup";
        submit.disabled = false;
        submit.style.opacity = "1";
        submit.style.cursor = "pointer";
        setMessage("Signup starts immediately on the hosted auth page.", "info");
        return;
      }

      form.innerHTML = `
        <div style="padding:18px;border-radius:16px;border:1px solid rgba(120,193,231,0.12);background:rgba(12,23,35,0.90);color:#d2deea;line-height:1.6;">
          ${view === "findId"
            ? "If email is the login identifier, a separate find-id feature is usually unnecessary."
            : "Password recovery should use the hosted reset-credentials page instead of a custom in-game form."}
        </div>
      `;
      submit.textContent = "Coming Soon";
      setMessage("Only backend-managed login and signup are wired right now.", "info");
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
          setMessage("Authentication completed. Moving into the game.", "success");
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
          setMessage("Existing session verified. Moving into the game.", "success");
          this.time.delayedCall(150, () => this.scene.start(SceneKey.Start));
          return;
        }

        setMessage("Use the hosted auth page to authenticate.", "info");
      } catch (error) {
        clearStoredSession();
        setMessage(error instanceof Error ? error.message : "Authentication failed", "error");
      } finally {
        setSubmitting(false);
      }
    };

    const startAuth = async (action: "login" | "signup"): Promise<void> => {
      setSubmitting(true);
      try {
        setMessage(
          action === "signup"
            ? "Redirecting to the hosted registration page."
            : "Redirecting to the hosted login page.",
          "info"
        );
        await beginBackendAuth(action);
      } catch (error) {
        setSubmitting(false);
        setMessage(error instanceof Error ? error.message : "Failed to start backend auth", "error");
      }
    };

    const handleSubmit = async (): Promise<void> => {
      if (this.currentView === "findId" || this.currentView === "findPw") {
        setMessage("Only backend-managed login and signup are available in the client right now.", "info");
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
        if (view === "login" || view === "signup") {
          void startAuth(view);
        }
      });
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
