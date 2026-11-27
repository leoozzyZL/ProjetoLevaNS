# Apresentação A3 — Leva Nós

Acesse https://levanos.vercel.app/, entre em uma conta e abra **Demonstração** no menu. A conta continua obrigatória; os três perfis são papéis de teste do mesmo cenário, não outras pessoas conectadas. A aba inicial respeita o perfil da conta.

## Roteiro sugerido

1. **Motorista:** simule o envio de CNH, documento do veículo e antecedentes. Nenhum documento real é solicitado.
2. **Central da banca:** aprove o cadastro fictício. Opcionalmente configure a comissão inicial de 3% após a isenção proposta; o padrão é 0% para o fundador.
3. **Motorista → Viagem e painel:** simule a selfie e clique em **Ficar disponível**.
4. **Passageiro:** simule a identidade, escolha um trajeto em Natal, categoria, preferência de condutora e pagamento. Confira o total e clique em **Confirmar viagem fictícia**.
5. **Motorista:** o mesmo pedido aparece com a mesma referência, preço, destino e pagamento. Aceite ou recuse. A recusa mantém a solicitação aberta para o próximo candidato elegível; cada candidato é identificado no painel.
6. Depois de aceitar, simule o deslocamento ao embarque duas vezes. Abra **Passageiro** para consultar o PIN de quatro dígitos. Volte a **Motorista**, digite-o e inicie. PIN errado bloqueia a partida.
7. Avance o percurso em quatro etapas. As duas abas refletem o mesmo progresso e marcador V no mapa. O passageiro pode simular posições recebidas, mas os comandos de aceite, início e conclusão pertencem ao motorista.
8. Teste o chat trocando de perfil para responder; teste a chamada fictícia, o cartão do contato de confiança e o botão de ajuda. Em **Ajuda e segurança**, simule parada longa/desvio ou abra um protocolo. Em **Central da banca**, revise o alerta e responda ao protocolo. A resposta aparece somente no perfil que abriu o chamado.
9. Conclua a corrida como motorista. Consulte o pagamento simulado, avalie de ambos os lados, confira histórico e ganhos e simule um saque Pix. Não existe saque duplo do mesmo saldo.
10. **Parceiro:** cadastre uma oferta com validade futura, edite, pause e reative. As ofertas ativas e não expiradas aparecem na vitrine de benefícios das abas Passageiro e Motorista.

## Como explicar os valores

A demonstração usa a premissa autorizada de **R$ 2/km + R$ 1 de taxa**. Não é uma tarifa oficial definida pelo plano de negócios. O PDF não foi alterado.

Exemplo Essencial UFRN → Midway: 5,1 km × R$ 2 = R$ 10,20 de viagem. Com taxa de R$ 1, o passageiro paga R$ 11,20. Com comissão de 3%, o motorista ganha R$ 9,89 e a comissão é R$ 0,31. A taxa do passageiro não integra o ganho do motorista. Durante a isenção demonstrada de 0%, ele ganha R$ 10,20.

- Cupom A3 desconta até R$ 2 do total; a plataforma subsidia o desconto sem reduzir o ganho do motorista.
- Fatores fictícios: Mais espaço ×1,30; Pet ×1,15; Entrega leve ×1,10.
- Cenários de demanda controlados pela banca: normal ×1; alta ×1,25; pico ×1,50. O fator incide sobre a viagem; a taxa permanece separada.
- Uma viagem confirmada mantém seu preço, cupom e comissão mesmo que a banca altere a configuração depois.
- Ganhos só são registrados na conclusão. Cancelamentos não cobram nem creditam ganhos.
- Dinheiro já recebido é descontado do saldo de repasse. Saldo negativo representa valor a compensar com a plataforma. Saque altera o saldo, não a receita. Combustível, manutenção e impostos não são descontados.
- Metas e mapa de demanda são ilustrativos, sem bônus financeiro prometido.

## O que é real e o que é simulado

**Real:** autenticação existente pelo Supabase, mapa OpenStreetMap, roteamento OSRM e links externos do Google Maps/Waze. O desenho do mapa depende da internet; a falha do mapa não bloqueia os botões e o resumo. Os tempos e distâncias dos três exemplos são fixados para repetibilidade e podem diferir do cálculo atual do mapa.

**Simulado:** localização e deslocamento do veículo, pareamento, espera, pagamentos, cupons, saque, documentos, antecedentes, selfie, chamada (sem áudio), atendimento, monitoramento e avaliações. O contato de confiança é um cartão de acompanhamento no mesmo painel, sem link público. Não há acionamento de autoridades, central real 24h, análise antifraude externa, cobrança ou transferência.

O cenário fica no armazenamento local deste navegador, separado pelo ID da conta. Não conecta passageiros e motoristas em aparelhos ou contas diferentes. Alterações são refletidas entre abas do mesmo navegador/origem, mas o armazenamento local não é uma infraestrutura para concorrência de usuários reais. A central da banca só altera esse cenário, sem privilégios administrativos no Supabase. Não envie documentos, dados bancários ou informações pessoais nos campos de teste.

Registros da demonstração anterior continuam disponíveis no histórico legado; não entram nos ganhos do novo cenário. As ofertas existentes foram preservadas. O login e a área **Quero viajar** da página inicial foram mantidos.

## Verificação técnica

```sh
pnpm build
pnpm exec tsc --noEmit
node --test src/components/demoScenario.test.mjs
```

Os testes cobrem permissões do turno fictício, identidade, tarifas e subsídios, preço preservado, duplicação de pedido, PIN e ordem das etapas, conclusão única, saldo por motorista, dinheiro/troco, saque duplicado, pareamento, chat, avaliações e suporte.
