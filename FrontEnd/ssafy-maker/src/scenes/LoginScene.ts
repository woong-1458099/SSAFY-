import Phaser from "phaser";
import { SceneKey } from "@shared/enums/sceneKey";
import { GAME_CONSTANTS } from "@core/constants/gameConstants";

type AuthView = "login" | "signup" | "findId" | "findPw";

export class LoginScene extends Phaser.Scene {
  private enterKey?: Phaser.Input.Keyboard.Key;
  private root?: Phaser.GameObjects.DOMElement;
  private submitHandler?: () => void;
  private currentView: AuthView = "login";
  private suggestedLoginId = "";

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
    this.add.rectangle(this.px(GAME_CONSTANTS.WIDTH / 2), this.px(GAME_CONSTANTS.HEIGHT / 2), GAME_CONSTANTS.WIDTH, GAME_CONSTANTS.HEIGHT, 0x081525, 1);
    for (let i = 0; i < 16; i += 1) {
      this.add.circle(Phaser.Math.Between(0, GAME_CONSTANTS.WIDTH), Phaser.Math.Between(0, GAME_CONSTANTS.HEIGHT), Phaser.Math.Between(60, 140), 0x0f2b43, 0.22);
    }
  }

  private buildAuthLayout(): void {
    const html = `
      <div style="width:1120px;height:640px;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,0.9fr);gap:24px;align-items:stretch;font-family:'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif;">
        <section style="position:relative;overflow:hidden;box-sizing:border-box;height:100%;border:1px solid rgba(133,187,222,0.18);border-radius:28px;background:rgba(5,14,24,0.80);box-shadow:0 24px 90px rgba(0,0,0,0.32);padding:34px 36px;">
          <p style="margin:0 0 10px;color:#6be6ff;font-size:12px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;">SSAFY Maker</p>
          <h1 style="margin:0;color:#f4fbff;font-size:62px;line-height:0.94;">로그인하고<br/>싸피생 키우기</h1>
          <p style="margin:18px 0 0;color:#b6c5d3;font-size:16px;line-height:1.5;">기존 로그인 UI 흐름 그대로 계정 확인 후 게임에 입장합니다. 미니게임은 게임 내 NPC와 대화하여 시작합니다.</p>
          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:28px;">
            <article style="padding:14px;border-radius:16px;background:linear-gradient(180deg,rgba(15,33,52,0.86),rgba(7,18,30,0.92));border:1px solid rgba(120,193,231,0.12);">
              <span style="display:inline-block;margin-bottom:10px;color:#7ce8ff;font-weight:700;">01</span>
              <strong style="display:block;margin-bottom:8px;color:#f4fbff;">로그인</strong>
              <p style="margin:0;color:#9baebe;font-size:13px;">아이디/비밀번호 인증</p>
            </article>
            <article style="padding:14px;border-radius:16px;background:linear-gradient(180deg,rgba(15,33,52,0.86),rgba(7,18,30,0.92));border:1px solid rgba(120,193,231,0.12);">
              <span style="display:inline-block;margin-bottom:10px;color:#7ce8ff;font-weight:700;">02</span>
              <strong style="display:block;margin-bottom:8px;color:#f4fbff;">육성 플레이</strong>
              <p style="margin:0;color:#9baebe;font-size:13px;">싸피생 키우기 진입</p>
            </article>
            <article style="padding:14px;border-radius:16px;background:linear-gradient(180deg,rgba(15,33,52,0.86),rgba(7,18,30,0.92));border:1px solid rgba(120,193,231,0.12);">
              <span style="display:inline-block;margin-bottom:10px;color:#7ce8ff;font-weight:700;">03</span>
              <strong style="display:block;margin-bottom:8px;color:#f4fbff;">NPC 미니게임</strong>
              <p style="margin:0;color:#9baebe;font-size:13px;">대화로 센터 입장</p>
            </article>
          </div>
        </section>
        <section style="position:relative;overflow:hidden;display:flex;flex-direction:column;min-height:0;box-sizing:border-box;height:100%;border:1px solid rgba(133,187,222,0.18);border-radius:28px;background:rgba(5,14,24,0.80);box-shadow:0 24px 90px rgba(0,0,0,0.32);padding:24px;">
          <div style="margin-bottom:10px;">
            <p style="margin:0 0 6px;color:#6be6ff;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">Player Access</p>
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

    if (!title || !message || !form || !submit) return;

    const viewTitle: Record<AuthView, string> = {
      login: "로그인",
      signup: "회원가입",
      findId: "아이디 찾기",
      findPw: "비밀번호 찾기"
    };

    const setMessage = (text: string, tone: "info" | "success" | "error" = "info"): void => {
      message.textContent = text;
      if (tone === "success") {
        message.style.background = "rgba(24,105,78,0.36)";
        message.style.color = "#97f5d3";
      } else if (tone === "error") {
        message.style.background = "rgba(126,44,63,0.34)";
        message.style.color = "#ffb4c2";
      } else {
        message.style.background = "rgba(40,66,92,0.48)";
        message.style.color = "#c4dae9";
      }
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
          ${this.renderInput("login-id", "아이디", "아이디 입력", this.suggestedLoginId)}
          ${this.renderInput("login-pw", "비밀번호", "비밀번호 입력", "", "password")}
        `;
        submit.textContent = "로그인";
        setMessage("로그인 후 게임에 입장할 수 있습니다.", "info");
        node.querySelector<HTMLInputElement>("#login-id")?.focus();
      } else if (view === "signup") {
        form.innerHTML = `
          ${this.renderInput("signup-id", "아이디", "아이디")}
          ${this.renderInput("signup-nick", "닉네임", "닉네임")}
          ${this.renderInput("signup-email", "이메일", "email@example.com")}
          ${this.renderInput("signup-pw", "비밀번호", "8자 이상", "", "password")}
          ${this.renderInput("signup-pw2", "비밀번호 확인", "비밀번호 재입력", "", "password")}
        `;
        submit.textContent = "회원가입";
        setMessage("정보를 입력하면 가입 후 로그인 탭으로 이동합니다.", "info");
      } else if (view === "findId") {
        form.innerHTML = `
          ${this.renderInput("findid-nick", "닉네임", "닉네임")}
          ${this.renderInput("findid-email", "이메일", "email@example.com")}
        `;
        submit.textContent = "아이디 찾기";
        setMessage("가입한 닉네임/이메일로 아이디를 확인합니다.", "info");
      } else {
        form.innerHTML = `
          ${this.renderInput("findpw-id", "아이디", "아이디")}
          ${this.renderInput("findpw-email", "이메일", "email@example.com")}
        `;
        submit.textContent = "비밀번호 찾기";
        setMessage("아이디/이메일 확인 후 재설정 안내를 제공합니다.", "info");
      }
    };

    const onSubmit = (): void => {
      if (this.currentView === "login") {
        const id = node.querySelector<HTMLInputElement>("#login-id")?.value.trim() ?? "";
        const pw = node.querySelector<HTMLInputElement>("#login-pw")?.value.trim() ?? "";
        if (!id || !pw) {
          setMessage("아이디와 비밀번호를 모두 입력해 주세요.", "error");
          return;
        }
        this.registry.set("authUser", { loginId: id, nickname: id });
        this.time.delayedCall(0, () => {
          this.scene.start(SceneKey.Start);
        });
        return;
      }

      if (this.currentView === "signup") {
        const id = node.querySelector<HTMLInputElement>("#signup-id")?.value.trim() ?? "";
        const nick = node.querySelector<HTMLInputElement>("#signup-nick")?.value.trim() ?? "";
        const email = node.querySelector<HTMLInputElement>("#signup-email")?.value.trim() ?? "";
        const pw = node.querySelector<HTMLInputElement>("#signup-pw")?.value ?? "";
        const pw2 = node.querySelector<HTMLInputElement>("#signup-pw2")?.value ?? "";

        if (!id || !nick || !email || !pw || !pw2) {
          setMessage("회원가입 항목을 모두 입력해 주세요.", "error");
          return;
        }
        if (pw.length < 8) {
          setMessage("비밀번호는 8자 이상이어야 합니다.", "error");
          return;
        }
        if (pw !== pw2) {
          setMessage("비밀번호 확인이 일치하지 않습니다.", "error");
          return;
        }

        this.suggestedLoginId = id;
        renderView("login");
        setMessage(`${id} 계정이 생성되었습니다. 로그인해 주세요.`, "success");
        return;
      }

      if (this.currentView === "findId") {
        const nick = node.querySelector<HTMLInputElement>("#findid-nick")?.value.trim() ?? "";
        const email = node.querySelector<HTMLInputElement>("#findid-email")?.value.trim() ?? "";
        if (!nick || !email) {
          setMessage("닉네임과 이메일을 입력해 주세요.", "error");
          return;
        }
        setMessage("일치하는 정보가 있으면 아이디 안내를 발송했습니다.", "success");
        return;
      }

      const id = node.querySelector<HTMLInputElement>("#findpw-id")?.value.trim() ?? "";
      const email = node.querySelector<HTMLInputElement>("#findpw-email")?.value.trim() ?? "";
      if (!id || !email) {
        setMessage("아이디와 이메일을 입력해 주세요.", "error");
        return;
      }
      setMessage("비밀번호 재설정 링크를 발송했습니다.", "success");
    };

    tabs.forEach((tab) => {
      const view = tab.dataset.view as AuthView;
      tab.addEventListener("click", () => renderView(view));
    });
    submit.addEventListener("click", onSubmit);

    this.submitHandler = onSubmit;
    renderView("login");

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      submit.removeEventListener("click", onSubmit);
      this.root?.destroy();
      this.root = undefined;
      this.submitHandler = undefined;
    });
  }

  private renderInput(id: string, label: string, placeholder: string, value = "", type = "text"): string {
    return `
      <label style="display:flex;flex-direction:column;gap:6px;color:#d2deea;font-size:14px;">
        ${label}
        <input id="${id}" type="${type}" value="${this.escapeHtml(value)}" placeholder="${this.escapeHtml(placeholder)}"
          style="width:100%;padding:12px 14px;border:1px solid rgba(134,185,219,0.16);border-radius:14px;background:rgba(12,23,35,0.90);color:#f4fbff;outline:none;box-sizing:border-box;" />
      </label>
    `;
  }

  private escapeHtml(value: string): string {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;").replaceAll("'", "&#39;");
  }

  private px(value: number): number {
    return Math.round(value);
  }
}

