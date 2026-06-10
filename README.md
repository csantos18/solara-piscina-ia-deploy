# Solara Piscina IA Deploy

Versao publica enxuta da Solara Piscina IA, preparada para Render Free Web Service com persistencia em Supabase Free.

## Links publicados

- Demo principal: `https://solara-piscina-ia.onrender.com/000000`
- Demo secundaria: `https://solara-piscina-ia.onrender.com/111111`
- Painel admin: `https://solara-piscina-ia.onrender.com/admin`
- Catalogo publico de upsell: `https://solara-piscina-ia.onrender.com/api/products`
- Health check: `https://solara-piscina-ia.onrender.com/api/health`
- Readiness de piloto real: `https://solara-piscina-ia.onrender.com/api/readiness`

## Documentacao

- `docs/00-leia-primeiro.md` - ponto de entrada operacional.
- `PRD_SOLARA_PISCINA_IA.md` - requisitos, escopo, status, limites e proximos passos do produto.
- `docs/credenciais-operacionais.md` - procedimento de credenciais para Supabase e Render.

## Arquivos principais

- `public/index.html` - landing page por token focada em desejo, imagens e pedido de orcamento.
- `public/admin.html` - painel comercial protegido por token.
- `public/app.js` - token, galeria, QR Code, formulario, upload de fotos e envio de lead.
- `public/admin.js` - leitura de leads e cadastro de produtos/upsell no painel.
- `public/styles.css` - visual responsivo da landing e do admin.
- `src/tokens.js` - dados dos tokens, imagens iniciais e prompts de imagem.
- `src/image-generation-config.js` - endpoint LiteLLM e configuracao do modelo.
- `server.mjs` - servidor Node, rotas publicas, leads, admin, produtos e dry-run de imagem.
- `render.yaml` - configuracao do Render Free Web Service.

## Estado real

- A landing publica roda no Render Free.
- O token `000000` abre a primeira experiencia.
- O token `111111` demonstra uma segunda pagina com dados e imagem principal diferentes.
- O formulario registra contato, medidas, preferencias e fotos do terreno.
- O painel admin lista leads, fotos/metadados e status operacional.
- O painel admin permite cadastrar produtos complementares/upsell.
- O catalogo inicial inclui deck premium, moveis externos e painel solar futuro.
- `/api/health` confirma que o servico esta no ar e mostra storage em Supabase.
- `/api/readiness` separa demo de piloto real e deve retornar `200` quando Supabase estiver ativo.
- A geracao real de imagens fica desativada por padrao.
- `/api/image-generation/request` retorna payload dry-run sem consumir API. Para chamada real, exige `LITELLM_API_KEY` e `ENABLE_REAL_IMAGE_GENERATION=1`.

## Seguranca e producao

- Configure `ADMIN_TOKEN` no Render e tambem no ambiente local quando precisar acessar o admin.
- O servidor aplica headers basicos de seguranca e compara token administrativo com `timingSafeEqual`.
- O corpo JSON tem limite configuravel por `MAX_JSON_BODY_BYTES`.
- No Render, leads e fotos devem rodar em Supabase Free com tabela `solara_leads` e bucket privado `solara-lead-photos`.
- Para cliente real ou piloto recorrente, mantenha `REQUIRE_PERSISTENT_STORAGE=1`, `LEAD_STORE_MODE=supabase` e `STORAGE_MODE=supabase` no Render.
- O schema versionado esta em `scripts/supabase-schema.sql`.
- Valide a conexao antes de virar producao com `npm run check:supabase`.

## Supabase Free

Credenciais sensiveis devem ser configuradas apenas em ambiente local ou nas variaveis secretas do Render. O arquivo `.env.supabase.local` e ignorado pelo Git e serve para validacao tecnica antes da ativacao em producao.

1. Criar um projeto no Supabase.
2. Abrir SQL Editor e executar `scripts/supabase-schema.sql`.
3. Criar o bucket privado `solara-lead-photos` em Storage.
4. Definir localmente `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET=solara-lead-photos` e `SUPABASE_LEADS_TABLE=solara_leads`.
5. Copiar `.env.supabase.example` para `.env.supabase.local` e preencher a chave no arquivo local.
6. Rodar `npm run check:supabase:local` para leitura de tabela/bucket.
7. Rodar `npm run check:supabase:write` para escrita temporaria de lead e objeto.
8. Rodar `npm run configure:supabase-render:local` para configurar o Render sem imprimir segredos.
9. Conferir se `LEAD_STORE_MODE=supabase`, `STORAGE_MODE=supabase` e `REQUIRE_PERSISTENT_STORAGE=1` estao configurados no Render.
10. Fazer deploy no Render.
11. Validar `/api/health`, `/api/readiness`, envio real de lead com foto e leitura no admin.

## Limites conhecidos

- Render Free pode dormir e demorar no primeiro acesso.
- No modo local em arquivo, leads, fotos e produtos nao sao armazenamento definitivo.
- `/api/readiness` deve retornar `503` se o projeto voltar ao modo demo com arquivo local.
- Para producao completa, usar banco real, Supabase Storage ou storage equivalente, e dominio/plano sem hibernacao.
- Pagamento online e CRM completo ainda nao foram implementados.
- O prazo de 30 dias deve continuar como premissa comercial a validar pela empresa.

## Rodar local

```bash
npm start
```

Abrir:

```text
http://localhost:4173/000000
http://localhost:4173/111111
http://localhost:4173/admin
```

## Checar

```bash
npm.cmd run check
```
