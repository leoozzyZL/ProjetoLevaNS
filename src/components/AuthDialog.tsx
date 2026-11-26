import { FormEvent, useEffect, useState } from "react";
import OperationalDemo from "./OperationalDemo";
import type { User } from "@supabase/supabase-js";
import { isAuthConfigured, supabase } from "../lib/supabase";

export type AuthMode = "login" | "signup" | "forgot" | "update-password" | "account";
export type AccountRole = "Passageiro" | "Motorista" | "Parceiro local" | "Universidade";

const profileOptions: Record<AccountRole, { label: string; description: string; welcome: string }> = {
  Passageiro: { label: "Passageiro", description: "Quero acompanhar o lançamento para utilizar as viagens.", welcome: "Você pode acompanhar o lançamento e registrar seus interesses. As viagens ainda não estão disponíveis." },
  Motorista: { label: "Motorista", description: "Quero dirigir e conhecer as condições para motoristas.", welcome: "Conheça as condições dos motoristas fundadores e os planos propostos. Este cadastro não aprova você para realizar corridas." },
  "Parceiro local": { label: "Representante de negócio local", description: "Represento um negócio e tenho interesse em oferecer serviços ou benefícios.", welcome: "Seu perfil registra interesse em oferecer serviços ou benefícios à comunidade. Uma parceria dependerá de avaliação e acordo posterior." },
  Universidade: { label: "Representante de universidade", description: "Represento uma instituição e tenho interesse em conhecer o piloto e possíveis parcerias.", welcome: "Seu perfil registra interesse institucional no piloto. Convênios e participação da universidade dependem de acordo posterior." },
};

function validRole(value: unknown): AccountRole {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(profileOptions, value)
    ? value as AccountRole : "Passageiro";
}

function representsOrganization(role: AccountRole) {
  return role === "Parceiro local" || role === "Universidade";
}

function ProfileFields({ role, organization, onRoleChange, onOrganizationChange, disabled = false }: {
  role: AccountRole;
  organization: string;
  onRoleChange: (role: AccountRole) => void;
  onOrganizationChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <>
      <label className="auth-field">
        <span>Como você quer participar?</span>
        <select value={role} disabled={disabled} aria-describedby="profile-description" onChange={(event) => {
          onRoleChange(validRole(event.target.value));
          onOrganizationChange("");
        }}>
          {(Object.keys(profileOptions) as AccountRole[]).map((value) => (
            <option key={value} value={value}>{profileOptions[value].label}</option>
          ))}
        </select>
      </label>
      <p className="auth-muted" id="profile-description" aria-live="polite" style={{ margin: 0 }}>{profileOptions[role].description}</p>
      {role === "Universidade" && <p className="auth-muted" style={{ margin: 0 }}>Se você é estudante e quer utilizar viagens, escolha Passageiro.</p>}
      {representsOrganization(role) && (
        <label className="auth-field">
          <span>{role === "Universidade" ? "Nome da instituição" : "Nome do negócio"}</span>
          <input value={organization} onChange={(event) => onOrganizationChange(event.target.value)} autoComplete="organization" maxLength={120} required disabled={disabled} />
        </label>
      )}
    </>
  );
}

type AuthDialogProps = {
  open: boolean;
  initialDemo?: boolean;
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
  initialDemo = false,
  initialMode,
  initialRole,
  pendingInterest,
  user,
  onClose,
  onModeChange,
}: AuthDialogProps) {
  const [demoOpen, setDemoOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [role, setRole] = useState<AccountRole>(initialRole);
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [savedProfile, setSavedProfile] = useState<{ role: AccountRole; organization: string } | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setDemoOpen(initialDemo && Boolean(user));
    if (open) {
      setError("");
      setNotice("");
      setPassword("");
      setPasswordConfirm("");
    }
      setEditingProfile(false);
      setSavedProfile(null);
      setOrganization("");
  }, [open, user?.id, initialDemo]);

  useEffect(() => {
    if (open) {
      setMode(initialDemo && !user && initialMode === "account" ? "login" : initialMode);
      setRole(initialRole);
    }
  }, [initialMode, initialRole, initialDemo, user?.id, open]);

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

    if (mode === "signup" && representsOrganization(role) && !organization.trim()) {
      setError(role === "Universidade" ? "Informe o nome da instituição." : "Informe o nome do negócio.");
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
            data: { full_name: fullName.trim(), role, interests, organization_name: representsOrganization(role) ? organization.trim() : null },
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

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!supabase || !user) {
      setError("Entre na sua conta para corrigir o perfil.");
      return;
    }
    if (representsOrganization(role) && !organization.trim()) {
      setError(role === "Universidade" ? "Informe o nome da instituição." : "Informe o nome do negócio.");
      return;
    }
    setBusy(true);
    try {
      const { data, error: profileError } = await supabase.auth.updateUser({
        data: { role, organization_name: representsOrganization(role) ? organization.trim() : null },
      });
      if (profileError) throw profileError;
      if (!data.user) throw new Error("Perfil não retornado");
      setSavedProfile({ role: validRole(data.user.user_metadata.role), organization: data.user.user_metadata.organization_name || "" });
      setEditingProfile(false);
      setNotice("Perfil atualizado com sucesso.");
    } catch {
      setError("Não foi possível salvar seu perfil. Tente novamente.");
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
  const accountRole = savedProfile?.role ?? validRole(user?.user_metadata?.role);
  const accountOrganization = savedProfile?.organization ?? (typeof user?.user_metadata?.organization_name === "string" ? user.user_metadata.organization_name : "");

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

        {demoOpen && user ? <OperationalDemo key={user.id} scope={user.id} initialRole={accountRole} onBack={() => setDemoOpen(false)} /> : mode === "account" && !user ? (
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
              Seu perfil: {profileOptions[accountRole].label}.
            </p>
            <p className="auth-email">{user.email}</p>
            <p className="auth-muted">{profileOptions[accountRole].welcome}</p>
            {representsOrganization(accountRole) && accountOrganization && (
              <p className="auth-muted"><strong>{accountRole === "Universidade" ? "Instituição" : "Negócio"}:</strong> {accountOrganization}</p>
            )}
            {editingProfile ? (
              <form className="auth-form" onSubmit={saveProfile}>
                <ProfileFields role={role} organization={organization} onRoleChange={setRole} onOrganizationChange={setOrganization} disabled={busy} />
                <button className="primary full" type="submit" disabled={busy}>{busy ? "Salvando perfil…" : "Salvar perfil"}</button>
                <button className="auth-text-button full" type="button" disabled={busy} onClick={() => { setEditingProfile(false); setError(""); }}>Cancelar</button>
              </form>
            ) : (
              <button className="auth-secondary full" type="button" disabled={busy} onClick={() => {
                setRole(accountRole); setOrganization(accountOrganization); setEditingProfile(true); setError(""); setNotice("");
              }}>Corrigir meu perfil</button>
            )}
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
              <ProfileFields role={role} organization={organization} onRoleChange={setRole} onOrganizationChange={setOrganization} disabled={busy} />
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
              <p className="auth-muted" style={{ margin: 0 }}>Cadastro gratuito para registrar seu interesse. Não contrata assinatura nem confirma participação no piloto.</p>
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
            <p className="auth-intro">{initialDemo ? "Entre ou crie sua conta para acessar os simuladores da demonstração." : "Entre para acompanhar seus dados, interesses e simular viagens na Leva Nós."}</p>
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
