import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isAuthConfigured, supabase } from "../lib/supabase";

export type AuthMode = "login" | "signup" | "forgot" | "update-password" | "account";
export type AccountRole = "Passageiro" | "Motorista" | "Parceiro local" | "Universidade";

type AuthDialogProps = {
  open: boolean;
  initialMode: AuthMode;
  initialRole: AccountRole;
  pendingInterest: string;
  user: User | null;
  onClose: () => void;
  onModeChange: (mode: AuthMode) => void;
};

function PasswordInput({
  label,
  value,
  onChange,
  autoComplete,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="auth-field">
      <span>{label}</span>
      <span className="auth-password-wrap">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          minLength={minLength}
          required
        />
        <button type="button" onClick={() => setVisible(!visible)}>
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </span>
    </label>
  );
}

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const normalized = message.toLocaleLowerCase("pt-BR");

  if (normalized.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos. Confira os dados e tente novamente.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Confirme seu e-mail pelo link enviado antes de entrar.";
  }
  if (normalized.includes("password should be at least")) {
    return "Use uma senha mais longa para proteger sua conta.";
  }
  if (normalized.includes("rate limit")) {
    return "Muitas tentativas em pouco tempo. Aguarde um pouco e tente novamente.";
  }

  return "Não foi possível concluir agora. Confira os dados e tente novamente.";
}

export default function AuthDialog({
  open,
  initialMode,
  initialRole,
  pendingInterest,
  user,
  onClose,
  onModeChange,
}: AuthDialogProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [role, setRole] = useState<AccountRole>(initialRole);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (open) {
      setError("");
      setNotice("");
      setPassword("");
      setPasswordConfirm("");
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setRole(initialRole);
    }
  }, [initialMode, initialRole, open]);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  if (!open) return null;

  function changeMode(nextMode: AuthMode) {
    setError("");
    setNotice("");
    setPassword("");
    setPasswordConfirm("");
    setMode(nextMode);
    onModeChange(nextMode);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!isAuthConfigured || !supabase) {
      setError("O serviço de contas ainda não foi configurado para este site.");
      return;
    }

    if (mode === "signup" && password !== passwordConfirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (mode === "update-password" && password !== passwordConfirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const interests = pendingInterest ? [pendingInterest] : [];
        const { data, error: signupError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim(), role, interests },
            emailRedirectTo: window.location.origin,
          },
        });
        if (signupError) throw signupError;

        if (data.session) {
          changeMode("account");
        } else {
          setNotice(
            "Enviamos um link de confirmação para seu e-mail. Confirme o endereço para ativar sua conta.",
          );
          setPassword("");
          setPasswordConfirm("");
          setMode("login");
          onModeChange("login");
        }
      } else if (mode === "login") {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (loginError) throw loginError;
        changeMode("account");
      } else if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/?auth=update-password`,
        });
        if (resetError) throw resetError;
        setNotice(
          "Se houver uma conta com este e-mail, enviaremos um link para redefinir a senha.",
        );
      } else if (mode === "update-password") {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        setNotice("Senha atualizada com sucesso.");
        setMode("account");
        onModeChange("account");
        setPassword("");
        setPasswordConfirm("");
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    setBusy(true);
    const { error: signOutError } = await supabase.auth.signOut();
    setBusy(false);
    if (signOutError) {
      setError("Não foi possível sair agora. Tente novamente.");
      return;
    }
    onClose();
  }

  const interests = Array.isArray(user?.user_metadata?.interests)
    ? (user.user_metadata.interests as string[])
    : [];
  const accountName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Sua conta";
  const accountRole = (user?.user_metadata?.role as string | undefined) || "Passageiro";

  return (
    <div
      className="auth-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="auth-close" type="button" onClick={onClose} aria-label="Fechar janela">
          ×
        </button>

        {mode === "account" && !user ? (
          <>
            <span className="auth-kicker">LEVA NÓS</span>
            <h2 id="auth-title">Abrindo sua conta</h2>
            <p className="auth-intro">Estamos carregando seus dados.</p>
          </>
        ) : mode === "account" && user ? (
          <>
            <span className="auth-kicker">LEVA NÓS</span>
            <h2 id="auth-title">Olá, {accountName}.</h2>
            <p className="auth-intro">
              Sua conta está ativa como {accountRole.toLocaleLowerCase("pt-BR")}.
            </p>
            <p className="auth-email">{user.email}</p>
            {notice && (
              <p className="auth-message success" role="status">
                {notice}
              </p>
            )}
            {interests.length > 0 ? (
              <div className="account-interests">
                <strong>Seus interesses</strong>
                <ul>
                  {interests.map((interest) => (
                    <li key={interest}>{interest}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="auth-muted">Os interesses que você registrar aparecerão aqui.</p>
            )}
            {error && (
              <p className="auth-message error" role="alert">
                {error}
              </p>
            )}
            <button
              className="auth-secondary full"
              type="button"
              onClick={() => changeMode("forgot")}
            >
              Redefinir senha
            </button>
            <button
              className="auth-text-button full"
              type="button"
              disabled={busy}
              onClick={signOut}
            >
              {busy ? "Saindo…" : "Sair da conta"}
            </button>
          </>
        ) : mode === "signup" ? (
          <>
            <span className="auth-kicker">FAÇA PARTE</span>
            <h2 id="auth-title">Crie sua conta</h2>
            <p className="auth-intro">
              Um cadastro simples para acompanhar sua jornada na Leva Nós.
            </p>
            {pendingInterest && (
              <p className="auth-interest">
                Vamos salvar também: <strong>{pendingInterest}</strong>
              </p>
            )}
            <form className="auth-form" onSubmit={submit}>
              <label className="auth-field">
                <span>Nome</span>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                  required
                />
              </label>
              <label className="auth-field">
                <span>E-mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
              <label className="auth-field">
                <span>Quero participar como</span>
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value as AccountRole)}
                >
                  <option>Passageiro</option>
                  <option>Motorista</option>
                  <option>Parceiro local</option>
                  <option>Universidade</option>
                </select>
              </label>
              <PasswordInput
                label="Senha (mínimo 8 caracteres)"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                minLength={8}
              />
              <PasswordInput
                label="Confirme sua senha"
                value={passwordConfirm}
                onChange={setPasswordConfirm}
                autoComplete="new-password"
                minLength={8}
              />
              {error && (
                <p className="auth-message error" role="alert">
                  {error}
                </p>
              )}
              {notice && (
                <p className="auth-message success" role="status">
                  {notice}
                </p>
              )}
              {!isAuthConfigured && (
                <p className="auth-message setup" role="status">
                  Defina a URL e a chave pública do Supabase no ambiente do site para ativar contas.
                </p>
              )}
              <button className="primary full" type="submit" disabled={busy || !isAuthConfigured}>
                {busy ? "Criando conta…" : "Criar conta"}
              </button>
            </form>
            <p className="auth-switch">
              Já tem conta?{" "}
              <button type="button" onClick={() => changeMode("login")}>
                Entrar
              </button>
            </p>
          </>
        ) : mode === "forgot" ? (
          <>
            <span className="auth-kicker">ACESSO À CONTA</span>
            <h2 id="auth-title">Esqueceu a senha?</h2>
            <p className="auth-intro">
              Informe o e-mail da sua conta. Vamos enviar um link para criar uma nova senha.
            </p>
            <form className="auth-form" onSubmit={submit}>
              <label className="auth-field">
                <span>E-mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
              {error && (
                <p className="auth-message error" role="alert">
                  {error}
                </p>
              )}
              {notice && (
                <p className="auth-message success" role="status">
                  {notice}
                </p>
              )}
              {!isAuthConfigured && (
                <p className="auth-message setup" role="status">
                  Configure o serviço de contas para enviar links de redefinição.
                </p>
              )}
              <button className="primary full" type="submit" disabled={busy || !isAuthConfigured}>
                {busy ? "Enviando…" : "Enviar link"}
              </button>
            </form>
            <p className="auth-switch">
              <button type="button" onClick={() => changeMode("login")}>
                Voltar para entrar
              </button>
            </p>
          </>
        ) : mode === "update-password" ? (
          <>
            <span className="auth-kicker">ACESSO À CONTA</span>
            <h2 id="auth-title">Crie uma nova senha</h2>
            <p className="auth-intro">Escolha uma senha com pelo menos 8 caracteres.</p>
            <form className="auth-form" onSubmit={submit}>
              <PasswordInput
                label="Nova senha"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                minLength={8}
              />
              <PasswordInput
                label="Confirme a nova senha"
                value={passwordConfirm}
                onChange={setPasswordConfirm}
                autoComplete="new-password"
                minLength={8}
              />
              {error && (
                <p className="auth-message error" role="alert">
                  {error}
                </p>
              )}
              {notice && (
                <p className="auth-message success" role="status">
                  {notice}
                </p>
              )}
              <button className="primary full" type="submit" disabled={busy || !isAuthConfigured}>
                {busy ? "Salvando…" : "Salvar nova senha"}
              </button>
            </form>
          </>
        ) : (
          <>
            <span className="auth-kicker">BEM-VINDO DE VOLTA</span>
            <h2 id="auth-title">Acesse sua conta</h2>
            <p className="auth-intro">Entre para acompanhar seus dados e interesses na Leva Nós.</p>
            <form className="auth-form" onSubmit={submit}>
              <label className="auth-field">
                <span>E-mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
              <PasswordInput
                label="Senha"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
              />
              <div className="auth-forgot-row">
                <button type="button" onClick={() => changeMode("forgot")}>
                  Esqueci minha senha
                </button>
              </div>
              {error && (
                <p className="auth-message error" role="alert">
                  {error}
                </p>
              )}
              {notice && (
                <p className="auth-message success" role="status">
                  {notice}
                </p>
              )}
              {!isAuthConfigured && (
                <p className="auth-message setup" role="status">
                  Defina a URL e a chave pública do Supabase no ambiente do site para ativar contas.
                </p>
              )}
              <button className="primary full" type="submit" disabled={busy || !isAuthConfigured}>
                {busy ? "Entrando…" : "Entrar"}
              </button>
            </form>
            <p className="auth-switch">
              Ainda não tem conta?{" "}
              <button type="button" onClick={() => changeMode("signup")}>
                Cadastre-se
              </button>
            </p>
          </>
        )}
      </section>
    </div>
  );
}
