# Leva Nós

Projeto acadêmico de mobilidade, publicado na Vercel. Usa React 19, TypeScript,
Vite 8, Tailwind CSS 4 e Supabase Auth.

## Desenvolvimento e validação

- Instale as dependências com `pnpm install --frozen-lockfile`.
- Copie `.env.example` para `.env.local` e configure as variáveis públicas do Supabase.
- Execute `pnpm dev` para iniciar o servidor na porta 8443; `PORT` permite alterá-la.
- Execute `pnpm build` e `pnpm exec tsc --noEmit` antes de publicar mudanças.
- Execute `pnpm preview` para conferir a compilação localmente.
- A publicação usa GitHub e Vercel. Não há dependência do Figma Make.

## Arquivos principais

- `src/App.tsx`: página inicial, navegação e estimativas em Natal/RN.
- `src/components/AuthDialog.tsx`: contas, login, recuperação de senha e acesso à demonstração.
- `src/components/OperationalDemo.tsx` e `.css`: cenários fictícios de passageiro, motorista e parceiro.
- `src/lib/supabase.ts`: cliente de autenticação.
- `src/index.css`: estilos globais, incluindo Tailwind CSS 4.
- `index.html`: título, idioma e metadados do site.
- `public/`: ícone e arquivos estáticos.
- `AUTH_SETUP.md`: instruções de configuração da autenticação.

## Cuidados ao editar

Preserve os fluxos existentes, a identidade visual e o suporte ao celular.
Simular viagens e acessar a demonstração exigem uma conta autenticada.
Os cenários de demonstração são fictícios e guardados no navegador por conta e perfil.
Use somente chaves públicas nas variáveis `VITE_*`; não versionar `.env.local` ou senhas.
Não altere o PDF do plano de negócios sem um pedido específico.

Os estilos usam Tailwind CSS 4 sem `tailwind.config`. Mantenha os `@import` no início
do CSS e considere a precedência das regras globais sobre as camadas do Tailwind.
