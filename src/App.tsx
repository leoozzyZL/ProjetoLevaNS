import { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import AuthDialog, { type AccountRole, type AuthMode } from "./components/AuthDialog";
import { supabase } from "./lib/supabase";
import { estimateTrip, type TripEstimate } from "./lib/tripRouting";
import RouteMap from "./components/RouteMap";

type IconName =
  | "arrow"
  | "car"
  | "check"
  | "chevron"
  | "clock"
  | "close"
  | "heart"
  | "home"
  | "menu"
  | "pin"
  | "route"
  | "search"
  | "shield"
  | "spark"
  | "star"
  | "store"
  | "users"
  | "wallet"
  | "wrench";

const paths: Record<IconName, React.ReactNode> = {
  arrow: (
    <>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </>
  ),
  car: (
    <>
      <path d="m5 11 1.4-4.1A2 2 0 0 1 8.3 5h7.4a2 2 0 0 1 1.9 1.4L19 11" />
      <path d="M4 11h16v6H4zM6 17v2M18 17v2M7 14h.01M17 14h.01" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12M18 6 6 18" />
    </>
  ),
  heart: (
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M8 18h3a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.6 3.2 7.8 7.5 9.5 4.3-1.7 7.5-4.9 7.5-9.5V6Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  spark: (
    <>
      <path d="m12 3 1.4 4.2L18 9l-4.6 1.8L12 15l-1.4-4.2L6 9l4.6-1.8Z" />
      <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7Z" />
    </>
  ),
  star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />,
  store: (
    <>
      <path d="M4 10v10h16V10M3 5h18l-1 5H4Z" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2" />
      <path d="M3 20c0-4 2-6 6-6s6 2 6 6M15 15c3 0 5 1.5 5 4.5" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 6h14a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12" />
      <path d="M16 12h6v4h-6a2 2 0 0 1 0-4Z" />
    </>
  ),
  wrench: <path d="M14.5 6.5a4 4 0 0 0-5-5L12 4l-3 3-2.5-2.5a4 4 0 0 0 5 5L20 18l-2 2-8.5-8.5" />,
};

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

const partners = [
  {
    icon: "car" as IconName,
    category: "Veículos",
    title: "Acesso ao veículo",
    text: "Concessionárias e alternativas para começar a rodar.",
    tag: "Para motoristas",
  },
  {
    icon: "wallet" as IconName,
    category: "Crédito",
    title: "Soluções financeiras",
    text: "Condições de instituições financeiras parceiras.",
    tag: "Em breve",
  },
  {
    icon: "wrench" as IconName,
    category: "Manutenção",
    title: "Cuidado em dia",
    text: "Autopeças, oficinas e serviços perto de você.",
    tag: "Mais buscado",
  },
  {
    icon: "shield" as IconName,
    category: "Seguro",
    title: "Proteção para rodar",
    text: "Cotações adequadas ao uso do veículo.",
    tag: "Para motoristas",
  },
  {
    icon: "pin" as IconName,
    category: "Rastreamento",
    title: "Mais tranquilidade",
    text: "Instalação e monitoramento com parceiros.",
    tag: "Em breve",
  },
  {
    icon: "users" as IconName,
    category: "Universidades",
    title: "Comunidade acadêmica",
    text: "Acesso ao piloto, pesquisa e divulgação.",
    tag: "Comunidade",
  },
];

const references = [
  "Pix em números",
  "Cetic.br / TIC Domicílios 2025",
  "IBGE / Trabalho por aplicativos 2024",
  "IBGE / Indicadores de motoristas 2024",
  "IBGE / Internet nos domicílios 2025",
  "FGV IBRE / Mercado de trabalho",
  "Inep / Censo da Educação Superior",
  "FBSP / Anuário 2026",
  "ANPD / Titular de dados",
  "ANPD / Perguntas frequentes",
  "Patrícia Galvão / Deslocamentos 2024",
  "Patrícia Galvão / Deslocamentos 2023",
  "Susep / Consulta de seguros",
  "ITDP / Transporte para Todas",
  "Igarapé / Mobilidade e violência",
  "99 / Mais Mulheres",
  "Uber / Segurança para usuários",
  "Uber / Expansão Uber Mulher",
  "99 / Rota99",
  "inDrive / Pacto de segurança",
  "Uber / Segurança como prioridade",
  "Uber / Dicas de suporte",
  "Uber / Cobrança não reconhecida",
  "inDrive / Segurança do passageiro",
  "99 / Campanhas em cidades",
  "99 / Motoristas",
  "99 / Vantagens regionais",
  "inDrive / Segurança do motorista",
  "inDrive / Formulário de suporte",
  "Reclame Aqui / inDrive",
  "Reclame Aqui / Cancelamento inDrive",
  "Reclame Aqui / Taxa inDrive",
  "inDrive / Centro de ajuda",
  "Senatran / Frota 2026",
  "MTE / Juventude e emprego",
  "BCB / Educação financeira",
  "BCB / Empréstimos e financiamentos",
  "IBGE / Desocupação anual 2025",
  "Fundação Itaú / Juventudes e trabalho",
  "Sebrae SC / Marketplace",
  "Sequoia / Plano de negócio",
  "STF / Tema 967",
  "Anatel / Certificação de produtos",
  "Câmara / Lei 13.640 de 2018",
  "ANTT / Fiscalização de aplicativos",
  "Y Combinator / Design de pitch",
  "Susep / Seguro de automóveis",
  "Susep / Registro de corretores",
  "Susep / Dúvidas sobre seguros",
  "BCB / Resolução CMN 4.935",
  "Volkswagen / FAQ parceria Uber",
  "BCB / Correspondentes no país",
  "VWFS / Financiamentos",
  "Inep / Resultados do Censo 2024",
  "Ipsos e inDrive / Segurança 2026",
  "Uber / Preços e comissão",
  "inDrive / Documentos legais",
  "Uber / Uber Pro",
  "Reclame Aqui / Cobrança 99",
  "Reclame Aqui / Bloqueio Uber",
];

export default function App() {
  const [audience, setAudience] = useState<"passageiro" | "motorista">("passageiro");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [trip, setTrip] = useState(false);
  const [tripLoading, setTripLoading] = useState(false);
  const [tripError, setTripError] = useState("");
  const [tripEstimate, setTripEstimate] = useState<TripEstimate | null>(null);
  const [women, setWomen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [filter, setFilter] = useState("Todos");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [referencesOpen, setReferencesOpen] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const signedInRole = authUser?.user_metadata?.role;
  const heroAudience = authUser ? (signedInRole === "Motorista" ? "motorista" : "passageiro") : audience;
  const isInstitutional = Boolean(authUser && signedInRole !== "Passageiro" && signedInRole !== "Motorista");
  const [authOpen, setAuthOpen] = useState(false);
  const [demoRequested, setDemoRequested] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authRole, setAuthRole] = useState<AccountRole>("Passageiro");
  const [pendingInterest, setPendingInterest] = useState("");

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setAuthUser((current) => current ?? data.session?.user ?? null);
      setAuthReady(true);
    }).catch(() => setAuthReady(true));
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthUser(session?.user ?? null);
      setAuthReady(true);
      if (event === "PASSWORD_RECOVERY") {
        setAuthMode("update-password");
        setAuthOpen(true);
      }
    });

    if (new URLSearchParams(window.location.search).get("auth") === "update-password") {
      setAuthMode("update-password");
      setAuthOpen(true);
    }

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setTrip(false);
    setTripEstimate(null);
    setTripError("");
  }, [authUser?.id, signedInRole]);

  const filteredPartners = useMemo(
    () =>
      partners.filter((partner) => {
        const matchesFilter = filter === "Todos" || partner.category === filter;
        const term = search.toLocaleLowerCase("pt-BR");
        return (
          matchesFilter &&
          `${partner.category} ${partner.title} ${partner.text}`
            .toLocaleLowerCase("pt-BR")
            .includes(term)
        );
      }),
    [filter, search],
  );

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }

  function openAuth(mode: AuthMode, role: AccountRole = "Passageiro", interest = "") {
    setDemoRequested(false);
    setAuthMode(authUser ? "account" : mode);
    setAuthRole(role);
    setPendingInterest(interest);
    setAuthOpen(true);
    setMenu(false);
  }

  function openDemo() {
    setDemoRequested(true);
    setAuthMode(authUser ? "account" : "login");
    setAuthOpen(true);
    setMenu(false);
  }

  async function recordInterest(interest: string, role: AccountRole = "Passageiro") {
    if (!authUser || !supabase) {
      openAuth("signup", role, interest);
      return;
    }

    const current = Array.isArray(authUser.user_metadata?.interests)
      ? (authUser.user_metadata.interests as string[])
      : [];
    const interests = [...new Set([...current, interest])];
    const { data, error } = await supabase.auth.updateUser({ data: { interests } });
    if (error || !data.user) {
      showToast("Não foi possível salvar esse interesse. Tente novamente.");
      return;
    }
    setAuthUser(data.user);
    showToast(`Interesse em ${interest} salvo na sua conta.`);
  }

  async function submitTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authUser) { openAuth("login"); return; }
    if (signedInRole !== "Passageiro") { showToast("A estimativa de viagem está disponível no perfil Passageiro."); return; }
    if (!origin.trim() || !destination.trim()) return;

    setTripLoading(true);
    setTripError("");
    setTripEstimate(null);
    try {
      const estimate = await estimateTrip(origin.trim(), destination.trim());
      setTripEstimate(estimate);
      setTrip(true);
    } catch (error) {
      setTripError(
        error instanceof Error
          ? error.message
          : "Não foi possível calcular essa rota. Confira os locais e tente novamente.",
      );
    } finally {
      setTripLoading(false);
    }
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenu(false);
  }

  return (
    <div className="app-shell">
      <header className="header">
        <a className="brand" href="#inicio" aria-label="Leva Nós — início">
          <span>leva</span> nós
          <i />
        </a>
        <nav className={menu ? "nav nav-open" : "nav"} aria-label="Navegação principal">
          <button onClick={() => scrollTo("como-funciona")}>Como funciona</button>
          <button onClick={() => scrollTo("beneficios")}>Benefícios</button>
          <button onClick={() => scrollTo("seguranca")}>Segurança</button>
          <button onClick={() => scrollTo("planos")}>Planos</button>
          <button onClick={openDemo}>Demonstração</button>
          {!authUser && (
            <button className="mobile-auth-link" onClick={() => openAuth("login")}>
              Entrar
            </button>
          )}
          <button
            className="mobile-create-account"
            onClick={() => openAuth(authUser ? "account" : "signup")}
          >
            {authUser ? "Minha conta" : "Criar conta"}
          </button>
        </nav>
        <div className="header-actions">
          {!authUser && (
            <button className="link-button" onClick={() => openAuth("login")}>
              Entrar
            </button>
          )}
          <button
            className="primary small"
            onClick={() => openAuth(authUser ? "account" : "signup")}
          >
            {authUser ? "Minha conta" : "Criar conta"}
          </button>
          <button
            className="menu-button"
            aria-label={menu ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMenu(!menu)}
          >
            <Icon name={menu ? "close" : "menu"} />
          </button>
        </div>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="route-art route-one">
            <span />
            <span />
          </div>
          <div className="hero-copy">
            <div className="eyebrow">
              <span /> Mobilidade feita para a comunidade
            </div>
            <h1>
              Seu destino.
              <br />
              <em>Novas possibilidades.</em>
            </h1>
            <p>Viagens, oportunidades de renda e benefícios para quem movimenta a cidade.</p>
            <p style={{ fontSize: 13, lineHeight: 1.6 }}>Projeto acadêmico em demonstração. Corridas ainda não disponíveis.</p>
            <div className="hero-proof">
              <span>
                <Icon name="shield" /> Segurança em cada etapa
              </span>
              <span>
                <Icon name="users" /> Feito para a comunidade
              </span>
            </div>
          </div>

          <div className="ride-card">
            {!authUser ? <div className="audience-switch" role="tablist" aria-label="Escolha seu perfil">
              <button
                className={audience === "passageiro" ? "active" : ""}
                onClick={() => {
                  setAudience("passageiro");
                  setTrip(false);
                }}
              >
                Quero viajar
              </button>
              <button
                className={audience === "motorista" ? "active" : ""}
                onClick={() => {
                  setAudience("motorista");
                  setTrip(false);
                }}
              >
                Quero dirigir
              </button>
            </div> : <p className="commission-pill">Seu espaço de {String(signedInRole || "conta").toLocaleLowerCase("pt-BR")}</p>}
            {isInstitutional ? <div className="driver-panel"><h2>{signedInRole === "Parceiro local" ? "Seu negócio na comunidade." : "Sua instituição na Leva Nós."}</h2><p>{signedInRole === "Parceiro local" ? "Cadastre e gerencie as ofertas do seu negócio no seu painel." : "Acompanhe seus dados e os interesses da instituição no projeto."}</p><button className="primary full" type="button" onClick={openDemo}>{signedInRole === "Parceiro local" ? "Gerenciar minhas ofertas" : "Abrir meu espaço institucional"}</button></div> : heroAudience === "passageiro" ? (
              !trip || !authUser ? (
                <form onSubmit={submitTrip}>
                  <h2>Para onde vamos?</h2>
                  <p>Simule sua próxima viagem em poucos passos.</p>
                  <label className="field">
                    <Icon name="home" />
                    <span>
                      <small>Partida</small>
                      <input
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        placeholder="Ex.: Midway Mall, Tirol"
                        aria-label="Local de partida"
                        autoComplete="street-address"
                        required
                      />
                    </span>
                  </label>
                  <label className="field">
                    <Icon name="pin" />
                    <span>
                      <small>Destino</small>
                      <input
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="Ex.: UFRN, Lagoa Nova"
                        aria-label="Destino"
                        required
                      />
                    </span>
                  </label>
                  <label className="women-option">
                    <span className="women-icon">
                      <Icon name="heart" />
                    </span>
                    <span>
                      <strong>Leva Nós Mulheres</strong>
                      <small>Viagem com motorista mulher</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={women}
                      onChange={(e) => setWomen(e.target.checked)}
                    />
                    <i />
                  </label>
                  <button className="primary full" type={authUser ? "submit" : "button"} disabled={tripLoading} onClick={!authUser ? () => openAuth("login") : undefined}>
                    {tripLoading ? "Calculando estimativa..." : authUser ? "Calcular estimativa" : "Entrar para simular"}
                    {!tripLoading && <Icon name="arrow" />}
                  </button>
                  {tripError && (
                    <p className="route-error" role="alert">
                      {tripError}
                    </p>
                  )}
                  <small className="availability">
                    {authUser ? "A simulação aceita somente endereços em Natal, RN. Informe o local e o bairro." : "Entre ou crie sua conta gratuitamente para simular uma viagem em Natal, RN."}
                  </small>
                </form>
              ) : (
                <div className="trip-result" aria-live="polite">
                  <button className="back-button" onClick={() => setTrip(false)}>
                    ← Alterar destino
                  </button>
                  <div className="result-route" style={{ alignItems: "flex-start" }}>
                    <span style={{ flexShrink: 0 }}><Icon name="route" size={32} /></span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <small>
                        {tripEstimate?.distanceKm.toLocaleString("pt-BR", {
                          maximumFractionDigits: 1,
                          minimumFractionDigits: 1,
                        })} km • {tripEstimate?.durationMinutes} min estimados
                      </small>
                      <small style={{ marginTop: 10 }}>Partida</small>
                      <strong style={{ whiteSpace: "normal", overflow: "visible", textOverflow: "clip", maxWidth: "none", overflowWrap: "anywhere", lineHeight: 1.5 }}>
                        {tripEstimate?.origin}
                      </strong>
                      <small style={{ marginTop: 10 }}>Chegada</small>
                      <strong style={{ whiteSpace: "normal", overflow: "visible", textOverflow: "clip", maxWidth: "none", overflowWrap: "anywhere", lineHeight: 1.5 }}>
                        {tripEstimate?.destination}
                      </strong>
                    </span>
                  </div>
                  {tripEstimate && <RouteMap origin={tripEstimate.origin} destination={tripEstimate.destination} coordinates={tripEstimate.coordinates} />}
                  <h2>Estimativa de viagem</h2>
                  <p className="concept-note"><strong>Valor ilustrativo para demonstração.</strong><br />Simulação em Natal, RN. Não solicita uma corrida.</p>
                  <div className="ride-option">
                    <span className="car-badge">
                      <Icon name="car" size={26} />
                    </span>
                    <span>
                      <strong>{women ? "Leva Nós Mulheres" : "Leva Nós"}</strong>
                      <small>
                        Rota de carro • {tripEstimate?.distanceKm.toLocaleString("pt-BR", {
                          maximumFractionDigits: 1,
                          minimumFractionDigits: 1,
                        })} km
                      </small>
                    </span>
                    <strong>
                      {tripEstimate?.price.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </strong>
                  </div>
                  <dl style={{ margin: "16px 0", fontSize: 13, lineHeight: 1.6 }} aria-label="Composição do preço estimado">
                    {[
                      ["Tarifa estimada da viagem", tripEstimate?.fare],
                      ["Taxa de serviço do passageiro", tripEstimate?.serviceFee],
                      ["Total estimado", tripEstimate?.price],
                    ].map(([label, value]) => (
                      <div key={String(label)} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderBottom: "1px solid #d6e7f5" }}>
                        <dt>{label}</dt>
                        <dd style={{ margin: 0, fontWeight: 700, whiteSpace: "nowrap" }}>{Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    className="primary full"
                    onClick={() => recordInterest("Novidades sobre o lançamento")}
                  >
                    Quero acompanhar o lançamento <Icon name="arrow" />
                  </button>
                  <p className="concept-note">
                    Cálculo demonstrativo: R$ 2,00 por km + R$ 1,00 de taxa de serviço por corrida.
                    Os R$ 2,00/km são uma hipótese desta demonstração, não uma tarifa definida no plano de negócios.
                    A taxa de R$ 1,00 segue a proposta do plano. O preço oficial ainda será validado.
                  </p>
                  <p className="route-attribution">
                    © OpenStreetMap contributors • rota por OSRM • busca por Photon.
                  </p>
                </div>
              )
            ) : (
              <div className="driver-panel">
                <span className="commission-pill">Condições propostas para motoristas</span>
                <h2>Comece com mais incentivo.</h2>
                <p>Veja como funciona a comissão sobre suas corridas.</p>
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: 12, lineHeight: 1.5, margin: "20px 0" }}>
                  <caption style={{ textAlign: "left", fontWeight: 700, marginBottom: 10 }}>Exemplo com tarifa de R$ 20,00</caption>
                  <thead>
                    <tr style={{ background: "#eaf6ff", color: "#0758aa" }}>
                      {["Condição", "Sem comissão", "Com comissão"].map((label) => (
                        <th key={label} scope="col" style={{ padding: "10px 8px", textAlign: "left" }}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Quando se aplica", "Primeiros 90 dias dos 150 motoristas fundadores", "Após a isenção; padrão para os demais motoristas"],
                      ["Comissão", "0%", "3%"],
                      ["Plataforma recebe", "R$ 0,00", "R$ 0,60"],
                      ["Motorista recebe¹", "R$ 20,00", "R$ 19,40"],
                    ].map(([label, exempt, standard]) => (
                      <tr key={label} style={{ borderBottom: "1px solid #d6e7f5" }}>
                        <th scope="row" style={{ padding: "10px 8px", textAlign: "left", verticalAlign: "top" }}>{label}</th>
                        <td style={{ padding: "10px 8px", verticalAlign: "top" }}>{exempt}</td>
                        <td style={{ padding: "10px 8px", verticalAlign: "top" }}>{standard}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 16 }}>
                  <b>Condição dos fundadores:</b> após os 90 dias, comissão de 3% garantida por 12 meses, mantendo avaliação igual ou superior a 4,8.
                </p>
                <button className="primary full" onClick={() => authUser ? openDemo() : openAuth("signup", "Motorista")}>
                  {authUser ? "Abrir meu painel de motorista" : "Quero dirigir"} <Icon name="arrow" />
                </button>
                <small className="availability" style={{ textAlign: "left" }}>
                  ¹Valores antes dos custos do motorista, como combustível e manutenção.
                  A taxa de serviço de R$ 1 é paga pelo passageiro, inclusive durante a isenção.
                  Categorias especiais ou campanhas publicadas podem ter comissão de até 10%.
                  Condições propostas no plano de negócios, sujeitas ao regulamento de lançamento.
                </small>
              </div>
            )}
          </div>
        </section>

        <section className="section" id="piloto">
          <div className="section-heading">
            <span className="kicker">PILOTO PROPOSTO EM NATAL, RN</span>
            <h2>Começar perto para atender melhor.</h2>
            <p>O plano prevê concentrar a operação em um campus e bairros próximos antes de expandir.</p>
          </div>
          <div className="audience-grid">
            {[
              ["pin", "Território inicial", "Um campus e corredores próximos em Natal. Universidade e área de atendimento ainda serão definidas; não há convênio confirmado."],
              ["clock", "Horários prioritários", "A pesquisa vai mapear a demanda por horário, com foco nos picos e na proposta de volta segura noturna por convênio institucional."],
              ["users", "Comunidade inicial", "Passageiros universitários e urbanos, motoristas elegíveis e negócios locais. O piloto prevê 150 motoristas fundadores."],
            ].map(([icon, title, description]) => (
              <article className="audience-card" key={title}>
                <span className="icon-box"><Icon name={icon as IconName} size={25} /></span>
                <h3>{title}</h3><p>{description}</p>
              </article>
            ))}
          </div>
          <p className="disclaimer">A busca de endereços permite simulações em Natal; isso não representa cobertura operacional já disponível.</p>
        </section>

        <section className="trust-strip" aria-label="Dados de mercado">
          <p>
            O ponto de partida combina <strong>comunidade universitária</strong> e mobilidade
            urbana.
          </p>
          <div>
            <strong>10,23 milhões</strong>
            <span>de matrículas de graduação no Brasil</span>
          </div>
          <div>
            <strong>878 mil</strong>
            <span>pessoas com trabalho principal por apps de transporte particular</span>
          </div>
        </section>

        <section className="section" id="como-funciona">
          <div className="section-heading">
            <span className="kicker">UMA PLATAFORMA, MUITAS CONEXÕES</span>
            <h2>
              A cidade conecta destinos.
              <br />A Leva Nós conecta oportunidades.
            </h2>
            <p>Uma proposta para aproximar passageiros, motoristas e negócios locais.</p>
          </div>
          <div className="audience-grid">
            {[
              [
                "pin",
                "Para quem vai",
                "Viagens para estudar, trabalhar e aproveitar a cidade.",
                "Simular uma viagem",
              ],
              [
                "car",
                "Para quem dirige",
                "Oportunidade de renda com acesso a serviços e benefícios.",
                "Conhecer a jornada",
              ],
              [
                "store",
                "Para quem empreende",
                "Um canal para alcançar a comunidade da plataforma.",
                "Seja um parceiro",
              ],
            ].map(([icon, title, text, action], index) => (
              <article className="audience-card" key={title}>
                <span className="card-number">0{index + 1}</span>
                <span className="icon-box">
                  <Icon name={icon as IconName} size={25} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
                {(!authUser || signedInRole === ["Passageiro", "Motorista", "Parceiro local"][index]) && <button
                  onClick={() =>
                    index === 0
                      ? (setAudience("passageiro"), scrollTo("inicio"))
                      : index === 1
                        ? (setAudience("motorista"), scrollTo("inicio"))
                        : authUser ? openDemo() : openAuth("signup", "Parceiro local")
                  }
                >
                  {authUser && index === 2 ? "Gerenciar minhas ofertas" : action} <Icon name="arrow" size={17} />
                </button>}
              </article>
            ))}
          </div>

          <div className="journey">
            <div className="journey-copy">
              <span className="kicker">JORNADA DO MOTORISTA</span>
              <h2>Do primeiro cadastro à rotina de quem dirige.</h2>
              <p>A proposta acompanha o motorista nas etapas que fazem diferença no dia a dia.</p>
            </div>
            <div className="journey-steps">
              {[
                ["users", "Entrar", "Cadastro e orientação para começar."],
                ["shield", "Se preparar", "Veículo e documentação adequados."],
                ["route", "Rodar", "Viagens e acompanhamento dos ganhos."],
                ["star", "Aproveitar", "Benefícios e parceiros em um só lugar."],
              ].map(([icon, title, text], index) => (
                <div className="journey-step" key={title}>
                  <span>{index + 1}</span>
                  <Icon name={icon as IconName} />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="market-section" id="beneficios">
          <div className="section split-title">
            <div>
              <span className="kicker light">MARKETPLACE DE BENEFÍCIOS</span>
              <h2>
                Benefícios perto.
                <br />
                Mais valor na rotina.
              </h2>
            </div>
            <p>
              Descubra parceiros por necessidade, compare condições disponíveis e acompanhe os
              benefícios utilizados.
            </p>
          </div>
          <div className="section marketplace">
            <div className="market-tools">
              <label className="search-field">
                <Icon name="search" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar benefício ou serviço"
                  aria-label="Buscar benefício"
                />
              </label>
              <div className="filters" aria-label="Filtrar categorias">
                {["Todos", ...new Set(partners.map((partner) => partner.category))].map((item) => (
                  <button
                    className={filter === item ? "active" : ""}
                    onClick={() => setFilter(item)}
                    key={item}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="partner-grid">
              {filteredPartners.map((partner) => (
                <article className="partner-card" key={partner.category}>
                  <div className="partner-top">
                    <span className="partner-icon">
                      <Icon name={partner.icon} />
                    </span>
                    <span className="tag">{partner.tag}</span>
                  </div>
                  <small>{partner.category}</small>
                  <h3>{partner.title}</h3>
                  <p>{partner.text}</p>
                  <button
                    onClick={() =>
                      recordInterest(
                        `Benefício: ${partner.category}`,
                        partner.category === "Universidades" ? "Universidade" : "Motorista",
                      )
                    }
                  >
                    Tenho interesse <Icon name="chevron" size={16} />
                  </button>
                </article>
              ))}
              {!filteredPartners.length && (
                <div className="empty-state">
                  <Icon name="search" size={30} />
                  <h3>Nenhum benefício encontrado</h3>
                  <p>Tente outra busca ou remova o filtro.</p>
                  <button
                    onClick={() => {
                      setSearch("");
                      setFilter("Todos");
                    }}
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </div>
            <p className="disclaimer">
              Rede prevista no modelo de negócio. Condições comerciais e disponibilidade dependem da
              contratação de parceiros.
            </p>
          </div>
        </section>

        <section className="section safety-section" id="seguranca">
          <div className="women-panel">
            <div className="women-copy">
              <span className="kicker">LEVA NÓS MULHERES</span>
              <h2>Mais escolha e acolhimento para os deslocamentos das mulheres.</h2>
              <p>
                Modalidade proposta para conectar passageiras a motoristas mulheres, com
                disponibilidade informada e sem mudança automática de categoria.
              </p>
              <div className="big-data">
                <strong>63%</strong>
                <span>
                  incluem segurança entre os aspectos relevantes ao escolher um app de mobilidade.
                </span>
              </div>
              <small>Ipsos em parceria com inDrive, 2026, 1.000 usuários.</small>
            </div>
            <div className="women-visual">
              <span className="orbit orbit-one" />
              <span className="orbit orbit-two" />
              <div>
                <Icon name="users" size={50} />
                <strong>
                  Passageiras escolhem.
                  <br />
                  Motoristas mulheres conduzem.
                </strong>
              </div>
            </div>
          </div>
          <div className="safety-content">
            <div>
              <span className="kicker">SEGURANÇA ESSENCIAL</span>
              <h2>Segurança acompanha cada etapa.</h2>
              <p>Recursos essenciais previstos para todos os planos e modalidades.</p>
            </div>
            <div className="safety-list">
              {[
                [
                  "check",
                  "Antes de sair",
                  "Identificação, verificação documental e confirmação de embarque.",
                ],
                [
                  "route",
                  "Durante o trajeto",
                  "Compartilhamento da viagem e acesso ao canal de emergência.",
                ],
                [
                  "shield",
                  "Quando precisar",
                  "Registro de ocorrência, protocolo e acompanhamento do atendimento.",
                ],
              ].map(([icon, title, text]) => (
                <article key={title}>
                  <span>
                    <Icon name={icon as IconName} />
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="plans-section" id="planos">
          <div className="section-heading">
            <span className="kicker">PLANOS</span>
            <h2>Planos para a rotina do motorista.</h2>
            <p>Acesso básico gratuito e assinaturas opcionais previstas a partir do 4º mês do piloto.</p>
          </div>
          <div className="plans">
            {[
              [
                "Essencial",
                "Grátis • sem mensalidade",
                "Para acompanhar as funções básicas da plataforma sem contratar uma assinatura.",
                ["Aplicativo e extrato", "Ofertas básicas dos parceiros disponíveis", "Segurança essencial e Leva Nós Mulheres previstas em todos os planos"],
              ],
              [
                "Mais",
                "R$ 29,90/mês • valor proposto",
                "Para ampliar os benefícios na rotina. O plano prevê economia comprovada de pelo menos duas vezes a mensalidade.",
                [
                  "Tudo do Essencial",
                  "Benefícios adicionais e campanhas, conforme a rede contratada",
                  "Meta prevista de economia: pelo menos R$ 59,80/mês",
                  "Economia acompanhada no extrato mensal",
                ],
              ],
              [
                "Completo",
                "R$ 59,90/mês • valor proposto",
                "Para acessar a rede ampliada de benefícios. As condições de cada parceiro serão definidas antes da oferta.",
                [
                  "Tudo do Mais",
                  "Condições em uma rede ampliada de parceiros, a contratar",
                  "Meta prevista de economia: pelo menos R$ 119,80/mês",
                  "Economia acompanhada no extrato mensal",
                ],
              ],
            ].map(([name, subtitle, description, items], index) => (
              <article
                className={`plan-card ${index === 1 ? "featured" : ""}`}
                key={name as string}
              >
                {index === 1 && <span className="popular">PLANO MAIS</span>}
                <div className="plan-head">
                  <span className="plan-icon">
                    <Icon name={index === 0 ? "route" : index === 1 ? "star" : "spark"} />
                  </span>
                  <h3>{name as string}</h3>
                  <p>{subtitle as string}</p>
                  <p className="plan-description">{description as string}</p>
                </div>
                <ul>
                  {(items as string[]).map((item) => (
                    <li key={item}>
                      <Icon name="check" size={17} />
                      {item}
                    </li>
                  ))}
                </ul>
                {(!authUser || signedInRole === "Motorista") && <button
                  className={index === 1 ? "primary full" : "secondary full"}
                  onClick={() => recordInterest(`Plano: ${name as string}`, "Motorista")}
                >
                  Tenho interesse
                </button>}
              </article>
            ))}
          </div>
          <p className="plans-note">
            Valores de planejamento, sem cobrança de assinatura neste site. Benefícios e parceiros ainda dependem de contratação.
            A mensalidade é separada da comissão do motorista e da taxa de R$ 1,00 paga pelo passageiro por corrida.
            A assinatura não prevê isenção dessas cobranças.
          </p>

          <div className="section" style={{ paddingTop: 24, paddingBottom: 16, maxWidth: 720 }}>
            <article className="audience-card">
              <span className="kicker">EXTRATO DEMONSTRATIVO</span>
              <h3>Como acompanhar a economia da assinatura</h3>
              <p>Exemplo fictício para explicar a proposta do plano Mais. Os valores abaixo não são descontos disponíveis nem ofertas de parceiros confirmados.</p>
              <dl style={{ margin: "16px 0", fontSize: 14 }}>
                {[
                  ["Economia hipotética com combustível", "R$ 30,00"],
                  ["Economia hipotética com manutenção", "R$ 25,00"],
                  ["Economia hipotética com telefonia", "R$ 10,00"],
                  ["Economia total no exemplo", "R$ 65,00"],
                  ["Mensalidade proposta do Mais", "− R$ 29,90"],
                  ["Economia após a mensalidade", "R$ 35,10"],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: "1px solid #d6e7f5" }}>
                    <dt>{label}</dt><dd style={{ margin: 0, fontWeight: 700, whiteSpace: "nowrap" }}>{value}</dd>
                  </div>
                ))}
              </dl>
              <p>Neste exemplo, R$ 65,00 supera a meta prevista de R$ 59,80 em benefícios, equivalente a duas mensalidades. A economia real dependerá do uso e da rede contratada.</p>
            </article>
          </div>
        </section>

        <section className="section difference">
          <div className="section-heading left">
            <span className="kicker">O DIFERENCIAL ESTÁ NA COMBINAÇÃO</span>
            <h2>Uma jornada voltada à comunidade.</h2>
          </div>
          <div className="comparison" role="table" aria-label="Comparativo entre plataformas">
            <div className="comparison-row comparison-head" role="row">
              <span />
              <strong>Plataforma 1</strong>
              <strong>Plataforma 2</strong>
              <strong>Plataforma 3</strong>
              <strong>Leva Nós</strong>
            </div>
            {[
              [
                "Atuação",
                "Mobilidade ampla",
                "Mobilidade ampla",
                "Mobilidade ampla",
                "Entrada universitária",
              ],
              [
                "Benefícios",
                "Programa de vantagens e parceiros",
                "Benefícios para motoristas e campanhas",
                "Proteção e segurança",
                "Marketplace e planos",
              ],
              ["Mulheres", "Modalidade para mulheres", "Modalidade para mulheres", "Não identificado*", "Modalidade proposta"],
              [
                "Comissão",
                "Varia por viagem",
                "Regras e campanhas",
                "Consultar no app",
                "Inicial de 3%**",
              ],
            ].map((row) => (
              <div className="comparison-row" role="row" key={row[0]}>
                {row.map((cell, i) =>
                  i === 0 ? <strong key={cell}>{cell}</strong> : <span key={cell}>{cell}</span>,
                )}
              </div>
            ))}
          </div>
          <p className="table-note">
            Comparativo de ofertas divulgadas e proposta da Leva Nós. *Nas fontes selecionadas.
            **Após isenção, conforme regulamento.
          </p>
        </section>

        <section className="revenue-section">
          <div className="section">
            <span className="kicker light">MODELO E EXPANSÃO</span>
            <h2>Quem participa ajuda a movimentar o próximo.</h2>
            <div className="revenue-grid">
              {[
                ["route", "Viagens", "Conexão entre passageiros e motoristas."],
                ["star", "Assinaturas", "Benefícios opcionais para diferentes necessidades."],
                ["store", "Parcerias", "Oportunidades comerciais para negócios locais."],
              ].map(([icon, title, text]) => (
                <article key={title}>
                  <Icon name={icon as IconName} />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
            <div className="rollout">
              <div>
                <small>01</small>
                <strong>Comunidade inicial</strong>
                <span>Universidades como canal de pesquisa e divulgação.</span>
              </div>
              <div>
                <small>02</small>
                <strong>Conexão local</strong>
                <span>Viagens para diferentes destinos e parceiros próximos.</span>
              </div>
              <div>
                <small>03</small>
                <strong>Novas regiões</strong>
                <span>Expansão apoiada no uso e na experiência da comunidade.</span>
              </div>
            </div>
            <p className="disclaimer dark">
              Modelo previsto: comissão sobre corridas, assinaturas e remuneração por transações
              elegíveis com parceiros. A proposta local é iniciar em Natal, RN; campus, parceiros e território
              do piloto ainda serão definidos e validados antes do lançamento.
            </p>
          </div>
        </section>

        {authReady && !authUser && <section className="cta-section" id="cadastro">
          <div className="route-art route-two">
            <span />
            <span />
          </div>
          <div>
            <span className="kicker light">FAÇA PARTE DO COMEÇO</span>
            <h2>
              Vamos movimentar
              <br />
              essa ideia juntos?
            </h2>
            <p>Universidades, parceiros e comunidade conectados a novas possibilidades.</p>
          </div>
          <div className="cta-auth">
            <strong>Comece com um cadastro gratuito.</strong>
            <p>Escolha seu perfil, crie sua conta e salve os benefícios que quer acompanhar.</p>
            <button className="primary light-button" onClick={() => openAuth("signup")}>
              Criar minha conta <Icon name="arrow" />
            </button>
            <button className="cta-login" onClick={() => openAuth("login")}>
              Já tenho uma conta
            </button>
          </div>
        </section>}
      </main>

      <footer>
        <div className="footer-main">
          <div>
            <a className="brand footer-brand" href="#inicio">
              <span>leva</span> nós
              <i />
            </a>
            <p>Seu destino. Novas possibilidades.</p>
          </div>
          <div>
            <strong>Explore</strong>
            <button onClick={() => scrollTo("como-funciona")}>Como funciona</button>
            <button onClick={() => scrollTo("beneficios")}>Benefícios</button>
            <button onClick={() => scrollTo("seguranca")}>Segurança</button>
          </div>
          <div>
            <strong>Projeto</strong>
            <button onClick={() => scrollTo("planos")}>Planos</button>
            <button onClick={() => setReferencesOpen(!referencesOpen)}>Referências</button>
            {!authUser && <button onClick={() => openAuth("signup")}>Participar</button>}
          </div>
          <div className="academic-note">
            <strong>Projeto acadêmico</strong>
            <p>
              Conceito desenvolvido por João Moura. Viagens, tarifas e disponibilidade ainda são uma
              proposta para lançamento.
            </p>
          </div>
        </div>
        <button
          className="references-toggle"
          onClick={() => setReferencesOpen(!referencesOpen)}
          aria-expanded={referencesOpen}
        >
          Referências da pesquisa ({references.length}) <span>{referencesOpen ? "−" : "+"}</span>
        </button>
        {referencesOpen && (
          <div className="references">
            {references.map((reference, index) => (
              <span key={reference}>
                [{String(index + 1).padStart(2, "0")}] {reference}
              </span>
            ))}
          </div>
        )}
        <div className="footer-bottom">
          <span>© 2026 Leva Nós — Projeto acadêmico.</span>
          <span>Dados de referência, não usuários da Leva Nós.</span>
        </div>
      </footer>

      {toast && (
        <div className="toast" role="status">
          <span>
            <Icon name="check" />
          </span>
          {toast}
          <button onClick={() => setToast("")} aria-label="Fechar aviso">
            <Icon name="close" size={17} />
          </button>
        </div>
      )}

      <AuthDialog
        open={authOpen}
        initialDemo={demoRequested}
        initialMode={authMode}
        initialRole={authRole}
        pendingInterest={pendingInterest}
        user={authUser}
        onClose={() => setAuthOpen(false)}
        onModeChange={setAuthMode}
      />
    </div>
  );
}
