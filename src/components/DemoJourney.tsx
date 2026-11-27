import { FormEvent, useEffect, useRef, useState } from 'react';
import RouteMap from './RouteMap';
import { Action, Choice, Config, Role, Scenario, Trip, candidates, categories, drivers, initialScenario, isActive, ledger, money, quote, routes, transition } from './demoScenario';
import './DemoJourney.css';

type CommunityOffer = { id: string; title: string; business: string; benefit: string; conditions: string; expires: string; active: boolean };
type Props = { scope: string; role: Role; onSwitch: (role: Role) => void; offers: CommunityOffer[] };
const defaultChoice: Choice = { route: 0, category: 'Essencial', women: false, payment: 'Pix', cash: 0, coupon: false };
const id = () => crypto.randomUUID();
const pin = () => String(1000 + crypto.getRandomValues(new Uint32Array(1))[0] % 9000);
function load(key: string): Scenario {
  try { const s = JSON.parse(localStorage.getItem(key) || 'null'); if (s?.version === 3 && Array.isArray(s.trips) && Array.isArray(s.tickets) && Array.isArray(s.audit)) return s; } catch { /* Fresh scenario if stored data cannot be read. */ }
  return initialScenario();
}
const when = (at: string) => new Date(at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
function Addresses({ trip }: { trip: { origin: string; destination: string } }) {
  return <div className="demo-route"><div><span>PARTIDA</span><p>{trip.origin}</p></div><div><span>CHEGADA</span><p>{trip.destination}</p></div></div>;
}
function Price({ value, driver = false, confirmed = true }: { value: ReturnType<typeof quote>; driver?: boolean; confirmed?: boolean }) {
  return <dl className="demo-price">
    <div><dt>Viagem {value.dynamic > 1 && `(demanda ×${value.dynamic.toLocaleString("pt-BR")})`}</dt><dd>{money(value.fare)}</dd></div>
    {driver ? <><div><dt>Comissão ({value.rate * 100}%)</dt><dd>− {money(value.commission)}</dd></div><div className="demo-earning"><dt>Ganho após comissão</dt><dd>{money(value.net)}</dd></div><div><dt>Total do passageiro</dt><dd>{money(value.total)}</dd></div></> : <><div><dt>Taxa de serviço</dt><dd>{money(value.fee)}</dd></div>{value.discount > 0 && <div><dt>Cupom A3 · custeado pela plataforma</dt><dd>− {money(value.discount)}</dd></div>}<div className="demo-earning"><dt>{confirmed ? 'Total confirmado' : 'Total previsto'}</dt><dd>{money(value.total)}</dd></div></>}
  </dl>;
}
export default function DemoJourney({ scope, role, onSwitch, offers }: Props) {
  const key = `levanos-demo-v3:${scope}:shared`;
  const [state, setState] = useState<Scenario>(() => load(key));
  const ref = useRef(state);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState(false);
  const [storageWarning, setStorageWarning] = useState('');
  const [choice, setChoice] = useState<Choice>(defaultChoice);
  const [boardPin, setBoardPin] = useState('');
  const [view, setView] = useState('journey');
  const [theme, setTheme] = useState('auto');
  const [history, setHistory] = useState(false);
  const [legacy] = useState<{ id: string; origin: string; destination: string; status: string }[]>(() => { try { const old = JSON.parse(localStorage.getItem(`levanos-demo-v1:${scope}:rides`) || '[]'); return Array.isArray(old) ? old.filter(v => v && typeof v.id === 'string' && typeof v.origin === 'string' && typeof v.destination === 'string') : []; } catch { return []; } });
  const [contact, setContact] = useState(false);
  const [call, setCall] = useState(false);
  useEffect(() => { setView('journey'); setFeedback(''); setContact(false); setCall(false); }, [role]);
  useEffect(() => {
    function sync(e: StorageEvent) { if (e.key === key) { const next = load(key); ref.current = next; setState(next); setFeedback('Demonstração atualizada pela outra aba deste navegador.'); } }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [key]);
  function send(action: Action) {
    const result = transition(ref.current, action);
    setFeedback(result.message); setError(Boolean(result.error));
    if (result.state !== ref.current) {
      ref.current = result.state; setState(result.state);
      try { localStorage.setItem(key, JSON.stringify(result.state)); setStorageWarning(''); }
      catch { setStorageWarning('Armazenamento indisponível: os dados serão mantidos somente enquanto este painel estiver aberto.'); }
    }
  }
  const trip = state.trips.find(t => t.id === state.current);
  const active = state.trips.some(isActive);
  const preview = routes[choice.route];
  const price = quote(state.config, choice);
  const driver = drivers.find(d => d.id === trip?.assigned);
  const eligible = trip?.status === 'Solicitada' ? candidates(state, trip) : [];
  const candidate = eligible[0];
  const operator = driver ?? candidate ?? drivers[0];
  const totals = ledger(state, operator.id);
  const frozen = trip && isActive(trip);
  const ownHistory = state.trips.filter(t => !isActive(t) && t.assigned === operator.id);
  const community = offers.filter(o => o.active && o.expires >= new Date().toLocaleDateString('en-CA'));
  function request(type: 'request' | 'receive') { setBoardPin(''); send({ type, choice: type === 'receive' ? defaultChoice : choice, id: id(), pin: pin() }); }
  const payments = ['Pix', 'Cartão de crédito', 'Cartão de débito', 'Carteira demo', 'Dinheiro'];
  return <div className={`demo-journey theme-${theme}`}>
    <nav className="demo-toolnav" aria-label="Ferramentas da apresentação">
      <button type="button" aria-pressed={view === 'journey'} onClick={() => setView('journey')}>Viagem e painel</button>
      <button type="button" aria-pressed={view === 'support'} onClick={() => setView('support')}>Ajuda e segurança</button>
      <button type="button" aria-pressed={view === 'admin'} onClick={() => setView('admin')}>Central da banca</button>
    </nav>
    <p className="demo-sync">Um cenário, duas perspectivas. Troque de perfil para acompanhar o mesmo pedido. Nenhuma conta de outra pessoa é conectada.</p>
    {feedback && <p className={`journey-feedback ${error ? 'is-error' : ''}`} role={error ? 'alert' : 'status'}>{feedback}</p>}
    {storageWarning && <p role="alert">{storageWarning}</p>}
    {view === 'admin' ? <Admin state={state} send={send} /> : view === 'support' ? <Support role={role} state={state} send={send} /> : <>
      <details className="demo-guide"><summary>Roteiro rápido para apresentar à banca</summary><ol><li>Motorista: envie os documentos fictícios. Na Central da banca, aprove o cadastro.</li><li>Motorista: simule a selfie e fique disponível.</li><li>Passageiro: valide a identidade fictícia, escolha a viagem e confirme.</li><li>Motorista: aceite, simule a chegada e digite o PIN da aba Passageiro.</li><li>Avance o percurso e conclua. Confira pagamento, avaliações, ganhos e saque.</li><li>Teste suporte e alertas em Ajuda e segurança; responda na Central da banca.</li></ol></details>
      {role === 'passenger' ? <div className="demo-driver-grid demo-passenger-grid">
        <section className="demo-section journey-stack"><span className="demo-step">PLANEJAR</span><h3>Para onde vamos?</h3>
          <div className="journey-check"><strong>Identidade do passageiro</strong><p>{state.passengerVerified ? 'Validação fictícia aprovada · passageiro de exemplo, nota 4,9.' : 'Simule CPF, selfie e vínculo de pagamento sem fornecer nenhum dado real.'}</p><button className="auth-secondary" type="button" disabled={state.passengerVerified} onClick={() => send({ type: 'verify' })}>{state.passengerVerified ? 'Identidade fictícia validada' : 'Simular validação de identidade'}</button></div>
          <label className="auth-field"><span>Trajeto de exemplo em Natal</span><select disabled={active} value={choice.route} onChange={e => setChoice({ ...choice, route: Number(e.target.value) })}>{routes.map((r, i) => <option key={r.origin} value={i}>{r.origin.split(',')[0]} → {r.destination.split(',')[0]}</option>)}</select></label>
          <label className="auth-field"><span>Categoria</span><select disabled={active} value={choice.category} onChange={e => setChoice({ ...choice, category: e.target.value as Choice['category'] })}>{Object.keys(categories).map(name => <option key={name}>{name}</option>)}</select></label>
          <p className="demo-help">Essencial: 4 lugares. Mais espaço: até 6, fator 1,30. Pet: fator 1,15. Entrega leve: fator 1,10. Categorias e fatores são hipóteses acadêmicas.</p>
          <label className="journey-toggle"><input type="checkbox" disabled={active} checked={choice.women} onChange={e => setChoice({ ...choice, women: e.target.checked })}/>Preferir condutora mulher no pareamento fictício</label>
          <label className="auth-field"><span>Pagamento simulado</span><select disabled={active} value={choice.payment} onChange={e => setChoice({ ...choice, payment: e.target.value })}>{payments.map(p => <option key={p}>{p}</option>)}</select></label>
          <p className="demo-help">Nenhum cartão, chave Pix ou número de carteira é solicitado. O pagamento só será marcado como simulado na conclusão.</p>
          {choice.payment === 'Dinheiro' && <label className="auth-field"><span>Troco para quanto? (0 = valor exato)</span><input type="number" min="0" step="0.01" disabled={active} value={choice.cash} onChange={e => setChoice({ ...choice, cash: Number(e.target.value) })}/></label>}
          <label className="journey-toggle"><input type="checkbox" disabled={active || !state.config.coupon} checked={choice.coupon} onChange={e => setChoice({ ...choice, coupon: e.target.checked })}/>Usar cupom A3 · até R$ 2 de desconto {state.config.coupon ? '' : '(pausado na central)'}</label>
          {!frozen && <><Addresses trip={preview}/><RouteMap origin={preview.origin} destination={preview.destination}/><p className="demo-trip-facts">{preview.km.toLocaleString('pt-BR')} km · {preview.minutes} min · espera de exemplo: 3 min após aceite</p><div className="journey-check"><strong>Encontro sugerido</strong><p>{preview.meeting}. Verifique o ambiente; não é uma certificação de segurança.</p></div><Price value={price} confirmed={false}/></>}
          <p className="demo-help">Premissa de teste: {money(state.config.perKm)}/km + {money(state.config.fee)} de taxa, com os fatores indicados. Estes preços e a demanda dinâmica não foram definidos como tarifas oficiais no plano de negócios.</p>
          {active && <p className="demo-help">Viagem em aberto: preço e escolhas estão preservados em Minha viagem.</p>}
          <button className="primary full" type="button" disabled={active || !state.passengerVerified} onClick={() => request('request')}>Confirmar viagem fictícia</button>
        </section>
        <section className="demo-section journey-stack"><span className="demo-step">ACOMPANHAR</span><h3>Minha viagem</h3>
          {!trip ? <div className="demo-empty">Seu pedido aparecerá aqui e na aba Motorista depois da confirmação.</div> : <>
            <TripSummary trip={trip} driver={false}/>
            {trip.status === 'Solicitada' && <div className="journey-check"><strong>Procurando motorista fictício</strong><p>{state.online ? `${eligible.length} candidato(s) elegível(is). Abra a aba Motorista para responder.` : 'O motorista precisa concluir a verificação e ficar disponível na outra aba.'}</p><button className="auth-secondary" type="button" onClick={() => onSwitch('driver')}>Ver pedido como motorista</button></div>}
            {driver && <div className="journey-check"><strong>{driver.name}</strong><p>{driver.car} · placa {driver.plate} · nota {driver.rating}</p><p>Embarque: {trip.meeting}</p></div>}
            {trip.status === 'Aceita' && <div className="journey-pin"><span>Seu PIN de embarque</span><strong>{trip.pin}</strong><p>Informe ao motorista somente no veículo correto. Na apresentação, use estes dígitos na aba Motorista.</p></div>}
            {['Aceita', 'Em andamento'].includes(trip.status) && <><Progress trip={trip}/><button className="auth-secondary full" type="button" onClick={() => send({ type: 'move' })}>Simular próxima atualização de posição</button><p className="demo-help">Este botão simula as posições recebidas. Aceite, início e conclusão são realizados na aba Motorista.</p></>}
            <Price value={trip.quote}/><p><strong>Pagamento:</strong> {trip.payment} · {trip.paid ? 'liquidado na simulação' : trip.status === 'Cancelada' ? 'cancelado sem cobrança' : 'aguardando conclusão'}</p>
            {isActive(trip) && <div className="demo-actions"><button type="button" className="auth-secondary" onClick={() => send({ type: 'cancel' })}>Cancelar viagem fictícia</button></div>}
            {trip.status === 'Concluída' && <Rating key={`${trip.id}-passenger`} trip={trip} role={role} send={send}/>}
          </>}
        </section>
      </div> : <>
        <div className="demo-metrics"><div><span>Viagens concluídas</span><strong>{totals.done.length}</strong></div><div><span>Ganho após comissão</span><strong>{money(totals.net)}</strong><small>Antes dos custos operacionais</small></div><div><span>Saldo para repasse fictício</span><strong>{money(totals.balance)}</strong></div></div>
        <div className="demo-driver-grid">
          <section className="demo-section journey-stack"><span className="demo-step">SEU TURNO</span><h3>Preparar para dirigir</h3><p><strong>Perfil em teste: {operator.name}</strong></p>
            <p>Uma única operação fictícia, compartilhada com a aba Passageiro.</p>
            <div className="journey-check"><strong>Documentos: {state.documents}</strong><p>Exemplos de CNH, documento do veículo e antecedentes. Não envie fotos nem dados pessoais.</p><button className="auth-secondary" type="button" disabled={['Em análise', 'Aprovado'].includes(state.documents)} onClick={() => send({ type: 'documents' })}>Simular envio de documentos</button>{state.documents === 'Em análise' && <button className="auth-secondary" type="button" onClick={() => setView('admin')}>Abrir análise na Central da banca</button>}</div>
            <button type="button" className="auth-secondary full" disabled={state.documents !== 'Aprovado' || state.selfie} onClick={() => send({ type: 'selfie' })}>{state.selfie ? 'Selfie fictícia aprovada' : 'Simular checagem facial do turno'}</button>
            <button type="button" className="primary full" onClick={() => send({ type: 'online' })}>{state.online ? 'Encerrar turno fictício' : 'Ficar disponível'}</button>
            <p className="demo-badge">{state.online ? 'Disponível na demonstração' : 'Fora de operação'}</p>
            <label className="auth-field"><span>Destino definido · filtrar ofertas</span><select value={state.destination} onChange={e => send({ type: 'destination', value: e.target.value })}>{['Qualquer destino', 'Tirol', 'Lagoa Nova', 'Praias urbanas'].map(z => <option key={z}>{z}</option>)}</select></label>
            <label className="auth-field"><span>Aparência para direção</span><select value={theme} onChange={e => setTheme(e.target.value)}><option value="auto">Automática pelo dispositivo</option><option value="light">Clara</option><option value="dark">Noturna</option></select></label>
            <button className="primary full" type="button" disabled={active && trip?.status !== 'Solicitada'} onClick={() => request('receive')}>Simular recebimento de pedido</button>
            <p className="demo-help">Se o passageiro já solicitou, este botão mostra o mesmo pedido. Sem solicitação, cria um passageiro fictício com Pix e trajeto UFRN → Midway.</p>
            <Demand demand={state.config.demand}/>
          </section>
          <section className="demo-section journey-stack"><span className="demo-step">TRABALHAR</span><h3>Pedidos e corridas</h3>
            <div className="demo-subnav"><button type="button" aria-pressed={!history} onClick={() => setHistory(false)}>Pedido atual</button><button type="button" aria-pressed={history} onClick={() => setHistory(true)}>Histórico ({ownHistory.length})</button></div>
            {history ? <div className="demo-card-list">{legacy.length > 0 && <details className="demo-details"><summary>Registros da demonstração anterior ({legacy.length})</summary><p>Preservados neste navegador. Não integram os ganhos do novo cenário compartilhado.</p>{legacy.map(v => <article key={v.id}><strong>{v.status}</strong><Addresses trip={v}/></article>)}</details>}{ownHistory.map(t => <article key={t.id} className="demo-ride"><strong>{t.status}</strong><Addresses trip={t}/><p>Ganho: {money(t.status === 'Concluída' ? t.quote.net : 0)} · {t.payment}</p><small>Referência {t.id.slice(0, 8)}</small></article>)}{!ownHistory.length && <p className="demo-empty">Conclua ou cancele um pedido para ver o histórico.</p>}</div> : !trip ? <p className="demo-empty">Nenhum pedido. Confirme na aba Passageiro ou simule o recebimento.</p> : <>
              <TripSummary trip={trip} driver/>
              <p><strong>Passageiro fictício:</strong> Marina · nota 4,9 · identidade de exemplo validada</p>
              {trip.status === 'Solicitada' && <div className="journey-check"><strong>{candidate ? `Candidato: ${candidate.name}` : 'Nenhum candidato elegível'}</strong><p>{candidate ? `${candidate.pickup.toLocaleString('pt-BR')} km até o embarque · espera fictícia 3 min. ${eligible.length} candidato(s), ordenados por proximidade.` : 'Ajuste o filtro de destino. Se todos recusarem, o passageiro pode cancelar e tentar de novo.'}</p><p>Pareamento: proximidade + categoria + preferência por condutora + destino. Não utiliza GPS real.</p></div>}
              {driver && <p>Condutor selecionado: {driver.name}</p>}
              <Price value={trip.quote} driver/>
              <p className="demo-help">A taxa de serviço não integra o ganho. Cupons são custeados pela plataforma e não reduzem o ganho do motorista.</p>
              <p><strong>Pagamento:</strong> {trip.payment}{trip.payment === 'Dinheiro' ? trip.cash ? ` · troco para ${money(trip.cash)}: ${money(trip.cash - trip.quote.total)}` : ' · valor exato' : ' · sem cobrança real'}</p>
              <div className="demo-actions">
                {trip.status === 'Solicitada' && <><button className="primary" type="button" disabled={!state.online || !candidate} onClick={() => send({ type: 'accept' })}>Aceitar corrida</button><button className="auth-secondary" type="button" disabled={!state.online || !candidate} onClick={() => send({ type: 'decline' })}>Recusar pedido</button></>}
                {['Aceita', 'Em andamento'].includes(trip.status) && <button className="primary" type="button" disabled={trip.status === 'Aceita' ? trip.pickup === 100 : trip.progress === 100} onClick={() => send({ type: 'move' })}>{trip.status === 'Aceita' ? 'Simular deslocamento ao embarque' : 'Avançar percurso fictício'}</button>}
              </div>
              {['Aceita', 'Em andamento'].includes(trip.status) && <><Progress trip={trip}/><div className="demo-actions"><a className="auth-secondary" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(trip.origin)}&destination=${encodeURIComponent(trip.destination)}&travelmode=driving`}>Ver no Google Maps</a><a className="auth-secondary" target="_blank" rel="noopener noreferrer" href={`https://waze.com/ul?q=${encodeURIComponent(trip.status === 'Aceita' ? trip.origin : trip.destination)}&navigate=yes`}>Abrir destino no Waze</a></div><p className="demo-help">Mapas externos abrem em outra aba e dependem da internet. Não acompanham esta simulação.</p></>}
              {trip.status === 'Aceita' && <form className="journey-stack" onSubmit={e => { e.preventDefault(); send({ type: 'start', pin: boardPin }); }}><label className="auth-field"><span>PIN informado pelo passageiro</span><input required inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={boardPin} autoComplete="off" onChange={e => setBoardPin(e.target.value.replace(/\D/g, ''))}/></label><button className="primary full" disabled={trip.pickup < 100} type="submit">Validar PIN e iniciar corrida</button><p className="demo-help">Simule a chegada antes de iniciar. O PIN está visível somente na aba Passageiro.</p></form>}
              {trip.status === 'Em andamento' && <button className="primary full" type="button" disabled={trip.progress < 100} onClick={() => send({ type: 'finish' })}>Concluir corrida fictícia</button>}
              {['Aceita', 'Em andamento'].includes(trip.status) && <button className="auth-secondary full" type="button" onClick={() => send({ type: 'cancel' })}>Cancelar corrida simulada</button>}
              {trip.status === 'Concluída' && <><p className="demo-complete">Viagem concluída e pagamento simulado registrado uma vez.</p><Rating key={`${trip.id}-driver`} role={role} trip={trip} send={send}/></>}
            </>}
          </section>
        </div>
        <section className="demo-section journey-stack journey-finance"><span className="demo-step">FINANÇAS</span><h3>Seus ganhos, sem surpresa</h3><p>{operator.name} · apenas viagens atribuídas a este condutor. Após uma recusa, o próximo candidato assume o painel.</p><dl className="demo-price"><div><dt>Ganhos após comissão</dt><dd>{money(totals.net)}</dd></div><div><dt>Dinheiro já recebido do passageiro</dt><dd>− {money(totals.cash)}</dd></div><div><dt>Saques fictícios anteriores</dt><dd>− {money(totals.withdrawn)}</dd></div><div className="demo-earning"><dt>Saldo de repasse</dt><dd>{money(totals.balance)}</dd></div></dl><p className="demo-help">O dinheiro já recebido entra no acerto com a plataforma. Saldo negativo indica valor a compensar, não um saque disponível. Combustível, manutenção e impostos não estão descontados. {totals.bonus}.</p><button type="button" className="primary" disabled={totals.balance <= 0} onClick={() => send({ type: 'withdraw', driver: operator.id })}>Simular saque Pix do saldo</button>{state.withdrawals.filter(w => w.driver === operator.id).map(w => <p key={w.id}>Repasse fictício registrado: {money(w.amount)}</p>)}</section>
      </>}
      <section className="demo-section journey-stack journey-finance"><h3>Benefícios da comunidade</h3><p>Ofertas ativas cadastradas na aba Parceiro desta mesma demonstração. Pausar ou expirar uma oferta a retira desta vitrine. Estes benefícios não alteram automaticamente o preço da viagem.</p>{!community.length && <p className="demo-empty">Cadastre uma oferta na aba Parceiro para vê-la aqui.</p>}<div className="demo-offer-grid">{community.map(o => <article key={o.id} className="demo-offer"><h4>{o.title}</h4><p>{o.business}</p><div className="demo-benefit">{o.benefit}</div><p>{o.conditions}</p><p>Válida até {o.expires.split('-').reverse().join('/')}</p></article>)}</div></section>
      {trip && <section className="demo-section journey-stack journey-communication"><h3>Conversa e proteção da viagem</h3><p>Somente o perfil selecionado escreve ou envia ações. Troque de aba para responder como a outra pessoa.</p>
        {['Aceita', 'Em andamento'].includes(trip.status) ? <>
          <Chat key={`${trip.id}-${role}`} trip={trip} role={role} send={send}/>
          <div className="demo-actions"><button className="auth-secondary" type="button" onClick={() => setCall(v => !v)}>{call ? 'Encerrar chamada fictícia' : 'Simular chamada protegida'}</button><button className="auth-secondary" type="button" onClick={() => { send({ type: 'share' }); setContact(true); }}>Compartilhar acompanhamento fictício</button><button className="journey-danger" type="button" onClick={() => send({ type: 'incident', kind: `Pedido de ajuda pelo ${role === 'passenger' ? 'passageiro' : 'motorista'} · SIMULAÇÃO`, id: id() })}>Testar botão de ajuda · simulação</button></div>
          {call && <p className="journey-feedback" role="status">Chamada fictícia conectada · identificadores protegidos. Sem áudio, VoIP real ou exposição de telefones.</p>}
          {contact && state.shared === trip.id && <div className="journey-check" role="status"><strong>Visão do contato de confiança · fictícia</strong><p>{trip.status} · {driver?.name} · {driver?.plate}</p><Addresses trip={trip}/><p>Progresso: {trip.status === 'Aceita' ? `aproximação ${trip.pickup}%` : `${trip.progress}% do trajeto`}. Este cartão acompanha as atualizações neste painel. Não gera link público.</p><button className="auth-secondary" type="button" onClick={() => setContact(false)}>Fechar visão do contato</button></div>}
        </> : <p className="demo-help">Chat, chamada e acompanhamento ficam disponíveis entre o aceite e a conclusão. Nenhum telefone pessoal é exibido.</p>}
        {state.alerts.filter(a => a.trip === trip.id).map(a => <p key={a.id} className="journey-feedback">{a.text} · {a.resolved ? 'Revisado pela central fictícia' : 'Pendente na central fictícia'}</p>)}
        <details className="demo-details"><summary>Registro da viagem</summary><ol>{trip.events.map((e, i) => <li key={i}>{when(e.at)} · {e.text}</li>)}</ol></details>
      </section>}
    </>}
  </div>;
}
function TripSummary({ trip, driver }: { trip: Trip; driver: boolean }) {
  const progress = ['Solicitada', 'Aceita', 'Em andamento', 'Concluída'];
  return <><div className="demo-card-heading"><strong className="demo-badge">{trip.status}</strong><span>Ref. {trip.id.slice(0, 8)} · {trip.category}</span></div><ol className="demo-timeline">{progress.map((v, i) => <li className={i <= progress.indexOf(trip.status) ? 'reached' : ''} aria-current={v === trip.status ? 'step' : undefined} key={v}><span>{i + 1}</span>{v}</li>)}</ol><Addresses trip={trip}/><RouteMap origin={trip.origin} destination={trip.destination} vehicleProgress={['Aceita', 'Em andamento', 'Concluída'].includes(trip.status) ? trip.status === 'Aceita' ? 0 : trip.progress : undefined}/><p className="demo-trip-facts">{trip.km.toLocaleString('pt-BR')} km · {trip.minutes} min · distâncias e tempos fixados para o cenário acadêmico</p>{driver && <p className="demo-help">O PIN deve ser informado pelo passageiro no embarque.</p>}</>;
}
function Progress({ trip }: { trip: Trip }) {
  const value = trip.status === 'Aceita' ? trip.pickup : trip.progress;
  return <div className="journey-progress"><label>{trip.status === 'Aceita' ? 'Aproximação fictícia do embarque' : 'Percurso fictício'} · {value}%</label><progress max="100" value={value}/><p>{trip.status === 'Aceita' ? value === 100 ? 'Chegou ao embarque. Confira veículo e PIN.' : `Chegada estimada: ${Math.ceil(3 * (1 - value / 100))} min fictícios.` : `Tempo restante: ${Math.ceil(trip.minutes * (1 - value / 100))} min fictícios.`} Sem GPS real.</p></div>;
}
function Chat({ trip, role, send }: { trip: Trip; role: Role; send: (a: Action) => void }) {
  const [text, setText] = useState('');
  return <div className="journey-chat"><h4>Chat interno fictício</h4><div className="journey-chat-log" role="log" aria-label="Mensagens da viagem">{!trip.chat.length && <p>Nenhuma mensagem. Use uma resposta rápida ou escreva abaixo.</p>}{trip.chat.map((m, i) => <p key={i} className={m.role === role ? 'mine' : ''}><strong>{m.role === 'passenger' ? 'Passageiro' : 'Motorista'} · {when(m.at)}</strong><span>{m.text}</span></p>)}</div><div className="demo-actions">{(role === 'passenger' ? ['Estou no ponto de encontro.', 'Estou chegando.'] : ['Cheguei ao embarque.', 'Pode confirmar o veículo?']).map(t => <button key={t} type="button" className="auth-secondary" onClick={() => send({ type: 'message', role, text: t })}>{t}</button>)}</div><form className="journey-stack" onSubmit={e => { e.preventDefault(); if (text.trim()) { send({ type: 'message', role, text }); setText(''); } }}><label className="auth-field"><span>Mensagem como {role === 'passenger' ? 'passageiro' : 'motorista'}</span><input maxLength={300} required value={text} onChange={e => setText(e.target.value)}/></label><button className="primary" type="submit">Enviar mensagem fictícia</button></form></div>;
}
function Rating({ trip, role, send }: { trip: Trip; role: Role; send: (a: Action) => void }) {
  const [stars, setStars] = useState(5); const [tags, setTags] = useState<string[]>([]);
  const saved = trip.ratings[role];
  return <div className="journey-rating"><h4>Avaliar {role === 'passenger' ? 'motorista' : 'passageiro'}</h4>{saved ? <p role="status">Sua avaliação: {saved.stars}/5 · {saved.tags.join(', ') || 'sem critérios adicionais'}. Para contestar, abra Ajuda e segurança.</p> : <form className="journey-stack" onSubmit={e => { e.preventDefault(); send({ type: 'rate', role, stars, tags }); }}><label className="auth-field"><span>Nota</span><select value={stars} onChange={e => setStars(Number(e.target.value))}>{[5, 4, 3, 2, 1].map(v => <option value={v} key={v}>{v} de 5 estrelas</option>)}</select></label><div className="journey-tags">{(role === 'passenger' ? ['Limpeza', 'Direção', 'Pontualidade', 'Cordialidade'] : ['Pontualidade', 'Respeito', 'Embarque', 'Cordialidade']).map(tag => <label key={tag}><input type="checkbox" checked={tags.includes(tag)} onChange={e => setTags(e.target.checked ? [...tags, tag] : tags.filter(t => t !== tag))}/>{tag}</label>)}</div><button type="submit" className="primary">Registrar avaliação</button></form>}</div>;
}
function Demand({ demand }: { demand: Config['demand'] }) {
  return <div className="journey-demand"><h4>Demanda ilustrativa em Natal</h4><div className="journey-heat" aria-label="Mapa esquemático de demanda, sem GPS"><span className="heat-high">Tirol<br/>Alta</span><span className="heat-mid">Lagoa Nova<br/>Média</span><span className="heat-low">Praias urbanas<br/>Baixa</span></div><p>Esquema fictício, sem dados de mercado. Cenário tarifário: {demand}. A central simula a relação oferta/demanda: normal ×1, alta ×1,25, pico ×1,50. Limite demonstrativo: ×1,50.</p></div>;
}
function Support({ role, state, send }: { role: Role; state: Scenario; send: (a: Action) => void }) {
  const [reason, setReason] = useState('Objeto esquecido'); const [text, setText] = useState('');
  return <div className="demo-driver-grid"><section className="demo-section journey-stack"><h3>Ajuda para {role === 'passenger' ? 'passageiro' : 'motorista'}</h3><p>Fila de atendimento humano simulada. A banca assume o papel da equipe na Central da banca. Não há atendimento real conectado.</p><form className="journey-stack" onSubmit={e => { e.preventDefault(); if (text.trim()) { send({ type: 'ticket', role, reason, text, id: id() }); setText(''); } }}><label className="auth-field"><span>Assunto</span><select value={reason} onChange={e => setReason(e.target.value)}>{['Objeto esquecido', 'Pagamento', 'Segurança', 'Contestar avaliação', 'Outra dúvida'].map(v => <option key={v}>{v}</option>)}</select></label><label className="auth-field"><span>Descrição fictícia (sem dados pessoais)</span><textarea required rows={4} maxLength={500} value={text} onChange={e => setText(e.target.value)}/></label><button className="primary" type="submit">Abrir protocolo fictício</button></form><h4>Monitoramento simulado</h4><p>Teste alertas durante uma viagem aceita ou em andamento. A detecção é acionada manualmente pela banca, sem monitoramento real.</p><div className="demo-actions">{['Parada longa não prevista', 'Desvio de rota'].map(kind => <button className="auth-secondary" key={kind} type="button" onClick={() => send({ type: 'incident', id: id(), kind: `${kind} · SIMULAÇÃO` })}>Simular {kind.toLowerCase()}</button>)}</div></section><section className="demo-section journey-stack"><h3>Meus protocolos</h3>{!state.tickets.some(t => t.role === role) && <p className="demo-empty">Nenhum protocolo deste perfil.</p>}{state.tickets.filter(t => t.role === role).map(t => <article className="demo-ride" key={t.id}><strong>{t.reason} · {t.status}</strong><p>Protocolo {t.id.slice(0, 8)} {t.trip && `· viagem ${t.trip.slice(0, 8)}`}</p><p>{t.text}</p><p className="journey-reply">{t.reply || 'Aguardando resposta da central fictícia.'}</p></article>)}</section></div>;
}
function Admin({ state, send }: { state: Scenario; send: (a: Action) => void }) {
  const [config, setConfig] = useState(state.config);
  const [reply, setReply] = useState<Record<string, string>>({});
  const l = ledger(state);
  return <div className="journey-admin journey-stack"><aside className="demo-notice"><strong>Central da banca · operação fictícia</strong><p>Acesso de apresentação, restrito ao cenário local da sua conta. Não é um painel administrativo de produção e não concede privilégios no Supabase.</p></aside>
    <section className="demo-section journey-stack"><h3>Aprovação de identidade</h3><p>Motorista: {state.documents}. CNH, veículo e antecedentes são exemplos fictícios. A selfie é simulada na aba Motorista depois da aprovação.</p><div className="demo-actions"><button type="button" className="primary" disabled={state.documents !== 'Em análise'} onClick={() => send({ type: 'approve', approved: true })}>Aprovar documentos fictícios</button><button type="button" className="auth-secondary" disabled={state.documents !== 'Em análise'} onClick={() => send({ type: 'approve', approved: false })}>Solicitar novo envio</button></div></section>
    <section className="demo-section journey-stack"><h3>Tarifas e campanhas de teste · Natal/RN</h3><p>Configuração apenas acadêmica, sem alterar a oferta pública nem o plano de negócios. Cada pedido preserva as condições do momento da confirmação.</p><form className="journey-stack" onSubmit={(e: FormEvent) => { e.preventDefault(); send({ type: 'settings', config }); }}><div className="demo-field-grid"><label className="auth-field"><span>Premissa R$/km</span><input type="number" min="0.01" max="10" step="0.01" required value={config.perKm} onChange={e => setConfig({ ...config, perKm: Number(e.target.value) })}/></label><label className="auth-field"><span>Taxa de serviço R$</span><input type="number" min="0" max="5" step="0.01" required value={config.fee} onChange={e => setConfig({ ...config, fee: Number(e.target.value) })}/></label><label className="auth-field"><span>Comissão do motorista</span><select value={config.rate} onChange={e => setConfig({ ...config, rate: Number(e.target.value) })}><option value="0">Fundador · 0% nos 90 dias propostos</option><option value="0.03">Após isenção · 3% inicial proposto</option></select></label><label className="auth-field"><span>Cenário de oferta e demanda</span><select value={config.demand} onChange={e => setConfig({ ...config, demand: e.target.value as Config['demand'] })}><option value="normal">Equilibrado · ×1</option><option value="alta">Alta demanda · ×1,25</option><option value="pico">Pico · ×1,50 (limite)</option></select></label></div><label className="journey-toggle"><input type="checkbox" checked={config.coupon} onChange={e => setConfig({ ...config, coupon: e.target.checked })}/>Cupom A3 ativo · plataforma cobre até R$ 2 por viagem</label><button type="submit" className="primary">Salvar premissas da demonstração</button></form></section>
    <section className="demo-section journey-stack"><h3>Conferência financeira</h3><p>Apenas viagens concluídas entram no cálculo. Cancelamentos e recusas não geram receita.</p><dl className="demo-price"><div><dt>Total pago pelos passageiros (simulado)</dt><dd>{money(l.done.reduce((v, t) => v + t.quote.total, 0))}</dd></div><div><dt>Ganhos dos motoristas</dt><dd>{money(l.net)}</dd></div><div><dt>Plataforma: taxas + comissões − cupons</dt><dd>{money(l.done.reduce((v, t) => v + t.quote.fee + t.quote.commission - t.quote.discount, 0))}</dd></div></dl><p className="demo-help">Os valores são brutos e fictícios. Receita da plataforma pode ser negativa em campanha subsidiada. Saques alteram o saldo de repasse, sem criar novos ganhos.</p></section>
    <section className="demo-section journey-stack"><h3>Segurança e auditoria de ocorrências</h3>{!state.alerts.length && <p className="demo-empty">Sem alertas. Teste ajuda, parada longa ou desvio durante uma viagem.</p>}{state.alerts.map(a => <article className="demo-ride" key={a.id}><strong>{a.text}</strong><p>Viagem {a.trip.slice(0, 8)} · {a.resolved ? 'Revisado' : 'Aguardando revisão'}</p><button className="auth-secondary" type="button" disabled={a.resolved} onClick={() => send({ type: 'resolve', id: a.id })}>Registrar revisão do alerta</button></article>)}<p className="demo-help">Validação de PIN, bloqueios de etapa e registro de eventos demonstram barreiras contra fraude. Não há análise antifraude automatizada ou checagem de bases reais.</p></section>
    <section className="demo-section journey-stack"><h3>Atendimento da central fictícia</h3>{!state.tickets.length && <p className="demo-empty">Os chamados de Ajuda e segurança aparecerão aqui.</p>}{state.tickets.map(t => <form className="demo-ride journey-stack" key={t.id} onSubmit={e => { e.preventDefault(); send({ type: 'support', id: t.id, status: 'Resolvido', reply: reply[t.id] || t.reply }); }}><strong>{t.reason} · {t.role === 'passenger' ? 'Passageiro' : 'Motorista'} · {t.status}</strong><p>{t.text}</p><label className="auth-field"><span>Resposta da equipe fictícia · protocolo {t.id.slice(0, 8)}</span><textarea rows={3} required maxLength={500} value={reply[t.id] ?? t.reply} onChange={e => setReply({ ...reply, [t.id]: e.target.value })}/></label><div className="demo-actions"><button className="auth-secondary" type="button" onClick={() => send({ type: 'support', id: t.id, status: 'Em atendimento', reply: reply[t.id] || t.reply || 'A equipe fictícia assumiu seu caso e está verificando os detalhes.' })}>Assumir atendimento fictício</button><button className="primary" type="submit">Responder e resolver</button></div></form>)}</section>
    <section className="demo-section journey-stack"><h3>Trilha de auditoria</h3><p>Últimos 100 eventos deste cenário. O histórico de cada viagem permanece no respectivo registro.</p><ol className="journey-audit">{state.audit.map((v, i) => <li key={i}><time>{when(v.at)}</time> {v.text}</li>)}</ol></section>
  </div>;
}
