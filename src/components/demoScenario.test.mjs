// Run: node --test src/components/demoScenario.test.mjs (uses the project's TypeScript dependency).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const compiled = ts.transpileModule(await readFile(new URL('./demoScenario.ts', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext } }).outputText;
const { initialScenario, transition, quote, ledger, candidates, transitionForRole, demoRoleForAccount, driverOfferBlockers } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const choice = { route: 0, category: 'Essencial', women: false, payment: 'Pix', cash: 0, coupon: false };
const action = (s, a) => transition(s, a, '2026-11-27T12:00:00Z');
function ready() { let s = initialScenario(); for (const a of [{ type: 'documents' }, { type: 'approve', approved: true }, { type: 'selfie' }, { type: 'online' }, { type: 'verify' }]) s = action(s, a).state; return s; }
function request(s, overrides = {}) { return action(s, { type: 'request', choice: { ...choice, ...overrides }, id: 'trip-1', pin: '4826' }).state; }
function complete(s) { s = action(s, { type: 'accept' }).state; for (let i = 0; i < 2; i++) s = action(s, { type: 'move' }).state; s = action(s, { type: 'start', pin: '4826' }).state; for (let i = 0; i < 4; i++) s = action(s, { type: 'move' }).state; return action(s, { type: 'finish' }).state; }
test('requires identity, driver approval and new selfie each shift', () => {
 let s = initialScenario(); assert.equal(action(s, { type: 'online' }).error, true); assert.equal(action(s, { type: 'approve', approved: true }).error, true); assert.equal(action(s, { type: 'request', choice, id: 'a', pin: '1234' }).error, true);
 s = ready(); assert.equal(s.online, true); s = action(s, { type: 'online' }).state; assert.equal(s.selfie, false); assert.equal(action(s, { type: 'online' }).error, true);
});
test('upfront fare includes fee, campaign subsidy and bounded dynamic factor', () => {
 const q = quote({ perKm: 2, fee: 1, rate: .03, demand: 'pico', coupon: true }, { ...choice, coupon: true });
 assert.equal(q.fare, 15.3); assert.equal(q.total, 14.3); assert.equal(q.commission, .46); assert.equal(q.net, 14.84); assert.equal(q.dynamic, 1.5);
 assert.equal(action(ready(), { type: 'settings', config: { perKm: NaN, fee: 1, rate: 0, demand: 'normal', coupon: false } }).error, true);
});
test('shared trip cannot duplicate, start early, use wrong PIN, finish early or credit twice', () => {
 let s = request(ready()); const original = s.trips[0].quote;
 assert.equal(action(s, { type: 'request', choice, id: 'b', pin: '1111' }).error, true);
 assert.equal(action(s, { type: 'receive', choice, id: 'b', pin: '1111' }).state.trips.length, 1);
 s = action(s, { type: 'accept' }).state; assert.equal(action(s, { type: 'start', pin: '4826' }).error, true);
 s = action(action(s, { type: 'move' }).state, { type: 'move' }).state;
 assert.equal(action(s, { type: 'start', pin: '0000' }).error, true);
 s = action(s, { type: 'start', pin: '4826' }).state; assert.equal(action(s, { type: 'finish' }).error, true);
 s = action(s, { type: 'settings', config: { ...s.config, perKm: 9, rate: .03 } }).state; assert.deepEqual(s.trips[0].quote, original);
 for (let i = 0; i < 4; i++) s = action(s, { type: 'move' }).state;
 s = action(s, { type: 'finish' }).state; assert.equal(s.trips[0].paid, true); assert.equal(ledger(s, 'ana').net, 10.2); assert.equal(ledger(s, 'carlos').net, 0);
 assert.equal(action(s, { type: 'finish' }).error, true); s = action(s, { type: 'withdraw', driver: 'ana' }).state; assert.equal(ledger(s, 'ana').balance, 0); assert.equal(action(s, { type: 'withdraw', driver: 'ana' }).error, true);
});
test('cancelled trip never pays; cash is deducted from settlement and not withdrawn twice', () => {
 let s = request(ready()); s = action(s, { type: 'cancel' }).state; assert.equal(ledger(s).net, 0); assert.equal(s.trips[0].paid, false);
 s = complete(request(ready(), { payment: 'Dinheiro', cash: 20 })); assert.equal(ledger(s, 'ana').cash, 11.2); assert.equal(ledger(s, 'ana').balance, -1); assert.equal(action(s, { type: 'withdraw', driver: 'ana' }).error, true);
 assert.equal(action(ready(), { type: 'request', choice: { ...choice, payment: 'Dinheiro', cash: 1 }, id: 'a', pin: '1111' }).error, true);
});
test('matching respects women, vehicle capacity, destination and refusal', () => {
 let s = request(ready(), { women: true, category: 'Mais espaço' }); assert.equal(candidates(s, s.trips[0])[0].id, 'bia'); s = action(s, { type: 'decline' }).state; assert.equal(s.trips[0].status, 'Cancelada'); assert.equal(candidates(s, s.trips[0]).length, 0);
 s = request(ready()); s = action(s, { type: 'destination', value: 'Praias urbanas' }).state; assert.equal(candidates(s, s.trips[0]).length, 0); s = action(s, { type: 'destination', value: 'Tirol' }).state; assert.equal(candidates(s, s.trips[0])[0].id, 'ana');
});
test('chat, ratings, support and alerts follow the same trip and selected profile', () => {
 let s = request(ready()); assert.equal(action(s, { type: 'message', role: 'driver', text: 'Oi' }).error, true); s = action(s, { type: 'accept' }).state;
 s = action(s, { type: 'message', role: 'passenger', text: 'Estou no embarque' }).state; s = action(s, { type: 'incident', kind: 'Desvio fictício', id: 'alert' }).state; assert.equal(s.trips[0].chat[0].role, 'passenger'); assert.equal(s.alerts[0].trip, 'trip-1');
 s = action(s, { type: 'ticket', role: 'passenger', reason: 'Segurança', text: 'Teste', id: 'ticket' }).state; s = action(s, { type: 'support', id: 'ticket', status: 'Resolvido', reply: 'Resolvido na simulação' }).state; assert.equal(s.tickets[0].trip, 'trip-1'); assert.equal(s.tickets[0].reply, 'Resolvido na simulação');
 s = complete(request(ready())); s = action(s, { type: 'rate', role: 'passenger', stars: 5, tags: ['Limpeza'] }).state; assert.equal(action(s, { type: 'rate', role: 'passenger', stars: 1, tags: [] }).error, true); s = action(s, { type: 'rate', role: 'driver', stars: 4, tags: [] }).state; assert.equal(s.trips[0].ratings.driver.stars, 4);
});

test('account profiles map to one workspace, with no passenger fallback for institutions or unknown roles', () => {
 assert.equal(demoRoleForAccount('Passageiro'), 'passenger'); assert.equal(demoRoleForAccount('Motorista'), 'driver'); assert.equal(demoRoleForAccount('Parceiro local'), 'partner'); assert.equal(demoRoleForAccount('Universidade'), null); assert.equal(demoRoleForAccount(''), null);
});
test('role permissions reject controls of the other profile and impersonated messages', () => {
 const s = request(ready());
 assert.equal(transitionForRole(s, 'driver', { type: 'request', choice, id: 'other', pin: '1111' }).error, true);
 assert.equal(transitionForRole(s, 'passenger', { type: 'accept' }).error, true);
 assert.equal(transitionForRole(s, 'passenger', { type: 'approve', approved: true }).error, true);
 assert.equal(transitionForRole(s, 'driver', { type: 'simulate-update' }).error, true);
 assert.equal(transitionForRole(s, 'driver', { type: 'message', role: 'passenger', text: 'invasão' }).error, true);
});
test('passenger completes own scenario by receiving fictional driver updates without driver controls', () => {
 let s = request({ ...initialScenario(), passengerVerified: true });
 for (let i = 0; i < 9; i++) { const result = transitionForRole(s, 'passenger', { type: 'simulate-update' }); assert.notEqual(result.error, true, result.message); s = result.state; }
 assert.equal(s.trips[0].status, 'Concluída'); assert.equal(s.trips[0].paid, true); assert.equal(transitionForRole(s, 'passenger', { type: 'simulate-update' }).error, true);
});
test('driver receives the fictional passenger PIN after arrival and support only resolves own tickets', () => {
 let s = action(request(ready()), { type: 'accept' }).state;
 assert.equal(transitionForRole(s, 'driver', { type: 'simulate-pin' }).error, true);
 for (let i = 0; i < 2; i++) s = action(s, { type: 'move' }).state;
 s = transitionForRole(s, 'driver', { type: 'simulate-pin' }).state; assert.equal(s.trips[0].chat.at(-1).role, 'passenger'); assert.match(s.trips[0].chat.at(-1).text, /4826/);
 s = action(s, { type: 'ticket', role: 'passenger', reason: 'Teste', text: 'Somente passageiro', id: 'private-ticket' }).state;
 assert.equal(transitionForRole(s, 'driver', { type: 'simulate-support', id: 'private-ticket' }).error, true);
 assert.equal(transitionForRole(s, 'passenger', { type: 'simulate-support', id: 'private-ticket' }).state.tickets[0].status, 'Resolvido');
});

test('last compatible refusal ends the request and a new request can be received without earnings', () => {
 let s = request(ready());
 for (let i = 0; i < 3; i++) { const r = transitionForRole(s, 'driver', { type: 'decline' }); assert.notEqual(r.error, true); s = r.state; }
 assert.equal(s.trips[0].status, 'Cancelada'); assert.equal(s.trips[0].paid, false); assert.equal(ledger(s).net, 0);
 const r = transitionForRole(s, 'driver', { type: 'receive', choice, id: 'new-request', pin: '1234' });
 assert.notEqual(r.error, true); assert.equal(r.state.current, 'new-request'); assert.equal(r.state.trips.length, 2); assert.equal(candidates(r.state,r.state.trips[0]).length, 3);
});
test('legacy stuck requests recover and filter mismatch cannot bypass an active request', () => {
 let s = request(ready()); s = { ...s, trips: s.trips.map(t => ({ ...t, declined: ['ana','carlos','bia'] })) };
 const recovered = transitionForRole(s, 'driver', { type: 'receive', choice, id: 'recovered', pin: '1234' });
 assert.notEqual(recovered.error, true); assert.equal(recovered.state.current, 'recovered'); assert.equal(recovered.state.trips.find(t => t.id === 'trip-1').status, 'Cancelada');
 s = action(request(ready()), { type: 'destination', value: 'Lagoa Nova' }).state;
 assert.match(driverOfferBlockers(s,s.trips[0]).join(' '), /Lagoa Nova.*Tirol/);
 const same = transitionForRole(s, 'driver', { type: 'receive', choice, id: 'duplicate', pin: '1234' }); assert.equal(same.state.current, 'trip-1');
 s = transitionForRole(s, 'driver', { type: 'destination', value: 'Qualquer destino' }).state;
 assert.equal(driverOfferBlockers(s,s.trips[0]).length, 0); assert.notEqual(transitionForRole(s, 'driver', { type: 'accept' }).error, true);
});
test('documents, analysis result, selfie and availability complete in one driver workspace', () => {
 let s=initialScenario(); const steps=[{type:'documents'},{type:'approve',approved:true},{type:'selfie'},{type:'online'}];
 for(const a of steps) { const r=transitionForRole(s,'driver',a); assert.notEqual(r.error,true,r.message); s=r.state; }
 assert.equal(s.documents,'Aprovado'); assert.equal(s.selfie,true); assert.equal(s.online,true);
 s=transitionForRole(s,'driver',{type:'receive',choice,id:'driver-only',pin:'1234'}).state; assert.deepEqual(driverOfferBlockers(s,s.trips[0]),[]);
 s=action(s,{type:'cancel'}).state; assert.equal(ledger(s).net,0);
});
