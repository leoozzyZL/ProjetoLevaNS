/** Academic simulation only. No money movement, GPS, document checks or emergency calls. */
export const money = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const routes = [
  { origin: 'UFRN, Lagoa Nova, Natal/RN', destination: 'Midway Mall, Tirol, Natal/RN', km: 5.1, minutes: 13, meeting: 'Entrada principal da UFRN · ponto de encontro ilustrativo', zone: 'Tirol' },
  { origin: 'Praça Cívica, Petrópolis, Natal/RN', destination: 'Praia do Meio, Natal/RN', km: 2, minutes: 7, meeting: 'Lateral da Praça Cívica · ponto de encontro ilustrativo', zone: 'Praias urbanas' },
  { origin: 'Via Direta, Lagoa Nova, Natal/RN', destination: 'Arena das Dunas, Lagoa Nova, Natal/RN', km: 3.1, minutes: 9, meeting: 'Entrada principal do Via Direta · ponto de encontro ilustrativo', zone: 'Lagoa Nova' },
];
export const categories = { Essencial: 1, 'Mais espaço': 1.3, Pet: 1.15, 'Entrega leve': 1.1 };
export type Role = 'passenger' | 'driver';
export type Status = 'Solicitada' | 'Aceita' | 'Em andamento' | 'Concluída' | 'Cancelada';
export type Config = { perKm: number; fee: number; rate: number; demand: 'normal' | 'alta' | 'pico'; coupon: boolean };
export type Choice = { route: number; category: keyof typeof categories; women: boolean; payment: string; cash: number; coupon: boolean };
export type Quote = { fare: number; fee: number; discount: number; total: number; commission: number; net: number; rate: number; dynamic: number; base: number };
export type Trip = { id: string; route: number; origin: string; destination: string; km: number; minutes: number; meeting: string; zone: string; category: string; women: boolean; payment: string; cash: number; quote: Quote; pin: string; status: Status; assigned: string | null; declined: string[]; progress: number; pickup: number; paid: boolean; chat: { role: Role; text: string; at: string }[]; ratings: Partial<Record<Role, { stars: number; tags: string[] }>>; events: { at: string; text: string }[] };
export type Ticket = { id: string; role: Role; reason: string; text: string; status: 'Aberto' | 'Em atendimento' | 'Resolvido'; reply: string; trip: string | null };
export type Scenario = { version: 3; trips: Trip[]; current: string | null; config: Config; passengerVerified: boolean; documents: 'Pendente' | 'Em análise' | 'Aprovado' | 'Rejeitado'; selfie: boolean; online: boolean; destination: string; withdrawals: { id: string; amount: number; driver: string }[]; tickets: Ticket[]; alerts: { id: string; trip: string; text: string; resolved: boolean }[]; audit: { at: string; text: string }[]; shared: string | null };
export const drivers = [
  { id: 'ana', name: 'Ana · condutora fictícia', woman: true, pickup: .7, zone: 'Tirol', plate: 'DEMO-001', car: 'Sedã azul · 4 lugares', rating: '4,9' },
  { id: 'carlos', name: 'Carlos · condutor fictício', woman: false, pickup: 1.2, zone: 'Lagoa Nova', plate: 'DEMO-002', car: 'Sedã branco · 4 lugares', rating: '4,8' },
  { id: 'bia', name: 'Bia · condutora fictícia', woman: true, pickup: 2.1, zone: 'Praias urbanas', plate: 'DEMO-003', car: 'Veículo amplo · até 6 lugares', rating: '4,9' },
];
export const initialScenario = (): Scenario => ({ version: 3, trips: [], current: null, config: { perKm: 2, fee: 1, rate: 0, demand: 'normal', coupon: true }, passengerVerified: false, documents: 'Pendente', selfie: false, online: false, destination: 'Qualquer destino', withdrawals: [], tickets: [], alerts: [], audit: [], shared: null });
export const isActive = (t: Trip) => ['Solicitada', 'Aceita', 'Em andamento'].includes(t.status);
export function quote(config: Config, choice: Choice): Quote {
  const route = routes[choice.route] ?? routes[0];
  const dynamic = config.demand === 'pico' ? 1.5 : config.demand === 'alta' ? 1.25 : 1;
  const base = round(route.km * config.perKm * categories[choice.category]);
  const fare = round(base * dynamic);
  const discount = choice.coupon && config.coupon ? Math.min(2, round(fare + config.fee)) : 0;
  const commission = round(fare * config.rate);
  return { base, fare, fee: config.fee, discount, total: round(fare + config.fee - discount), commission, net: round(fare - commission), rate: config.rate, dynamic };
}
export function candidates(s: Scenario, t: Trip) {
  return drivers.filter(d => !t.declined.includes(d.id) && (!t.women || d.woman) && (t.category !== 'Mais espaço' || d.id === 'bia') && (s.destination === 'Qualquer destino' || t.zone === s.destination)).sort((a, b) => a.pickup - b.pickup);
}
export function ledger(s: Scenario, driverId?: string) {
  const done = s.trips.filter(t => t.status === 'Concluída' && (!driverId || t.assigned === driverId));
  const net = round(done.reduce((v, t) => v + t.quote.net, 0));
  const cash = round(done.filter(t => t.payment === 'Dinheiro').reduce((v, t) => v + t.quote.total, 0));
  const withdrawn = round(s.withdrawals.filter(w => !driverId || w.driver === driverId).reduce((v, w) => v + w.amount, 0));
  // Cash is already in the driver's hands; the balance can be negative (platform settlement due).
  const balance = round(net - cash - withdrawn);
  return { done, net, cash, withdrawn, balance, bonus: done.length >= 3 ? 'Meta demonstrativa atingida · sem crédito financeiro' : `${done.length}/3 viagens para a meta demonstrativa` };
}
export type Action =
  | { type: 'verify' | 'documents' | 'selfie' | 'online' | 'share' }
  | { type: 'withdraw'; driver: string }
  | { type: 'request'; choice: Choice; id: string; pin: string }
  | { type: 'receive'; choice: Choice; id: string; pin: string }
  | { type: 'accept' | 'decline' | 'start' | 'finish' | 'cancel' | 'move'; pin?: string }
  | { type: 'message'; role: Role; text: string }
  | { type: 'rate'; role: Role; stars: number; tags: string[] }
  | { type: 'ticket'; role: Role; reason: string; text: string; id: string }
  | { type: 'incident'; id: string; kind: string }
  | { type: 'destination'; value: string }
  | { type: 'approve'; approved: boolean }
  | { type: 'settings'; config: Config }
  | { type: 'resolve'; id: string }
  | { type: 'support'; id: string; status: Ticket['status']; reply: string };
export function transition(s: Scenario, a: Action, at = new Date().toISOString()): { state: Scenario; message: string; error?: boolean } {
  const fail = (message: string) => ({ state: s, message, error: true });
  const ok = (patch: Partial<Scenario>, message: string) => ({ state: { ...s, ...patch, audit: [{ at, text: message }, ...s.audit].slice(0, 100) }, message });
  const t = s.trips.find(t => t.id === s.current);
  const changeTrip = (next: Trip, message: string) => ok({ trips: s.trips.map(v => v.id === next.id ? { ...next, events: [...next.events, { at, text: message }] } : v) }, message);
  switch (a.type) {
    case 'verify': return ok({ passengerVerified: true }, 'Identidade fictícia do passageiro validada. Nenhum documento real foi coletado.');
    case 'documents': return ok({ documents: 'Em análise', selfie: false, online: false }, 'CNH, veículo e antecedentes fictícios enviados. Abra Configurações da simulação para aprovar o cadastro.');
    case 'approve': if (s.documents !== 'Em análise') return fail('Envie os documentos fictícios no seu painel antes da análise.'); return ok({ documents: a.approved ? 'Aprovado' : 'Rejeitado', online: false, selfie: false }, a.approved ? 'Cadastro fictício aprovado. O motorista pode simular a selfie e ficar disponível.' : 'Cadastro fictício rejeitado. O motorista pode reenviar os exemplos.');
    case 'selfie': if (s.documents !== 'Aprovado') return fail('Aguarde a aprovação dos documentos em Configurações da simulação.'); return ok({ selfie: true }, 'Checagem facial fictícia aprovada para este turno. Sem câmera ou reconhecimento real.');
    case 'online': if (s.documents !== 'Aprovado' || !s.selfie) return fail('Conclua a aprovação e a selfie fictícia antes de ficar disponível.'); if (t && ['Aceita', 'Em andamento'].includes(t.status) && s.online) return fail('Finalize ou cancele a viagem antes de encerrar o turno.'); return ok({ online: !s.online, selfie: s.online ? false : s.selfie }, s.online ? 'Turno encerrado. Uma nova selfie fictícia será necessária.' : 'Motorista disponível na demonstração.');
    case 'destination': return ok({ destination: a.value }, 'Filtro de destino atualizado para os próximos pedidos.');
    case 'settings': if (!Number.isFinite(a.config.perKm) || a.config.perKm <= 0 || a.config.perKm > 10 || !Number.isFinite(a.config.fee) || a.config.fee < 0 || a.config.fee > 5 || ![0, .03].includes(a.config.rate) || !['normal', 'alta', 'pico'].includes(a.config.demand)) return fail('Use tarifa entre R$ 0,01 e R$ 10, taxa entre R$ 0 e R$ 5 e comissão de 0% ou 3%.'); return ok({ config: a.config }, 'Premissas salvas apenas na demonstração. Viagens já confirmadas mantêm o preço e a comissão originais.');
    case 'request': case 'receive': {
      if (s.trips.some(isActive)) {
        if (a.type === 'receive' && t?.status === 'Solicitada') return ok({}, 'O pedido do passageiro já está disponível aqui. É o mesmo pedido no acompanhamento da viagem.');
        return fail('Há uma viagem em aberto. Conclua ou cancele antes de criar outra.');
      }
      if (a.type === 'request' && !s.passengerVerified) return fail('Simule a validação de identidade antes de confirmar.');
      if (!routes[a.choice.route] || !Object.prototype.hasOwnProperty.call(categories, a.choice.category) || !['Pix', 'Cartão de crédito', 'Cartão de débito', 'Carteira demo', 'Dinheiro'].includes(a.choice.payment) || !/^\d{4}$/.test(a.pin)) return fail('Escolha um trajeto, categoria e pagamento válidos.');
      const price = quote(s.config, a.choice);
      if (a.choice.payment === 'Dinheiro' && (!Number.isFinite(a.choice.cash) || (a.choice.cash !== 0 && a.choice.cash < price.total))) return fail('Informe troco para um valor maior ou igual ao total, ou zero para valor exato.');
      const route = routes[a.choice.route];
      const trip: Trip = { ...route, id: a.id, route: a.choice.route, category: a.choice.category, women: a.choice.women, payment: a.choice.payment, cash: a.choice.payment === 'Dinheiro' ? a.choice.cash : 0, quote: price, pin: a.pin, status: 'Solicitada', assigned: null, declined: [], progress: 0, pickup: 0, paid: false, chat: [], ratings: {}, events: [{ at, text: 'Viagem fictícia solicitada' }] };
      return ok({ trips: [trip, ...s.trips], current: trip.id, shared: null, passengerVerified: s.passengerVerified || a.type === 'receive' }, 'Viagem fictícia solicitada. Acompanhe o pedido no seu painel.');
    }
    case 'accept': {
      if (!t || t.status !== 'Solicitada') return fail('Nenhum pedido aguardando aceite.');
      if (!s.online || s.documents !== 'Aprovado' || !s.selfie) return fail('O motorista precisa estar aprovado, com selfie e disponível.');
      const driver = candidates(s, t)[0];
      if (!driver) return fail('Nenhum motorista elegível. Remova o filtro de destino ou cancele e tente outra categoria.');
      return changeTrip({ ...t, status: 'Aceita', assigned: driver.id, pickup: 0 }, `Corrida aceita por ${driver.name}. Previsão fictícia de chegada: 3 minutos.`);
    }
    case 'decline': {
      if (!t || t.status !== 'Solicitada') return fail('Somente pedidos solicitados podem ser recusados.');
      if (!s.online) return fail('Fique disponível antes de responder ao pedido.');
      const driver = candidates(s, t)[0];
      if (!driver) return fail('Não há candidato elegível para recusar.');
      return changeTrip({ ...t, declined: [...t.declined, driver.id] }, `Pedido recusado por ${driver.name}. A solicitação continua aberta para o próximo candidato fictício.`);
    }
    case 'start': if (!t || t.status !== 'Aceita') return fail('Aceite a corrida antes de iniciar.'); if (t.pickup < 100) return fail('Simule a chegada ao embarque antes de iniciar.'); if (a.pin !== t.pin) return fail('PIN incorreto. Confira os quatro dígitos informados pelo passageiro fictício.'); return changeTrip({ ...t, status: 'Em andamento', progress: 0 }, 'PIN confirmado. Corrida fictícia iniciada.');
    case 'move': if (!t || !['Aceita', 'Em andamento'].includes(t.status)) return fail('Aceite uma corrida para simular o deslocamento.'); if (t.status === 'Aceita') return changeTrip({ ...t, pickup: Math.min(100, t.pickup + 50) }, t.pickup >= 50 ? 'Veículo fictício chegou ao ponto de embarque.' : 'Veículo fictício a caminho do embarque.'); return changeTrip({ ...t, progress: Math.min(100, t.progress + 25) }, 'Posição fictícia atualizada no mapa da viagem.');
    case 'finish': if (!t || t.status !== 'Em andamento') return fail('Inicie a corrida e valide o PIN antes de concluir.'); if (t.progress < 100) return fail('Simule o percurso até 100% antes de concluir.'); return changeTrip({ ...t, status: 'Concluída', paid: true }, `Corrida concluída. ${t.payment === 'Dinheiro' ? 'Recebimento em dinheiro' : 'Pagamento'} simulado de ${money(t.quote.total)}. Ganho do motorista: ${money(t.quote.net)}.`);
    case 'cancel': if (!t || !isActive(t)) return fail('Não há viagem em aberto para cancelar.'); return changeTrip({ ...t, status: 'Cancelada', paid: false }, 'Viagem fictícia cancelada sem cobrança. Nenhum ganho foi creditado.');
    case 'withdraw': { if (!drivers.some(d => d.id === a.driver)) return fail('Motorista de demonstração inválido.'); const l = ledger(s, a.driver); if (l.balance <= 0) return fail('Não há saldo positivo para saque. Dinheiro recebido já está nas mãos do motorista.'); return ok({ withdrawals: [...s.withdrawals, { id: `saque-${at}`, amount: l.balance, driver: a.driver }] }, `Saque Pix fictício de ${money(l.balance)} registrado. Nenhuma transferência real foi realizada.`); }
    case 'message': if (!t || !['Aceita', 'Em andamento'].includes(t.status)) return fail('O chat fica disponível após o aceite e durante a corrida.'); if (!a.text.trim()) return fail('Escreva uma mensagem.'); return changeTrip({ ...t, chat: [...t.chat, { role: a.role, text: a.text.trim().slice(0, 300), at }] }, 'Mensagem enviada ao outro perfil nesta demonstração.');
    case 'rate': if (!t || t.status !== 'Concluída') return fail('Conclua uma viagem antes de avaliar.'); if (t.ratings[a.role]) return fail('Sua avaliação desta viagem já foi registrada.'); if (![1, 2, 3, 4, 5].includes(a.stars)) return fail('Escolha uma nota de 1 a 5.'); return changeTrip({ ...t, ratings: { ...t.ratings, [a.role]: { stars: a.stars, tags: a.tags.slice(0, 4) } } }, 'Avaliação registrada. Cada perfil avalia uma vez; contestações são feitas pelo suporte.');
    case 'share': if (!t || !isActive(t) || !t.assigned) return fail('O compartilhamento fica disponível após o aceite.'); return ok({ shared: t.id }, 'Cartão de acompanhamento criado. Na apresentação, o contato é simulado neste navegador, sem link público ou dados reais.');
    case 'ticket': if (!a.text.trim()) return fail('Descreva o que precisa de ajuda.'); return ok({ tickets: [{ id: a.id, role: a.role, reason: a.reason, text: a.text.trim().slice(0, 500), trip: t?.id ?? null, status: 'Aberto', reply: '' }, ...s.tickets] }, 'Protocolo fictício aberto. A Central da banca pode assumir e responder; não há atendente real conectado.');
    case 'support': { if (!s.tickets.some(v => v.id === a.id)) return fail('Protocolo não encontrado.'); if (!a.reply.trim()) return fail('Escreva uma resposta ao usuário antes de atualizar o protocolo.'); return ok({ tickets: s.tickets.map(v => v.id === a.id ? { ...v, status: a.status, reply: a.reply.trim().slice(0, 500) } : v) }, 'Protocolo atualizado. A resposta aparece no suporte do perfil que abriu o chamado.'); }
    case 'incident': if (!t || !['Aceita', 'Em andamento'].includes(t.status)) return fail('Inicie o acompanhamento de uma viagem para simular um alerta.'); return ok({ alerts: [{ id: a.id, trip: t.id, text: a.kind, resolved: false }, ...s.alerts] }, 'Alerta fictício registrado e visível em Configurações da simulação. Nenhuma autoridade ou central real foi acionada.');
    case 'resolve': if (!s.alerts.some(v => v.id === a.id)) return fail('Alerta não encontrado.'); return ok({ alerts: s.alerts.map(v => v.id === a.id ? { ...v, resolved: true } : v) }, 'Alerta revisado e encerrado na simulação; registro mantido na auditoria.');
  }
}

export function demoRoleForAccount(accountRole: string): Role | 'partner' | null {
  return accountRole === 'Passageiro' ? 'passenger' : accountRole === 'Motorista' ? 'driver' : accountRole === 'Parceiro local' ? 'partner' : null;
}
export type RoleAction = Action | { type: 'simulate-update' } | { type: 'simulate-pin' } | { type: 'simulate-chat-reply' } | { type: 'simulate-support'; id: string };
/** UI permissions for a local academic scenario, not a server authorization boundary. */
export function transitionForRole(s: Scenario, role: Role, a: RoleAction, at = new Date().toISOString()): ReturnType<typeof transition> {
  const fail = (message: string) => ({ state: s, message, error: true });
  const trip = s.trips.find(t => t.id === s.current);
  if (a.type === 'simulate-update') {
    if (role !== 'passenger') return fail('Este controle pertence ao acompanhamento do passageiro.');
    if (!trip || !isActive(trip)) return fail('Confirme uma viagem fictícia para acompanhar as atualizações.');
    const steps: Action[] = [];
    if (trip.status === 'Solicitada') {
      if (s.documents !== 'Aprovado') steps.push({ type: 'documents' }, { type: 'approve', approved: true });
      if (!s.selfie || s.documents !== 'Aprovado') steps.push({ type: 'selfie' });
      if (!s.online || s.documents !== 'Aprovado') steps.push({ type: 'online' });
      steps.push({ type: 'destination', value: 'Qualquer destino' }, { type: 'accept' });
    } else if (trip.status === 'Aceita') steps.push(trip.pickup < 100 ? { type: 'move' } : { type: 'start', pin: trip.pin });
    else steps.push(trip.progress < 100 ? { type: 'move' } : { type: 'finish' });
    let result: ReturnType<typeof transition> = { state: s, message: '' };
    for (const step of steps) { result = transition(result.state, step, at); if (result.error) return fail(result.message); }
    return { ...result, message: `Atualização recebida do motorista fictício: ${result.message}` };
  }
  if (a.type === 'simulate-pin') {
    if (role !== 'driver' || trip?.status !== 'Aceita' || trip.pickup < 100) return fail('O passageiro fictício informa o PIN depois da chegada ao embarque.');
    return transition(s, { type: 'message', role: 'passenger', text: `Meu PIN fictício de embarque é ${trip.pin}.` }, at);
  }
  if (a.type === 'simulate-chat-reply') return transition(s, { type: 'message', role: role === 'passenger' ? 'driver' : 'passenger', text: role === 'passenger' ? 'Recebi sua mensagem. Estou seguindo o trajeto combinado. (Resposta fictícia)' : 'Recebi sua mensagem. Estou no ponto de encontro combinado. (Resposta fictícia)' }, at);
  if (a.type === 'simulate-support') {
    const ticket = s.tickets.find(t => t.id === a.id && t.role === role);
    if (!ticket) return fail('Este protocolo não pertence ao seu perfil.');
    if (ticket.status === 'Resolvido') return fail('Este protocolo já recebeu uma resposta.');
    return transition(s, { type: 'support', id: a.id, status: 'Resolvido', reply: 'A equipe fictícia conferiu o relato e registrou a orientação no seu protocolo. Atendimento simulado para a apresentação, sem equipe real conectada.' }, at);
  }
  const allowed = role === 'passenger'
    ? ['verify', 'request', 'cancel', 'move', 'message', 'rate', 'share', 'ticket', 'incident']
    : ['documents', 'approve', 'selfie', 'online', 'receive', 'accept', 'decline', 'start', 'finish', 'cancel', 'move', 'withdraw', 'destination', 'settings', 'resolve', 'support', 'message', 'rate', 'share', 'ticket', 'incident'];
  if (!allowed.includes(a.type)) return fail('Esta ação não está disponível para o perfil da sua conta.');
  if ((a.type === 'message' || a.type === 'rate' || a.type === 'ticket') && a.role !== role) return fail('Você só pode enviar ações do perfil da sua conta.');
  if (a.type === 'support' && !s.tickets.some(t => t.id === a.id && t.role === role)) return fail('Este protocolo não pertence ao seu perfil.');
  return transition(s, a, at);
}
