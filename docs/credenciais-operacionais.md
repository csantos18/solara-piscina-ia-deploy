# Credenciais Operacionais

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

Supabase pode ficar pausado ate a proxima rodada de cliente real. Antes de ativar producao ou piloto recorrente, validar tabela, bucket, escrita temporaria e leitura pelo admin.

## Trava de projeto real

Para operacao com cliente real, configurar no Render:

```text
LEAD_STORE_MODE=supabase
STORAGE_MODE=supabase
REQUIRE_PERSISTENT_STORAGE=1
```

Com `REQUIRE_PERSISTENT_STORAGE=1`, o servidor bloqueia recebimento de leads se Supabase nao estiver configurado com credenciais validas.
