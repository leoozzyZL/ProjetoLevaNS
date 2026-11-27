import { FormEvent, Suspense, lazy, useState } from "react";
import "./OperationalDemo.css";
import { demoRoleForAccount } from "./demoScenario";
const DemoJourney = lazy(() => import("./DemoJourney"));

// Offers remain scoped to the authenticated account; journeys use a shared local scenario.
type Offer = { id: string; title: string; business: string; category: string; benefit: string; conditions: string; expires: string; active: boolean };
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
  const tab = demoRoleForAccount(initialRole);
  const offersStore = useDemoStore<Offer[]>(`levanos-demo-v1:${scope}:offers`, []);
  const offers = Array.isArray(offersStore.value) ? offersStore.value : [];
  const [draft, setDraft] = useState(emptyOffer);
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [partnerView, setPartnerView] = useState("create");
  const today = new Date().toLocaleDateString("en-CA");
  function saveOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const expires = String(new FormData(event.currentTarget).get("expires") || "");
    if (Object.values({ ...draft, expires }).some(value => !value.trim()) || expires < today) { setMessage("Preencha os campos e escolha uma validade a partir de hoje."); return; }
    const offer = { ...draft, expires, title: draft.title.trim(), business: draft.business.trim(), benefit: draft.benefit.trim(), conditions: draft.conditions.trim(), id: editing || crypto.randomUUID(), active: offers.find(item => item.id === editing)?.active ?? true };
    offersStore.save(editing ? offers.map(item => item.id === editing ? offer : item) : [offer, ...offers]);
    setEditing(null); setDraft(emptyOffer); setPartnerView("list"); setMessage("Oferta salva no seu painel de demonstração.");
  }
  return <div className="demo-panel">
    <header className="demo-heading">
      <button className="auth-text-button" type="button" onClick={onBack}>← Voltar à conta</button>
      <span className="auth-kicker">DEMONSTRAÇÃO INTERATIVA</span>
      <h2 id="auth-title">Seu painel Leva Nós</h2>
      <p>Seu espaço de {initialRole.toLocaleLowerCase("pt-BR")}, com as funções do seu cadastro.</p>
    </header>
    <p className="demo-badge">Perfil da conta: {initialRole}</p>
    <aside className="demo-notice"><strong>Demonstração acadêmica · Projeto A3</strong><p>Dados, pedidos e valores fictícios. Nenhuma corrida ou oferta é enviada a outras pessoas. Sua conta acessa somente as funções do perfil cadastrado. Os dados ficam neste navegador, separados por conta e perfil. As outras pessoas da viagem e as respostas do atendimento são simuladas, sem acesso aos painéis delas. Não há cobrança, GPS ao vivo, validação real de documentos ou acionamento de emergência.</p></aside>
    {message && <p className="auth-message success" role="status">{message}</p>}
    {offersStore.warning && <p role="alert">{offersStore.warning}</p>}
    {tab === null ? <section className="demo-section"><h3>Seu espaço institucional</h3><p>O cadastro de universidade acompanha o projeto e os interesses da instituição. Simulações de viagens, operação de motoristas e gestão de negócios pertencem aos respectivos perfis.</p><button className="auth-secondary" type="button" onClick={onBack}>Ver meus dados institucionais</button></section> : tab !== "partner" ? <Suspense fallback={<p role="status">Carregando a demonstração integrada…</p>}><DemoJourney scope={scope} role={tab === "driver" ? "driver" : "passenger"} offers={offers} /></Suspense> : <>
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
