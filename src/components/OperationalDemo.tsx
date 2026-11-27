import { FormEvent, useState } from "react";
import "./OperationalDemo.css";
import RouteMap from "./RouteMap";

// Academic sandbox: no dispatch, payments or public offer publication.
type Ride = { id: string; origin: string; destination: string; km: number; minutes: number; fare: number; rate: number; status: "Novo pedido" | "Aceita" | "Em andamento" | "Concluída" | "Recusada" | "Cancelada" };
type Offer = { id: string; title: string; business: string; category: string; benefit: string; conditions: string; expires: string; active: boolean };
const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const round = (value: number) => Math.round(value * 100) / 100;
const examples = [
  { origin: "UFRN, Lagoa Nova, Natal/RN", destination: "Midway Mall, Tirol, Natal/RN", km: 4.8, minutes: 12, fare: 9.6 },
  { origin: "Praça Cívica, Petrópolis, Natal/RN", destination: "Praia do Meio, Natal/RN", km: 3.5, minutes: 10, fare: 7 },
  { origin: "Via Direta, Lagoa Nova, Natal/RN", destination: "Arena das Dunas, Lagoa Nova, Natal/RN", km: 2.6, minutes: 8, fare: 5.2 },
];
type PassengerTrip = (typeof examples)[number] & { status: "Solicitada" | "Aceita" | "Em andamento" | "Concluída" };
const passengerStages: PassengerTrip["status"][] = ["Solicitada", "Aceita", "Em andamento", "Concluída"];
const emptyOffer = { title: "", business: "", category: "Veículos", benefit: "", conditions: "", expires: "" };

function useDemoStore<T>(key: string, initial: T) {
  const [warning, setWarning] = useState("");
  const [value, setValue] = useState<T>(() => {
    try { return JSON.parse(localStorage.getItem(key) || "null") ?? initial; } catch { return initial; }
  });
  function save(next: T) {
    setValue(next);
    try { localStorage.setItem(key, JSON.stringify(next)); setWarning(""); }
    catch { setWarning("Não foi possível salvar neste navegador. As alterações durarão apenas nesta sessão."); }
  }
  return { value, save, warning };
}

export default function OperationalDemo({ scope, initialRole, onBack }: { scope: string; initialRole: string; onBack: () => void }) {
  const [tab, setTab] = useState(initialRole === "Motorista" ? "driver" : initialRole === "Parceiro local" ? "partner" : "passenger");
  const [selectedRoute, setSelectedRoute] = useState("0");
  const passengerStore = useDemoStore<PassengerTrip | null>(`levanos-demo-v1:${scope}:passenger-trip`, null);
  const passengerTrip = passengerStore.value;
  const passengerActive = Boolean(passengerTrip && passengerTrip.status !== "Concluída");
  const routePreview = passengerActive && passengerTrip ? passengerTrip : examples[Number(selectedRoute)] ?? examples[0];
  function confirmPassengerTrip() {
    if (passengerActive) return;
    passengerStore.save({ ...routePreview, status: "Solicitada" });
    setMessage("Viagem fictícia solicitada. Acompanhe o status em Minha viagem.");
  }
  function advancePassengerTrip() {
    if (!passengerTrip || passengerTrip.status === "Concluída") return;
    const nextStatus = passengerStages[passengerStages.indexOf(passengerTrip.status) + 1];
    if (!nextStatus) return;
    passengerStore.save({ ...passengerTrip, status: nextStatus });
    setMessage(`Atualização simulada recebida: viagem ${nextStatus.toLowerCase()}.`);
  }
  const ridesStore = useDemoStore<Ride[]>(`levanos-demo-v1:${scope}:rides`, []);
  const offersStore = useDemoStore<Offer[]>(`levanos-demo-v1:${scope}:offers`, []);
  const rides = Array.isArray(ridesStore.value) ? ridesStore.value : [];
  const offers = Array.isArray(offersStore.value) ? offersStore.value : [];
  const [rate, setRate] = useState(0);
  const [draft, setDraft] = useState(emptyOffer);
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("Todas");
  const [driverView, setDriverView] = useState("current");
  const [partnerView, setPartnerView] = useState("create");
  const activeRide = rides.find(ride => ride.status === "Aceita" || ride.status === "Em andamento");
  const completed = rides.filter(ride => ride.status === "Concluída");
  const today = new Date().toLocaleDateString("en-CA");
  function updateRide(id: string, status: Ride["status"]) {
    const ride = rides.find(item => item.id === id);
    if (!ride) return;
    const allowed = (ride.status === "Novo pedido" && ["Aceita", "Recusada"].includes(status)) || (ride.status === "Aceita" && ["Em andamento", "Cancelada"].includes(status)) || (ride.status === "Em andamento" && ["Concluída", "Cancelada"].includes(status));
    if (!allowed || (status === "Aceita" && activeRide)) return;
    ridesStore.save(rides.map(item => item.id === id ? { ...item, status } : item));
    setMessage(`Corrida ${status.toLowerCase()}.`);
  }
  function receiveRide() {
    if (rides.some(ride => ride.status === "Novo pedido")) return;
    const example = examples[rides.length % examples.length];
    ridesStore.save([{ ...example, id: crypto.randomUUID(), rate, status: "Novo pedido" }, ...rides]);
    setDriverView("current");
    setMessage("Novo pedido fictício recebido. Confira o trajeto e o ganho antes de aceitar.");
  }
  function saveOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const expires = String(new FormData(event.currentTarget).get("expires") || "");
    if (Object.values({ ...draft, expires }).some(value => !value.trim()) || expires < today) { setMessage("Preencha os campos e escolha uma validade a partir de hoje."); return; }
    const offer = { ...draft, expires, title: draft.title.trim(), business: draft.business.trim(), benefit: draft.benefit.trim(), conditions: draft.conditions.trim(), id: editing || crypto.randomUUID(), active: offers.find(item => item.id === editing)?.active ?? true };
    offersStore.save(editing ? offers.map(item => item.id === editing ? offer : item) : [offer, ...offers]);
    setEditing(null); setDraft(emptyOffer); setPartnerView("list"); setMessage("Oferta salva no seu painel de demonstração.");
  }
  const history = rides.filter(ride => !["Novo pedido", "Aceita", "Em andamento"].includes(ride.status));
  const current = rides.filter(ride => ["Novo pedido", "Aceita", "Em andamento"].includes(ride.status));
  const visibleRides = driverView === "current" ? current : history.filter(ride => filter === "Todas" || ride.status === filter);
  const earnings = completed.reduce((sum, ride) => sum + round(ride.fare - round(ride.fare * ride.rate)), 0);
  return <div className="demo-panel">
    <header className="demo-heading">
      <button className="auth-text-button" type="button" onClick={onBack}>← Voltar à conta</button>
      <span className="auth-kicker">DEMONSTRAÇÃO INTERATIVA</span>
      <h2 id="auth-title">Seu painel Leva Nós</h2>
      <p>Escolha um perfil e explore cada etapa no seu ritmo.</p>
    </header>
    <div className="demo-profile-tabs" role="group" aria-label="Painel de demonstração">
      <button type="button" aria-pressed={tab === "passenger"} onClick={() => { setTab("passenger"); setMessage(""); }}><strong>Passageiro</strong><span>Trajeto, preço e minha viagem</span></button>
      <button type="button" aria-pressed={tab === "driver"} onClick={() => { setTab("driver"); setMessage(""); }}><strong>Motorista</strong><span>Pedidos, corridas e ganhos</span></button>
      <button type="button" aria-pressed={tab === "partner"} onClick={() => { setTab("partner"); setMessage(""); }}><strong>Parceiro</strong><span>Cadastro e gestão de ofertas</span></button>
    </div>
    <aside className="demo-notice"><strong>Demonstração acadêmica · Projeto A3</strong><p>Dados, pedidos e valores fictícios. Nenhuma corrida ou oferta é enviada a outras pessoas. Com sua conta, teste os três perfis de demonstração. Os dados ficam neste navegador, separados por conta; cada perfil explora seu próprio cenário de demonstração.</p></aside>
    {message && <p className="auth-message success" role="status">{message}</p>}
    {(passengerStore.warning || ridesStore.warning || offersStore.warning) && <p role="alert">{passengerStore.warning || ridesStore.warning || offersStore.warning}</p>}
    {tab === "passenger" ? <div className="demo-driver-grid demo-passenger-grid">
      <section className="demo-section">
        <span className="demo-step">01 · ESCOLHA SEU TRAJETO</span><h3>Uma viagem por Natal</h3>
        <p>Escolha um exemplo e confira o preço completo antes de confirmar.</p>
        <label className="auth-field"><span>Trajeto de exemplo em Natal</span><select value={selectedRoute} disabled={passengerActive} onChange={event => { setSelectedRoute(event.target.value); setMessage(""); }}>
          {examples.map((route, index) => <option key={route.origin} value={index}>{route.origin.split(",")[0]} → {route.destination.split(",")[0]}</option>)}
        </select></label>
        <div className="demo-route demo-passenger-route"><div><span>PARTIDA</span><p>{routePreview.origin}</p></div><div><span>CHEGADA</span><p>{routePreview.destination}</p></div></div>
        <RouteMap origin={routePreview.origin} destination={routePreview.destination} />
        <p className="demo-trip-facts">{routePreview.km.toLocaleString("pt-BR")} km · {routePreview.minutes} min fictícios</p>
        <dl className="demo-price"><div><dt>Valor da viagem</dt><dd>{money(routePreview.fare)}</dd></div><div><dt>Taxa de serviço</dt><dd>{money(1)}</dd></div><div className="demo-earning"><dt>Preço total</dt><dd>{money(round(routePreview.fare + 1))}</dd></div></dl>
        <p className="demo-help">Valores ilustrativos: R$ 2/km + R$ 1 de taxa de serviço. A tarifa por km é uma hipótese de demonstração, não um preço definido no plano de negócios.</p>
        <button className="primary full" type="button" disabled={passengerActive} onClick={confirmPassengerTrip}>Confirmar viagem fictícia</button>
        {passengerActive && <p className="demo-help">Você já tem uma viagem solicitada. Simule as etapas em Minha viagem até concluí-la para testar outro trajeto.</p>}
      </section>
      <section className="demo-section" aria-label="Minha viagem">
        <span className="demo-step">02 · ACOMPANHE AS ATUALIZAÇÕES</span><h3>Minha viagem</h3>
        <p>Você consulta somente a sua viagem neste cenário de demonstração.</p>
        {!passengerTrip ? <div className="demo-empty"><strong>Sua próxima viagem aparece aqui</strong><p>Escolha um trajeto e clique em Confirmar viagem fictícia para começar.</p></div> : <article className="demo-ride" aria-label={`Minha viagem ${passengerTrip.status}`}>
          <div className="demo-card-heading"><strong className="demo-badge">{passengerTrip.status}</strong><span>Viagem fictícia</span></div>
          <ol className="demo-timeline" aria-label="Etapas da minha viagem">{passengerStages.map((stage, index) => <li key={stage} className={index <= passengerStages.indexOf(passengerTrip.status) ? "reached" : ""} aria-current={stage === passengerTrip.status ? "step" : undefined}><span>{index + 1}</span>{stage}</li>)}</ol>
          <div className="demo-route"><div><span>PARTIDA</span><p>{passengerTrip.origin}</p></div><div><span>CHEGADA</span><p>{passengerTrip.destination}</p></div></div>
          <RouteMap origin={passengerTrip.origin} destination={passengerTrip.destination} />
          <p className="demo-trip-facts">{passengerTrip.km.toLocaleString("pt-BR")} km · {passengerTrip.minutes} min fictícios</p>
          <dl className="demo-price"><div><dt>Taxa de serviço incluída</dt><dd>{money(1)}</dd></div><div className="demo-earning"><dt>Total da sua viagem</dt><dd>{money(round(passengerTrip.fare + 1))}</dd></div></dl>
          {passengerTrip.status !== "Concluída" ? <><p className="demo-help">O botão abaixo simula as atualizações que o passageiro receberia. Ele não aceita, inicia ou conclui uma corrida real.</p><button className="primary full" type="button" onClick={advancePassengerTrip}>Simular próxima etapa</button></> : <p className="demo-complete" role="status">Viagem fictícia concluída! Você pode escolher outro trajeto e confirmar uma nova demonstração.</p>}
        </article>}
      </section>
    </div> : tab === "driver" ? <>
      <div className="demo-metrics" aria-label="Resumo do motorista">
        <div><span>Corridas concluídas</span><strong>{completed.length}</strong></div>
        <div><span>Ganhos após comissão</span><strong>{money(earnings)}</strong><small>Antes de combustível e outros custos</small></div>
        <div><span>Corrida atual</span><strong>{activeRide ? activeRide.status : "Livre"}</strong></div>
      </div>
      <div className="demo-driver-grid">
        <section className="demo-section demo-simulator">
          <span className="demo-step">01 · RECEBER UM PEDIDO</span>
          <h3>Simule uma solicitação</h3>
          <p>Escolha a condição e receba um exemplo de viagem em Natal.</p>
          <label className="auth-field"><span>Condição da próxima simulação</span><select value={rate} onChange={event => setRate(Number(event.target.value))}>
            <option value={0}>Fundador · comissão de 0%</option><option value={0.03}>Após a isenção · comissão de 3%</option>
          </select></label>
          <p className="demo-help">Isenção proposta nos primeiros 90 dias dos fundadores. Depois, comissão inicial proposta de 3%.</p>
          <button className="primary full" type="button" disabled={rides.some(ride => ride.status === "Novo pedido")} onClick={receiveRide}>Simular recebimento de pedido</button>
          {rides.some(ride => ride.status === "Novo pedido") && <p className="demo-help">Há um pedido aguardando sua decisão na área de corridas.</p>}
          <details className="demo-details"><summary>Como os valores são calculados</summary><p>Exemplos fixos em Natal: R$ 2/km, premissa ilustrativa. Taxa de R$ 1 do passageiro separada dos ganhos. Não inclui combustível, custos ou assinatura. Os R$ 2/km não são uma tarifa definida no plano de negócios.</p></details>
        </section>
        <section className="demo-section">
          <span className="demo-step">02 · ACOMPANHAR A JORNADA</span><h3>Suas corridas</h3>
          <div className="demo-subnav" role="group" aria-label="Visualização das corridas">
            <button type="button" aria-pressed={driverView === "current"} onClick={() => setDriverView("current")}>Pedidos e corrida atual ({current.length})</button>
            <button type="button" aria-pressed={driverView === "history"} onClick={() => setDriverView("history")}>Histórico ({history.length})</button>
          </div>
          {driverView === "history" && <label className="auth-field demo-filter"><span>Filtrar histórico</span><select value={filter} onChange={event => setFilter(event.target.value)}>{["Todas", "Concluída", "Recusada", "Cancelada"].map(value => <option key={value}>{value}</option>)}</select></label>}
          {!visibleRides.length && <div className="demo-empty"><strong>{driverView === "current" ? "Tudo pronto para começar" : "Nenhuma corrida neste filtro"}</strong><p>{driverView === "current" ? "Simule um pedido, confira os ganhos e decida se deseja aceitar." : "As corridas concluídas, recusadas e canceladas ficam aqui."}</p></div>}
          <div className="demo-card-list">{visibleRides.map(ride => <article className="demo-ride" key={ride.id} aria-label={`Corrida ${ride.status}`}>
            <div className="demo-card-heading"><strong className="demo-badge">{ride.status}</strong><span>{ride.km.toLocaleString("pt-BR")} km · {ride.minutes} min fictícios</span></div>
            <div className="demo-route"><div><span>PARTIDA</span><p>{ride.origin}</p></div><div><span>CHEGADA</span><p>{ride.destination}</p></div></div>
            <RouteMap origin={ride.origin} destination={ride.destination} />
            <dl className="demo-price"><div><dt>Valor da viagem</dt><dd>{money(ride.fare)}</dd></div><div><dt>Comissão ({ride.rate * 100}%)</dt><dd>− {money(round(ride.fare * ride.rate))}</dd></div><div className="demo-earning"><dt>Seu ganho após comissão</dt><dd>{money(round(ride.fare - round(ride.fare * ride.rate)))}</dd></div></dl>
            <p className="demo-help">Passageiro: {money(ride.fare + 1)} no total, incluindo R$ 1,00 de taxa.</p>
            <div className="demo-actions">
              {ride.status === "Novo pedido" && <><button className="primary" type="button" disabled={Boolean(activeRide)} onClick={() => updateRide(ride.id, "Aceita")}>Aceitar corrida</button><button className="auth-secondary" type="button" onClick={() => updateRide(ride.id, "Recusada")}>Recusar pedido</button></>}
              {ride.status === "Aceita" && <button className="primary" type="button" onClick={() => updateRide(ride.id, "Em andamento")}>Iniciar corrida</button>}
              {ride.status === "Em andamento" && <button className="primary" type="button" onClick={() => updateRide(ride.id, "Concluída")}>Concluir corrida</button>}
              {["Aceita", "Em andamento"].includes(ride.status) && <button className="auth-secondary" type="button" onClick={() => updateRide(ride.id, "Cancelada")}>Cancelar corrida simulada</button>}
            </div>
            {ride.status === "Novo pedido" && activeRide && <p className="demo-help">Conclua ou cancele a corrida atual antes de aceitar outra.</p>}
          </article>)}</div>
        </section>
      </div>
    </> : <>
      <div className="demo-subnav" role="group" aria-label="Gestão de ofertas"><button type="button" aria-pressed={partnerView === "create"} onClick={() => setPartnerView("create")}>{editing ? "Editar oferta" : "Cadastrar oferta"}</button><button type="button" aria-pressed={partnerView === "list"} onClick={() => setPartnerView("list")}>Minhas ofertas ({offers.length})</button></div>
      {partnerView === "create" ? <section className="demo-section">
        <span className="demo-step">{editing ? "ATUALIZE SUA OFERTA" : "NOVA OFERTA"}</span><h3>{editing ? "Editar oferta" : "O que seu negócio oferece?"}</h3><p>Preencha os dados abaixo. Ao salvar, você verá a oferta pronta no seu painel.</p>
        <form className="auth-form demo-offer-form" onSubmit={saveOffer}>
          <fieldset><legend>1. Identifique a oferta</legend><div className="demo-field-grid">
            <label className="auth-field"><span>Nome do negócio</span><input required maxLength={100} value={draft.business} onChange={e => setDraft({ ...draft, business: e.target.value })}/></label>
            <label className="auth-field"><span>Título da oferta</span><input required maxLength={100} placeholder="Ex.: revisão com desconto" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })}/></label>
            <label className="auth-field"><span>Categoria</span><select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}>{["Veículos", "Saúde", "Alimentação", "Educação", "Serviços"].map(value => <option key={value}>{value}</option>)}</select></label>
          </div></fieldset>
          <fieldset><legend>2. Explique o benefício</legend><div className="demo-field-grid">
            <label className="auth-field"><span>Benefício oferecido</span><input required maxLength={200} placeholder="Ex.: 10% de desconto na revisão" value={draft.benefit} onChange={e => setDraft({ ...draft, benefit: e.target.value })}/></label>
            <label className="auth-field"><span>Condições de uso</span><input required maxLength={300} placeholder="Ex.: apresentar cadastro; não cumulativo" value={draft.conditions} onChange={e => setDraft({ ...draft, conditions: e.target.value })}/></label>
            <label className="auth-field"><span>Válida até</span><input name="expires" type="date" required min={today} value={draft.expires} onChange={e => setDraft({ ...draft, expires: e.target.value })}/></label>
          </div></fieldset>
          <div className="demo-form-footer"><p className="demo-help">Todos os campos são obrigatórios. Oferta exclusiva da demonstração.</p><div className="demo-actions"><button className="primary" type="submit">{editing ? "Salvar alterações" : "Salvar oferta"}</button>{editing && <button className="auth-secondary" type="button" onClick={() => { setEditing(null); setDraft(emptyOffer); setMessage("Edição cancelada. A oferta salva foi mantida."); }}>Cancelar edição</button>}</div></div>
        </form>
      </section> : <section className="demo-section">
        <div className="demo-section-heading"><div><span className="demo-step">GESTÃO DE OFERTAS</span><h3>Minhas ofertas ({offers.length})</h3><p>Confira os detalhes e escolha uma ação em cada oferta.</p></div><button className="primary" type="button" onClick={() => { setEditing(null); setDraft(emptyOffer); setPartnerView("create"); }}>Cadastrar nova oferta</button></div>
        {!offers.length && <div className="demo-empty"><strong>Seu negócio pode aparecer aqui</strong><p>Cadastre uma oferta para visualizar o benefício, as condições e a validade.</p></div>}
        <div className="demo-offer-grid">{offers.map(offer => <article key={offer.id} className="demo-offer">
          <span className="demo-badge">{offer.expires < today ? "Expirada" : offer.active ? "Ativa na demonstração" : "Pausada"}</span><small>{offer.category}</small><h4>{offer.title}</h4><p>{offer.business}</p><div className="demo-benefit">{offer.benefit}</div>
          <dl className="demo-offer-details"><div><dt>Condições de uso</dt><dd>{offer.conditions}</dd></div><div><dt>Válida até</dt><dd>{offer.expires.split("-").reverse().join("/")}</dd></div></dl>
          <div className="demo-actions"><button className="auth-secondary" type="button" onClick={() => { const { id, active, ...fields } = offer; setDraft(fields); setEditing(id); setPartnerView("create"); setMessage("Atualize os campos e salve as alterações."); }}>Editar oferta</button><button className="auth-secondary" type="button" onClick={() => { offersStore.save(offers.map(item => item.id === offer.id ? { ...item, active: !item.active } : item)); setMessage(offer.active ? "Oferta pausada." : "Oferta reativada. A validade continua sendo respeitada."); }}>{offer.active ? "Pausar oferta" : "Reativar oferta"}</button></div>
        </article>)}</div>
      </section>}
    </>}
  </div>;
}
