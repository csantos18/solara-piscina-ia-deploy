# Procedimento de Credenciais

## Objetivo

Manter chaves, tokens e senhas fora do codigo-fonte, dos commits e de documentos compartilhados.

## Credencial Supabase

A `SUPABASE_SERVICE_ROLE_KEY` deve ser configurada somente em ambientes controlados:

- `.env.supabase.local`, para validacao local;
- variavel secreta do Render, para producao;
- painel seguro do provedor, quando aplicavel.

## Rotacao de credencial

Quando uma chave precisar ser substituida:

1. Criar uma nova Secret key no Supabase.
2. Atualizar `.env.supabase.local` ou a variavel secreta do Render.
3. Revogar a chave anterior.
4. Repetir `npm run check:supabase:local`.
5. Repetir `npm run check:supabase:write`.

## Estado atual recomendado

Supabase pode ficar pausado ate a proxima rodada. Antes de ativar producao, validar tabela, bucket, escrita temporaria e leitura pelo admin.
