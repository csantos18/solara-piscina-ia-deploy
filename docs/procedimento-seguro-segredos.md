# Procedimento Seguro para Segredos

## Regra principal

Nunca cole chaves, tokens ou senhas no chat, em commits, README, prints publicos ou documentos compartilhados.

## Onde colar a chave Supabase

A `SUPABASE_SERVICE_ROLE_KEY` deve ser colada somente em um destes lugares:

- arquivo local `.env.supabase.local`, que esta protegido pelo `.gitignore`;
- variavel secreta do Render;
- painel seguro do provedor.

## Se uma chave foi exposta

1. Considerar a chave comprometida.
2. Criar uma nova Secret key no Supabase.
3. Atualizar o arquivo local ou Render com a nova chave.
4. Revogar/deletar a chave antiga.
5. Repetir `npm run check:supabase:local` e `npm run check:supabase:write`.

## Estado atual recomendado

Supabase pode ficar pausado ate a proxima rodada. Antes de retomar, gere uma nova Secret key e nao reutilize chave que ja apareceu em chat.
