# Solara Piscina IA Deploy

Versao publica enxuta da demo Solara Piscina IA, preparada para Render Free Web Service.

## Links publicados

- Demo principal: `https://solara-piscina-ia.onrender.com/000000`
- Demo secundaria: `https://solara-piscina-ia.onrender.com/111111`
- Painel admin: `https://solara-piscina-ia.onrender.com/admin`
- Catalogo publico de upsell: `https://solara-piscina-ia.onrender.com/api/products`

## Documentacao

- `PRD_SOLARA_PISCINA_IA.md` - requisitos, escopo, status, limites e proximos passos do produto.
- `docs/pitch-coordenador.md` - pitch executivo para aprovacao do piloto.
- `docs/checklist-aprovacao-premium.md` - checklist tecnico-comercial da aprovacao.
- `docs/roteiro-demo-5-minutos.md` - roteiro objetivo para demonstracao ao coordenador.

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
- A geracao real de imagens fica desativada por padrao.
- `/api/image-generation/request` retorna payload dry-run sem consumir API. Para chamada real, exige `LITELLM_API_KEY` e `ENABLE_REAL_IMAGE_GENERATION=1`.

## Seguranca e producao

- Em producao, configure `ADMIN_TOKEN` no Render. O token padrao existe somente para desenvolvimento local sem `NODE_ENV=production`.
- O servidor aplica headers basicos de seguranca e compara token administrativo com `timingSafeEqual`.
- O corpo JSON tem limite configuravel por `MAX_JSON_BODY_BYTES`.
- Leads rodam em arquivo por padrao para manter compatibilidade com Render Free.
- Para operacao premium inicial, use Supabase Free com tabela `solara_leads` e bucket privado `solara-lead-photos`.
- O schema versionado esta em `scripts/supabase-schema.sql`.
- Valide a conexao antes de virar producao com `npm run check:supabase`.

Fluxo recomendado para Supabase Free:

1. Criar um projeto no Supabase.
2. Abrir SQL Editor e executar `scripts/supabase-schema.sql`.
3. Criar o bucket privado `solara-lead-photos` em Storage.
4. Definir localmente `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET=solara-lead-photos` e `SUPABASE_LEADS_TABLE=solara_leads`.
5. Rodar `npm run check:supabase` para leitura de tabela/bucket.
6. Rodar `SUPABASE_WRITE_TEST=1 npm run check:supabase` para escrita temporaria de lead e objeto.
7. No Render, configurar `LEAD_STORE_MODE=supabase`, `STORAGE_MODE=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` e `SUPABASE_LEADS_TABLE`.
8. Fazer deploy e validar envio real de lead com foto no admin.

## Limites conhecidos

- Render Free pode dormir e demorar no primeiro acesso.
- No modo gratuito em arquivo, leads, fotos e produtos nao sao armazenamento definitivo.
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



