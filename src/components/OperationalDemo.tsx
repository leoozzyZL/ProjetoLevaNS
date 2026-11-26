import { FormEvent, useState } from "react";

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
  const [tab, setTab] = useState(initialRole === "Parceiro local" ? "partner" : "driver");
  const ridesStore = useDemoStore<Ride[]>(`levanos-demo-v1:${scope}:rides`, []);
  const offersStore = useDemoStore<Offer[]>(`levanos-demo-v1:${scope}:offers`, []);
  const rides = Array.isArray(ridesStore.value) ? ridesStore.value : [];
  const offers = Array.isArray(offersStore.value) ? offersStore.value : [];
  const [rate, setRate] = useState(0);
  const [draft, setDraft] = useState(emptyOffer);
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("Todas");
  const activeRide = rides.find(ride => ride.status === "Aceita" || ride.status === "Em andamento");
  const completed = rides.filter(ride => ride.status === "Concluída");
  const today = new Date().toLocaleDateString("en-CA");
  const card = { border: "1px solid #d6e7f5", borderRadius: 14, padding: 16, marginTop: 14, background: "#f5faff", overflowWrap: "anywhere" as const };
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
    setMessage("Novo pedido fictício recebido. Confira o trajeto e o ganho antes de aceitar.");
  }
  function saveOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const expires = String(new FormData(event.currentTarget).get("expires") || "");
    if (Object.values({ ...draft, expires }).some(value => !value.trim()) || expires < today) { setMessage("Preencha os campos e escolha uma validade a partir de hoje."); return; }
    const offer = { ...draft, expires, title: draft.title.trim(), business: draft.business.trim(), benefit: draft.benefit.trim(), conditions: draft.conditions.trim(), id: editing || crypto.randomUUID(), active: offers.find(item => item.id === editing)?.active ?? true };
    offersStore.save(editing ? offers.map(item => item.id === editing ? offer : item) : [offer, ...offers]);
    setEditing(null); setDraft(emptyOffer); setMessage("Oferta salva no seu painel de demonstração.");
  }
  return <>
    <button className="auth-text-button" type="button" onClick={onBack}>← Voltar à conta</button>
    <span className="auth-kicker" style={{ display: "block", marginTop: 16 }}>DEMONSTRAÇÃO INTERATIVA</span>
    <h2 id="auth-title">Seu painel Leva Nós</h2>
    <p className="auth-intro">Teste a jornada do motorista e do parceiro. Pedidos e valores são fictícios; nenhuma corrida ou oferta é enviada a outras pessoas.</p>
    <p className="auth-muted">Os dados ficam somente neste navegador, separados por conta. Você pode fechar e voltar depois.</p>
    <div style={{ display: "flex", gap: 8, margin: "16px 0" }} role="group" aria-label="Painel de demonstração">
      <button type="button" className="auth-secondary full" aria-pressed={tab === "driver"} onClick={() => { setTab("driver"); setMessage(""); }}>Motorista</button>
      <button type="button" className="auth-secondary full" aria-pressed={tab === "partner"} onClick={() => { setTab("partner"); setMessage(""); }}>Parceiro</button>
    </div>
    {message && <p className="auth-message success" role="status">{message}</p>}
    {(ridesStore.warning || offersStore.warning) && <p role="alert">{ridesStore.warning || offersStore.warning}</p>}
    {tab === "driver" ? <>
      <h3>Pedidos e corridas</h3>
      <label className="auth-form" style={{ marginTop: 12 }}>Condição da próxima simulação
        <select value={rate} onChange={event => setRate(Number(event.target.value))}>
          <option value={0}>Fundador: isenção de comissão nos primeiros 90 dias</option>
          <option value={0.03}>Após a isenção: comissão inicial proposta de 3%</option>
        </select>
      </label>
      <p className="auth-muted">Exemplos fixos em Natal: R$ 2/km, premissa ilustrativa. Taxa de R$ 1 do passageiro separada dos ganhos. Não inclui combustível, custos ou assinatura.</p>
      <button className="primary full" type="button" disabled={rides.some(ride => ride.status === "Novo pedido")} onClick={receiveRide}>Simular recebimento de pedido</button>
      <div style={card}><strong>Resumo das corridas concluídas</strong><p>{completed.length} corrida(s) • Ganhos após comissão: <strong>{money(completed.reduce((sum, ride) => sum + round(ride.fare - round(ride.fare * ride.rate)), 0))}</strong></p><small>Valor da viagem menos a comissão; custos do motorista não descontados.</small></div>
      <label className="auth-form" style={{ marginTop: 12 }}>Filtrar corridas<select value={filter} onChange={event => setFilter(event.target.value)}>{["Todas", "Novo pedido", "Aceita", "Em andamento", "Concluída", "Recusada", "Cancelada"].map(value => <option key={value}>{value}</option>)}</select></label>
      {!rides.length && <p className="auth-muted">Ainda não há corridas. Simule um pedido para começar.</p>}
      {rides.length > 0 && !rides.some(ride => filter === "Todas" || ride.status === filter) && <p className="auth-muted">Nenhuma corrida neste filtro.</p>}
      {rides.filter(ride => filter === "Todas" || ride.status === filter).map(ride => <article style={card} key={ride.id} aria-label={`Corrida ${ride.status}`}>
        <strong>{ride.status}</strong><p><b>Partida:</b> {ride.origin}</p><p><b>Chegada:</b> {ride.destination}</p>
        <p>{ride.km.toLocaleString("pt-BR")} km • {ride.minutes} min fictícios</p>
        <p>Valor da viagem: {money(ride.fare)}<br/>Comissão ({ride.rate * 100}%): {money(round(ride.fare * ride.rate))}<br/>Taxa do passageiro: {money(1)} • Total: {money(ride.fare + 1)}</p>
        <p><b>Seu ganho após comissão: {money(round(ride.fare - round(ride.fare * ride.rate)))}</b></p>
        <div style={{ display: "grid", gap: 8 }}>
          {ride.status === "Novo pedido" && <><button className="primary full" type="button" disabled={Boolean(activeRide)} onClick={() => updateRide(ride.id, "Aceita")}>Aceitar corrida</button>{activeRide && <small>Conclua ou cancele a corrida atual antes de aceitar outra.</small>}<button className="auth-secondary full" type="button" onClick={() => updateRide(ride.id, "Recusada")}>Recusar pedido</button></>}
          {ride.status === "Aceita" && <button className="primary full" type="button" onClick={() => updateRide(ride.id, "Em andamento")}>Iniciar corrida</button>}
          {ride.status === "Em andamento" && <button className="primary full" type="button" onClick={() => updateRide(ride.id, "Concluída")}>Concluir corrida</button>}
          {["Aceita", "Em andamento"].includes(ride.status) && <button className="auth-secondary full" type="button" onClick={() => updateRide(ride.id, "Cancelada")}>Cancelar corrida simulada</button>}
        </div>
      </article>)}
    </> : <>
      <h3>{editing ? "Editar oferta" : "Cadastrar oferta"}</h3>
      <form className="auth-form" onSubmit={saveOffer}>
        <label>Nome do negócio<input required maxLength={100} value={draft.business} onChange={e => setDraft({ ...draft, business: e.target.value })}/></label>
        <label>Título da oferta<input required maxLength={100} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })}/></label>
        <label>Categoria<select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}>{["Veículos", "Saúde", "Alimentação", "Educação", "Serviços"].map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Benefício oferecido<input required maxLength={200} placeholder="Ex.: 10% de desconto na revisão" value={draft.benefit} onChange={e => setDraft({ ...draft, benefit: e.target.value })}/></label>
        <label>Condições de uso<input required maxLength={300} placeholder="Ex.: apresentar cadastro; não cumulativo" value={draft.conditions} onChange={e => setDraft({ ...draft, conditions: e.target.value })}/></label>
        <label>Válida até<input name="expires" type="date" required min={today} value={draft.expires} onChange={e => setDraft({ ...draft, expires: e.target.value })}/></label>
        <button className="primary full" type="submit">{editing ? "Salvar alterações" : "Salvar oferta"}</button>
        {editing && <button className="auth-secondary full" type="button" onClick={() => { setEditing(null); setDraft(emptyOffer); }}>Cancelar edição</button>}
      </form>
      <h3 style={{ marginTop: 24 }}>Minhas ofertas ({offers.length})</h3>
      {!offers.length && <p className="auth-muted">Sua primeira oferta aparecerá aqui após salvar.</p>}
      {offers.map(offer => <article key={offer.id} style={card}>
        <small>{offer.expires < today ? "Expirada" : offer.active ? "Ativa na demonstração" : "Pausada"} • {offer.category}</small>
        <h4>{offer.title}</h4><p><strong>{offer.business}</strong></p><p>{offer.benefit}</p><p>Condições: {offer.conditions}</p><p>Validade: {offer.expires.split("-").reverse().join("/")}</p>
        <div style={{ display: "grid", gap: 8 }}><button className="auth-secondary full" type="button" onClick={() => { const { id, active, ...fields } = offer; setDraft(fields); setEditing(id); setMessage("Edite os campos no formulário acima."); }}>Editar oferta</button><button className="auth-secondary full" type="button" onClick={() => { offersStore.save(offers.map(item => item.id === offer.id ? { ...item, active: !item.active } : item)); setMessage(offer.active ? "Oferta pausada." : "Oferta reativada. A validade continua sendo respeitada."); }}>{offer.active ? "Pausar oferta" : "Reativar oferta"}</button></div>
      </article>)}
    </>}
  </>;
}
