# Apresentação A3 — Leva Nós

Acesse https://levanos.vercel.app/, entre em uma conta e abra **Demonstração** no menu. Cada conta acessa exclusivamente o perfil escolhido no cadastro. Não existe seletor para abrir o painel de outro perfil, e a edição dos dados mantém o perfil do cadastro.

O convite **Criar minha conta / Já tenho uma conta** aparece apenas para visitantes deslogados. A página inicial também mostra funções compatíveis com o perfil autenticado.

## Roteiro por perfil

Para apresentar perfis diferentes, use contas distintas, uma de cada perfil. A demonstração não conecta essas contas entre si; as outras pessoas de cada cenário são fictícias.

### Conta de passageiro

1. Abra **Demonstração**, valide a identidade fictícia e escolha trajeto, categoria, preferência de condutora e pagamento.
2. Confira o total e clique em **Confirmar viagem fictícia**.
3. Use **Simular próxima etapa** para receber o aceite do motorista fictício, duas atualizações de aproximação, confirmação do embarque, quatro avanços de percurso e conclusão. Você acompanha atualizações, sem acessar os controles do motorista.
4. Consulte o PIN, o veículo e o mapa. Teste o chat e **Simular resposta recebida**, chamada fictícia, contato de confiança, alerta e avaliação.
5. Em **Ajuda e segurança**, abra um protocolo e use **Simular retorno do atendimento** para receber uma resposta fictícia, sem acesso ao painel da equipe.

### Conta de motorista

1. Em **Preparar para dirigir**, simule o envio dos documentos e clique em **Simular resultado da análise**. A aprovação fictícia aparece no próprio painel e libera a selfie; não é preciso abrir a central da banca.
2. Simule a checagem facial do turno e clique em **Ficar disponível**.
3. Use **Simular recebimento de pedido**. Confira o trajeto, valor, comissão e ganho; aceite ou recuse. A recusa oferece o pedido ao próximo candidato fictício. Quando todos recusam, o pedido é encerrado sem cobrança e você pode simular outro. Pedidos antigos que ficaram presos também são encerrados ao simular um novo recebimento.
4. Simule o deslocamento ao embarque duas vezes. Use **Simular passageiro informando o PIN**, digite os quatro dígitos recebidos e inicie. PIN incorreto continua bloqueando o início.
5. Avance o percurso quatro vezes e conclua. Consulte histórico, ganhos, avaliações e saque Pix fictício. Chat e suporte têm respostas simuladas no próprio painel.
6. Se os botões de aceitar/recusar estiverem bloqueados, leia o motivo exibido junto deles. Para um pedido que termina em Tirol, um filtro de Lagoa Nova impede a resposta; use **Limpar filtro de destino**. Você também pode usar **Encerrar pedido fictício** antes do aceite.
7. As configurações de apresentação deste perfil permitem variar as premissas e revisar alertas. Não são permissões administrativas reais.

### Conta de parceiro local

Abra **Demonstração** ou **Gerenciar minhas ofertas**. Cadastre nome do negócio, título, categoria, benefício, condições e validade. Salve, edite, pause e reative suas ofertas. Essa conta não acessa simuladores de passageiros ou motoristas.

### Conta de universidade

Acesse o espaço institucional e os dados/interesses da instituição. Esse cadastro não abre simuladores de passageiros ou motoristas nem a gestão de ofertas de negócios.

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

**Simulado:** localização e deslocamento do veículo, pareamento, espera, pagamentos, cupons, saque, documentos, antecedentes, selfie, respostas recebidas de outros participantes, chamada (sem áudio), atendimento, monitoramento e avaliações. O contato de confiança é um cartão de acompanhamento no mesmo painel, sem link público. Não há acionamento de autoridades, central real 24h, análise antifraude externa, cobrança ou transferência.

O cenário fica no armazenamento local deste navegador, separado pelo ID da conta e perfil. O cenário compartilhado anterior é usado apenas como origem de migração, sem botões de troca de perfil. Não conecta passageiros e motoristas em aparelhos ou contas diferentes. Alterações são refletidas entre abas do mesmo perfil, conta e navegador/origem, mas o armazenamento local não é uma infraestrutura para concorrência de usuários reais. As configurações do motorista só alteram seu cenário, sem privilégios administrativos no Supabase. Não envie documentos, dados bancários ou informações pessoais nos campos de teste.

Registros da demonstração anterior continuam disponíveis no histórico legado; não entram nos ganhos do novo cenário. As ofertas existentes foram preservadas na conta de parceiro. Não há publicação dessas ofertas em outras contas da demonstração. O login e a área **Quero viajar** da página inicial foram mantidos.

## Equipe

João Moura, Leandro Luis, Dayvid Ramos, João Gabriel, Raied Lucas e Mario Lucio.

## Verificação técnica

```sh
pnpm build
pnpm exec tsc --noEmit
node --test src/components/demoScenario.test.mjs
```

Os testes também verificam a recuperação após recusas, pedidos presos da versão anterior, motivos de bloqueio por filtro e a sequência de documentos/selfie no mesmo painel. Os testes cobrem permissões do turno fictício, identidade, tarifas e subsídios, preço preservado, duplicação de pedido, PIN e ordem das etapas, conclusão única, saldo por motorista, dinheiro/troco, saque duplicado, pareamento, chat, avaliações e suporte.
