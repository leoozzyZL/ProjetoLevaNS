# Leva Nós — Projeto A3

Projeto acadêmico de mobilidade voltado à comunidade, com proposta inicial em Natal/RN. O site apresenta o modelo de negócio e permite demonstrar as jornadas de passageiro, motorista e parceiro local.

**Site:** [levanos.vercel.app](https://levanos.vercel.app/)

## Integrantes

- João Moura
- Leandro Luis
- Dayvid Ramos
- João Gabriel
- Raied Lucas
- Mario Lucio

## O que o projeto demonstra

- Cadastro, confirmação de e-mail, login, edição de dados e recuperação de senha pelo Supabase Auth.
- Acesso ao painel correspondente ao perfil da conta, sem troca entre os perfis na demonstração.
- Passageiro: trajeto em Natal, preço detalhado, pagamento fictício, acompanhamento, chat e avaliação.
- Motorista: documentos e selfie fictícios, disponibilidade, pedidos, aceite/recusa, PIN de embarque, histórico e ganhos.
- Parceiro local: cadastro, edição, pausa e reativação de ofertas do próprio painel.
- Universidade: espaço institucional para consultar os dados e interesses do cadastro.
- Mapas de trajetos por ruas, suporte e recursos de segurança demonstrativos.

## Como apresentar

Entre em uma conta confirmada e abra **Demonstração** no menu. Prepare contas diferentes de passageiro, motorista e parceiro antes da apresentação. Cada conta vê somente seu perfil.

O [roteiro da apresentação](DEMONSTRACAO_A3.md) descreve as etapas, os valores e as limitações de cada cenário.

No painel do motorista:

1. Clique em **Simular envio de documentos** e **Simular resultado da análise**, no mesmo painel.
2. Simule a checagem facial e clique em **Ficar disponível**.
3. Simule um pedido. Se houver bloqueio, leia a explicação junto de **Aceitar corrida / Recusar pedido**; **Limpar filtro de destino** remove um filtro incompatível.
4. Aceite, simule a chegada, receba o PIN do passageiro fictício, digite-o e inicie a corrida.
5. Avance o percurso e conclua para consultar ganhos, histórico e avaliação.

Após a última recusa, o pedido é encerrado sem cobrança. É possível receber outro pedido ou encerrar manualmente um pedido ainda não aceito.

## Tecnologias

- React 19 e TypeScript
- Vite 8 e Tailwind CSS 4
- Supabase Auth
- Leaflet e mapas OpenStreetMap
- Photon para localizar endereços e OSRM para calcular rotas
- GitHub e Vercel para versionamento e publicação

## Executar localmente

Pré-requisitos: Node.js 22 atualizado e pnpm. As versões de desenvolvimento estão declaradas em [.mise.toml](.mise.toml).

```sh
git clone https://github.com/leoozzyZL/ProjetoLevaNS.git
cd ProjetoLevaNS
pnpm install --frozen-lockfile
cp .env.example .env.local
```

Preencha `.env.local` com a URL e a chave pública do seu projeto Supabase:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA
```

Para projetos antigos, a chave pública `anon` pode ser configurada como `VITE_SUPABASE_ANON_KEY`. Não use chaves secretas ou `service_role` nas variáveis do cliente. `.env.local` permanece fora do Git.

A configuração do provedor de e-mail, URLs de retorno e recuperação de senha está em [AUTH_SETUP.md](AUTH_SETUP.md).

```sh
pnpm dev
```

Abra [localhost:8443](http://localhost:8443/). O acesso à demonstração exige uma conta autenticada. Sem as variáveis do Supabase, a página institucional abre, mas os fluxos de autenticação ficam indisponíveis.

## Verificações

```sh
pnpm build
pnpm exec tsc --noEmit
node --test src/components/demoScenario.test.mjs
```

Os testes verificam o ciclo da viagem, PIN, tarifas, comissões, pagamentos e saques fictícios, separação de ações por perfil, suporte, filtros e recuperação depois das recusas. Para conferir a compilação localmente:

```sh
pnpm preview
```

## Limites da demonstração

- É uma apresentação acadêmica: não solicita corridas reais nem movimenta dinheiro.
- Cada conta possui um cenário local independente, salvo por conta e perfil neste navegador. Não existe conexão operacional entre passageiros, motoristas e parceiros em contas ou aparelhos diferentes.
- Documentos, antecedentes, selfie, posições do veículo, pareamento, pagamentos, suporte e chamadas são simulados. Não há validação real de identidade, áudio, rastreamento GPS ou acionamento de autoridades.
- O mapa usa serviços externos e depende de internet. Se ele falhar, o resumo e os controles da viagem continuam disponíveis.
- Os exemplos fixos podem diferir da distância e do tempo calculados naquele momento no mapa.
- A premissa de preço é R$ 2/km + R$ 1 de taxa, com fatores demonstrativos explicitados no painel. O valor por quilômetro não é uma tarifa oficial definida pelo plano de negócios.
- As configurações de apresentação alteram somente o cenário fictício, sem conceder acesso administrativo ao Supabase.

O projeto está publicado na Vercel a partir da branch `main`. As mesmas variáveis públicas do Supabase precisam estar configuradas no ambiente de publicação. O plano de negócios em PDF não é alterado pelo site.
