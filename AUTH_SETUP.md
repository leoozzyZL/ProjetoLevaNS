# Ativar contas e recuperação de senha

O site usa Supabase Auth para cadastro por e-mail e senha, login, redefinição de senha e sessão. Nenhuma senha é salva no código ou no navegador como dado próprio do app.

## Configuração

1. Crie um projeto Supabase e habilite o provedor **Email** em Authentication → Sign In / Providers.
2. Em Authentication → URL Configuration, defina `https://levanos.vercel.app` como Site URL e permita os endereços de desenvolvimento e produção, incluindo `http://localhost:8443/**`, `http://localhost:5173/**` e `https://levanos.vercel.app/**`.
3. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` com a URL e a chave pública do projeto. Projetos antigos podem usar `VITE_SUPABASE_ANON_KEY`.
4. Cadastre essas mesmas variáveis no projeto Vercel e faça um novo deploy.

Use somente a chave pública `anon`/`publishable` no cliente. Nunca coloque `service_role` ou outra chave secreta em variáveis `VITE_*`.

O cadastro guarda nome, perfil e interesses nos metadados da conta. O link de recuperação volta para `/?auth=update-password`. O Supabase precisa permitir esse destino e ter um serviço de e-mail habilitado; para uso público, configure SMTP próprio, pois o envio padrão tem limite baixo.

Referências: [Configuração de URLs de redirecionamento](https://supabase.com/docs/guides/auth/redirect-urls) e [Autenticação por senha e recuperação](https://supabase.com/docs/guides/auth/passwords).
