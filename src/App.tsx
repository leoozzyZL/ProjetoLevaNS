import { FormEvent, useMemo, useState } from "react";

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
  const [destination, setDestination] = useState("");
  const [trip, setTrip] = useState(false);
  const [women, setWomen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [filter, setFilter] = useState("Todos");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [referencesOpen, setReferencesOpen] = useState(false);

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

  function submitTrip(event: FormEvent) {
    event.preventDefault();
    if (!destination.trim()) return;
    setTrip(true);
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
        </nav>
        <div className="header-actions">
          <button
            className="link-button"
            onClick={() => showToast("A área de acesso estará disponível no lançamento.")}
          >
            Entrar
          </button>
          <button className="primary small" onClick={() => scrollTo("cadastro")}>
            Quero participar
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
            <div className="audience-switch" role="tablist" aria-label="Escolha seu perfil">
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
            </div>
            {audience === "passageiro" ? (
              !trip ? (
                <form onSubmit={submitTrip}>
                  <h2>Para onde vamos?</h2>
                  <p>Simule sua próxima viagem em poucos passos.</p>
                  <label className="field">
                    <Icon name="home" />
                    <span>
                      <small>Partida</small>
                      <input value="Minha localização" readOnly aria-label="Local de partida" />
                    </span>
                  </label>
                  <label className="field">
                    <Icon name="pin" />
                    <span>
                      <small>Destino</small>
                      <input
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="Digite seu destino"
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
                  <button className="primary full" type="submit">
                    Ver opções de viagem <Icon name="arrow" />
                  </button>
                  <small className="availability">
                    A disponibilidade varia conforme a região e o horário.
                  </small>
                </form>
              ) : (
                <div className="trip-result" aria-live="polite">
                  <button className="back-button" onClick={() => setTrip(false)}>
                    ← Alterar destino
                  </button>
                  <div className="result-route">
                    <Icon name="route" size={32} />
                    <span>
                      <small>Destino</small>
                      <strong>{destination}</strong>
                    </span>
                  </div>
                  <h2>Opção encontrada</h2>
                  <div className="ride-option">
                    <span className="car-badge">
                      <Icon name="car" size={26} />
                    </span>
                    <span>
                      <strong>{women ? "Leva Nós Mulheres" : "Leva Nós Essencial"}</strong>
                      <small>4 min • 4 lugares</small>
                    </span>
                    <strong>R$ 18,40</strong>
                  </div>
                  <button
                    className="primary full"
                    onClick={() =>
                      showToast(
                        "Interesse registrado. Avisaremos quando o piloto chegar à sua região.",
                      )
                    }
                  >
                    Tenho interesse no piloto <Icon name="arrow" />
                  </button>
                  <p className="concept-note">
                    Simulação ilustrativa. Valores e disponibilidade serão definidos no lançamento.
                  </p>
                </div>
              )
            ) : (
              <div className="driver-panel">
                <span className="commission-pill">Condição inicial proposta</span>
                <h2>Comece com mais incentivo.</h2>
                <p>Cadastre seu interesse e acompanhe as próximas etapas do piloto.</p>
                <div className="commission">
                  <strong>
                    90 <small>dias</small>
                  </strong>
                  <span>sem comissão sobre corridas*</span>
                </div>
                <div className="mini-stat">
                  <strong>3%</strong>
                  <span>comissão inicial após a isenção*</span>
                </div>
                <button className="primary full" onClick={() => scrollTo("cadastro")}>
                  Quero dirigir <Icon name="arrow" />
                </button>
                <small className="availability">
                  *Política proposta. Faixa de 3% a 10%, conforme regulamento.
                </small>
              </div>
            )}
          </div>
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
                "Pedir uma viagem",
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
                <button
                  onClick={() =>
                    index === 0
                      ? scrollTo("inicio")
                      : index === 1
                        ? setAudience("motorista")
                        : scrollTo("cadastro")
                  }
                >
                  {action} <Icon name="arrow" size={17} />
                </button>
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
                {["Todos", "Veículos", "Crédito", "Manutenção", "Seguro"].map((item) => (
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
                      showToast(
                        `${partner.category}: avisaremos quando houver parceiros disponíveis.`,
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
            <h2>Um plano para cada momento.</h2>
            <p>Acesso básico gratuito e duas opções de assinatura para ampliar os benefícios.</p>
          </div>
          <div className="plans">
            {[
              [
                "Essencial",
                "Acesso básico",
                ["Aplicativo e extrato", "Ofertas básicas dos parceiros"],
              ],
              [
                "Mais",
                "Assinatura opcional",
                ["Tudo do Essencial", "Benefícios adicionais", "Campanhas elegíveis"],
              ],
              [
                "Completo",
                "Assinatura opcional",
                [
                  "Tudo do Mais",
                  "Rede ampliada de benefícios",
                  "Condições em parceiros selecionados",
                ],
              ],
            ].map(([name, subtitle, items], index) => (
              <article
                className={`plan-card ${index === 1 ? "featured" : ""}`}
                key={name as string}
              >
                {index === 1 && <span className="popular">MAIS ESCOLHIDO</span>}
                <div className="plan-head">
                  <span className="plan-icon">
                    <Icon name={index === 0 ? "route" : index === 1 ? "star" : "spark"} />
                  </span>
                  <h3>{name as string}</h3>
                  <p>{subtitle as string}</p>
                </div>
                <ul>
                  {(items as string[]).map((item) => (
                    <li key={item}>
                      <Icon name="check" size={17} />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  className={index === 1 ? "primary full" : "secondary full"}
                  onClick={() => showToast(`Interesse no plano ${name} registrado.`)}
                >
                  Tenho interesse
                </button>
              </article>
            ))}
          </div>
          <p className="plans-note">
            Planos propostos. Preços, benefícios e regulamentos serão definidos para lançamento.
            Segurança essencial incluída em todos os níveis.
          </p>
        </section>

        <section className="section difference">
          <div className="section-heading left">
            <span className="kicker">O DIFERENCIAL ESTÁ NA COMBINAÇÃO</span>
            <h2>Uma jornada voltada à comunidade.</h2>
          </div>
          <div className="comparison" role="table" aria-label="Comparativo entre plataformas">
            <div className="comparison-row comparison-head" role="row">
              <span />
              <strong>Uber</strong>
              <strong>99</strong>
              <strong>inDrive</strong>
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
                "Uber Pro e parceiros",
                "Rota99 e campanhas",
                "Proteção e segurança",
                "Marketplace e planos",
              ],
              ["Mulheres", "Uber Mulher", "99Mulher", "Não identificado*", "Modalidade proposta"],
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
              elegíveis com parceiros. Cidade e parceiros do piloto serão definidos na preparação do
              lançamento.
            </p>
          </div>
        </section>

        <section className="cta-section" id="cadastro">
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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              showToast("Interesse registrado. Obrigado por fazer parte do começo!");
              (e.currentTarget as HTMLFormElement).reset();
            }}
          >
            <label>
              <span>Seu e-mail</span>
              <input type="email" placeholder="voce@email.com" required />
            </label>
            <label>
              <span>Quero participar como</span>
              <select defaultValue="Passageiro">
                <option>Passageiro</option>
                <option>Motorista</option>
                <option>Parceiro local</option>
                <option>Universidade</option>
              </select>
            </label>
            <button className="primary light-button" type="submit">
              Registrar interesse <Icon name="arrow" />
            </button>
            <small>Ao enviar, você concorda em receber novidades sobre o projeto.</small>
          </form>
        </section>
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
            <button onClick={() => scrollTo("cadastro")}>Participar</button>
          </div>
          <div className="academic-note">
            <strong>Projeto acadêmico</strong>
            <p>
              Conceito desenvolvido por João Moura. Funcionalidades e condições descritas compõem
              uma proposta de desenvolvimento.
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
    </div>
  );
}
