# Solara Piscina IA Deploy

Repositorio publico enxuto do piloto Solara Piscina IA. Este repositorio e a fonte do deploy no Render.

## Fonte de verdade

- Produto, escopo, status e proximos passos: `PRD_SOLARA_PISCINA_IA.md`.
- Credenciais e segredos: `docs/credenciais-operacionais.md`.
- Schema Supabase: `scripts/supabase-schema.sql`.

Nao duplicar escopo, roadmap ou checklist operacional em novos documentos. Atualize o PRD quando a mudanca for de produto; atualize este README apenas quando mudar como rodar, validar ou localizar o projeto.

## Links publicados

- Demo principal: `https://solara-piscina-ia.onrender.com/000000`
- Demo secundaria: `https://solara-piscina-ia.onrender.com/111111`
- Painel admin: `https://solara-piscina-ia.onrender.com/admin`
- Health check: `https://solara-piscina-ia.onrender.com/api/health`
- Readiness: `https://solara-piscina-ia.onrender.com/api/readiness`

## Arquivos principais

- `server.mjs` - servidor Node, rotas publicas, leads, admin, fotos protegidas e dry-run de IA.
- `public/index.html` - landing page por token.
- `public/admin.html` - painel comercial.
- `public/app.js` - experiencia da landing, formulario e upload.
- `public/admin.js` - leads, status comercial simples e fotos protegidas.
- `public/styles.css` - visual responsivo.
- `src/tokens.js` - dados dos tokens e prompts.
- `render.yaml` - configuracao do Render.

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

Para testar admin local, defina `ADMIN_TOKEN` antes de iniciar.

## Validar

```bash
npm.cmd run check
```

Validacao Supabase local:

```bash
npm.cmd run check:supabase:local
npm.cmd run check:supabase:write
```

## Regra de operacao real

Para piloto com cliente real, o Render deve usar:

```text
LEAD_STORE_MODE=supabase
STORAGE_MODE=supabase
REQUIRE_PERSISTENT_STORAGE=1
```

Se a persistencia definitiva nao estiver ativa, `/api/readiness` deve retornar bloqueio operacional.
